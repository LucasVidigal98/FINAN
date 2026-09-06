import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Transaction, TransactionType } from '../transaction';
import { TransactionService } from '../transaction.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss',
})
export class TransactionFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);
  private readonly today = new Date().toISOString().substring(0, 10);

  readonly transactionCreated = output<Transaction>();
  readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(150)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    occurredOn: [this.today, Validators.required],
    type: ['EXPENSE' as TransactionType, Validators.required],
  });

  isSubmitting = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.transactionService
      .create(this.form.getRawValue())
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (transaction) => {
          this.transactionCreated.emit(transaction);
          this.form.reset({
            description: '',
            amount: 0,
            occurredOn: this.today,
            type: 'EXPENSE',
          });
        },
        error: () => (this.errorMessage = 'Não foi possível adicionar a transação.'),
      });
  }
}
