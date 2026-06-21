// src/app/features/masters/tax-master/tax-master.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AreaMaster, FirmService, TaxMaster } from '../../../core/services/firm.service';
import { Toast } from '../../../core/services/toast';
import { INDIAN_STATES } from '../../../shared/models/product.model';

@Component({
  selector: 'app-tax-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('modalAnim', [
      transition(':enter', [style({ opacity: 0, transform: 'scale(0.95)' }), animate('220ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1)' }))]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.96)' }))]),
    ]),
  ],
  templateUrl: './area.html',
  styleUrl: './area.css',
})
export class AreaComponent implements OnInit {
  private svc   = inject(FirmService);
  private toast = inject(Toast);
  private fb    = inject(FormBuilder);

  items     = signal<AreaMaster[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  showModal = signal(false);
  editMode  = signal(false);
  editId    = signal('');
  searchQ   = '';
  states    = INDIAN_STATES;

  form = this.fb.group({
    name:    ['', Validators.required],
    city:    [''],
    state:   [''],
    pincode: [''],
  });

  ngOnInit() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAreas(this.searchQ).subscribe({
      next: (r) => { this.items.set(r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  fi(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  openAdd(): void { this.editMode.set(false); this.editId.set(''); this.form.reset(); this.showModal.set(true); }
  openEdit(a: AreaMaster): void { this.editMode.set(true); this.editId.set(a._id!); this.form.patchValue(a); this.showModal.set(true); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    const req = this.editMode() ? this.svc.updateArea(this.editId(), this.form.value as any) : this.svc.createArea(this.form.value as any);
    req.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Area updated.' : 'Area added.'); this.showModal.set(false); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  remove(a: AreaMaster): void {
    this.svc.deleteArea(a._id!).subscribe({ next: () => { this.toast.success('Area removed.'); this.load(); } });
  }
}
