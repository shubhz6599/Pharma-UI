// src/app/shared/models/product.model.ts

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'pharmacist' | 'billing';
  isVerified: boolean;
}

// ── PRODUCT MASTER (catalog entry — no stock/batch data) ──────
export interface Product {
  _id?: string;
  productName: string;
  genericName?: string;
  mfgCompany: string;
  category?: string;
  unit?: string;
  hsnNo: string;
  sch?: string;
  minStockLevel: number;
  supplierId?: string;
  supplierName?: string;
  supplierAddress?: string;
  isActive?: boolean;
  // Optional enriched fields when fetched with includeBatches=true
  totalStock?: number;
  batchCount?: number;
  nearestExpiry?: Date | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── PRODUCT BATCH (a specific stock lot) ───────────────────────
export interface ProductBatch {
  _id?: string;
  productId: string;
  batchNo: string;
  expDate: Date | string;
  quantity: number;
  mrp: number;
  ptr: number;
  saleRate: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  schemeNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Flattened batch result returned by the billing batch-search endpoint
export interface BatchSearchResult {
  batchId: string;
  productId: string;
  productName: string;
  genericName?: string;
  mfgCompany: string;
  hsnNo: string;
  unit?: string;
  sch?: string;
  batchNo: string;
  expDate: Date | string;
  quantity: number;
  mrp: number;
  ptr: number;
  saleRate: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
}

export interface ProductFilter {
  search?: string;
  category?: string;
  mfgCompany?: string;
  includeBatches?: boolean;
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
  todaySales: number;
  todaySalesCount: number;
  todayPurchases: number;
  todayPurchasesCount: number;
  recentBills: { billNo: string; billDate: Date; customerName?: string; grandTotal: number }[];
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

// ── BILLING (Sales — stock OUT) ────────────────────────────────
export interface BillItem {
  productId: string;
  productName: string;
  hsnNo: string;
  mfgCode?: string;
  unit?: string;
  sch?: string;
  batchId?: string;
  batch: string;
  expDate: Date | string;
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
  amountPaid?: number;
  paymentStatus?: 'paid' | 'partial' | 'credit';
  isReturned?: boolean;
  createdAt?: Date;
}

// Cart item during billing — supports both a selected master batch AND free-text fallback
export interface BillCartItem {
  // From batch search (preferred path)
  batchId?: string;
  productId: string;
  productName: string;
  hsnNo?: string;
  mfgCompany?: string;
  unit?: string;
  sch?: string;
  batchNo: string;          // always present — either selected or manually typed
  expDate: Date | string;
  mrp: number;
  rate: number;
  quantity: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  availableStock?: number;  // only known if batchId is set
  isManualBatch: boolean;   // true if batch wasn't found in master and was typed in
}

export interface Transaction {
  _id?: string;
  productId: string;
  productName: string;
  batchNo: string;
  type: 'purchase' | 'sale' | 'purchase_return' | 'sale_return' | 'adjustment';
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reference?: string;
  notes?: string;
  createdAt?: Date;
}

// ── PURCHASE (Supplier invoice — stock IN) ─────────────────────
export interface PurchaseItem {
  productId: string;
  productName: string;
  batchNo: string;
  expDate: Date | string;
  quantity: number;
  freeQuantity: number;
  schemeNote?: string;
  mrp: number;
  ptr: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  totalAmount?: number;
}

export interface Purchase {
  _id?: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: Date | string;
  items: PurchaseItem[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  grandTotal: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  createdAt?: Date;
}

// Cart item during purchase entry
export interface PurchaseCartItem {
  productId: string;
  productName: string;
  batchNo: string;
  expDate: string;
  quantity: number;
  freeQuantity: number;
  schemeNote?: string;
  mrp: number;
  ptr: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
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
  totalPurchases?: number;
  outstandingDue?: number;
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
  outstandingDue?: number;
  isActive?: boolean;
}

export const SCHEDULE_OPTIONS = ['H', 'H1', 'X', 'G', 'C', 'C1', 'OTC'];
export const UNIT_OPTIONS = ['Strip', 'Bottle', 'Box', 'Vial', 'Tube', 'Sachet', 'Jar', 'Piece'];
export const PRODUCT_CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Surgical', 'General'];
export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];
