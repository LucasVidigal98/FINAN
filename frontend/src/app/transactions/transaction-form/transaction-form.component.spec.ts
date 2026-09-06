import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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

  beforeEach(async () => {
    transactionService.create.mockReset();
    categoryService.findAll.mockReset().mockReturnValue(of(categories));
    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers: [
        { provide: TransactionService, useValue: transactionService },
        { provide: CategoryService, useValue: categoryService },
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
    });

    fixture.componentInstance.submit();

    expect(transactionService.create).toHaveBeenCalledWith({
      description: 'Mercado',
      amount: 123.45,
      occurredOn: '2026-09-06',
      type: 'EXPENSE',
      categoryId: 'expense-category',
    });
    expect(created).toHaveBeenCalledWith(transaction);
    expect(fixture.componentInstance.form.controls.description.value).toBe('');
    expect(fixture.componentInstance.form.controls.amount.value).toBe(0);
    expect(fixture.componentInstance.form.controls.type.value).toBe('EXPENSE');
    expect(fixture.componentInstance.form.controls.categoryId.value).toBeNull();
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
    });

    errorFixture.componentInstance.submit();

    expect(transactionService.create).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: null }),
    );
    expect(errorFixture.componentInstance.categoriesLoadError()).toBe(true);
  });
});
