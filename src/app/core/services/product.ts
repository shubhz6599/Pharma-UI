// src/app/core/services/product.service.ts
import { ApiResponse, Product, ProductFilter, DashboardStats, Bill } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/stats/dashboard`);
  }

  getProducts(filter: ProductFilter = {}): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, String(val));
      }
    });
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl, { params });
  }

  getProduct(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  updateStock(id: string, payload: { quantityChange: number; type: string; reference?: string; notes?: string }): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/stock`, payload);
  }
}


// src/app/core/services/billing.service.ts

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
    Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    return this.http.get<ApiResponse<Bill[]>>(this.apiUrl, { params: httpParams });
  }

  getBill(id: string): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.apiUrl}/${id}`);
  }

  getTransactions(params: Record<string, string> = {}): Observable<ApiResponse<any[]>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/transactions`, { params: httpParams });
  }
}
