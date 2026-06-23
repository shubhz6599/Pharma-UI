// src/app/features/inventory/inventory.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Product, ProductBatch, Supplier, SCHEDULE_OPTIONS, UNIT_OPTIONS, PRODUCT_CATEGORIES } from '../../shared/models/product.model';
import { ProductService } from '../../core/services/product';
import { MastersService } from '../../core/services/masters';
import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  animations: [
    trigger('modalAnim', [
      transition(':enter', [style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }), animate('240ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))]),
      transition(':leave', [animate('170ms ease-in', style({ opacity: 0, transform: 'scale(0.96)' }))]),
    ]),
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideDown', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(-6px)', maxHeight: '0' }), animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)', maxHeight: '300px' }))]),
      transition(':leave', [animate('130ms ease-in', style({ opacity: 0, maxHeight: '0' }))]),
    ]),
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit{
   private fb         = inject(FormBuilder);
  private prodSvc    = inject(ProductService);
  private mastersSvc = inject(MastersService);
  private toast      = inject(Toast);

  products = signal<Product[]>([]);
  loading  = signal(true);
  hasMore  = signal(false);
  searchQ  = '';
  categoryFilter = '';
  categories = PRODUCT_CATEGORIES;
  units      = UNIT_OPTIONS;
  schedules  = SCHEDULE_OPTIONS;
  private currentPage = 1;
  private searchTimer?: ReturnType<typeof setTimeout>;

  // Product modal
  showProductModal = signal(false);
  editMode  = signal(false);
  editId    = signal('');
  saveLoading = signal(false);
  deleteTarget = signal<Product | null>(null);

  supplierSearch   = '';
  supplierResults  = signal<Supplier[]>([]);
  selectedSupplier = signal<Supplier | null>(null);
  private supplierTimer?: ReturnType<typeof setTimeout>;

  // Detail / batch state
  detailProduct  = signal<Product | null>(null);
  batches        = signal<ProductBatch[]>([]);
  batchesLoading = signal(false);
  showBatchModal = signal(false);
  editBatchMode  = signal(false);
  editBatchId    = signal('');
  deleteBatchTarget = signal<ProductBatch | null>(null);

  productForm = this.fb.group({
    productName:   ['', [Validators.required, Validators.minLength(2)]],
    genericName:   [''],
    hsnNo:         ['', Validators.required],
    mfgCompany:    ['', Validators.required],
    category:      [''],
    unit:          ['Strip'],
    sch:           [''],
    minStockLevel: [10, [Validators.required, Validators.min(0)]],
  });

  batchForm = this.fb.group({
    batchNo:     ['', Validators.required],
    expDate:     ['', Validators.required],
    quantity:    [0, [Validators.required, Validators.min(0)]],
    mrp:         [null as number | null, [Validators.required, Validators.min(0)]],
    ptr:         [null as number | null, [Validators.required, Validators.min(0)]],
    saleRate:    [null as number | null, [Validators.required, Validators.min(0)]],
    discPercent: [0],
    cgstPercent: [6],
    sgstPercent: [6],
  });

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(page = 1): void {
    this.loading.set(true);
    this.prodSvc.getProducts({ page, limit: 18, search: this.searchQ || undefined, category: this.categoryFilter || undefined, includeBatches: true }).subscribe({
      next: (res) => {
        if (page === 1) this.products.set(res.data || []);
        else this.products.update(p => [...p, ...(res.data || [])]);
        const pg = res.pagination;
        this.hasMore.set(pg ? pg.page < pg.totalPages : false);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void { clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => { this.currentPage = 1; this.loadProducts(); }, 320); }
  loadMore(): void { this.currentPage++; this.loadProducts(this.currentPage); }

  fi(f: string): boolean { const c = this.productForm.get(f); return !!(c?.invalid && c?.touched); }
  bfi(f: string): boolean { const c = this.batchForm.get(f); return !!(c?.invalid && c?.touched); }

  // ── Supplier autocomplete (Product Master default supplier) ──
  onSupplierSearch(val: string): void {
    clearTimeout(this.supplierTimer);
    this.selectedSupplier.set(null);
    if (val.length < 2) { this.supplierResults.set([]); return; }
    this.supplierTimer = setTimeout(() => {
      this.mastersSvc.getSuppliers({ search: val, limit: 6 }).subscribe({ next: r => this.supplierResults.set(r.data ?? []) });
    }, 280);
  }
  selectSupplier(s: Supplier): void { this.selectedSupplier.set(s); this.supplierSearch = s.name; this.supplierResults.set([]); }
  clearSupplier(): void { this.selectedSupplier.set(null); this.supplierSearch = ''; this.supplierResults.set([]); }

  // ── Product Master modal ──────────────────────────
  openAddProduct(): void {
    this.editMode.set(false); this.editId.set('');
    this.clearSupplier();
    this.productForm.reset({ unit: 'Strip', minStockLevel: 10 });
    this.showProductModal.set(true);
  }

  openEditProduct(p: Product): void {
    this.editMode.set(true); this.editId.set(p._id!);
    if (p.supplierName) {
      this.supplierSearch = p.supplierName;
      this.selectedSupplier.set({ _id: p.supplierId, name: p.supplierName, phone: '', address: { line1: p.supplierAddress || '', city: '', state: '', pincode: '' } } as any);
    } else this.clearSupplier();
    this.productForm.patchValue(p as any);
    this.showProductModal.set(true);
  }

  closeProductModal(): void { this.showProductModal.set(false); }

  submitProduct(): void {
    this.productForm.markAllAsTouched();
    if (this.productForm.invalid) return;
    this.saveLoading.set(true);
    const supplier = this.selectedSupplier();
    const payload = {
      ...this.productForm.value as any,
      supplierId: supplier?._id, supplierName: supplier?.name,
      supplierAddress: supplier ? [supplier.address?.line1, supplier.address?.city, supplier.address?.state].filter(Boolean).join(', ') : undefined,
    };
    const req = this.editMode() ? this.prodSvc.updateProduct(this.editId(), payload) : this.prodSvc.createProduct(payload);
    req.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Medicine updated.' : 'Medicine added!'); this.closeProductModal(); this.saveLoading.set(false); this.currentPage = 1; this.loadProducts(); },
      error: () => this.saveLoading.set(false),
    });
  }

  confirmDelete(p: Product): void { this.deleteTarget.set(p); }
  doDeleteProduct(): void {
    if (!this.deleteTarget()) return;
    this.prodSvc.deleteProduct(this.deleteTarget()!._id!).subscribe({
      next: () => { this.toast.success('Medicine deleted.'); this.deleteTarget.set(null); this.currentPage = 1; this.loadProducts(); },
    });
  }

  // ── Product Detail + Batches ───────────────────────
  openDetail(p: Product): void {
    this.detailProduct.set(p);
    this.loadBatches(p._id!);
  }
  closeDetail(): void { this.detailProduct.set(null); this.batches.set([]); }

  loadBatches(productId: string): void {
    this.batchesLoading.set(true);
    this.prodSvc.getBatchesForProduct(productId).subscribe({
      next: (r) => { this.batches.set(r.data ?? []); this.batchesLoading.set(false); },
      error: () => this.batchesLoading.set(false),
    });
  }

  openAddBatch(): void {
    this.editBatchMode.set(false); this.editBatchId.set('');
    this.batchForm.reset({ quantity: 0, discPercent: 0, cgstPercent: 6, sgstPercent: 6 });
    this.showBatchModal.set(true);
  }

  openEditBatch(b: ProductBatch): void {
    this.editBatchMode.set(true); this.editBatchId.set(b._id!);
    const expDate = b.expDate ? new Date(b.expDate).toISOString().substring(0, 7) : '';
    this.batchForm.patchValue({ ...b, expDate } as any);
    this.showBatchModal.set(true);
  }

  closeBatchModal(): void { this.showBatchModal.set(false); }

  submitBatch(): void {
    this.batchForm.markAllAsTouched();
    if (this.batchForm.invalid || !this.detailProduct()) return;
    this.saveLoading.set(true);
    const formVal = this.batchForm.value;
    const expDate = formVal.expDate ? new Date((formVal.expDate as string) + '-01') : null;
    this.prodSvc.createOrUpdateBatch(this.detailProduct()!._id!, { ...formVal as any, expDate }).subscribe({
      next: () => {
        this.toast.success(this.editBatchMode() ? 'Batch updated.' : 'Batch added.');
        this.closeBatchModal(); this.saveLoading.set(false);
        this.loadBatches(this.detailProduct()!._id!);
        this.currentPage = 1; this.loadProducts(); // refresh aggregate stock on cards
      },
      error: () => this.saveLoading.set(false),
    });
  }

  confirmDeleteBatch(b: ProductBatch): void { this.deleteBatchTarget.set(b); }
  doDeleteBatch(): void {
    if (!this.deleteBatchTarget() || !this.detailProduct()) return;
    this.prodSvc.deleteBatch(this.deleteBatchTarget()!._id!).subscribe({
      next: () => { this.toast.success('Batch removed.'); this.deleteBatchTarget.set(null); this.loadBatches(this.detailProduct()!._id!); this.currentPage = 1; this.loadProducts(); },
    });
  }

  isExpiringSoon(d: Date | string | null | undefined): boolean {
    if (!d) return false;
    const exp = new Date(d), soon = new Date(); soon.setMonth(soon.getMonth() + 1);
    return exp > new Date() && exp <= soon;
  }
  isExpired(d: Date | string | null | undefined): boolean { return !!d && new Date(d) < new Date(); }
}
