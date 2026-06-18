// src/app/app.component.ts
import { Component, inject, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Auth } from './core/services/auth';
import { Toast } from './core/services/toast';
import { LoadingService } from './core/services/loading';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  animations: [
    trigger('routeAnim', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('280ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('toastAnim', [
      transition(':enter', [style({ opacity: 0, transform: 'translateX(100%)' }), animate('240ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))]),
      transition(':leave', [animate('180ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))]),
    ]),
    trigger('submenuAnim', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(-6px)', height: '0' }), animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)', height: '*' }))]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)', height: '0' }))]),
    ]),
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private authService    = inject(Auth);
  private toastService   = inject(Toast);
  private loadingService = inject(LoadingService);
  private router         = inject(Router);

  isLoggedIn       = this.authService.isAuthenticated;
  toasts           = this.toastService.toasts;
  isLoading        = this.loadingService.isLoading;
  sidebarCollapsed = signal(false);
  mastersOpen      = signal(false);

  userName    = computed(() => this.authService.currentUser()?.name || '');
  userRole    = computed(() => this.authService.currentUser()?.role || '');
  userInitial = computed(() => (this.authService.currentUser()?.name || 'U').charAt(0).toUpperCase());
  route       = computed(() => this.router.url);
  isOnMasters = computed(() => this.router.url.startsWith('/masters'));

  toastIcon(type: string): string {
    return ({ success:'✓', error:'✕', warning:'⚠', info:'ℹ' } as Record<string,string>)[type] || 'ℹ';
  }

  removeToast(id: string): void { this.toastService.remove(id); }
  logout(): void { this.authService.logout(); }
}
