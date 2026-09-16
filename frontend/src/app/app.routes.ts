import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((component) => component.DashboardComponent),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./transactions/transaction-list.component').then(
        (component) => component.TransactionListComponent,
      ),
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./accounts/account-list.component').then(
        (component) => component.AccountListComponent,
      ),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./categories/category-page.component').then(
        (component) => component.CategoryPageComponent,
      ),
  },
  {
    path: 'fixed-entries',
    loadComponent: () =>
      import('./fixed-entries/fixed-entry-page.component').then(
        (component) => component.FixedEntryPageComponent,
      ),
  },
];
