// src/app/features/auth/register/register.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Auth } from '../../../core/services/auth';
import { Toast } from '../../../core/services/toast';

function pwdMatch(c: AbstractControl): ValidationErrors | null {
  return c.get('password')?.value !== c.get('confirmPassword')?.value ? { mismatch: true } : null;
}

type RegStep = 'form' | 'otp';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  animations: [
    trigger('cardAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('380ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('stepAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(16px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);
  private toast = inject(Toast);

  step = signal<RegStep>('form');
  loading = signal(false);
  showPwd = signal(false);
  registeredEmail = signal('');
  registeredUserId = signal('');
  resendCooldown = signal(0);
  otpDigits = signal<string[]>(['', '', '', '', '', '']);

  private _cooldownTimer?: ReturnType<typeof setInterval>;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    role: ['pharmacist'],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: pwdMatch });

  fi(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onRegister(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.hasError('mismatch')) return;
    this.loading.set(true);
    const { name, username, email, phone, password, role } = this.form.value;

    this.authService.register({ name: name!, username: username!, email: email!, phone: phone!, password: password!, role: role || 'pharmacist' }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.registeredEmail.set(res.data?.email || email || '');
        this.registeredUserId.set(res.data?.userId || '');
        this.toast.success('Account created! Please verify your email.');
        this.step.set('otp');
        this.startCooldown();
      },
      error: () => this.loading.set(false),
    });
  }

  /* OTP box interactions */
  onOtpInput(event: Event, idx: number): void {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(-1);
    const digits = [...this.otpDigits()];
    digits[idx] = val;
    this.otpDigits.set(digits);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, idx: number): void {
    if (event.key === 'Backspace') {
      const digits = [...this.otpDigits()];
      if (!digits[idx] && idx > 0) {
        digits[idx - 1] = '';
        this.otpDigits.set(digits);
        document.getElementById(`otp-${idx - 1}`)?.focus();
      } else {
        digits[idx] = '';
        this.otpDigits.set(digits);
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '';
    const digits = pasted.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    this.otpDigits.set(digits);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  }

  onVerifyOtp(): void {
    const otp = this.otpDigits().join('');
    if (otp.length !== 6) { this.toast.error('Please enter all 6 digits.'); return; }
    this.loading.set(true);
    this.authService.verifyOtp(this.registeredUserId(), otp).subscribe({
      next: () => { this.toast.success('Email verified! Welcome to PharmaTrack.'); this.router.navigate(['/dashboard']); },
      error: () => { this.loading.set(false); this.otpDigits.set(['', '', '', '', '', '']); document.getElementById('otp-0')?.focus(); },
    });
  }

  onResendOtp(): void {
    if (this.resendCooldown() > 0) return;
    this.authService.resendOtp(this.registeredUserId()).subscribe({
      next: () => { this.toast.info('New OTP sent to your email.'); this.startCooldown(); },
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
