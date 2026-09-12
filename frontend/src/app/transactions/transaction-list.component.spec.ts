import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { FinancialAccountService } from '../accounts/financial-account.service';
import { CategoryResponse } from '../categories/category.model';
import { CategoryService } from '../categories/category.service';
import { Transaction } from './transaction';
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
    },
    {
      id: '2',
      description: 'Avulsa',
      amount: 20,
      occurredOn: '2026-09-05',
      type: 'EXPENSE',
      source: 'MANUAL',
      category: null,
      account: null,
      createdAt: '2026-09-05T12:00:00Z',
      updatedAt: '2026-09-05T12:00:00Z',
    },
  ];
  const transactionService = {
    findAll: vi.fn(() => of(transactions)),
    updateCategory: vi.fn(),
  };
  const categoryService = { findAll: vi.fn(() => of(categories)) };

  beforeEach(async () => {
    transactionService.findAll.mockReset().mockReturnValue(of(transactions));
    transactionService.updateCategory.mockReset();
    categoryService.findAll.mockReset().mockReturnValue(of(categories));
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [
        { provide: TransactionService, useValue: transactionService },
        { provide: CategoryService, useValue: categoryService },
        { provide: FinancialAccountService, useValue: { findAll: () => of([]) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
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
});
