// src/app/features/reports/gst-report.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Toast } from '../../../../core/services/toast';
import { ReportsService } from '../../../../core/services/reports';


@Component({
  selector: 'app-gst-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])])],
  templateUrl: './gst-report.html',
  styleUrl: './gst-report.css',
})
export class GstReport implements OnInit {
  private svc = inject(ReportsService);
  private toast = inject(Toast);
  data = signal<any>(null);
  loading = signal(false);
  dateFrom = '';
  dateTo = '';
  gstType = 'sales';

  ngOnInit(): void { this.setRange(30); this.load(); }
  setRange(d: number): void { const t = new Date(), f = new Date(); f.setDate(f.getDate() - d); this.dateTo = t.toISOString().substring(0, 10); this.dateFrom = f.toISOString().substring(0, 10); }
  setMonthToDate(): void { const n = new Date(); this.dateFrom = new Date(n.getFullYear(), n.getMonth(), 1).toISOString().substring(0, 10); this.dateTo = n.toISOString().substring(0, 10); }

  load(): void {
    this.loading.set(true);
    this.svc.getGstReport({ dateFrom: this.dateFrom, dateTo: this.dateTo, type: this.gstType }).subscribe({
      next: r => { this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportCsv(): void {
    const d = this.data(); if (!d) return;
    const h = ['Date', 'Ref No', 'Party', 'Product', 'HSN', 'Taxable', 'CGST%', 'CGST Amt', 'SGST%', 'SGST Amt', 'Total'];
    const rows = d.rows.map((r: any) => [new Date(r.date).toLocaleDateString('en-IN'), r.refNo, r.party, r.productName, r.hsnNo || '', r.taxable.toFixed(2), r.cgstPct, r.cgstAmt.toFixed(2), r.sgstPct, r.sgstAmt.toFixed(2), r.total.toFixed(2)]);
    const csv = [h, ...rows].map((r: any[]) => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `gst-${this.gstType}-${this.dateFrom}-${this.dateTo}.csv`; a.click();
    this.toast.success('CSV exported.');
  }
}
