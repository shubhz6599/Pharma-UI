// src/app/core/services/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiResponse, User } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

interface AuthResponse { token: string; user: User; }
interface OtpSentResponse { userId: string; email: string; }

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  readonly currentUser     = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly userRole        = computed(() => this._currentUser()?.role);

  private loadUserFromStorage(): User | null {
    try { const s = localStorage.getItem('pharma_user'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  }

  getToken(): string | null { return localStorage.getItem('pharma_token'); }

  private storeSession(token: string, user: User): void {
    localStorage.setItem('pharma_token', token);
    localStorage.setItem('pharma_user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  // ── Register (step 1): returns userId + email for OTP screen
  register(payload: { name: string; username: string; email: string; phone: string; password: string; role?: string }): Observable<ApiResponse<OtpSentResponse>> {
    return this.http.post<ApiResponse<OtpSentResponse>>(`${this.apiUrl}/register`, payload);
  }

  // ── Verify OTP (registration): on success sets session + returns token
  verifyOtp(userId: string, otp: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/verify-otp`, { userId, otp }).pipe(
      tap((res) => { if (res.success && res.data) this.storeSession(res.data.token, res.data.user); })
    );
  }

  resendOtp(userId: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/resend-otp`, { userId });
  }

  // ── Login: identifier = email | username | phone
  login(identifier: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, { identifier, password }).pipe(
      tap((res) => { if (res.success && res.data) this.storeSession(res.data.token, res.data.user); }),
      catchError((err) => throwError(() => err))
    );
  }

  // ── Forgot password
  forgotPassword(identifier: string): Observable<ApiResponse<{ userId: string }>> {
    return this.http.post<ApiResponse<{ userId: string }>>(`${this.apiUrl}/forgot-password`, { identifier });
  }

  verifyResetOtp(userId: string, otp: string): Observable<ApiResponse<{ userId: string; resetToken: string }>> {
    return this.http.post<ApiResponse<{ userId: string; resetToken: string }>>(`${this.apiUrl}/verify-reset-otp`, { userId, otp });
  }

  resetPassword(userId: string, resetToken: string, newPassword: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/reset-password`, { userId, resetToken, newPassword });
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
    localStorage.removeItem('pharma_token');
    localStorage.removeItem('pharma_user');
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap((res) => { if (res.success && res.data) { localStorage.setItem('pharma_user', JSON.stringify(res.data)); this._currentUser.set(res.data); } })
    );
  }
}
