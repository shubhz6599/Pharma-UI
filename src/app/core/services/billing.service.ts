// src/app/core/services/billing.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Bill, Transaction } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

export interface BillItemPayload {
  productId: string;
  quantity: number;
  discPercent?: number;
}

export interface GenerateBillPayload {
  // Customer — either from master (customerId) or manual entry
  customerId?:        string;
  customerName?:      string;
  customerPhone?:     string;
  customerAddress?:   string;
  customerDlNo?:      string;
  customerGstNo?:     string;
  customerState?:     string;
  customerStateCode?: string;
  // Supplier info (auto-populated from first product's supplier)
  supplierName?:      string;
  supplierAddress?:   string;
  supplierPhone?:     string;
  supplierDlNo?:      string;
  supplierGstNo?:     string;
  salesman?:          string;
  items: BillItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/billing`;

  generateBill(payload: GenerateBillPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/generate`, payload);
  }

  getBills(params: Record<string, string> = {}): Observable<ApiResponse<Bill[]>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return this.http.get<ApiResponse<Bill[]>>(this.apiUrl, { params: p });
  }

  getBill(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getTransactions(params: Record<string, string> = {}): Observable<ApiResponse<Transaction[]>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return this.http.get<ApiResponse<Transaction[]>>(`${this.apiUrl}/transactions`, { params: p });
  }
}
