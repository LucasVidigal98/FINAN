import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
    createdAt: '2026-09-06T12:00:00Z',
    updatedAt: '2026-09-06T12:00:00Z',
  };
  const transactionService = {
    create: vi.fn(),
  };

  beforeEach(async () => {
    transactionService.create.mockReset();
    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers: [{ provide: TransactionService, useValue: transactionService }],
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
    });

    fixture.componentInstance.submit();

    expect(transactionService.create).toHaveBeenCalledWith({
      description: 'Mercado',
      amount: 123.45,
      occurredOn: '2026-09-06',
      type: 'EXPENSE',
    });
    expect(created).toHaveBeenCalledWith(transaction);
    expect(fixture.componentInstance.form.controls.description.value).toBe('');
    expect(fixture.componentInstance.form.controls.amount.value).toBe(0);
    expect(fixture.componentInstance.form.controls.type.value).toBe('EXPENSE');
  });
});
