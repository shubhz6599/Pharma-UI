// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Toast } from '../services/toast';
import { Auth } from '../services/auth';


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(Toast);
  const authService = inject(Auth);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'An unexpected error occurred.';

      if (error.error?.message) {
        message = error.error.message;
      } else if (error.status === 0) {
        message = 'Cannot connect to server. Please check your connection.';
      } else if (error.status === 401) {
        message = 'Session expired. Please log in again.';
        authService.logout();
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        message = 'You do not have permission to perform this action.';
        router.navigate(['/dashboard']);
      } else if (error.status === 404) {
        message = 'Resource not found.';
      } else if (error.status >= 500) {
        message = 'Server error. Please try again later.';
      }

      toastService.error(message);
      return throwError(() => error);
    })
  );
};