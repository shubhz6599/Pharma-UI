import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { Product, ProductFilter, DashboardStats, Pagination } from '../../shared/models/product.model';
import { ProductService } from '../../core/services/product';
import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  animations: [
    trigger('cardStagger', [
      transition(':enter', [
        query('.kpi-card', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(80, [animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
        ], { optional: true }),
      ]),
    ]),
    trigger('tableRowsIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-10px)' }),
          stagger(30, [animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))]),
        ], { optional: true }),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit{
   private productService = inject(ProductService);
  private toastService = inject(Toast);

  stats = signal<DashboardStats | null>(null);
  products = signal<Product[]>([]);
  pagination = signal<Pagination | null>(null);
  statsLoading = signal(true);
  tableLoading = signal(true);
  deleteLoading = signal(false);
  showDeleteModal = signal(false);
  deleteTarget = signal<Product | null>(null);
  activeFilter = signal<'expiring' | 'lowstock' | 'none'>('none');
  currentPage = signal(1);

  searchQuery = '';
  filterSch = '';
  sortField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  today = new Date();

  private searchTimeout?: ReturnType<typeof setTimeout>;

  pageNumbers = computed(() => {
    const p = this.pagination();
    if (!p) return [];
    const pages = [];
    const start = Math.max(1, this.currentPage() - 2);
    const end = Math.min(p.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadProducts();
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.productService.getDashboardStats().subscribe({
      next: (res) => { this.stats.set(res.data || null); this.statsLoading.set(false); },
      error: () => this.statsLoading.set(false),
    });
  }

  loadProducts(): void {
    this.tableLoading.set(true);
    const filter: ProductFilter = {
      page: this.currentPage(),
      limit: 15,
      sort: this.sortField,
      order: this.sortOrder,
    };
    if (this.searchQuery.trim()) filter.search = this.searchQuery.trim();
    if (this.filterSch) filter.sch = this.filterSch;
    if (this.activeFilter() === 'expiring') filter.expiringSoon = true;
    if (this.activeFilter() === 'lowstock') filter.lowStock = true;

    this.productService.getProducts(filter).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.pagination.set(res.pagination || null);
        this.tableLoading.set(false);
      },
      error: () => this.tableLoading.set(false),
    });
  }

  setFilter(f: 'expiring' | 'lowstock'): void {
    this.activeFilter.set(this.activeFilter() === f ? 'none' : f);
    this.currentPage.set(1);
    this.loadProducts();
  }

  clearFilter(): void {
    this.activeFilter.set('none');
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSearchChange(_val: string): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadProducts();
    }, 350);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage.set(1);
    this.loadProducts();
  }

  toggleOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.loadProducts();
  }

  goToPage(p: number): void {
    this.currentPage.set(p);
    this.loadProducts();
  }

  isExpiringSoon(date: Date | string): boolean {
    const exp = new Date(date);
    const oneMonth = new Date();
    oneMonth.setMonth(oneMonth.getMonth() + 1);
    return exp > new Date() && exp <= oneMonth;
  }

  isExpired(date: Date | string): boolean {
    return new Date(date) < new Date();
  }

  editProduct(product: Product): void {
    this.toastService.info(`Edit ${product.productName} — navigate to Inventory for full edit form.`);
  }

  confirmDelete(product: Product): void {
    this.deleteTarget.set(product);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteTarget.set(null);
  }

  deleteProduct(): void {
    if (!this.deleteTarget()) return;
    this.deleteLoading.set(true);
    this.productService.deleteProduct(this.deleteTarget()!._id!).subscribe({
      next: () => {
        this.toastService.success(`${this.deleteTarget()?.productName} deleted.`);
        this.closeDeleteModal();
        this.deleteLoading.set(false);
        this.loadStats();
        this.loadProducts();
      },
      error: () => { this.deleteLoading.set(false); },
    });
  }

}
