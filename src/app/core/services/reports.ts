// src/app/core/services/reports.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}/reports`;

  private params(obj: Record<string, string | undefined>): HttpParams {
    let p = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return p;
  }

  getSalesStatement(f: { dateFrom?: string; dateTo?: string; salesman?: string } = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/sales-statement`, { params: this.params(f) });
  }

  getPurchaseReport(f: { dateFrom?: string; dateTo?: string; supplierId?: string } = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/purchase-report`, { params: this.params(f) });
  }

  getGstReport(f: { dateFrom?: string; dateTo?: string; type?: string } = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/gst-report`, { params: this.params(f) });
  }

  getStockReport(f: { category?: string; supplierId?: string; lowStockOnly?: string } = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/stock-report`, { params: this.params(f) });
  }

  getExpiryReport(f: { type?: string } = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/expiry-report`, { params: this.params(f) });
  }

  getTopProducts(f: { dateFrom?: string; dateTo?: string; limit?: string } = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/top-products`, { params: this.params(f) });
  }
}
