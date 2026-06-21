// src/app/core/services/settings.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

export interface AppInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseNotes: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}/settings`;

  // Backup downloads raw JSON via blob
  downloadBackup(): Observable<Blob> {
    return this.http.get(`${this.api}/backup`, { responseType: 'blob' });
  }

  restoreBackup(payload: { data: any }): Observable<ApiResponse<Record<string, number>>> {
    return this.http.post<ApiResponse<Record<string, number>>>(`${this.api}/restore`, payload);
  }

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.api}/users`);
  }

  updateUserRole(id: string, role: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.api}/users/${id}/role`, { role });
  }

  deactivateUser(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.api}/users/${id}`);
  }

  getAppInfo(): Observable<ApiResponse<AppInfo>> {
    return this.http.get<ApiResponse<AppInfo>>(`${this.api}/app-info`);
  }
}
