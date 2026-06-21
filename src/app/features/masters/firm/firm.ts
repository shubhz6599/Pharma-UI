// src/app/features/masters/firm/firm.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { FirmService } from '../../../core/services/firm.service';
import { INDIAN_STATES } from '../../../shared/models/product.model';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-firm',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  templateUrl: './firm.html',
  styleUrl: './firm.css',
})
export class FirmComponent implements OnInit {
  private svc   = inject(FirmService);
  private toast = inject(Toast);
  private fb    = inject(FormBuilder);

  loading = signal(true);
  saving  = signal(false);
  states  = INDIAN_STATES;
  private firmId = '';

  form = this.fb.group({
    firmName:        ['', Validators.required],
    ownerName:       [''],
    phone:           ['', Validators.required],
    alternatePhone:  [''],
    email:           ['', Validators.email],
    address:         ['', Validators.required],
    city:            ['', Validators.required],
    state:           ['', Validators.required],
    pincode:         ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    gstNo:           [''],
    panNo:           [''],
    drugLicenseNo1:  [''],
    drugLicenseNo2:  [''],
    bankName:        [''],
    accountNo:       [''],
    ifscCode:        [''],
  });

  ngOnInit(): void {
    this.svc.getFirm().subscribe({
      next: (r) => {
        if (r.data) { this.firmId = r.data._id || ''; this.form.patchValue(r.data as any); }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  fi(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.svc.saveFirm(this.form.value as any).subscribe({
      next: () => { this.toast.success('Firm details saved successfully.'); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }
}
