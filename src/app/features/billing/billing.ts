// src/app/features/billing/billing.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  trigger, transition, style, animate, stagger, query
} from '@angular/animations';
import { BillingService, GenerateBillPayload } from '../../core/services/billing.service';
import { Product, BillCartItem, Bill } from '../../shared/models/product.model';
import { ProductService } from '../../core/services/product';
import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' })),
      ]),
    ]),
    trigger('cartStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-10px)' }),
          stagger(35, [
            animate('190ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
  templateUrl: './billing.html',
  styleUrl: './billing.css',
})
export class Billing implements OnInit{
  private productService = inject(ProductService);
  private billingService = inject(BillingService);
  private toastService = inject(Toast);

  activeTab = signal<'new' | 'history'>('new');

  /* ── Cart state ────────────────────── */
  cart = signal<BillCartItem[]>([]);
  customerName = '';
  customerPhone = '';

  /* ── Product search ────────────────── */
  productSearch = '';
  searchResults = signal<Product[]>([]);
  searchLoading = signal(false);
  private searchTimeout?: ReturnType<typeof setTimeout>;

  /* ── Bill generation ───────────────── */
  billLoading = signal(false);
  generatedBill = signal<any>(null);

  /* ── History ───────────────────────── */
  bills = signal<Bill[]>([]);
  historyLoading = signal(false);
  historySearch = '';
  historyPage = 1;
  historyPagination: { totalPages: number; total: number } | null = null;
  private historyTimeout?: ReturnType<typeof setTimeout>;

  /* ── Computed totals ───────────────── */
  billTotals = computed(() => {
    let subtotal = 0, discount = 0, cgst = 0, sgst = 0;
    for (const item of this.cart()) {
      const raw      = item.product.rate * item.quantity;
      const disc     = raw * ((item.discPercent || 0) / 100);
      const taxable  = raw - disc;
      const c        = (taxable * (item.product.cgstPercent || 0)) / 100;
      const s        = (taxable * (item.product.sgstPercent || 0)) / 100;
      subtotal += raw;
      discount += disc;
      cgst     += c;
      sgst     += s;
    }
    return {
      subtotal,
      discount,
      cgst,
      sgst,
      grandTotal: subtotal - discount + cgst + sgst,
    };
  });

  historyPageNums = computed(() => {
    if (!this.historyPagination) return [];
    const total = this.historyPagination.totalPages;
    const cur   = this.historyPage;
    const start = Math.max(1, cur - 2);
    const end   = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  ngOnInit(): void {}

  /* ── Product search ────────────────── */
  onProductSearch(val: string): void {
    clearTimeout(this.searchTimeout);
    if (val.length < 2) { this.searchResults.set([]); return; }
    this.searchLoading.set(true);
    this.searchTimeout = setTimeout(() => {
      this.productService.getProducts({ search: val, limit: 8 }).subscribe({
        next:  (res) => { this.searchResults.set(res.data ?? []); this.searchLoading.set(false); },
        error: ()    => { this.searchLoading.set(false); },
      });
    }, 280);
  }

  /* ── Cart operations ───────────────── */
  addToCart(product: Product): void {
    if (product.quantity === 0) {
      this.toastService.warning('This product is out of stock.');
      return;
    }
    const existing = this.cart().findIndex((i) => i.product._id === product._id);
    if (existing >= 0) {
      if (this.cart()[existing].quantity >= product.quantity) {
        this.toastService.warning(`Max available stock: ${product.quantity}`);
        return;
      }
      const updated = [...this.cart()];
      updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + 1 };
      this.cart.set(updated);
    } else {
      this.cart.update((c) => [
        ...c,
        { product, quantity: 1, discPercent: product.discPercent || 0 },
      ]);
    }
    this.productSearch = '';
    this.searchResults.set([]);
  }

  updateQty(idx: number, qty: number): void {
    if (qty < 1) { this.removeFromCart(idx); return; }
    const updated = [...this.cart()];
    const max     = updated[idx].product.quantity;
    if (qty > max) { this.toastService.warning(`Max available: ${max}`); }
    updated[idx] = { ...updated[idx], quantity: Math.min(qty, max) };
    this.cart.set(updated);
  }

  updateDisc(idx: number, disc: number): void {
    const updated = [...this.cart()];
    updated[idx]  = { ...updated[idx], discPercent: Math.max(0, Math.min(100, disc)) };
    this.cart.set(updated);
  }

  removeFromCart(idx: number): void {
    this.cart.update((c) => c.filter((_, i) => i !== idx));
  }

  clearCart(): void {
    this.cart.set([]);
    this.generatedBill.set(null);
  }

  calcItemTotal(item: BillCartItem): number {
    const raw     = item.product.rate * item.quantity;
    const taxable = raw * (1 - (item.discPercent || 0) / 100);
    const cgst    = (taxable * (item.product.cgstPercent || 0)) / 100;
    const sgst    = (taxable * (item.product.sgstPercent || 0)) / 100;
    return taxable + cgst + sgst;
  }

  /* ── Generate Bill ─────────────────── */
  generateBill(): void {
    if (this.cart().length === 0) return;
    this.billLoading.set(true);

    const payload: GenerateBillPayload = {
      customerName:  this.customerName  || undefined,
      customerPhone: this.customerPhone || undefined,
      items: this.cart().map((i) => ({
        productId:   i.product._id!,
        quantity:    i.quantity,
        discPercent: i.discPercent,
      })),
    };

    this.billingService.generateBill(payload).subscribe({
      next: (res) => {
        this.generatedBill.set(res.data);
        this.billLoading.set(false);
        this.toastService.success(`Bill ${(res.data as any)?.billNo} generated!`);
        this.cart.set([]);
        this.customerName  = '';
        this.customerPhone = '';
      },
      error: () => { this.billLoading.set(false); },
    });
  }

  newBill(): void {
    this.generatedBill.set(null);
    this.customerName  = '';
    this.customerPhone = '';
  }

  /* ── History ───────────────────────── */
  switchToHistory(): void {
    this.activeTab.set('history');
    this.loadBillHistory();
  }

  onHistorySearch(): void {
    clearTimeout(this.historyTimeout);
    this.historyTimeout = setTimeout(() => {
      this.historyPage = 1;
      this.loadBillHistory();
    }, 320);
  }

  loadBillHistory(): void {
    this.historyLoading.set(true);
    const params: Record<string, string> = {
      page:  String(this.historyPage),
      limit: '15',
    };
    if (this.historySearch) params['billNo'] = this.historySearch;

    this.billingService.getBills(params).subscribe({
      next: (res) => {
        this.bills.set(res.data ?? []);
        this.historyPagination = res.pagination
          ? { totalPages: res.pagination.totalPages, total: res.pagination.total }
          : null;
        this.historyLoading.set(false);
      },
      error: () => { this.historyLoading.set(false); },
    });
  }

  changeBillPage(p: number): void {
    this.historyPage = p;
    this.loadBillHistory();
  }

  /* ── Print ─────────────────────────── */
  printReceipt(): void {
    const content = document.getElementById('receipt-print-area')?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=420,height=650');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Bill</title>
      <style>
        body{font-family:monospace;font-size:12px;padding:16px;color:#000;background:#fff}
        strong{font-weight:bold}
        table{width:100%;border-collapse:collapse}
        th,td{padding:4px 3px;text-align:left;border-bottom:1px solid #ccc;vertical-align:top}
        small{font-size:10px;color:#555;display:block}
        .receipt-pharmacy strong{font-size:14px}
        .receipt-pharmacy p{color:#555;font-size:10px;margin:2px 0 0}
        .receipt-bill-row,.receipt-total-row{display:flex;justify-content:space-between;padding:2px 0}
        .receipt-grand{font-weight:bold;font-size:14px;border-top:2px solid #000;padding-top:4px;margin-top:2px}
        .receipt-footer-note{text-align:center;margin-top:10px;color:#777;font-size:11px}
      </style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  /* ── Helpers ───────────────────────── */
  isExpiringSoon(date: Date | string): boolean {
    const exp = new Date(date);
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 1);
    return exp > new Date() && exp <= soon;
  }

  isExpired(date: Date | string): boolean {
    return new Date(date) < new Date();
  }
}
