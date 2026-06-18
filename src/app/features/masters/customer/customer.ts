// src/app/features/masters/customer/customer.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Customer, INDIAN_STATES } from '../../../shared/models/product.model';
import { MastersService } from '../../../core/services/masters';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-customer',
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
  templateUrl: './customer.html',
  styleUrl: './customer.css',
})
export class CustomerComponent implements OnInit {
  private svc   = inject(MastersService);
  private toast = inject(Toast);
  private fb    = inject(FormBuilder);

  customers   = signal<Customer[]>([]);
  pagination  = signal<any>(null);
  loading     = signal(true);
  saveLoading = signal(false);
  showModal   = signal(false);
  editMode    = signal(false);
  editId      = signal('');
  deleteTarget= signal<Customer | null>(null);
  searchQ     = '';
  states      = INDIAN_STATES;

  private _currentPage = signal(1);
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize    = 15;

  pageNums = computed(() => {
    const pg = this.pagination(); if (!pg) return [];
    const cur = this._currentPage(), tot = pg.totalPages;
    const start = Math.max(1,cur-2), end = Math.min(tot,start+4);
    return Array.from({length:end-start+1},(_,i)=>start+i);
  });

  private searchTimer?: ReturnType<typeof setTimeout>;

  form = this.fb.group({
    name:          ['', Validators.required],
    phone:         ['', Validators.required],
    alternatePhone:[''],
    email:         ['', Validators.email],
    age:           [null as number|null],
    gender:        [''],
    doctorName:    [''],
    address: this.fb.group({
      line1:   [''],
      city:    [''],
      state:   [''],
      pincode: [''],
    }),
  });

  ngOnInit() { this.loadCustomers(); }

  loadCustomers(): void {
    this.loading.set(true);
    const p: any = { page: this._currentPage(), limit: this.pageSize };
    if (this.searchQ) p.search = this.searchQ;
    this.svc.getCustomers(p).subscribe({
      next: (r) => { this.customers.set(r.data ?? []); this.pagination.set(r.pagination ?? null); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void { clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => { this._currentPage.set(1); this.loadCustomers(); }, 320); }
  goPage(p: number): void { this._currentPage.set(p); this.loadCustomers(); }

  openAdd(): void { this.editMode.set(false); this.editId.set(''); this.form.reset({ address:{} }); this.showModal.set(true); }
  openEdit(c: Customer): void { this.editMode.set(true); this.editId.set(c._id!); this.form.patchValue({...c, address: c.address||{}} as any); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }
  confirmDelete(c: Customer): void { this.deleteTarget.set(c); }

  fi(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  submitForm(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saveLoading.set(true);
    const req = this.editMode()
      ? this.svc.updateCustomer(this.editId(), this.form.value as any)
      : this.svc.createCustomer(this.form.value as any);
    req.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Customer updated.' : 'Customer added!'); this.closeModal(); this.saveLoading.set(false); this.loadCustomers(); },
      error: () => this.saveLoading.set(false),
    });
  }

  doDelete(): void {
    if (!this.deleteTarget()) return;
    this.saveLoading.set(true);
    this.svc.deleteCustomer(this.deleteTarget()!._id!).subscribe({
      next: () => { this.toast.success('Customer deactivated.'); this.deleteTarget.set(null); this.saveLoading.set(false); this.loadCustomers(); },
      error: () => this.saveLoading.set(false),
    });
  }
}
