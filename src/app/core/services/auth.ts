// src/app/core/services/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiResponse, User } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly userRole = computed(() => this._currentUser()?.role);

  private loadUserFromStorage(): User | null {
    try {
      const stored = localStorage.getItem('pharma_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('pharma_token');
  }

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        if (res.success && res.data) {
          localStorage.setItem('pharma_token', res.data.token);
          localStorage.setItem('pharma_user', JSON.stringify(res.data.user));
          this._currentUser.set(res.data.user);
        }
      }),
      catchError((err) => throwError(() => err))
    );
  }

  register(name: string, email: string, password: string, role?: string): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, { name, email, password, role })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            localStorage.setItem('pharma_token', res.data.token);
            localStorage.setItem('pharma_user', JSON.stringify(res.data.user));
            this._currentUser.set(res.data.user);
          }
        })
      );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
    localStorage.removeItem('pharma_token');
    localStorage.removeItem('pharma_user');
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          localStorage.setItem('pharma_user', JSON.stringify(res.data));
          this._currentUser.set(res.data);
        }
      })
    );
  }
}
