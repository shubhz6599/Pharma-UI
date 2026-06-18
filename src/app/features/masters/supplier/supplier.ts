// src/app/features/masters/supplier/supplier.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Supplier, INDIAN_STATES } from '../../../shared/models/product.model';
import { MastersService } from '../../../core/services/masters';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
    ]),
    trigger('modalAnim', [
      transition(':enter', [style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }), animate('240ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))]),
      transition(':leave', [animate('160ms ease-in', style({ opacity: 0, transform: 'scale(0.96)' }))]),
    ]),
  ],
  templateUrl: './supplier.html',
  styleUrl: './supplier.css',
})
export class SupplierComponent implements OnInit {
  private svc   = inject(MastersService);
  private toast = inject(Toast);
  private fb    = inject(FormBuilder);

  suppliers   = signal<Supplier[]>([]);
  pagination  = signal<any>(null);
  loading     = signal(true);
  saveLoading = signal(false);
  showModal   = signal(false);
  editMode    = signal(false);
  editId      = signal('');
  viewTarget  = signal<Supplier | null>(null);
  deleteTarget= signal<Supplier | null>(null);
  searchQ     = '';
  activeFilter= 'true';
  states      = INDIAN_STATES;

  private _currentPage = signal(1);
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize    = 15;

  pageNums = computed(() => {
    const pg = this.pagination();
    if (!pg) return [];
    const cur = this._currentPage(), tot = pg.totalPages;
    const start = Math.max(1, cur-2), end = Math.min(tot, start+4);
    return Array.from({ length: end-start+1 }, (_,i) => start+i);
  });

  private searchTimer?: ReturnType<typeof setTimeout>;

  form = this.fb.group({
    name:          ['', Validators.required],
    contactPerson: [''],
    phone:         ['', Validators.required],
    alternatePhone:[''],
    email:         ['', Validators.email],
    gstNo:         ['', Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)],
    drugLicenseNo: [''],
    address: this.fb.group({
      line1:   ['', Validators.required],
      line2:   [''],
      city:    ['', Validators.required],
      state:   ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    }),
  });

  ngOnInit() { this.loadSuppliers(); }

  loadSuppliers(): void {
    this.loading.set(true);
    const p: any = { page: this._currentPage(), limit: this.pageSize };
    if (this.searchQ)     p.search   = this.searchQ;
    if (this.activeFilter !== '') p.isActive = this.activeFilter;
    this.svc.getSuppliers(p).subscribe({
      next: (r) => { this.suppliers.set(r.data ?? []); this.pagination.set(r.pagination ?? null); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this._currentPage.set(1); this.loadSuppliers(); }, 320);
  }

  goPage(p: number): void { this._currentPage.set(p); this.loadSuppliers(); }

  openAdd(): void {
    this.editMode.set(false); this.editId.set('');
    this.form.reset({ address: {} });
    this.showModal.set(true);
  }

  openEdit(s: Supplier): void {
    this.editMode.set(true); this.editId.set(s._id!);
    this.form.patchValue({ ...s, address: s.address || {} } as any);
    this.showModal.set(true);
  }

  openView(s: Supplier): void { this.viewTarget.set(s); }
  closeModal(): void { this.showModal.set(false); }
  confirmDelete(s: Supplier): void { this.deleteTarget.set(s); }

  fi(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  fadd(f: string): boolean { const c = this.form.get('address')?.get(f); return !!(c?.invalid && c?.touched); }

  submitForm(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saveLoading.set(true);
    const payload = this.form.value;
    const req = this.editMode()
      ? this.svc.updateSupplier(this.editId(), payload as any)
      : this.svc.createSupplier(payload as any);
    req.subscribe({
      next: () => {
        this.toast.success(this.editMode() ? 'Supplier updated.' : 'Supplier added successfully!');
        this.closeModal(); this.saveLoading.set(false); this.loadSuppliers();
      },
      error: () => this.saveLoading.set(false),
    });
  }

  doDelete(): void {
    if (!this.deleteTarget()) return;
    this.saveLoading.set(true);
    this.svc.deleteSupplier(this.deleteTarget()!._id!).subscribe({
      next: () => { this.toast.success('Supplier deactivated.'); this.deleteTarget.set(null); this.saveLoading.set(false); this.loadSuppliers(); },
      error: () => this.saveLoading.set(false),
    });
  }
}
