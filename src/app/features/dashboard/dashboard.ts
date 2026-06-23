// src/app/features/dashboard/dashboard.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { DashboardStats } from '../../shared/models/product.model';
import { ProductService } from '../../core/services/product';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('kpiStagger', [
      transition(':enter', [
        query('.kpi-card', [style({ opacity: 0, transform: 'translateY(16px)' }), stagger(60, [animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])], { optional: true }),
      ]),
    ]),
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('260ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit{
   private prodSvc = inject(ProductService);
  stats   = signal<DashboardStats | null>(null);
  loading = signal(true);
  today   = new Intl.DateTimeFormat('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.prodSvc.getDashboardStats().subscribe({
      next: r => { this.stats.set(r.data ?? null); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
