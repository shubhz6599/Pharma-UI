// src/app/features/purchase/purchase.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import {  PurchaseCartItem, Supplier, Product, Purchase } from '../../shared/models/product.model';
import { PurchaseService } from '../../core/services/purchase';
import { ProductService } from '../../core/services/product';
import { MastersService } from '../../core/services/masters';
import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(6px)' }), animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('slideDown', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(-6px)', maxHeight: '0' }), animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)', maxHeight: '300px' }))]),
      transition(':leave', [animate('130ms ease-in', style({ opacity: 0, maxHeight: '0' }))]),
    ]),
  ],
  templateUrl: './purchase.html',
  styleUrl: './purchase.css',
})
export class PurchaseComponent implements OnInit {
  private purchaseSvc = inject(PurchaseService);
  private prodSvc     = inject(ProductService);
  private mastersSvc  = inject(MastersService);
  private toast       = inject(Toast);

  tab         = signal<'new'|'history'>('new');
  saveLoading = signal(false);
  cart        = signal<PurchaseCartItem[]>([]);

  supplierSearch   = '';
  supplierResults  = signal<Supplier[]>([]);
  selectedSupplier = signal<Supplier | null>(null);
  invoiceNo   = '';
  invoiceDate = new Date().toISOString().substring(0, 10);
  paymentStatus: 'paid'|'partial'|'unpaid' = 'unpaid';
  amountPaid  = 0;

  prodSearch        = '';
  prodResults       = signal<Product[]>([]);
  prodSearchLoading = signal(false);

  purchases   = signal<Purchase[]>([]);
  histLoading = signal(false);
  histSearch  = '';
  histFrom    = '';
  histTo      = '';
  histPage    = 1;
  histPag: any = null;

  private supplierTimer?: ReturnType<typeof setTimeout>;
  private prodTimer?: ReturnType<typeof setTimeout>;
  private histTimer?: ReturnType<typeof setTimeout>;

  grandTotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + this.calcLine(item), 0);
  });

  canSave = computed(() =>
    !!this.selectedSupplier() && !!this.invoiceNo.trim() && !!this.invoiceDate &&
    this.cart().length > 0 &&
    this.cart().every(i => i.batchNo.trim() && i.expDate && i.quantity > 0 && i.ptr > 0 && i.mrp > 0)
  );

  ngOnInit(): void {}

  searchSuppliers(val: string): void {
    clearTimeout(this.supplierTimer);
    this.selectedSupplier.set(null);
    if (val.length < 2) { this.supplierResults.set([]); return; }
    this.supplierTimer = setTimeout(() => {
      this.mastersSvc.getSuppliers({ search: val, limit: 6 }).subscribe({ next: r => this.supplierResults.set(r.data ?? []) });
    }, 280);
  }
  selectSupplier(s: Supplier): void { this.selectedSupplier.set(s); this.supplierSearch = s.name; this.supplierResults.set([]); }
  clearSupplier(): void { this.selectedSupplier.set(null); this.supplierSearch = ''; }

  searchProducts(val: string): void {
    clearTimeout(this.prodTimer);
    if (val.length < 2) { this.prodResults.set([]); return; }
    this.prodSearchLoading.set(true);
    this.prodTimer = setTimeout(() => {
      this.prodSvc.getProducts({ search: val, limit: 8 }).subscribe({
        next: r => { this.prodResults.set(r.data ?? []); this.prodSearchLoading.set(false); },
        error: () => this.prodSearchLoading.set(false),
      });
    }, 280);
  }

  addToCart(p: Product): void {
    const exists = this.cart().find(i => i.productId === p._id);
    if (exists) { this.toast.warning(`${p.productName} already in list. Add a new line below.`); return; }
    this.cart.update(c => [...c, {
      productId: p._id!, productName: p.productName, batchNo: '', expDate: '',
      quantity: 1, freeQuantity: 0, schemeNote: '', mrp: 0, ptr: 0,
      discPercent: 0, cgstPercent: 6, sgstPercent: 6,
    }]);
    this.prodSearch = ''; this.prodResults.set([]);
  }
  removeItem(i: number): void { this.cart.update(c => c.filter((_,idx)=>idx!==i)); }

  calcLine(item: PurchaseCartItem): number {
    const raw     = item.ptr * item.quantity;
    const taxable = raw * (1 - item.discPercent / 100);
    const tax     = taxable * (item.cgstPercent + item.sgstPercent) / 100;
    return parseFloat((taxable + tax).toFixed(2));
  }

  savePurchase(): void {
    if (!this.canSave()) return;
    this.saveLoading.set(true);
    const payload = {
      supplierId:    this.selectedSupplier()!._id!,
      invoiceNo:     this.invoiceNo,
      invoiceDate:   this.invoiceDate,
      paymentStatus: this.paymentStatus,
      amountPaid:    this.amountPaid,
      items: this.cart().map(i => ({
        productId:    i.productId,
        productName:  i.productName,
        batchNo:      i.batchNo,
        expDate:      i.expDate + '-01',
        quantity:     i.quantity,
        freeQuantity: i.freeQuantity || 0,
        schemeNote:   i.schemeNote,
        mrp:          i.mrp,
        ptr:          i.ptr,
        saleRate:     i.mrp,
        discPercent:  i.discPercent || 0,
        cgstPercent:  i.cgstPercent,
        sgstPercent:  i.sgstPercent,
      })),
    };
    this.purchaseSvc.createPurchase(payload as any).subscribe({
      next: (r) => {
        this.toast.success(`Purchase saved! ${r.data?.purchaseNo || ''} — stock updated.`);
        this.saveLoading.set(false);
        this.cart.set([]); this.invoiceNo = ''; this.selectedSupplier.set(null); this.supplierSearch = '';
      },
      error: () => this.saveLoading.set(false),
    });
  }

  switchHistory(): void { this.tab.set('history'); this.loadHistory(); }
  onHistSearch(): void { clearTimeout(this.histTimer); this.histTimer = setTimeout(() => { this.histPage=1; this.loadHistory(); }, 320); }
  loadHistory(): void {
    this.histLoading.set(true);
    this.purchaseSvc.getPurchases({ page: this.histPage, limit: 15, search: this.histSearch || undefined, dateFrom: this.histFrom || undefined, dateTo: this.histTo || undefined }).subscribe({
      next: r => { this.purchases.set(r.data ?? []); this.histPag = r.pagination ?? null; this.histLoading.set(false); },
      error: () => this.histLoading.set(false),
    });
  }
}
