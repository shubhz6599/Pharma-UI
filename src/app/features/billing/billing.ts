// src/app/features/billing/billing.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { BillingService, GenerateBillPayload } from '../../core/services/billing.service';
import { BatchSearchResult, BillCartItem, Bill, Customer } from '../../shared/models/product.model';
import { ProductService } from '../../core/services/product';
import { MastersService } from '../../core/services/masters';
import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(6px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('slideDown', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(-6px)', maxHeight: '0' }), animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)', maxHeight: '400px' }))]),
      transition(':leave', [animate('130ms ease-in', style({ opacity: 0, maxHeight: '0' }))]),
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
  paymentStatus: 'paid'|'partial'|'credit' = 'paid';
  salesman = '';

  custMode         = signal<'master'|'manual'>('master');
  custSearch       = '';
  custResults      = signal<Customer[]>([]);
  selectedCustomer = signal<Customer | null>(null);
  manualName = ''; manualPhone = ''; manualAddress = ''; manualDlNo = ''; manualGst = '';

  prodSearch        = '';
  batchResults      = signal<BatchSearchResult[]>([]);
  prodSearchLoading = signal(false);

  showManualEntry = signal(false);
  manualProdName = ''; manualBatchNo = ''; manualBatchExp = '';
  manualBatchMrp = 0; manualBatchRate = 0; manualCgst = 6; manualSgst = 6;

  bills     = signal<Bill[]>([]);
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
      const raw  = i.rate * i.quantity;
      const disc = raw * ((i.discPercent||0)/100);
      const tax  = raw - disc;
      subtotal += raw; discount += disc;
      cgst += (tax * (i.cgstPercent||0)) / 100;
      sgst += (tax * (i.sgstPercent||0)) / 100;
    }
    return { subtotal, discount, cgst, sgst, grand: subtotal - discount + cgst + sgst };
  });

  ngOnInit(): void {}

  searchCustomers(val: string): void {
    clearTimeout(this.custTimer);
    this.selectedCustomer.set(null);
    if (val.length < 2) { this.custResults.set([]); return; }
    this.custTimer = setTimeout(() => {
      this.mastersSvc.getCustomers({ search: val, limit: 6 }).subscribe({ next: r => this.custResults.set(r.data ?? []) });
    }, 280);
  }
  selectCustomer(c: Customer): void { this.selectedCustomer.set(c); this.custSearch = c.name; this.custResults.set([]); }
  clearCustomer(): void { this.selectedCustomer.set(null); this.custSearch = ''; }

  searchBatches(val: string): void {
    clearTimeout(this.prodTimer);
    if (val.length < 2) { this.batchResults.set([]); return; }
    this.prodSearchLoading.set(true);
    this.prodTimer = setTimeout(() => {
      this.prodSvc.searchBatches(val, 10).subscribe({
        next: r => { this.batchResults.set(r.data ?? []); this.prodSearchLoading.set(false); },
        error: () => this.prodSearchLoading.set(false),
      });
    }, 280);
  }

  addBatchToCart(b: BatchSearchResult): void {
    const existing = this.cart().find(i => i.batchId === b.batchId);
    if (existing) { this.toast.warning('This batch is already in the bill.'); return; }
    this.cart.update(c => [...c, {
      batchId: b.batchId, productId: b.productId, productName: b.productName,
      hsnNo: b.hsnNo, mfgCompany: b.mfgCompany, unit: b.unit, sch: b.sch,
      batchNo: b.batchNo, expDate: b.expDate, mrp: b.mrp, rate: b.saleRate,
      quantity: 1, discPercent: b.discPercent || 0,
      cgstPercent: b.cgstPercent, sgstPercent: b.sgstPercent,
      availableStock: b.quantity, isManualBatch: false,
    }]);
    this.prodSearch = ''; this.batchResults.set([]);
  }

  openManualEntry(): void {
    this.showManualEntry.set(true);
    this.prodSearch = ''; this.batchResults.set([]);
  }

  addManualToCart(): void {
    if (!this.manualProdName || !this.manualBatchNo || !this.manualBatchMrp) {
      this.toast.error('Medicine name, batch number and MRP are required.'); return;
    }
    this.cart.update(c => [...c, {
      batchId: undefined, productId: 'manual_' + Date.now(), productName: this.manualProdName,
      batchNo: this.manualBatchNo, expDate: this.manualBatchExp ? new Date(this.manualBatchExp + '-01') : new Date(),
      mrp: this.manualBatchMrp, rate: this.manualBatchRate || this.manualBatchMrp,
      quantity: 1, discPercent: 0, cgstPercent: this.manualCgst, sgstPercent: this.manualSgst,
      isManualBatch: true,
    }]);
    this.showManualEntry.set(false);
    this.manualProdName = ''; this.manualBatchNo = ''; this.manualBatchExp = '';
    this.manualBatchMrp = 0; this.manualBatchRate = 0;
  }

  updateQty(i: number, qty: number): void {
    if (qty < 1) { this.removeItem(i); return; }
    const c = [...this.cart()];
    const item = c[i];
    if (item.availableStock && qty > item.availableStock) {
      this.toast.warning(`Only ${item.availableStock} in stock.`); return;
    }
    c[i] = { ...item, quantity: qty }; this.cart.set(c);
  }
  updateDisc(i: number, d: number): void { const c=[...this.cart()]; c[i]={...c[i],discPercent:Math.max(0,Math.min(100,d))}; this.cart.set(c); }
  removeItem(i: number): void { this.cart.update(c=>c.filter((_,idx)=>idx!==i)); }

  calcItem(item: BillCartItem): number {
    const raw=item.rate*item.quantity, tax=raw*(1-(item.discPercent||0)/100);
    return tax + (tax*(item.cgstPercent||0)/100) + (tax*(item.sgstPercent||0)/100);
  }

  generateBill(): void {
    if (!this.cart().length) return;
    this.billLoading.set(true);

    const payload: GenerateBillPayload = {
      customerId:        this.custMode()==='master' ? this.selectedCustomer()?._id : undefined,
      customerName:      this.custMode()==='master' ? this.selectedCustomer()?.name  : this.manualName  || undefined,
      customerPhone:     this.custMode()==='master' ? this.selectedCustomer()?.phone : this.manualPhone || undefined,
      customerAddress:   this.custMode()==='master' ? this.selectedCustomer()?.fullAddress : this.manualAddress || undefined,
      customerDlNo:      this.manualDlNo  || undefined,
      customerGstNo:     this.manualGst   || undefined,
      customerState:     'MAHARASHTRA', customerStateCode: '27',
      salesman:          this.salesman || undefined,
      paymentStatus:     this.paymentStatus,
      items: this.cart().map(i => ({
        productId:    i.productId.startsWith('manual_') ? undefined as any : i.productId,
        batchId:      i.batchId,
        batchNo:      i.batchNo,
        expDate:      i.expDate ? new Date(i.expDate).toISOString() : undefined,
        mrp:          i.mrp, rate: i.rate, quantity: i.quantity,
        discPercent:  i.discPercent, cgstPercent: i.cgstPercent, sgstPercent: i.sgstPercent,
      })),
    };

    this.billSvc.generateBill(payload).subscribe({
      next: r => {
        this.generatedBill.set(r.data);
        this.billLoading.set(false);
        this.toast.success(`Invoice ${r.data?.billNo} generated!`);
        this.cart.set([]); this.clearCustomer();
        this.manualName=this.manualPhone=this.manualAddress=this.manualDlNo=this.manualGst='';
      },
      error: () => this.billLoading.set(false),
    });
  }

  newBill(): void { this.generatedBill.set(null); }

  printBill(): void {
    const el = document.getElementById('gst-print-area');
    if (!el) return;
    el.style.display = 'block';
    window.print();
    el.style.display = 'none';
  }

  switchHistory(): void { this.tab.set('history'); this.loadHistory(); }
  onHistSearch(): void { clearTimeout(this.histTimer); this.histTimer = setTimeout(()=>{ this.histPage=1; this.loadHistory(); },320); }
  loadHistory(): void {
    this.histLoading.set(true);
    this.billSvc.getBills({ page: String(this.histPage), limit: '15', ...(this.histSearch?{billNo:this.histSearch}:{}) }).subscribe({
      next: r => { this.bills.set(r.data??[]); this.histPag=r.pagination??null; this.histLoading.set(false); },
      error: () => this.histLoading.set(false),
    });
  }

  isExpiringSoon(d: Date|string): boolean { const e=new Date(d),s=new Date(); s.setMonth(s.getMonth()+1); return e>new Date()&&e<=s; }
  isExpired(d: Date|string): boolean { return new Date(d)<new Date(); }
}
