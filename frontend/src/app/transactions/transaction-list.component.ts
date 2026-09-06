import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';
import { Transaction } from './transaction';
import { TransactionService } from './transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TransactionFormComponent],
  templateUrl: './transaction-list.component.html',
})
export class TransactionListComponent {
  private readonly transactionService = inject(TransactionService);

  protected readonly state = signal({
    transactions: [] as Transaction[],
    loading: true,
    error: false,
  });

  constructor() {
    this.transactionService.findAll().subscribe({
      next: (transactions) => this.state.set({ transactions, loading: false, error: false }),
      error: () => this.state.set({ transactions: [], loading: false, error: true }),
    });
  }

  protected addTransaction(transaction: Transaction): void {
    this.state.update((state) => ({
      ...state,
      transactions: [transaction, ...state.transactions],
    }));
  }
}
