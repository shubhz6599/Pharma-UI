// src/app/core/services/firm.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

export interface FirmMaster {
  _id?: string;
  firmName: string;
  ownerName?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNo?: string;
  drugLicenseNo1?: string;
  drugLicenseNo2?: string;
  panNo?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
}

export interface Salesman {
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  area?: string;
  commissionPercent?: number;
  isActive?: boolean;
}

export interface AreaMaster {
  _id?: string;
  name: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive?: boolean;
}

export interface TaxMaster {
  _id?: string;
  name: string;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  totalPercent?: number;
  hsnCodes?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FirmService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/config`;

  // Firm
  getFirm(): Observable<ApiResponse<FirmMaster>> { return this.http.get<ApiResponse<FirmMaster>>(`${this.api}/firm`); }
  saveFirm(d: Partial<FirmMaster>): Observable<ApiResponse<FirmMaster>> { return this.http.post<ApiResponse<FirmMaster>>(`${this.api}/firm`, d); }

  // Salesman
  getSalesmen(search?: string): Observable<ApiResponse<Salesman[]>> {
    let p = new HttpParams();
    if (search) p = p.set('search', search);
    return this.http.get<ApiResponse<Salesman[]>>(`${this.api}/salesmen`, { params: p });
  }
  createSalesman(d: Partial<Salesman>): Observable<ApiResponse<Salesman>> { return this.http.post<ApiResponse<Salesman>>(`${this.api}/salesmen`, d); }
  updateSalesman(id: string, d: Partial<Salesman>): Observable<ApiResponse<Salesman>> { return this.http.put<ApiResponse<Salesman>>(`${this.api}/salesmen/${id}`, d); }
  deleteSalesman(id: string): Observable<ApiResponse<null>> { return this.http.delete<ApiResponse<null>>(`${this.api}/salesmen/${id}`); }

  // Area
  getAreas(search?: string): Observable<ApiResponse<AreaMaster[]>> {
    let p = new HttpParams();
    if (search) p = p.set('search', search);
    return this.http.get<ApiResponse<AreaMaster[]>>(`${this.api}/areas`, { params: p });
  }
  createArea(d: Partial<AreaMaster>): Observable<ApiResponse<AreaMaster>> { return this.http.post<ApiResponse<AreaMaster>>(`${this.api}/areas`, d); }
  updateArea(id: string, d: Partial<AreaMaster>): Observable<ApiResponse<AreaMaster>> { return this.http.put<ApiResponse<AreaMaster>>(`${this.api}/areas/${id}`, d); }
  deleteArea(id: string): Observable<ApiResponse<null>> { return this.http.delete<ApiResponse<null>>(`${this.api}/areas/${id}`); }

  // Tax
  getTaxes(): Observable<ApiResponse<TaxMaster[]>> { return this.http.get<ApiResponse<TaxMaster[]>>(`${this.api}/taxes`); }
  createTax(d: Partial<TaxMaster>): Observable<ApiResponse<TaxMaster>> { return this.http.post<ApiResponse<TaxMaster>>(`${this.api}/taxes`, d); }
  updateTax(id: string, d: Partial<TaxMaster>): Observable<ApiResponse<TaxMaster>> { return this.http.put<ApiResponse<TaxMaster>>(`${this.api}/taxes/${id}`, d); }
  deleteTax(id: string): Observable<ApiResponse<null>> { return this.http.delete<ApiResponse<null>>(`${this.api}/taxes/${id}`); }
}
