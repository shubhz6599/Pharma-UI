// src/app/features/billing/stock-ledger/stock-ledger.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  trigger, transition, style, animate, stagger, query
} from '@angular/animations';
import { ProductService } from '../../core/services/product';
import { BillingService } from '../../core/services/billing.service';
import { Toast } from '../../core/services/toast';
import { Product, Transaction } from '../../shared/models/product.model';


@Component({
  selector: 'app-stock-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('230ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-8px)' }),
        animate('220ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
      transition(':leave', [
        animate('160ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
      ]),
    ]),
    trigger('rowsIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-8px)' }),
          stagger(25, [animate('180ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))]),
        ], { optional: true }),
      ]),
    ]),
  ],
  templateUrl: './stock-ledger.html',
  styleUrl: './stock-ledger.css',
})
export class StockLedger implements OnInit{
   private productService = inject(ProductService);
  private billingService = inject(BillingService);
  private toastService   = inject(Toast);

  /* ── Data ──────────────────────────── */
  transactions  = signal<Transaction[]>([]);
  filtered      = signal<Transaction[]>([]);
  loading       = signal(true);

  /* ── Filters ───────────────────────── */
  filterSearch = '';
  filterType   = '';

  /* ── Pagination (client-side on filtered) ── */
  private _currentPage = signal(1);
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize    = 15;

  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));
  readonly pageNums   = computed(() => {
    const total = this.totalPages();
    const cur   = this._currentPage();
    const start = Math.max(1, cur - 2);
    const end   = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  readonly kpis = computed(() => ({
    purchased: this.transactions()
      .filter((t) => t.type === 'purchase')
      .reduce((acc, t) => acc + Math.abs(t.quantityChange), 0),
    sold: this.transactions()
      .filter((t) => t.type === 'sale')
      .reduce((acc, t) => acc + Math.abs(t.quantityChange), 0),
    adjusted: this.transactions().filter((t) => t.type === 'adjustment').length,
  }));

  /* ── Modal ─────────────────────────── */
  showModal          = signal(false);
  modalSearch        = '';
  modalSearchResults = signal<Product[]>([]);
  modalSearchLoading = signal(false);
  selectedProduct    = signal<Product | null>(null);
  entryType          = 'purchase';
  entryQty           = 0;
  entryRef           = '';
  entryNotes         = '';
  submitLoading      = signal(false);

  private modalSearchTimeout?: ReturnType<typeof setTimeout>;

  readonly previewQty = computed(() => {
    const prod = this.selectedProduct();
    if (!prod || this.entryQty < 1) return prod?.quantity ?? 0;
    return this.entryType === 'purchase'
      ? prod.quantity + this.entryQty
      : prod.quantity - this.entryQty;
  });

  readonly canSubmit = computed(() =>
    !!this.selectedProduct() &&
    this.entryQty >= 1 &&
    this.previewQty() >= 0 &&
    !this.submitLoading()
  );

  /* Expose Math to template */
  readonly Math = Math;

  /* ── Lifecycle ─────────────────────── */
  ngOnInit(): void { this.loadTransactions(); }

  /* ── Load all transactions ─────────── */
  loadTransactions(): void {
    this.loading.set(true);
    this.billingService.getTransactions({ limit: '500' }).subscribe({
      next: (res) => {
        this.transactions.set(res.data ?? []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  /* ── Client-side filter ────────────── */
  applyFilters(): void {
    let result = [...this.transactions()];
    if (this.filterSearch.trim()) {
      const q = this.filterSearch.toLowerCase();
      result  = result.filter(
        (t) => t.productName.toLowerCase().includes(q) || t.batch.toLowerCase().includes(q)
      );
    }
    if (this.filterType) {
      result = result.filter((t) => t.type === this.filterType);
    }
    this.filtered.set(result);
    this._currentPage.set(1);
  }

  clearFilters(): void {
    this.filterSearch = '';
    this.filterType   = '';
    this.applyFilters();
  }

  gotoPage(p: number): void { this._currentPage.set(p); }

  /* ── Modal ─────────────────────────── */
  openModal(): void {
    this.selectedProduct.set(null);
    this.modalSearch        = '';
    this.entryType          = 'purchase';
    this.entryQty           = 0;
    this.entryRef           = '';
    this.entryNotes         = '';
    this.modalSearchResults.set([]);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalSearchResults.set([]);
  }

  searchProducts(val: string): void {
    clearTimeout(this.modalSearchTimeout);
    this.selectedProduct.set(null);
    if (val.length < 2) { this.modalSearchResults.set([]); return; }
    this.modalSearchLoading.set(true);
    this.modalSearchTimeout = setTimeout(() => {
      this.productService.getProducts({ search: val, limit: 6 }).subscribe({
        next:  (res) => { this.modalSearchResults.set(res.data ?? []); this.modalSearchLoading.set(false); },
        error: ()    => { this.modalSearchLoading.set(false); },
      });
    }, 280);
  }

  selectProduct(p: Product): void {
    this.selectedProduct.set(p);
    this.modalSearch = p.productName;
    this.modalSearchResults.set([]);
  }

  submitEntry(): void {
    if (!this.canSubmit()) return;
    this.submitLoading.set(true);

    this.productService.updateStock(this.selectedProduct()!._id!, {
      quantityChange: this.entryQty,
      type:           this.entryType,
      reference:      this.entryRef   || undefined,
      notes:          this.entryNotes || undefined,
    }).subscribe({
      next: () => {
        this.toastService.success(
          `${this.entryType.charAt(0).toUpperCase() + this.entryType.slice(1)} entry saved for ${this.selectedProduct()!.productName}.`
        );
        this.submitLoading.set(false);
        this.closeModal();
        this.loadTransactions();
      },
      error: () => { this.submitLoading.set(false); },
    });
  }
}
