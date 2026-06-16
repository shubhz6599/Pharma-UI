// src/app/core/services/loading.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = signal(false);
  private _requestCount = 0;

  readonly isLoading = this._loading.asReadonly();

  show(): void {
    this._requestCount++;
    this._loading.set(true);
  }

  hide(): void {
    this._requestCount = Math.max(0, this._requestCount - 1);
    if (this._requestCount === 0) {
      this._loading.set(false);
    }
  }

  forceHide(): void {
    this._requestCount = 0;
    this._loading.set(false);
  }
}