import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Product, SCHEDULE_OPTIONS } from '../../shared/models/product.model';
import { ProductService } from '../../core/services/product';
import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
    ]),
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit{
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private toastService = inject(Toast);

  products = signal<Product[]>([]);
  loading = signal(true);
  showModal = signal(false);
  showDeleteModal = signal(false);
  editMode = signal(false);
  editTarget = signal<Product | null>(null);
  deleteTarget = signal<Product | null>(null);
  saveLoading = signal(false);
  deleteLoading = signal(false);
  taxPreview = signal<{ taxable: number; cgst: number; sgst: number; total: number } | null>(null);
  hasMore = signal(false);
  schedules = SCHEDULE_OPTIONS;
  private currentPage = 1;

  productForm = this.fb.group({
    productName: ['', [Validators.required, Validators.minLength(2)]],
    hsnNo: ['', Validators.required],
    mfgCompany: ['', Validators.required],
    batch: ['', Validators.required],
    pack: [''],
    sch: [''],
    expDate: ['', Validators.required],
    mrp: [null as number | null, [Validators.required, Validators.min(0)]],
    rate: [null as number | null, [Validators.required, Validators.min(0)]],
    quantity: [null as number | null, [Validators.required, Validators.min(0)]],
    discPercent: [0, [Validators.min(0), Validators.max(100)]],
    cgstPercent: [0, Validators.min(0)],
    sgstPercent: [0, Validators.min(0)],
  });

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(page = 1): void {
    this.loading.set(true);
    this.productService.getProducts({ page, limit: 18 }).subscribe({
      next: (res) => {
        if (page === 1) this.products.set(res.data || []);
        else this.products.update((p) => [...p, ...(res.data || [])]);
        const pg = res.pagination;
        this.hasMore.set(pg ? pg.page < pg.totalPages : false);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore(): void {
    this.currentPage++;
    this.loadProducts(this.currentPage);
  }

  isInvalid(field: string): boolean {
    const c = this.productForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  recalcTax(): void {
    const { rate, discPercent, cgstPercent, sgstPercent } = this.productForm.value;
    if (!rate) { this.taxPreview.set(null); return; }
    const disc = discPercent || 0;
    const taxable = rate * (1 - disc / 100);
    const cgst = (taxable * (cgstPercent || 0)) / 100;
    const sgst = (taxable * (sgstPercent || 0)) / 100;
    this.taxPreview.set({ taxable, cgst, sgst, total: taxable + cgst + sgst });
  }

  openAddModal(): void {
    this.editMode.set(false);
    this.editTarget.set(null);
    this.productForm.reset({ discPercent: 0, cgstPercent: 0, sgstPercent: 0 });
    this.taxPreview.set(null);
    this.showModal.set(true);
  }

  openEditModal(product: Product): void {
    this.editMode.set(true);
    this.editTarget.set(product);
    const expDate = product.expDate ? new Date(product.expDate).toISOString().substring(0, 7) : '';
    this.productForm.patchValue({ ...product, expDate } as any);
    this.recalcTax();
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  submitForm(): void {
    if (this.productForm.invalid) { this.productForm.markAllAsTouched(); return; }
    this.saveLoading.set(true);

    const formVal = this.productForm.value;
    const expDate = formVal.expDate ? new Date(formVal.expDate + '-01') : null;
    const payload = { ...formVal, expDate };

    const req = this.editMode()
      ? this.productService.updateProduct(this.editTarget()!._id!, payload as any)
      : this.productService.createProduct(payload as any);

    req.subscribe({
      next: () => {
        this.toastService.success(this.editMode() ? 'Medicine updated.' : 'Medicine added to inventory!');
        this.closeModal();
        this.saveLoading.set(false);
        this.currentPage = 1;
        this.loadProducts();
      },
      error: () => this.saveLoading.set(false),
    });
  }

  confirmDelete(p: Product): void { this.deleteTarget.set(p); this.showDeleteModal.set(true); }
  closeDeleteModal(): void { this.showDeleteModal.set(false); this.deleteTarget.set(null); }

  deleteProduct(): void {
    if (!this.deleteTarget()) return;
    this.deleteLoading.set(true);
    this.productService.deleteProduct(this.deleteTarget()!._id!).subscribe({
      next: () => {
        this.toastService.success('Medicine deleted.');
        this.closeDeleteModal();
        this.deleteLoading.set(false);
        this.currentPage = 1;
        this.loadProducts();
      },
      error: () => this.deleteLoading.set(false),
    });
  }

  isExpiringSoon(date: Date | string): boolean {
    const exp = new Date(date);
    const oneMonth = new Date();
    oneMonth.setMonth(oneMonth.getMonth() + 1);
    return exp > new Date() && exp <= oneMonth;
  }

  isExpired(date: Date | string): boolean { return new Date(date) < new Date(); }

}
