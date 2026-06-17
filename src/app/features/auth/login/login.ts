// src/app/features/auth/login/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Auth } from '../../../core/services/auth';
import { Toast } from '../../../core/services/toast';


type LoginStep = 'login' | 'forgot-input' | 'forgot-otp' | 'forgot-reset' | 'forgot-success';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  animations: [
    trigger('cardAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.98)' }),
        animate('380ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
    ]),
    trigger('stepAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(16px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateX(-16px)' })),
      ]),
    ]),
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);
  private toast = inject(Toast);

  step = signal<LoginStep>('login');
  loading = signal(false);
  showPwd = signal(false);
  showNewPwd = signal(false);
  maskedEmail = signal('');
  resendCooldown = signal(0);
  private _forgotUserId = '';
  private _resetToken = '';
  private _cooldownTimer?: ReturnType<typeof setInterval>;

  loginForm = this.fb.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  forgotForm = this.fb.group({
    identifier: ['', Validators.required],
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, {
    validators: (g) => g.get('newPassword')?.value !== g.get('confirmPassword')?.value ? { mismatch: true } : null,
  });

fInvalid(
  form: 'loginForm' | 'forgotForm' | 'otpForm' | 'resetForm',
  field: string
): boolean {
  const control = (this[form] as FormGroup).get(field);
  return !!(control?.invalid && control?.touched);
}

  onLogin(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading.set(true);
    const { identifier, password } = this.loginForm.value;
    this.authService.login(identifier!, password!).subscribe({
      next: () => { this.toast.success('Welcome back!'); this.router.navigate(['/dashboard']); },
      error: (err) => {
        this.loading.set(false);
        // If needsVerification flag, offer to go verify
        if (err?.error?.data?.needsVerification) {
          this._forgotUserId = err.error.data.userId;
          this.maskedEmail.set(err.error.data.email);
          this.toast.warning('Please verify your email first.');
        }
      },
    });
  }

  onForgotSend(): void {
    if (this.forgotForm.invalid) { this.forgotForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.authService.forgotPassword(this.forgotForm.value.identifier!).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data?.userId) { this._forgotUserId = res.data.userId; }
        this.maskedEmail.set(res.message?.match(/\S+@\S+\.\S+/)?.[0] || '');
        this.toast.success(res.message || 'OTP sent!');
        this.step.set('forgot-otp');
        this.startCooldown();
      },
      error: () => this.loading.set(false),
    });
  }

  onVerifyResetOtp(): void {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.authService.verifyResetOtp(this._forgotUserId, this.otpForm.value.otp!).subscribe({
      next: (res) => {
        this.loading.set(false);
        this._resetToken = res.data?.resetToken || '';
        this.toast.success('OTP verified!');
        this.step.set('forgot-reset');
      },
      error: () => this.loading.set(false),
    });
  }

  onResetPassword(): void {
    this.resetForm.markAllAsTouched();
    if (this.resetForm.invalid || this.resetForm.hasError('mismatch')) return;
    this.loading.set(true);
    this.authService.resetPassword(this._forgotUserId, this._resetToken, this.resetForm.value.newPassword!).subscribe({
      next: () => { this.loading.set(false); this.toast.success('Password reset successfully!'); this.step.set('forgot-success'); },
      error: () => this.loading.set(false),
    });
  }

  onResendForgotOtp(): void {
    if (this.resendCooldown() > 0 || !this._forgotUserId) return;
    this.authService.resendOtp(this._forgotUserId).subscribe({
      next: () => { this.toast.info('OTP resent.'); this.startCooldown(); },
    });
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);
    clearInterval(this._cooldownTimer);
    this._cooldownTimer = setInterval(() => {
      const v = this.resendCooldown() - 1;
      this.resendCooldown.set(v);
      if (v <= 0) clearInterval(this._cooldownTimer);
    }, 1000);
  }
}
