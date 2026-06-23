// src/app/core/services/billing.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Bill, Transaction } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

// One sale line — supports both a selected batch (preferred) and a manually-typed
// batch number when the batch isn't found in master (per requirement).
export interface BillItemPayload {
  productId: string;
  batchId?: string;      // present if selected from batch search
  batchNo: string;       // always present — selected or manually typed
  expDate?: string;       // required if batchId absent (manual entry)
  mrp?: number;
  rate?: number;
  quantity: number;
  discPercent?: number;
  cgstPercent?: number;
  sgstPercent?: number;
}

export interface GenerateBillPayload {
  customerId?:        string;
  customerName?:      string;
  customerPhone?:     string;
  customerAddress?:   string;
  customerDlNo?:      string;
  customerGstNo?:     string;
  customerState?:     string;
  customerStateCode?: string;
  supplierName?:      string;
  supplierAddress?:   string;
  supplierPhone?:     string;
  supplierDlNo?:      string;
  supplierGstNo?:     string;
  salesman?:          string;
  paymentStatus?:      'paid' | 'partial' | 'credit';
  amountPaid?:         number;
  items: BillItemPayload[];
}

export interface SaleReturnPayload {
  billId: string;
  items: { productId: string; batchId?: string; batchNo: string; quantity: number }[];
  reason?: string;
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

  createReturn(payload: SaleReturnPayload): Observable<ApiResponse<{ returnTotal: number }>> {
    return this.http.post<ApiResponse<{ returnTotal: number }>>(`${this.apiUrl}/return`, payload);
  }
}
