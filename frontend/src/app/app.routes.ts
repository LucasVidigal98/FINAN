import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'transactions', pathMatch: 'full' },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./transactions/transaction-list.component')
        .then(component => component.TransactionListComponent),
  },
];
