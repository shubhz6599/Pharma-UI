import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { User } from '../../shared/models/product.model';
import { AppInfo, SettingsService } from '../../core/services/settings';
import { Auth } from '../../core/services/auth';
import { Toast } from '../../core/services/toast';

type SettingsTab = 'users' | 'backup' | 'app';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('modalAnim', [
      transition(':enter', [style({ opacity: 0, transform: 'scale(0.95)' }), animate('220ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1)' }))]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.96)' }))]),
    ]),
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private settingsSvc = inject(SettingsService);
  private authSvc     = inject(Auth);
  private toast       = inject(Toast);

  tab = signal<SettingsTab>('users');

  users          = signal<User[]>([]);
  usersLoading   = signal(false);
  removeTarget   = signal<User | null>(null);

  backupLoading   = signal(false);
  restoreLoading  = signal(false);
  selectedFileName= signal('');
  showRestoreConfirm = signal(false);
  private restorePayload: any = null;

  appInfo        = signal<AppInfo | null>(null);
  appInfoLoading = signal(false);

  currentUserId = () => this.authSvc.currentUser()?.id;

  ngOnInit(): void { this.loadUsers(); }

  // ── Users ──────────────────────────
  loadUsers(): void {
    this.usersLoading.set(true);
    this.settingsSvc.getUsers().subscribe({
      next: (r) => { this.users.set(r.data ?? []); this.usersLoading.set(false); },
      error: () => this.usersLoading.set(false),
    });
  }

  changeRole(u: User, role: string): void {
    this.settingsSvc.updateUserRole(u.id, role).subscribe({
      next: () => this.toast.success(`${u.name}'s role updated to ${role}.`),
      error: () => this.loadUsers(),
    });
  }

  confirmRemove(u: User): void { this.removeTarget.set(u); }
  doRemove(): void {
    if (!this.removeTarget()) return;
    this.settingsSvc.deactivateUser(this.removeTarget()!.id).subscribe({
      next: () => { this.toast.success('User removed.'); this.removeTarget.set(null); this.loadUsers(); },
    });
  }

  // ── Backup ─────────────────────────
  downloadBackup(): void {
    this.backupLoading.set(true);
    this.settingsSvc.downloadBackup().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `pharmatrack-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.backupLoading.set(false);
        this.toast.success('Backup downloaded.');
      },
      error: () => this.backupLoading.set(false),
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.restorePayload = JSON.parse(reader.result as string);
      } catch {
        this.toast.error('Invalid JSON file.');
        this.selectedFileName.set('');
      }
    };
    reader.readAsText(file);
  }

  confirmRestore(): void {
    if (!this.restorePayload) { this.toast.error('Please select a valid backup file.'); return; }
    this.showRestoreConfirm.set(true);
  }

  doRestore(): void {
    this.showRestoreConfirm.set(false);
    this.restoreLoading.set(true);
    this.settingsSvc.restoreBackup(this.restorePayload).subscribe({
      next: (r) => {
        this.restoreLoading.set(false);
        this.toast.success('Backup restored successfully.');
        this.selectedFileName.set('');
        this.restorePayload = null;
      },
      error: () => this.restoreLoading.set(false),
    });
  }

  // ── App info ───────────────────────
  loadAppInfo(): void {
    this.appInfoLoading.set(true);
    this.settingsSvc.getAppInfo().subscribe({
      next: (r) => { this.appInfo.set(r.data ?? null); this.appInfoLoading.set(false); },
      error: () => this.appInfoLoading.set(false),
    });
  }
}
