import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CategoryService } from '../categories/category.service';
import { Transaction } from './transaction';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from './transaction.service';

registerLocaleData(localePt);

describe('TransactionListComponent', () => {
  let fixture: ComponentFixture<TransactionListComponent>;
  const transactions: Transaction[] = [
    {
      id: '1',
      description: 'Mercado',
      amount: 180.5,
      occurredOn: '2026-09-06',
      type: 'EXPENSE',
      source: 'MANUAL',
      category: { id: 'category-id', name: 'Alimentação', color: '#EF4444' },
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
      createdAt: '2026-09-05T12:00:00Z',
      updatedAt: '2026-09-05T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [
        { provide: TransactionService, useValue: { findAll: () => of(transactions) } },
        { provide: CategoryService, useValue: { findAll: () => of([]) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
  });

  it('shows the category name and color', () => {
    const categoryCell = fixture.nativeElement.querySelector(
      'tbody tr:first-child .transaction-category',
    ) as HTMLElement;
    const color = categoryCell.querySelector('.category-color') as HTMLElement;

    expect(categoryCell.textContent).toContain('Alimentação');
    expect(color.style.background).toBe('rgb(239, 68, 68)');
  });

  it('shows uncategorized transactions', () => {
    const categoryCell = fixture.nativeElement.querySelector(
      'tbody tr:nth-child(2) .transaction-category',
    ) as HTMLElement;

    expect(categoryCell.textContent).toContain('Sem categoria');
  });
});
