// src/app/features/reports/purchase-report.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReportsService } from '../../../../core/services/reports';
import { Toast } from '../../../../core/services/toast';


@Component({
  selector: 'app-purchase-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])])],
  templateUrl: './purchase-report.html',
  styleUrl: './purchase-report.css',
})
export class PurchaseReport implements OnInit {
  private svc   = inject(ReportsService);
  private toast = inject(Toast);
  data    = signal<any>(null);
  loading = signal(false);
  dateFrom = ''; dateTo = '';

  ngOnInit(): void { this.setRange(30); this.load(); }
  setRange(days: number): void { const t=new Date(),f=new Date(); f.setDate(f.getDate()-days); this.dateTo=t.toISOString().substring(0,10); this.dateFrom=f.toISOString().substring(0,10); }
  setMonthToDate(): void { const n=new Date(); this.dateFrom=new Date(n.getFullYear(),n.getMonth(),1).toISOString().substring(0,10); this.dateTo=n.toISOString().substring(0,10); }

  load(): void {
    this.loading.set(true);
    this.svc.getPurchaseReport({ dateFrom: this.dateFrom, dateTo: this.dateTo }).subscribe({
      next: r => { this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportCsv(): void {
    const d = this.data(); if (!d) return;
    const header = ['Purchase No','Invoice No','Date','Supplier','Items','Discount','Tax','Total','Status'];
    const rows = d.purchases.map((p: any) => [p.purchaseNo, p.invoiceNo, new Date(p.invoiceDate).toLocaleDateString('en-IN'), p.supplierName, p.itemCount, p.discount.toFixed(2), p.tax.toFixed(2), p.grandTotal.toFixed(2), p.paymentStatus]);
    const csv = [header, ...rows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `purchase-report-${this.dateFrom}-${this.dateTo}.csv`; a.click();
    this.toast.success('CSV exported.');
  }
}
