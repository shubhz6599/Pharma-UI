// src/app/features/billing/billing.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { BillingService, GenerateBillPayload }  from '../../core/services/billing.service';
import { Product, BillCartItem, Bill, Customer } from '../../shared/models/product.model';
import { ProductService } from '../../core/services/product';
import { MastersService } from '../../core/services/masters';
import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(6px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
    ]),
    trigger('slideDown', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(-8px)', maxHeight: '0' }), animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)', maxHeight: '400px' }))]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0, maxHeight: '0' }))]),
    ]),
    trigger('cartStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-10px)' }),
          stagger(35, [animate('180ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))]),
        ], { optional: true }),
      ]),
    ]),
  ],
  templateUrl: './billing.html',
  styleUrl: './billing.css',
})
export class Billing implements OnInit{
   private prodSvc    = inject(ProductService);
  private billSvc    = inject(BillingService);
  private mastersSvc = inject(MastersService);
  private toast      = inject(Toast);

  tab          = signal<'new'|'history'>('new');
  cart         = signal<BillCartItem[]>([]);
  generatedBill= signal<any>(null);
  billLoading  = signal(false);

  // Customer
  custMode         = signal<'master'|'manual'>('master');
  custSearch       = '';
  custResults      = signal<Customer[]>([]);
  custSearchLoading= signal(false);
  selectedCustomer = signal<Customer | null>(null);
  manualCustName   = '';
  manualCustPhone  = '';
  manualCustAddress= '';
  manualCustDlNo   = '';
  manualCustGst    = '';

  // Product search
  prodSearch        = '';
  prodResults       = signal<Product[]>([]);
  prodSearchLoading = signal(false);

  // History
  bills    = signal<Bill[]>([]);
  histLoading = signal(false);
  histSearch  = '';
  histPage    = 1;
  histPag: any = null;

  private custTimer?: ReturnType<typeof setTimeout>;
  private prodTimer?: ReturnType<typeof setTimeout>;
  private histTimer?: ReturnType<typeof setTimeout>;

  totals = computed(() => {
    let subtotal=0, discount=0, cgst=0, sgst=0;
    for (const i of this.cart()) {
      const raw    = i.product.rate * i.quantity;
      const disc   = raw * ((i.discPercent||0)/100);
      const tax    = raw - disc;
      subtotal += raw; discount += disc;
      cgst += (tax * (i.product.cgstPercent||0)) / 100;
      sgst += (tax * (i.product.sgstPercent||0)) / 100;
    }
    return { subtotal, discount, cgst, sgst, grand: subtotal - discount + cgst + sgst };
  });

  ngOnInit(): void {}

  // ── Customer search ────────────────
  searchCustomers(val: string): void {
    clearTimeout(this.custTimer);
    this.selectedCustomer.set(null);
    if (val.length < 2) { this.custResults.set([]); return; }
    this.custSearchLoading.set(true);
    this.custTimer = setTimeout(() => {
      this.mastersSvc.getCustomers({ search: val, limit: 6 }).subscribe({
        next:  r => { this.custResults.set(r.data ?? []); this.custSearchLoading.set(false); },
        error: () => this.custSearchLoading.set(false),
      });
    }, 280);
  }

  selectCustomer(c: Customer): void {
    this.selectedCustomer.set(c);
    this.custSearch = c.name;
    this.custResults.set([]);
  }

  clearCustomer(): void { this.selectedCustomer.set(null); this.custSearch = ''; }

  // ── Product search ─────────────────
  searchProducts(val: string): void {
    clearTimeout(this.prodTimer);
    if (val.length < 2) { this.prodResults.set([]); return; }
    this.prodSearchLoading.set(true);
    this.prodTimer = setTimeout(() => {
      this.prodSvc.getProducts({ search: val, limit: 8 }).subscribe({
        next:  r => { this.prodResults.set(r.data ?? []); this.prodSearchLoading.set(false); },
        error: () => this.prodSearchLoading.set(false),
      });
    }, 280);
  }

  // ── Cart ops ───────────────────────
  addToCart(p: Product): void {
    if (p.quantity === 0) { this.toast.warning('Out of stock.'); return; }
    const idx = this.cart().findIndex(i => i.product._id === p._id);
    if (idx >= 0) {
      if (this.cart()[idx].quantity >= p.quantity) { this.toast.warning(`Max available: ${p.quantity}`); return; }
      const c = [...this.cart()]; c[idx] = { ...c[idx], quantity: c[idx].quantity + 1 }; this.cart.set(c);
    } else {
      this.cart.update(c => [...c, { product: p, quantity: 1, discPercent: p.discPercent || 0 }]);
    }
    this.prodSearch = ''; this.prodResults.set([]);
  }

  updateQty(i: number, qty: number): void {
    if (qty < 1) { this.removeItem(i); return; }
    const c = [...this.cart()];
    c[i] = { ...c[i], quantity: Math.min(qty, c[i].product.quantity) };
    this.cart.set(c);
  }

  updateDisc(i: number, d: number): void {
    const c = [...this.cart()];
    c[i] = { ...c[i], discPercent: Math.max(0, Math.min(100, d)) };
    this.cart.set(c);
  }

  removeItem(i: number): void { this.cart.update(c => c.filter((_,idx) => idx !== i)); }
  clearCart(): void { this.cart.set([]); this.generatedBill.set(null); }

  calcItem(item: BillCartItem): number {
    const raw = item.product.rate * item.quantity;
    const tax = raw * (1 - (item.discPercent||0)/100);
    const c   = (tax * (item.product.cgstPercent||0)) / 100;
    const s   = (tax * (item.product.sgstPercent||0)) / 100;
    return tax + c + s;
  }

  // ── Generate bill ──────────────────
  generateBill(): void {
    if (!this.cart().length) return;
    this.billLoading.set(true);

    // Pick supplier from the first cart item's product
    const firstProd = this.cart()[0].product;

    const payload: GenerateBillPayload = {
      // Customer
      customerId:        this.custMode() === 'master' ? this.selectedCustomer()?._id : undefined,
      customerName:      this.custMode() === 'master' ? this.selectedCustomer()?.name  : this.manualCustName  || undefined,
      customerPhone:     this.custMode() === 'master' ? this.selectedCustomer()?.phone : this.manualCustPhone || undefined,
      customerAddress:   this.custMode() === 'master' ? this.selectedCustomer()?.fullAddress : this.manualCustAddress || undefined,
      customerDlNo:      this.manualCustDlNo  || undefined,
      customerGstNo:     this.manualCustGst   || undefined,
      customerState:     'MAHARASHTRA',
      customerStateCode: '27',
      // Supplier (from product)
      supplierName:    firstProd.supplierName    || undefined,
      supplierAddress: firstProd.supplierAddress || undefined,
      // Items
      items: this.cart().map(i => ({ productId: i.product._id!, quantity: i.quantity, discPercent: i.discPercent })),
    };

    this.billSvc.generateBill(payload).subscribe({
      next: r => {
        this.generatedBill.set(r.data);
        this.billLoading.set(false);
        this.toast.success(`Invoice ${r.data?.billNo} generated!`);
        this.cart.set([]);
        this.clearCustomer();
        this.manualCustName = this.manualCustPhone = this.manualCustAddress = this.manualCustDlNo = this.manualCustGst = '';
      },
      error: () => this.billLoading.set(false),
    });
  }

  newBill(): void { this.generatedBill.set(null); }

  // ── Print ──────────────────────────
  printBill(): void {
    const el = document.getElementById('gst-print-area');
    if (!el) return;
    el.style.display = 'block';
    window.print();
    el.style.display = 'none';
  }

  // ── History ────────────────────────
  switchHistory(): void { this.tab.set('history'); this.loadHistory(); }

  onHistSearch(): void {
    clearTimeout(this.histTimer);
    this.histTimer = setTimeout(() => { this.histPage=1; this.loadHistory(); }, 320);
  }

  loadHistory(): void {
    this.histLoading.set(true);
    const p: Record<string,string> = { page: String(this.histPage), limit: '15' };
    if (this.histSearch) p['billNo'] = this.histSearch;
    this.billSvc.getBills(p).subscribe({
      next:  r => { this.bills.set(r.data ?? []); this.histPag = r.pagination ?? null; this.histLoading.set(false); },
      error: () => this.histLoading.set(false),
    });
  }

  isExpiringSoon(d: Date|string): boolean {
    const exp = new Date(d), soon = new Date(); soon.setMonth(soon.getMonth()+1);
    return exp > new Date() && exp <= soon;
  }
  isExpired(d: Date|string): boolean { return new Date(d) < new Date(); }
}
