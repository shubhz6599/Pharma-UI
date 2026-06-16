// src/app/shared/models/product.model.ts
export interface Product {
  _id?: string;
  productName: string;
  hsnNo: string;
  mfgCompany: string;
  batch: string;
  pack?: string;
  sch?: string;
  expDate: Date | string;
  mrp: number;
  rate: number;
  discPercent?: number;
  taxableAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductFilter {
  search?: string;
  productName?: string;
  mfgCompany?: string;
  hsnNo?: string;
  batch?: string;
  pack?: string;
  sch?: string;
  quantityMin?: number;
  quantityMax?: number;
  mrpMin?: number;
  mrpMax?: number;
  expDateFrom?: string;
  expDateTo?: string;
  expiringSoon?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalProducts: number;
  expiringSoon: number;
  lowStock: number;
  totalInventoryValue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
  errors?: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Billing Models
export interface BillItem {
  productId: string;
  productName: string;
  batch: string;
  expDate: string;
  mrp: number;
  rate: number;
  quantity: number;
  discPercent: number;
  taxableAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  totalAmount: number;
}

export interface Bill {
  _id?: string;
  billNo: string;
  billDate: Date;
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  createdAt?: Date;
}

export interface BillCartItem {
  product: Product;
  quantity: number;
  discPercent: number;
}

export interface Transaction {
  _id?: string;
  product: string;
  productName: string;
  batch: string;
  type: 'purchase' | 'sale' | 'adjustment';
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reference?: string;
  notes?: string;
  createdAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'pharmacist' | 'billing';
}

export type SortOrder = 'asc' | 'desc';

export const SCHEDULE_OPTIONS = ['H', 'H1', 'X', 'G', 'C', 'C1', 'OTC'];
