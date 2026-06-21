// src/app/features/masters/tax-master/tax-master.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { FirmService, TaxMaster } from '../../../core/services/firm.service';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-tax-master',
  imports: [ReactiveFormsModule],
  templateUrl: './tax-master.html',
  styleUrl: './tax-master.css',
})
export class TaxMasterComponent implements OnInit {
  private svc   = inject(FirmService);
  private toast = inject(Toast);
  private fb    = inject(FormBuilder);

  items     = signal<TaxMaster[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  showModal = signal(false);
  editMode  = signal(false);
  editId    = signal('');

  form = this.fb.group({
    name:         ['', Validators.required],
    cgstPercent:  [0, [Validators.required, Validators.min(0)]],
    sgstPercent:  [0, [Validators.required, Validators.min(0)]],
    igstPercent:  [0, Validators.min(0)],
    hsnCodes:     [''],
  });

  ngOnInit() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getTaxes().subscribe({
      next: (r) => { this.items.set(r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  fi(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  openAdd(): void { this.editMode.set(false); this.editId.set(''); this.form.reset({ cgstPercent: 0, sgstPercent: 0, igstPercent: 0 }); this.showModal.set(true); }
  openEdit(t: TaxMaster): void { this.editMode.set(true); this.editId.set(t._id!); this.form.patchValue(t); this.showModal.set(true); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    const req = this.editMode() ? this.svc.updateTax(this.editId(), this.form.value as any) : this.svc.createTax(this.form.value as any);
    req.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Tax slab updated.' : 'Tax slab added.'); this.showModal.set(false); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  remove(t: TaxMaster): void {
    this.svc.deleteTax(t._id!).subscribe({ next: () => { this.toast.success('Tax slab deactivated.'); this.load(); } });
  }
}
