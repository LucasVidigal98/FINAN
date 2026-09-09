import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CategoryResponse } from '../categories/category.model';
import { CategoryService } from '../categories/category.service';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';
import { Transaction } from './transaction';
import { TransactionService } from './transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TransactionFormComponent],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);

  protected readonly state = signal({
    transactions: [] as Transaction[],
    loading: true,
    error: false,
  });
  protected readonly categories = signal<CategoryResponse[]>([]);
  protected readonly categoriesLoading = signal(true);
  protected readonly savingCategoryIds = signal(new Set<string>());

  constructor() {
    this.transactionService.findAll().subscribe({
      next: (transactions) => this.state.set({ transactions, loading: false, error: false }),
      error: () => this.state.set({ transactions: [], loading: false, error: true }),
    });
    this.categoryService
      .findAll()
      .pipe(finalize(() => this.categoriesLoading.set(false)))
      .subscribe({ next: (categories) => this.categories.set(categories) });
  }

  protected addTransaction(transaction: Transaction): void {
    this.state.update((state) => ({
      ...state,
      transactions: [transaction, ...state.transactions],
    }));
  }

  protected filteredCategories(transaction: Transaction): CategoryResponse[] {
    return this.categories().filter(
      (category) => category.active && category.type === transaction.type,
    );
  }

  protected updateCategory(transaction: Transaction, categoryId: string | null): void {
    const previousCategory = transaction.category;
    const category = this.categories().find((item) => item.id === categoryId);
    const updated = {
      ...transaction,
      category: category ? { id: category.id, name: category.name, color: category.color } : null,
    };

    this.replaceTransaction(updated);
    this.setCategorySaving(transaction.id, true);
    this.transactionService
      .updateCategory(transaction.id, categoryId)
      .pipe(finalize(() => this.setCategorySaving(transaction.id, false)))
      .subscribe({
        next: (saved) => this.replaceTransaction(saved),
        error: () => this.replaceTransaction({ ...transaction, category: previousCategory }),
      });
  }

  private replaceTransaction(transaction: Transaction): void {
    this.state.update((state) => ({
      ...state,
      transactions: state.transactions.map((item) =>
        item.id === transaction.id ? transaction : item,
      ),
    }));
  }

  private setCategorySaving(transactionId: string, saving: boolean): void {
    this.savingCategoryIds.update((ids) => {
      const updated = new Set(ids);
      saving ? updated.add(transactionId) : updated.delete(transactionId);
      return updated;
    });
  }
}
