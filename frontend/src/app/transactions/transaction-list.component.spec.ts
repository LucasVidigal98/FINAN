import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { FinancialAccountService } from '../accounts/financial-account.service';
import { CategoryResponse } from '../categories/category.model';
import { CategoryService } from '../categories/category.service';
import { Transaction } from './transaction';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from './transaction.service';

registerLocaleData(localePt);

describe('TransactionListComponent', () => {
  let fixture: ComponentFixture<TransactionListComponent>;
  const categories: CategoryResponse[] = [
    {
      id: 'category-id',
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
  ];
  const transactions: Transaction[] = [
    {
      id: '1',
      description: 'Mercado',
      amount: 180.5,
      occurredOn: '2026-09-06',
      type: 'EXPENSE',
      source: 'MANUAL',
      category: { id: 'category-id', name: 'Alimentação', color: '#EF4444' },
      account: null,
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z',
      deletable: true,
    },
    {
      id: '2',
      description: 'Avulsa',
      amount: 20,
      occurredOn: '2026-09-05',
      type: 'EXPENSE',
      source: 'PLUGGY',
      category: null,
      account: null,
      createdAt: '2026-09-05T12:00:00Z',
      updatedAt: '2026-09-05T12:00:00Z',
      deletable: false,
    },
  ];
  transactions.push(
    {
      ...transactions[0],
      id: '3',
      description: 'Outubro antigo',
      occurredOn: '2025-10-01',
      createdAt: '2025-10-01T12:00:00Z',
      updatedAt: '2025-10-01T12:00:00Z',
      deletable: false,
    },
    {
      ...transactions[0],
      id: '4',
      description: 'Mercado antigo',
      occurredOn: '2025-09-15',
      createdAt: '2025-09-15T12:00:00Z',
      updatedAt: '2025-09-15T12:00:00Z',
      deletable: false,
    },
    {
      ...transactions[0],
      id: '5',
      description: 'Histórico antigo',
      occurredOn: '2024-08-15',
      createdAt: '2024-08-15T12:00:00Z',
      updatedAt: '2024-08-15T12:00:00Z',
      deletable: false,
    },
  );
  const transactionService = {
    findAll: vi.fn(() => of(transactions)),
    updateCategory: vi.fn(),
    updateAccount: vi.fn(),
    delete: vi.fn(),
  };
  const categoryService = { findAll: vi.fn(() => of(categories)) };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 10, 12));
  });

  beforeEach(async () => {
    transactionService.findAll.mockReset().mockReturnValue(of(transactions));
    transactionService.updateCategory.mockReset();
    transactionService.updateAccount.mockReset();
    transactionService.delete.mockReset();
    categoryService.findAll.mockReset().mockReturnValue(of(categories));
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [
        { provide: TransactionService, useValue: transactionService },
        { provide: CategoryService, useValue: categoryService },
        {
          provide: FinancialAccountService,
          useValue: {
            findAll: () =>
              of([
                { id: 'a', name: 'Banco A', type: 'CHECKING', source: 'MANUAL', active: true },
                { id: 'b', name: 'Banco B', type: 'CHECKING', source: 'MANUAL', active: true },
              ]),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  function selectPeriodOption(id: string, label: string): void {
    const select = fixture.nativeElement.querySelector(`#${id}`) as HTMLSelectElement;
    const option = Array.from(select.options).find((item) => item.textContent?.trim() === label);
    expect(option).toBeDefined();
    select.value = option!.value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function visibleDescriptions(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>,
    )
      .map((row) => row.querySelector('td')?.textContent.trim() ?? '')
      .filter(Boolean);
  }

  it('defaults to the local current month and year', () => {
    expect(
      (fixture.nativeElement.querySelector('#transaction-month') as HTMLSelectElement)
        .selectedOptions[0].textContent,
    ).toBe('Setembro');
    expect(
      (fixture.nativeElement.querySelector('#transaction-year') as HTMLSelectElement)
        .selectedOptions[0].textContent,
    ).toBe('2026');
    expect(visibleDescriptions()).toEqual(['Mercado', 'Avulsa']);
  });

  it('filters by another month and year without reloading transactions', () => {
    selectPeriodOption('transaction-month', 'Outubro');
    selectPeriodOption('transaction-year', '2025');

    expect(visibleDescriptions()).toEqual(['Outubro antigo']);
    expect(transactionService.findAll).toHaveBeenCalledTimes(1);
  });

  it('shows all transactions in their existing order when both filters are Todos', () => {
    selectPeriodOption('transaction-month', 'Todos');
    selectPeriodOption('transaction-year', 'Todos');

    expect(visibleDescriptions()).toEqual([
      'Mercado',
      'Avulsa',
      'Outubro antigo',
      'Mercado antigo',
      'Histórico antigo',
    ]);
  });

  it('filters independently by month or year when the other is Todos', () => {
    selectPeriodOption('transaction-month', 'Setembro');
    selectPeriodOption('transaction-year', 'Todos');
    expect(visibleDescriptions()).toEqual(['Mercado', 'Avulsa', 'Mercado antigo']);

    selectPeriodOption('transaction-month', 'Todos');
    selectPeriodOption('transaction-year', '2025');
    expect(visibleDescriptions()).toEqual(['Outubro antigo', 'Mercado antigo']);
  });

  it('keeps newly created transactions in the full state and applies the active filter', () => {
    const created: Transaction = {
      ...transactions[0],
      id: '6',
      description: 'Nova transação',
      occurredOn: '2025-08-02',
      createdAt: '2025-08-02T12:00:00Z',
      updatedAt: '2025-08-02T12:00:00Z',
    };
    fixture.debugElement
      .query(By.directive(TransactionFormComponent))
      .componentInstance.transactionCreated.emit(created);
    fixture.detectChanges();

    expect(visibleDescriptions()).toEqual(['Mercado', 'Avulsa']);
    selectPeriodOption('transaction-month', 'Agosto');
    selectPeriodOption('transaction-year', '2025');
    expect(visibleDescriptions()).toEqual(['Nova transação']);
  });

  it('has associated labels and focusable native controls', () => {
    const month = fixture.nativeElement.querySelector('#transaction-month') as HTMLSelectElement;
    const year = fixture.nativeElement.querySelector('#transaction-year') as HTMLSelectElement;

    expect(
      fixture.nativeElement.querySelector('label[for="transaction-month"]')?.textContent.trim(),
    ).toBe('Mês');
    expect(
      fixture.nativeElement.querySelector('label[for="transaction-year"]')?.textContent.trim(),
    ).toBe('Ano');
    month.focus();
    expect(document.activeElement).toBe(month);
    expect(year.tagName).toBe('SELECT');
  });

  it('preserves loading and error states and distinguishes empty period from empty history', () => {
    selectPeriodOption('transaction-month', 'Dezembro');
    expect(fixture.nativeElement.querySelector('tbody')?.textContent).toContain(
      'Nenhuma transação encontrada neste período.',
    );

    fixture.destroy();
    const request = new Subject<Transaction[]>();
    transactionService.findAll.mockReturnValue(request);
    fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Carregando transações...');
    request.error(new Error('network'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar as transações.',
    );

    fixture.destroy();
    transactionService.findAll.mockReturnValue(of([]));
    fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
    selectPeriodOption('transaction-month', 'Todos');
    selectPeriodOption('transaction-year', 'Todos');
    expect(fixture.nativeElement.querySelector('tbody')?.textContent).toContain(
      'Nenhuma transação cadastrada.',
    );
  });

  it('assigns, switches and removes accounts without reloading, and restores on failure', () => {
    const selects = fixture.nativeElement.querySelectorAll(
      '.account-select',
    ) as NodeListOf<HTMLSelectElement>;
    const otherRow = fixture.nativeElement.querySelector('tbody tr:nth-child(2)');
    expect(selects[0].selectedOptions[0].text).toBe('Sem conta');
    for (const accountId of ['a', 'b', null]) {
      const request = new Subject<Transaction>();
      transactionService.updateAccount.mockReturnValue(request);
      selects[0].value = accountId ?? '';
      selects[0].dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(transactionService.updateAccount).toHaveBeenLastCalledWith('1', accountId);
      expect(selects[0].disabled).toBe(true);
      expect(selects[1].disabled).toBe(false);
      expect(fixture.nativeElement.querySelector('.category-select').disabled).toBe(true);
      const saved: Transaction = {
        ...transactions[0],
        account: accountId
          ? {
              id: accountId,
              name: accountId === 'a' ? 'Banco A' : 'Banco B',
              type: 'CHECKING',
              source: 'MANUAL',
            }
          : null,
      };
      request.next(saved);
      request.complete();
      fixture.detectChanges();
      expect(selects[0].value).toBe(accountId ?? '');
      expect(selects[0].disabled).toBe(false);
      expect(selects[1].value).toBe('');
      expect(fixture.nativeElement.querySelector('tbody tr:nth-child(2)')).toBe(otherRow);
      if (accountId) {
        const failed = new Subject<Transaction>();
        transactionService.updateAccount.mockReturnValue(failed);
        selects[0].value = '';
        selects[0].dispatchEvent(new Event('change'));
        fixture.detectChanges();
        failed.error(new Error('network'));
        fixture.detectChanges();
        expect(selects[0].value).toBe(accountId);
        expect(selects[0].disabled).toBe(false);
        expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
          'Tente novamente',
        );
      }
    }
    expect(selects[0].selectedOptions[0].text).toBe('Sem conta');
    expect(transactionService.findAll).toHaveBeenCalledTimes(1);
  });

  it('shows only compatible categories and the uncategorized option', () => {
    const select = fixture.nativeElement.querySelector(
      'tbody tr:first-child .category-select',
    ) as HTMLSelectElement;

    expect(select.value).toBe('category-id');
    expect(Array.from(select.options).map((option) => option.text)).toEqual([
      'Sem categoria',
      'Alimentação',
    ]);
  });

  it('shows uncategorized transactions', () => {
    const select = fixture.nativeElement.querySelector(
      'tbody tr:nth-child(2) .category-select',
    ) as HTMLSelectElement;

    expect(select.value).toBe('');
  });

  it('updates only the changed row and disables it while saving', () => {
    const request = new Subject<Transaction>();
    transactionService.updateCategory.mockReturnValue(request);
    const selects = fixture.nativeElement.querySelectorAll(
      '.category-select',
    ) as NodeListOf<HTMLSelectElement>;

    selects[1].value = 'category-id';
    selects[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(transactionService.updateCategory).toHaveBeenCalledWith('2', 'category-id');
    expect(selects[0].disabled).toBe(false);
    expect(selects[1].disabled).toBe(true);

    request.next({ ...transactions[1], category: transactions[0].category });
    request.complete();
    fixture.detectChanges();

    expect(selects[0].value).toBe('category-id');
    expect(selects[1].value).toBe('category-id');
    expect(selects[1].disabled).toBe(false);
  });

  it('restores the previous category when saving fails', () => {
    const request = new Subject<Transaction>();
    transactionService.updateCategory.mockReturnValue(request);
    const select = fixture.nativeElement.querySelector(
      'tbody tr:first-child .category-select',
    ) as HTMLSelectElement;

    select.value = '';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    request.error(new Error('network'));
    fixture.detectChanges();

    expect(select.value).toBe('category-id');
    expect(select.disabled).toBe(false);
  });

  it('removes a manual transaction after successful deletion', () => {
    transactionService.delete.mockReturnValue(of(void 0));
    const button = fixture.nativeElement.querySelector('.delete') as HTMLButtonElement;

    expect(fixture.nativeElement.querySelectorAll('.delete')).toHaveLength(1);
    button.click();
    fixture.detectChanges();

    expect(transactionService.delete).toHaveBeenCalledWith('1');
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
  });
});
