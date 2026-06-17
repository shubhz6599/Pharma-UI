// src/app/core/services/billing.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Bill, Transaction } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

export interface GenerateBillPayload {
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    productId: string;
    quantity: number;
    discPercent?: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/billing`;

  generateBill(payload: GenerateBillPayload): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(`${this.apiUrl}/generate`, payload);
  }

  getBills(params: Record<string, string> = {}): Observable<ApiResponse<Bill[]>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) httpParams = httpParams.set(k, v);
    });
    return this.http.get<ApiResponse<Bill[]>>(this.apiUrl, { params: httpParams });
  }

  getBill(id: string): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.apiUrl}/${id}`);
  }

  getTransactions(params: Record<string, string> = {}): Observable<ApiResponse<Transaction[]>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) httpParams = httpParams.set(k, v);
    });
    return this.http.get<ApiResponse<Transaction[]>>(`${this.apiUrl}/transactions`, { params: httpParams });
  }
}
