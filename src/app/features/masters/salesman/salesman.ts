// src/app/features/masters/salesman/salesman.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { FirmService, Salesman } from '../../../core/services/firm.service';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-salesman',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('modalAnim', [
      transition(':enter', [style({ opacity: 0, transform: 'scale(0.95)' }), animate('220ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1)' }))]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.96)' }))]),
    ]),
  ],
  templateUrl: './salesman.html',
  styleUrl: './salesman.css',
})
export class SalesmanComponent implements OnInit {
  private svc = inject(FirmService);
  private toast = inject(Toast);
  private fb = inject(FormBuilder);

  items = signal<Salesman[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editMode = signal(false);
  editId = signal('');
  searchQ = '';

  form = this.fb.group({
    name: ['', Validators.required],
    phone: [''],
    email: ['', Validators.email],
    area: [''],
    commissionPercent: [0],
  });

  ngOnInit() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getSalesmen(this.searchQ).subscribe({
      next: (r) => { this.items.set(r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  fi(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  openAdd(): void { this.editMode.set(false); this.editId.set(''); this.form.reset({ commissionPercent: 0 }); this.showModal.set(true); }
  openEdit(s: Salesman): void { this.editMode.set(true); this.editId.set(s._id!); this.form.patchValue(s); this.showModal.set(true); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    const req = this.editMode() ? this.svc.updateSalesman(this.editId(), this.form.value as any) : this.svc.createSalesman(this.form.value as any);
    req.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Salesman updated.' : 'Salesman added.'); this.showModal.set(false); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  remove(s: Salesman): void {
    this.svc.deleteSalesman(s._id!).subscribe({ next: () => { this.toast.success('Salesman removed.'); this.load(); } });
  }
}
