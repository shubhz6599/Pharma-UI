// src/app/core/services/product.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Product, ProductBatch, BatchSearchResult, ProductFilter, DashboardStats } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/stats/dashboard`);
  }

  // ── Product Master CRUD ───────────────────────────────────
  getProducts(filter: ProductFilter = {}): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, String(val));
      }
    });
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl, { params });
  }

  getProduct(id: string): Observable<ApiResponse<Product & { batches: ProductBatch[] }>> {
    return this.http.get<ApiResponse<Product & { batches: ProductBatch[] }>>(`${this.apiUrl}/${id}`);
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

  // ── Batch operations ──────────────────────────────────────
  // Used by Billing: live batch search across all products (name, generic, company, HSN)
  searchBatches(search: string, limit = 10): Observable<ApiResponse<BatchSearchResult[]>> {
    const params = new HttpParams().set('search', search).set('limit', String(limit));
    return this.http.get<ApiResponse<BatchSearchResult[]>>(`${this.apiUrl}/batches/search`, { params });
  }

  getBatchesForProduct(productId: string): Observable<ApiResponse<ProductBatch[]>> {
    return this.http.get<ApiResponse<ProductBatch[]>>(`${this.apiUrl}/${productId}/batches`);
  }

  createOrUpdateBatch(productId: string, batch: Partial<ProductBatch>): Observable<ApiResponse<ProductBatch>> {
    return this.http.post<ApiResponse<ProductBatch>>(`${this.apiUrl}/${productId}/batches`, batch);
  }

  deleteBatch(batchId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/batches/${batchId}`);
  }

  updateStock(
    batchId: string,
    payload: { quantityChange: number; type: string; reference?: string; notes?: string }
  ): Observable<ApiResponse<{ batchId: string; quantityBefore: number; quantityAfter: number }>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/batches/${batchId}/stock`, payload);
  }
}
