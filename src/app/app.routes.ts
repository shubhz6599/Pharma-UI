// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';


export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.Login),
        title: 'Login — PharmaTrack',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.Register),
        title: 'Register — PharmaTrack',
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Dashboard — PharmaTrack',
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inventory/inventory').then((m) => m.Inventory),
    title: 'Inventory — PharmaTrack',
  },
  {
    path: 'billing',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/billing/billing').then((m) => m.Billing),
    title: 'Billing — PharmaTrack',
  },
  {
    path: 'stock-ledger',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/stock-ledger/stock-ledger').then(
        (m) => m.StockLedger
      ),
    title: 'Stock Ledger — PharmaTrack',
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
