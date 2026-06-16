import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Auth } from '../../../core/services/auth';
import { Toast } from '../../../core/services/toast';



function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password?.value !== confirmPassword?.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  animations: [
    trigger('formEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
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
  private toastService = inject(Toast);

  loading = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['pharmacist'],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { name, email, password, role } = this.form.value;
    this.authService.register(name!, email!, password!, role!).subscribe({
      next: () => {
        this.toastService.success('Account created! Welcome aboard.');
        this.router.navigate(['/dashboard']);
      },
      error: () => { this.loading.set(false); },
    });
  }
}

