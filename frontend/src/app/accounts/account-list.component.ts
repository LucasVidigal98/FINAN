import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { AccountType, FinancialAccount } from './financial-account';
import { FinancialAccountService } from './financial-account.service';

@Component({
  selector: 'app-account-list',
  imports: [CurrencyPipe],
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.scss',
})
export class AccountListComponent {
  private readonly accountService = inject(FinancialAccountService);
  readonly accounts = signal<FinancialAccount[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly typeLabels: Record<AccountType, string> = {
    CHECKING: 'Conta corrente',
    SAVINGS: 'Poupança',
    CASH: 'Dinheiro',
    INVESTMENT: 'Investimento',
  };
  readonly sourceLabels = { MANUAL: 'Manual', PLUGGY: 'Pluggy' };

  constructor() {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.accountService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (accounts) => this.accounts.set(accounts),
        error: () => this.loadError.set(true),
      });
  }
}
