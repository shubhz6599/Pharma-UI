// src/app/features/inventory/inventory.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Product, Supplier, SCHEDULE_OPTIONS } from '../../shared/models/product.model';
import { ProductService } from '../../core/services/product';
import { MastersService } from '../../core/services/masters';
import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule],
  animations: [
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }),
        animate('240ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
      transition(':leave', [
        animate('170ms ease-in', style({ opacity: 0, transform: 'scale(0.96)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))]),
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)', maxHeight: '0' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)', maxHeight: '300px' })),
      ]),
      transition(':leave', [animate('130ms ease-in', style({ opacity: 0, maxHeight: '0' }))]),
    ]),
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit{
   private fb          = inject(FormBuilder);
  private prodSvc     = inject(ProductService);
  private mastersSvc  = inject(MastersService);
  private toast       = inject(Toast);

  products      = signal<Product[]>([]);
  loading       = signal(true);
  hasMore       = signal(false);
  showModal     = signal(false);
  showDeleteModal = signal(false);
  editMode      = signal(false);
  editId        = signal('');
  deleteTarget  = signal<Product | null>(null);
  saveLoading   = signal(false);
  deleteLoading = signal(false);
  taxPreview    = signal<{ taxable: number; cgst: number; sgst: number; total: number } | null>(null);
  schedules     = SCHEDULE_OPTIONS;

  // Supplier search state
  supplierSearch        = '';
  supplierResults       = signal<Supplier[]>([]);
  supplierSearchLoading = signal(false);
  selectedSupplier      = signal<Supplier | null>(null);
  private supplierTimer?: ReturnType<typeof setTimeout>;
  private currentPage   = 1;

  supplierAddressDisplay = () => {
    const s = this.selectedSupplier();
    if (!s) return '';
    const a = s.address;
    if (!a) return '';
    return [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ');
  };

  productForm = this.fb.group({
    productName:  ['', [Validators.required, Validators.minLength(2)]],
    hsnNo:        ['', Validators.required],
    mfgCompany:   ['', Validators.required],
    batch:        ['', Validators.required],
    pack:         [''],
    sch:          [''],
    expDate:      ['', Validators.required],
    mrp:          [null as number | null, [Validators.required, Validators.min(0)]],
    rate:         [null as number | null, [Validators.required, Validators.min(0)]],
    quantity:     [null as number | null, [Validators.required, Validators.min(0)]],
    discPercent:  [0, [Validators.min(0), Validators.max(100)]],
    cgstPercent:  [6, Validators.min(0)],
    sgstPercent:  [6, Validators.min(0)],
  });

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(page = 1): void {
    this.loading.set(true);
    this.prodSvc.getProducts({ page, limit: 18 }).subscribe({
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

  loadMore(): void { this.currentPage++; this.loadProducts(this.currentPage); }

  fi(f: string): boolean { const c = this.productForm.get(f); return !!(c?.invalid && c?.touched); }

  recalcTax(): void {
    const { rate, discPercent, cgstPercent, sgstPercent } = this.productForm.value;
    if (!rate) { this.taxPreview.set(null); return; }
    const taxable = (rate as number) * (1 - ((discPercent as number) || 0) / 100);
    const cgst    = (taxable * ((cgstPercent as number) || 0)) / 100;
    const sgst    = (taxable * ((sgstPercent as number) || 0)) / 100;
    this.taxPreview.set({ taxable, cgst, sgst, total: taxable + cgst + sgst });
  }

  // ── Supplier autocomplete ──────────────────────
  onSupplierSearch(val: string): void {
    clearTimeout(this.supplierTimer);
    this.selectedSupplier.set(null);
    if (val.length < 2) { this.supplierResults.set([]); return; }
    this.supplierSearchLoading.set(true);
    this.supplierTimer = setTimeout(() => {
      this.mastersSvc.getSuppliers({ search: val, limit: 6 }).subscribe({
        next:  r => { this.supplierResults.set(r.data ?? []); this.supplierSearchLoading.set(false); },
        error: () => this.supplierSearchLoading.set(false),
      });
    }, 280);
  }

  selectSupplier(s: Supplier): void {
    this.selectedSupplier.set(s);
    this.supplierSearch = s.name;
    this.supplierResults.set([]);
    // Auto-populate address in form context (stored in component, sent with save)
  }

  clearSupplier(): void {
    this.selectedSupplier.set(null);
    this.supplierSearch = '';
    this.supplierResults.set([]);
  }

  // ── Modal open/close ───────────────────────────
  openAdd(): void {
    this.editMode.set(false); this.editId.set('');
    this.clearSupplier();
    this.productForm.reset({ discPercent: 0, cgstPercent: 6, sgstPercent: 6 });
    this.taxPreview.set(null);
    this.showModal.set(true);
  }

  openEdit(p: Product): void {
    this.editMode.set(true); this.editId.set(p._id!);
    // Restore supplier if product has one
    if (p.supplierName) {
      this.supplierSearch = p.supplierName;
      this.selectedSupplier.set({
        _id:          p.supplierId,
        name:         p.supplierName,
        phone:        '',
        address:      { line1: p.supplierAddress || '', city: '', state: '', pincode: '' },
        fullAddress:  p.supplierAddress,
      } as any);
    } else {
      this.clearSupplier();
    }
    const expDate = p.expDate ? new Date(p.expDate).toISOString().substring(0, 7) : '';
    this.productForm.patchValue({ ...p, expDate } as any);
    this.recalcTax();
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  submitForm(): void {
    this.productForm.markAllAsTouched();
    if (this.productForm.invalid) return;
    this.saveLoading.set(true);

    const formVal  = this.productForm.value;
    const expDate  = formVal.expDate ? new Date((formVal.expDate as string) + '-01') : null;
    const supplier = this.selectedSupplier();

    const payload: Partial<Product> = {
      ...formVal as any,
      expDate,
      supplierId:      supplier?._id,
      supplierName:    supplier?.name,
      supplierAddress: supplier ? this.supplierAddressDisplay() : undefined,
    };

    const req = this.editMode()
      ? this.prodSvc.updateProduct(this.editId(), payload)
      : this.prodSvc.createProduct(payload);

    req.subscribe({
      next: () => {
        this.toast.success(this.editMode() ? 'Medicine updated.' : 'Medicine added!');
        this.closeModal(); this.saveLoading.set(false);
        this.currentPage = 1; this.loadProducts();
      },
      error: () => this.saveLoading.set(false),
    });
  }

  confirmDelete(p: Product): void { this.deleteTarget.set(p); this.showDeleteModal.set(true); }
  closeDeleteModal(): void { this.showDeleteModal.set(false); this.deleteTarget.set(null); }

  doDelete(): void {
    if (!this.deleteTarget()) return;
    this.deleteLoading.set(true);
    this.prodSvc.deleteProduct(this.deleteTarget()!._id!).subscribe({
      next: () => {
        this.toast.success('Medicine deleted.');
        this.closeDeleteModal(); this.deleteLoading.set(false);
        this.currentPage = 1; this.loadProducts();
      },
      error: () => this.deleteLoading.set(false),
    });
  }

  isExpiringSoon(d: Date | string): boolean {
    const exp = new Date(d), soon = new Date(); soon.setMonth(soon.getMonth() + 1);
    return exp > new Date() && exp <= soon;
  }
  isExpired(d: Date | string): boolean { return new Date(d) < new Date(); }
}
