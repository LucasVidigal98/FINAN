import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [CurrencyPipe, DatePipe, FormsModule, TransactionFormComponent],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly accountService = inject(FinancialAccountService);
  private readonly today = new Date();

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
  protected readonly deletingIds = signal(new Set<string>());
  protected readonly deleteError = signal('');
  protected readonly months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  protected readonly selectedMonth = signal<number | null>(this.today.getMonth() + 1);
  protected readonly selectedYear = signal<number | null>(this.today.getFullYear());
  protected readonly years = computed(() =>
    [
      ...new Set([
        this.today.getFullYear(),
        ...this.state().transactions.map((transaction) =>
          Number(transaction.occurredOn.slice(0, 4)),
        ),
      ]),
    ].sort((a, b) => b - a),
  );
  protected readonly visibleTransactions = computed(() => {
    const month = this.selectedMonth();
    const year = this.selectedYear();
    return this.state().transactions.filter(
      ({ occurredOn }) =>
        (month === null || occurredOn.slice(5, 7) === String(month).padStart(2, '0')) &&
        (year === null || occurredOn.slice(0, 4) === String(year)),
    );
  });
  protected readonly hasPeriodFilter = computed(
    () => this.selectedMonth() !== null || this.selectedYear() !== null,
  );

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

  protected deleteTransaction(transaction: Transaction): void {
    this.deleteError.set('');
    this.deletingIds.update((ids) => new Set(ids).add(transaction.id));
    this.transactionService
      .delete(transaction.id)
      .pipe(
        finalize(() =>
          this.deletingIds.update((ids) => {
            const updated = new Set(ids);
            updated.delete(transaction.id);
            return updated;
          }),
        ),
      )
      .subscribe({
        next: () =>
          this.state.update((state) => ({
            ...state,
            transactions: state.transactions.filter((item) => item.id !== transaction.id),
          })),
        error: () => this.deleteError.set('Não foi possível excluir a transação. Tente novamente.'),
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
