import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Auth } from './core/services/auth';
import {  Toast } from './core/services/toast';
import { LoadingService } from './core/services/loading';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  animations: [
    trigger('routeAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(12px)' }),
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
        ], { optional: true }),
      ]),
    ]),
    trigger('toastEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private authService = inject(Auth);
  private toastService = inject(Toast);
  private loadingService = inject(LoadingService);
  private router = inject(Router);

  isLoggedIn = this.authService.isAuthenticated;
  toasts = this.toastService.toasts;
  isLoading = this.loadingService.isLoading;
  userName = computed(() => this.authService.currentUser()?.name || '');
  userRole = computed(() => this.authService.currentUser()?.role || '');
  userInitial = computed(() => (this.authService.currentUser()?.name || 'U').charAt(0).toUpperCase());

  toastIcon(type: string): string {
    const icons: Record<string, string> = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    return icons[type] || 'ℹ';
  }

  removeToast(id: string): void { this.toastService.remove(id); }

  logout(): void { this.authService.logout(); }

  getRouteState(): string { return this.router.url; }
}


