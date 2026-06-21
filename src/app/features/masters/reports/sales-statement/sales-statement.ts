// src/app/features/reports/sales-statement.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReportsService, SalesStatement } from '../../../../core/services/reports';
import { Toast } from '../../../../core/services/toast';


@Component({
  selector: 'app-sales-statement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  templateUrl: './sales-statement.html',
  styleUrl: './sales-statement.css',
})
export class SalesStatementComponent implements OnInit {
  private svc   = inject(ReportsService);
  private toast = inject(Toast);

  statement = signal<SalesStatement | null>(null);
  loading   = signal(false);

  dateFrom = '';
  dateTo   = '';
  salesman = '';

  ngOnInit(): void { this.setRange(30); this.load(); }

  setRange(days: number): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    this.dateTo   = to.toISOString().substring(0, 10);
    this.dateFrom = from.toISOString().substring(0, 10);
  }

  setMonthToDate(): void {
    const now = new Date();
    this.dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
    this.dateTo   = now.toISOString().substring(0, 10);
  }

  load(): void {
    this.loading.set(true);
    this.svc.getSalesStatement({ dateFrom: this.dateFrom, dateTo: this.dateTo, salesman: this.salesman || undefined }).subscribe({
      next: (r) => { this.statement.set(r.data ?? null); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportCsv(): void {
    const s = this.statement();
    if (!s) return;
    const header = ['Bill No', 'Date', 'Customer', 'Salesman', 'Items', 'Discount', 'Tax', 'Total'];
    const rows = s.bills.map(b => [
      b.billNo, new Date(b.billDate).toLocaleDateString('en-IN'), b.customerName || 'Walk-in',
      b.salesman || '', b.itemCount, b.discount.toFixed(2), b.tax.toFixed(2), b.grandTotal.toFixed(2),
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `sales-statement-${this.dateFrom}-to-${this.dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('CSV exported.');
  }
}
