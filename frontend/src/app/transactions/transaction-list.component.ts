import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { FinancialAccount } from '../accounts/financial-account';
import { FinancialAccountService } from '../accounts/financial-account.service';
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
  private readonly accountService = inject(FinancialAccountService);

  protected readonly state = signal({
    transactions: [] as Transaction[],
    loading: true,
    error: false,
  });
  protected readonly categories = signal<CategoryResponse[]>([]);
  protected readonly categoriesLoading = signal(true);
  protected readonly savingCategoryIds = signal(new Set<string>());
  protected readonly accounts = signal<FinancialAccount[]>([]);
  protected readonly accountsLoading = signal(true);
  protected readonly accountsLoadError = signal(false);
  protected readonly savingAccountIds = signal(new Set<string>());
  protected readonly accountError = signal('');

  constructor() {
    this.accountService
      .findAll()
      .pipe(finalize(() => this.accountsLoading.set(false)))
      .subscribe({
        next: (accounts) => this.accounts.set(accounts.filter((account) => account.active)),
        error: () => {
          this.accountsLoadError.set(true);
          this.accountError.set('Não foi possível carregar as contas. Tente recarregar a página.');
        },
      });
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

  protected updateAccount(transaction: Transaction, accountId: string | null): void {
    this.accountError.set('');
    this.replaceTransaction({
      ...transaction,
      account: this.accounts().find((account) => account.id === accountId) ?? null,
    });
    this.savingAccountIds.update((ids) => new Set(ids).add(transaction.id));
    this.transactionService
      .updateAccount(transaction.id, accountId)
      .pipe(
        finalize(() => {
          this.savingAccountIds.update((ids) => {
            const updated = new Set(ids);
            updated.delete(transaction.id);
            return updated;
          });
        }),
      )
      .subscribe({
        next: (saved) => this.replaceTransaction(saved),
        error: () => {
          this.replaceTransaction(transaction);
          this.accountError.set('Não foi possível atualizar a conta. Tente novamente.');
        },
      });
  }

  protected accountIsListed(accountId: string): boolean {
    return this.accounts().some((account) => account.id === accountId);
  }

  private setCategorySaving(transactionId: string, saving: boolean): void {
    this.savingCategoryIds.update((ids) => {
      const updated = new Set(ids);
      saving ? updated.add(transactionId) : updated.delete(transactionId);
      return updated;
    });
  }
}
