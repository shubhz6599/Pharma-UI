// src/app/core/services/reports.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

export interface SalesStatementRow {
  billNo: string;
  billDate: Date;
  customerName?: string;
  salesman?: string;
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
}

export interface SalesStatementSummary {
  totalBills: number;
  totalSubtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalGrand: number;
  totalItemsSold: number;
}

export interface SalesStatement {
  bills: SalesStatementRow[];
  summary: SalesStatementSummary;
}

export interface TopProduct {
  _id: string;
  totalQty: number;
  totalRevenue: number;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}/reports`;

  getSalesStatement(params: { dateFrom?: string; dateTo?: string; salesman?: string; customerId?: string } = {}): Observable<ApiResponse<SalesStatement>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return this.http.get<ApiResponse<SalesStatement>>(`${this.api}/sales-statement`, { params: p });
  }

  getTopProducts(params: { dateFrom?: string; dateTo?: string; limit?: number } = {}): Observable<ApiResponse<TopProduct[]>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, String(v)); });
    return this.http.get<ApiResponse<TopProduct[]>>(`${this.api}/top-products`, { params: p });
  }
}
