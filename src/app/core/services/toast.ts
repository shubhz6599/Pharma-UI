// src/app/core/services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class Toast {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = crypto.randomUUID();
    const toast: Toast | any = { id, type, message, duration };
    this._toasts.update((t) => [...t, toast]);
    setTimeout(() => this.remove(id), duration);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string, duration = 6000): void { this.show(message, 'error', duration); }
  warning(message: string): void { this.show(message, 'warning'); }
  info(message: string): void { this.show(message, 'info'); }

  remove(id: string): void {
    this._toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}