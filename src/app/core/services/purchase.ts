// src/app/core/services/purchase.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Purchase, PurchaseItem } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

export interface CreatePurchasePayload {
  supplierId: string;
  invoiceNo: string;
  invoiceDate: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  amountPaid?: number;
  items: PurchaseItem[];
}

export interface PurchaseReturnPayload {
  purchaseId: string;
  items: { productId: string; batchNo: string; quantity: number }[];
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/purchase`;

  createPurchase(payload: CreatePurchasePayload): Observable<ApiResponse<Purchase>> {
    return this.http.post<ApiResponse<Purchase>>(this.apiUrl, payload);
  }

  getPurchases(params: { page?: number; limit?: number; supplierId?: string; dateFrom?: string; dateTo?: string; search?: string } = {}): Observable<ApiResponse<Purchase[]>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p = p.set(k, String(v)); });
    return this.http.get<ApiResponse<Purchase[]>>(this.apiUrl, { params: p });
  }

  getPurchase(id: string): Observable<ApiResponse<Purchase>> {
    return this.http.get<ApiResponse<Purchase>>(`${this.apiUrl}/${id}`);
  }

  createReturn(payload: PurchaseReturnPayload): Observable<ApiResponse<{ returnTotal: number }>> {
    return this.http.post<ApiResponse<{ returnTotal: number }>>(`${this.apiUrl}/return`, payload);
  }
}
