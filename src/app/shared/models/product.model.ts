export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'pharmacist' | 'billing';
  isVerified: boolean;
}

export interface Product {
  _id?: string;
  productName: string;
  hsnNo: string;
  mfgCompany: string;
  supplierId?: string;
  supplierName?: string;
  supplierAddress?: string;
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

export interface Supplier {
  _id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  gstNo?: string;
  drugLicenseNo?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  fullAddress?: string;
  isActive?: boolean;
}

export interface Customer {
  _id?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  doctorName?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  fullAddress?: string;
  totalBills?: number;
  totalSpend?: number;
  isActive?: boolean;
}

export const SCHEDULE_OPTIONS = ['H', 'H1', 'X', 'G', 'C', 'C1', 'OTC'];
export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];
