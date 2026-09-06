import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, map, of, startWith } from 'rxjs';
import { TransactionService } from './transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe],
  templateUrl: './transaction-list.component.html',
})
export class TransactionListComponent {
  protected readonly state$ = inject(TransactionService).findAll().pipe(
    map(transactions => ({ transactions, loading: false, error: false })),
    startWith({ transactions: [], loading: true, error: false }),
    catchError(() => of({ transactions: [], loading: false, error: true })),
  );
}
