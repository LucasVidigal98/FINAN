import { Component, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CategoryResponse } from '../../categories/category.model';
import { CategoryService } from '../../categories/category.service';
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
  private readonly categoryService = inject(CategoryService);
  private readonly today = new Date().toISOString().substring(0, 10);

  readonly transactionCreated = output<Transaction>();
  readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(150)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    occurredOn: [this.today, Validators.required],
    type: ['EXPENSE' as TransactionType, Validators.required],
    categoryId: this.formBuilder.control<string | null>(null),
  });
  readonly categories = signal<CategoryResponse[]>([]);
  readonly categoriesLoading = signal(true);
  readonly categoriesLoadError = signal(false);

  isSubmitting = false;
  errorMessage = '';

  constructor() {
    this.categoryService
      .findAll()
      .pipe(finalize(() => this.categoriesLoading.set(false)))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.categoriesLoadError.set(true),
      });

    this.form.controls.type.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const categoryId = this.form.controls.categoryId.value;
      if (categoryId && !this.filteredCategories().some((category) => category.id === categoryId)) {
        this.form.controls.categoryId.setValue(null);
      }
    });
  }

  filteredCategories(): CategoryResponse[] {
    return this.categories().filter(
      (category) => category.active && category.type === this.form.controls.type.value,
    );
  }

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
            categoryId: null,
          });
        },
        error: () => (this.errorMessage = 'Não foi possível adicionar a transação.'),
      });
  }
}
