// src/app/core/services/masters.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Supplier, Customer } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MastersService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/masters`;

  // ── Suppliers ──────────────────────────────────────────────
  getSuppliers(params: { search?: string; page?: number; limit?: number; isActive?: boolean } = {}): Observable<ApiResponse<Supplier[]>> {
    let p = new HttpParams();
    if (params.search !== undefined && params.search !== '') p = p.set('search', params.search);
    if (params.page)   p = p.set('page',     String(params.page));
    if (params.limit)  p = p.set('limit',    String(params.limit));
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    return this.http.get<ApiResponse<Supplier[]>>(`${this.apiUrl}/suppliers`, { params: p });
  }

  getSupplier(id: string): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${this.apiUrl}/suppliers/${id}`);
  }

  createSupplier(payload: Partial<Supplier>): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.apiUrl}/suppliers`, payload);
  }

  updateSupplier(id: string, payload: Partial<Supplier>): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${this.apiUrl}/suppliers/${id}`, payload);
  }

  deleteSupplier(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/suppliers/${id}`);
  }

  // ── Customers ──────────────────────────────────────────────
  getCustomers(params: { search?: string; page?: number; limit?: number } = {}): Observable<ApiResponse<Customer[]>> {
    let p = new HttpParams();
    if (params.search !== undefined && params.search !== '') p = p.set('search', params.search);
    if (params.page)  p = p.set('page',  String(params.page));
    if (params.limit) p = p.set('limit', String(params.limit));
    return this.http.get<ApiResponse<Customer[]>>(`${this.apiUrl}/customers`, { params: p });
  }

  getCustomer(id: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/customers/${id}`);
  }

  createCustomer(payload: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.apiUrl}/customers`, payload);
  }

  updateCustomer(id: string, payload: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/customers/${id}`, payload);
  }

  deleteCustomer(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/customers/${id}`);
  }
}
