// src/app/features/reports/expiry-report.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReportsService } from '../../../../core/services/reports';
import { Toast } from '../../../../core/services/toast';


@Component({
  selector: 'app-expiry-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])])],
  templateUrl: './expiry-report.html',
  styleUrl: './expiry-report.css',
})
export class ExpiryReport implements OnInit {
  private svc = inject(ReportsService);
  private toast = inject(Toast);
  data = signal<any>(null);
  loading = signal(false);
  expiryType = 'expiring';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getExpiryReport({ type: this.expiryType }).subscribe({
      next: r => { this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportCsv(): void {
    const d = this.data(); if (!d) return;
    const h = ['Medicine', 'Generic', 'Company', 'Category', 'Batch', 'Expiry', 'Days Left', 'Qty', 'MRP', 'Value'];
    const rows = d.rows.map((r: any) => [r.productName, r.genericName || '', r.mfgCompany, r.category || '', r.batchNo, new Date(r.expDate).toLocaleDateString('en-IN'), r.daysLeft, r.quantity, r.mrp, r.stockValue.toFixed(2)]);
    const csv = [h, ...rows].map((r: any[]) => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `expiry-${this.expiryType}-report.csv`; a.click(); this.toast.success('CSV exported.');
  }
}
