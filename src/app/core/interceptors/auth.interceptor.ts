
import { finalize } from 'rxjs';
import { Auth } from '../services/auth';
import { inject } from '@angular/core';
import {  HttpInterceptorFn } from '@angular/common/http';
import { LoadingService } from '../services/loading';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const loadingService = inject(LoadingService);
  const token = authService.getToken();

  loadingService.show();

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(finalize(() => loadingService.hide()));
};


