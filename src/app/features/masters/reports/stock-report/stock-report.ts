// src/app/features/reports/stock-report.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReportsService } from '../../../../core/services/reports';
import { Toast } from '../../../../core/services/toast';
import { PRODUCT_CATEGORIES } from '../../../../shared/models/product.model';


@Component({
  selector: 'app-stock-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])])],
  templateUrl: './stock-report.html',
  styleUrl: './stock-report.css',
})
export class StockReport implements OnInit {
  private svc = inject(ReportsService);
  private toast = inject(Toast);
  data = signal<any>(null); loading = signal(false);
  category = '';
  lowStockOnly = false;
  categories = PRODUCT_CATEGORIES;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getStockReport({ category: this.category || undefined, lowStockOnly: this.lowStockOnly ? 'true' : undefined }).subscribe({
      next: r => { this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isExpired(d: Date | string): boolean { return new Date(d) < new Date(); }
  isExpiringSoon(d: Date | string): boolean { const e = new Date(d), s = new Date(); s.setMonth(s.getMonth() + 3); return e > new Date() && e <= s; }

  exportCsv(): void {
    const d = this.data(); if (!d) return;
    const h = ['Medicine', 'Generic', 'Company', 'Category', 'Batch', 'Expiry', 'Qty', 'MRP', 'PTR', 'Total Stock', 'Status'];
    const rows: any[][] = [];
    d.rows.forEach((r: any) => r.batches.forEach((b: any) => rows.push([r.productName, r.genericName || '', r.mfgCompany, r.category || '', b.batchNo, new Date(b.expDate).toLocaleDateString('en-IN'), b.quantity, b.mrp, b.ptr, r.totalStock, r.totalStock < r.minStockLevel ? 'Low' : 'OK'])));
    const csv = [h, ...rows].map((r: any[]) => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'stock-report.csv'; a.click(); this.toast.success('CSV exported.');
  }
}
