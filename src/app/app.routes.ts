// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard }  from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login',    loadComponent: () => import('./features/auth/login/login').then(m => m.Login), title: 'Login — PharmaTrack' },
      { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.Register), title: 'Register — PharmaTrack' },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Core
  { path: 'dashboard',    canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard), title: 'Dashboard — PharmaTrack' },
  { path: 'inventory',    canActivate: [authGuard], loadComponent: () => import('./features/inventory/inventory').then(m => m.Inventory), title: 'Medicines — PharmaTrack' },
  { path: 'purchase',     canActivate: [authGuard], loadComponent: () => import('./features/purchase/purchase').then(m => m.PurchaseComponent), title: 'Purchase — PharmaTrack' },
  { path: 'billing',      canActivate: [authGuard], loadComponent: () => import('./features/billing/billing').then(m => m.Billing), title: 'Billing — PharmaTrack' },
  { path: 'stock-ledger', canActivate: [authGuard], loadComponent: () => import('./features/stock-ledger/stock-ledger').then(m => m.StockLedger), title: 'Stock Ledger — PharmaTrack' },

  // Masters
  { path: 'masters/suppliers',  canActivate: [authGuard], loadComponent: () => import('./features/masters/supplier/supplier').then(m => m.SupplierComponent), title: 'Suppliers — PharmaTrack' },
  { path: 'masters/customers',  canActivate: [authGuard], loadComponent: () => import('./features/masters/customer/customer').then(m => m.CustomerComponent), title: 'Customers — PharmaTrack' },
  { path: 'masters/firm',       canActivate: [authGuard], loadComponent: () => import('./features/masters/firm/firm').then(m => m.FirmComponent), title: 'Firm Master — PharmaTrack' },
  { path: 'masters/salesman',   canActivate: [authGuard], loadComponent: () => import('./features/masters/salesman/salesman').then(m => m.SalesmanComponent), title: 'Salesman — PharmaTrack' },
  { path: 'masters/area',       canActivate: [authGuard], loadComponent: () => import('./features/masters/area/area').then(m => m.AreaComponent), title: 'Area — PharmaTrack' },
  { path: 'masters/tax-master', canActivate: [authGuard], loadComponent: () => import('./features/masters/tax-master/tax-master').then(m => m.TaxMasterComponent), title: 'Tax Master — PharmaTrack' },

  // Reports
  { path: 'reports/sales-statement', canActivate: [authGuard], loadComponent: () => import('./features/masters/reports/sales-statement/sales-statement').then(m => m.SalesStatementComponent), title: 'Sales Statement — PharmaTrack' },
  { path: 'reports/purchase-report', canActivate: [authGuard], loadComponent: () => import('./features/masters/reports/purchase-report/purchase-report').then(m => m.PurchaseReport), title: 'Purchase Report — PharmaTrack' },
  { path: 'reports/gst-report',      canActivate: [authGuard], loadComponent: () => import('./features/masters/reports/gst-report/gst-report').then(m => m.GstReport), title: 'GST Report — PharmaTrack' },
  { path: 'reports/stock-report',    canActivate: [authGuard], loadComponent: () => import('./features/masters/reports/stock-report/stock-report').then(m => m.StockReport), title: 'Stock Report — PharmaTrack' },
  { path: 'reports/expiry',          canActivate: [authGuard], loadComponent: () => import('./features/masters/reports/expiry-report/expiry-report').then(m => m.ExpiryReport), title: 'Expiry Report — PharmaTrack' },

  // Settings
  { path: 'settings', canActivate: [authGuard], loadComponent: () => import('./features/settings/settings').then(m => m.Settings), title: 'Settings — PharmaTrack' },

  { path: '**', redirectTo: '/dashboard' },
];
