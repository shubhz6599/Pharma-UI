import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Auth } from '../../../core/services/auth';
import { Toast } from '../../../core/services/toast';


@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

   private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);
  private toastService = inject(Toast);

  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.toastService.success('Welcome back!');
        this.router.navigate(['/dashboard']);
      },
      error: () => { this.loading.set(false); },
    });
  }
}
