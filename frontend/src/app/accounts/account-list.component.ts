import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AccountType, FinancialAccount } from './financial-account';
import { FinancialAccountService } from './financial-account.service';

@Component({
  selector: 'app-account-list',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.scss',
})
export class AccountListComponent {
  private readonly accountService = inject(FinancialAccountService);
  private readonly formBuilder = inject(FormBuilder);
  readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(80),
      Validators.pattern(/\S/),
    ]),
    type: this.formBuilder.nonNullable.control<AccountType>('CHECKING', Validators.required),
    initialBalance: this.formBuilder.control<number | null>(null, Validators.required),
  });
  readonly saving = signal(false);
  readonly saveError = signal('');
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
  readonly accountTypes = Object.keys(this.typeLabels) as AccountType[];

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

  submit(): void {
    if (this.form.invalid || this.saving() || this.loading() || this.loadError()) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, type, initialBalance } = this.form.getRawValue();
    if (initialBalance === null) return;

    this.saving.set(true);
    this.saveError.set('');
    this.accountService
      .create({ name: name.trim(), type, initialBalance })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (account) => {
          this.accounts.update((accounts) => [...accounts, account]);
          this.form.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.saveError.set(
            error.status === 409
              ? 'Já existe uma conta ativa com esse nome'
              : 'Não foi possível cadastrar a conta. Tente novamente.',
          );
        },
      });
  }
}
