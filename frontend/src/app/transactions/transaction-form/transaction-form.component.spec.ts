import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { FinancialAccount } from '../../accounts/financial-account';
import { FinancialAccountService } from '../../accounts/financial-account.service';
import { CategoryResponse } from '../../categories/category.model';
import { CategoryService } from '../../categories/category.service';
import { Transaction } from '../transaction';
import { TransactionService } from '../transaction.service';
import { TransactionFormComponent } from './transaction-form.component';

describe('TransactionFormComponent', () => {
  let fixture: ComponentFixture<TransactionFormComponent>;
  const transaction: Transaction = {
    id: '1',
    description: 'Mercado',
    amount: 123.45,
    occurredOn: '2026-09-06',
    type: 'EXPENSE',
    source: 'MANUAL',
    category: null,
    account: null,
    createdAt: '2026-09-06T12:00:00Z',
    updatedAt: '2026-09-06T12:00:00Z',
  };
  const transactionService = {
    create: vi.fn(),
  };
  const categories: CategoryResponse[] = [
    {
      id: 'expense-category',
      name: 'Alimentação',
      type: 'EXPENSE',
      color: '#EF4444',
      active: true,
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z',
    },
    {
      id: 'income-category',
      name: 'Salário',
      type: 'INCOME',
      color: '#22C55E',
      active: true,
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z',
    },
    {
      id: 'inactive-category',
      name: 'Antiga',
      type: 'EXPENSE',
      color: '#71717A',
      active: false,
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z',
    },
  ];
  const categoryService = { findAll: vi.fn(() => of(categories)) };
  const account: FinancialAccount = {
    id: 'account-id',
    name: 'Nubank',
    type: 'CHECKING',
    source: 'MANUAL',
    initialBalance: 0,
    providerBalance: null,
    active: true,
    lastSyncedAt: null,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
  const accountService = { findAll: vi.fn(() => of([account])) };

  beforeEach(async () => {
    transactionService.create.mockReset();
    accountService.findAll.mockReset().mockReturnValue(of([account]));
    categoryService.findAll.mockReset().mockReturnValue(of(categories));
    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers: [
        { provide: TransactionService, useValue: transactionService },
        { provide: CategoryService, useValue: categoryService },
        { provide: FinancialAccountService, useValue: accountService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TransactionFormComponent);
  });

  it('creates a valid transaction and emits it', () => {
    const created = vi.fn();
    transactionService.create.mockReturnValue(of(transaction));
    fixture.componentInstance.transactionCreated.subscribe(created);
    fixture.componentInstance.form.setValue({
      description: 'Mercado',
      amount: 123.45,
      occurredOn: '2026-09-06',
      type: 'EXPENSE',
      categoryId: 'expense-category',
      accountId: account.id,
    });

    fixture.componentInstance.submit();

    expect(transactionService.create).toHaveBeenCalledWith({
      description: 'Mercado',
      amount: 123.45,
      occurredOn: '2026-09-06',
      type: 'EXPENSE',
      categoryId: 'expense-category',
      accountId: account.id,
    });
    expect(created).toHaveBeenCalledWith(transaction);
    expect(fixture.componentInstance.form.controls.description.value).toBe('');
    expect(fixture.componentInstance.form.controls.amount.value).toBe(0);
    expect(fixture.componentInstance.form.controls.type.value).toBe('EXPENSE');
    expect(fixture.componentInstance.form.controls.categoryId.value).toBeNull();
    expect(fixture.componentInstance.form.controls.accountId.value).toBeNull();
  });

  it('filters active categories by transaction type', () => {
    expect(fixture.componentInstance.filteredCategories().map((category) => category.name)).toEqual(
      ['Alimentação'],
    );

    fixture.componentInstance.form.controls.type.setValue('INCOME');

    expect(fixture.componentInstance.filteredCategories().map((category) => category.name)).toEqual(
      ['Salário'],
    );
    expect(categoryService.findAll).toHaveBeenCalledOnce();
  });

  it('clears an incompatible category when type changes', () => {
    fixture.componentInstance.form.controls.categoryId.setValue('expense-category');

    fixture.componentInstance.form.controls.type.setValue('INCOME');

    expect(fixture.componentInstance.form.controls.categoryId.value).toBeNull();
  });

  it('creates a transaction without a category when loading categories fails', () => {
    categoryService.findAll.mockReturnValue(throwError(() => new Error('network')));
    const errorFixture = TestBed.createComponent(TransactionFormComponent);
    transactionService.create.mockReturnValue(of(transaction));
    errorFixture.componentInstance.form.setValue({
      description: 'Mercado',
      amount: 123.45,
      occurredOn: '2026-09-06',
      type: 'EXPENSE',
      categoryId: null,
      accountId: null,
    });

    errorFixture.componentInstance.submit();

    expect(transactionService.create).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: null }),
    );
    expect(errorFixture.componentInstance.categoriesLoadError()).toBe(true);
  });

  it('loads active accounts and binds the select, including Sem conta', () => {
    const request = new Subject<FinancialAccount[]>();
    accountService.findAll.mockReturnValue(request);
    const loadingFixture = TestBed.createComponent(TransactionFormComponent);
    loadingFixture.detectChanges();
    const select = loadingFixture.nativeElement.querySelector(
      '[formControlName="accountId"]',
    ) as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    request.next([account, { ...account, id: 'inactive', active: false }]);
    request.complete();
    loadingFixture.detectChanges();
    expect(select.disabled).toBe(false);
    expect(Array.from(select.options).map((option) => option.text.trim())).toEqual([
      'Sem conta',
      'Nubank — Conta corrente',
    ]);
    select.value = account.id;
    select.dispatchEvent(new Event('change'));
    loadingFixture.componentInstance.form.controls.type.setValue('INCOME');
    expect(loadingFixture.componentInstance.form.controls.accountId.value).toBe(account.id);
    select.value = select.options[0].value;
    select.dispatchEvent(new Event('change'));
    expect(loadingFixture.componentInstance.form.controls.accountId.value).toBeNull();
  });

  it('can save with a category and no account when accounts fail to load', () => {
    accountService.findAll.mockReturnValue(throwError(() => new Error('network')));
    const errorFixture = TestBed.createComponent(TransactionFormComponent);
    transactionService.create.mockReturnValue(of(transaction));
    errorFixture.componentInstance.form.patchValue({
      description: 'Mercado',
      amount: 10,
      categoryId: 'expense-category',
    });
    errorFixture.detectChanges();
    errorFixture.componentInstance.submit();
    expect(transactionService.create).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: null, categoryId: 'expense-category' }),
    );
    expect(errorFixture.nativeElement.textContent).toContain(
      'As contas não puderam ser carregadas',
    );
    expect(errorFixture.componentInstance.categoriesLoadError()).toBe(false);
  });
});
