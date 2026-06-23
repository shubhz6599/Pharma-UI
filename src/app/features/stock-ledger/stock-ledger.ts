// src/app/features/billing/stock-ledger/stock-ledger.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { BillingService } from '../../core/services/billing.service';
import { Toast } from '../../core/services/toast';
import { Transaction } from '../../shared/models/product.model';


@Component({
  selector: 'app-stock-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(6px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  templateUrl: './stock-ledger.html',
  styleUrl: './stock-ledger.css',
})
export class StockLedger implements OnInit{
  private billSvc = inject(BillingService);
  private toast   = inject(Toast);

  transactions = signal<Transaction[]>([]);
  loading      = signal(true);
  pagination   = signal<any>(null);
  private _page = signal(1);
  currentPage   = this._page.asReadonly();

  searchQ    = '';
  typeFilter = '';
  dateFrom   = '';
  dateTo     = '';

  private searchTimer?: ReturnType<typeof setTimeout>;

  kpis = computed(() => {
    const txs = this.transactions();
    const purchased  = txs.filter(t => t.type === 'purchase').reduce((s,t) => s + t.quantityChange, 0);
    const sold       = txs.filter(t => t.type === 'sale').reduce((s,t) => s + Math.abs(t.quantityChange), 0);
    const pReturns   = txs.filter(t => t.type === 'purchase_return').reduce((s,t) => s + Math.abs(t.quantityChange), 0);
    const sReturns   = txs.filter(t => t.type === 'sale_return').reduce((s,t) => s + t.quantityChange, 0);
    return [
      { label: 'Total Entries', val: this.pagination()?.total ?? txs.length, color: 'neutral' },
      { label: 'Purchased',     val: purchased,  color: 'teal' },
      { label: 'Sold',          val: sold,        color: 'blue' },
      { label: 'Purchase Ret.', val: pReturns,    color: 'warn' },
      { label: 'Sale Returns',  val: sReturns,    color: 'warn' },
    ];
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = { page: String(this._page()), limit: '50' };
    if (this.typeFilter) params['type']     = this.typeFilter;
    if (this.dateFrom)   params['dateFrom'] = this.dateFrom;
    if (this.dateTo)     params['dateTo']   = this.dateTo;
    if (this.searchQ)    params['search']   = this.searchQ;

    this.billSvc.getTransactions(params).subscribe({
      next: r => { this.transactions.set(r.data ?? []); this.pagination.set(r.pagination ?? null); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this._page.set(1); this.load(); }, 320);
  }

  goPage(p: number): void { this._page.set(p); this.load(); }

  clearFilters(): void {
    this.searchQ = ''; this.typeFilter = ''; this.dateFrom = ''; this.dateTo = '';
    this._page.set(1); this.load();
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      purchase: 'Purchase', sale: 'Sale',
      purchase_return: 'Purch. Return', sale_return: 'Sale Return', adjustment: 'Adjustment',
    };
    return map[type] || type;
  }
}
