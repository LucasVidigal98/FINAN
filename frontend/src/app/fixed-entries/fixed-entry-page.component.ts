import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CategoryResponse } from '../categories/category.model';
import { CategoryService } from '../categories/category.service';
import { CurrencyInputDirective } from '../shared/currency-input.directive';
import { FixedEntry, FixedEntryType } from './fixed-entry.model';
import { FixedEntryService } from './fixed-entry.service';

@Component({
  selector: 'app-fixed-entry-page',
  standalone: true,
  imports: [CurrencyInputDirective, DecimalPipe, ReactiveFormsModule],
  templateUrl: './fixed-entry-page.component.html',
  styleUrl: './fixed-entry-page.component.scss',
})
export class FixedEntryPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly fixedEntryService = inject(FixedEntryService);
  private readonly categoryService = inject(CategoryService);

  readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(150), Validators.pattern(/\S/)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: ['EXPENSE' as FixedEntryType, Validators.required],
    categoryId: ['', Validators.required],
    startsOn: ['', Validators.required],
  });
  readonly entries = signal<FixedEntry[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly categoriesLoading = signal(true);
  compatibleCategories(): CategoryResponse[] {
    return this.categories().filter(
      (category) => category.active && category.type === this.form.controls.type.value,
    );
  }

  isSubmitting = false;
  togglingId = '';
  deletingId = '';
  errorMessage = '';

  constructor() {
    this.loadEntries();
    this.loadCategories();
    this.form.controls.type.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (
        !this.compatibleCategories().some(
          (category) => category.id === this.form.controls.categoryId.value,
        )
      ) {
        this.form.controls.categoryId.setValue('');
      }
    });
  }

  loadEntries(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.fixedEntryService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (entries) => this.entries.set(entries),
        error: () => this.loadError.set(true),
      });
  }

  loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoryService
      .findAll()
      .pipe(finalize(() => this.categoriesLoading.set(false)))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => (this.errorMessage = 'Não foi possível carregar as categorias.'),
      });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const description = value.description.trim();
    if (!description) {
      this.form.controls.description.setErrors({ required: true });
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.fixedEntryService
      .create({ ...value, description })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (entry) => {
          this.entries.update((entries) =>
            [...entries, entry].sort((a, b) => a.description.localeCompare(b.description, 'pt-BR')),
          );
          this.form.reset({
            description: '',
            amount: 0,
            type: 'EXPENSE',
            categoryId: '',
            startsOn: '',
          });
        },
        error: (error: HttpErrorResponse) =>
          (this.errorMessage =
            error.status === 400
              ? 'Revise os dados e a categoria selecionada.'
              : 'Não foi possível cadastrar o FIXO. Tente novamente.'),
      });
  }

  toggle(entry: FixedEntry): void {
    if (this.togglingId) return;
    this.togglingId = entry.id;
    this.errorMessage = '';
    this.fixedEntryService
      .setActive(entry.id, !entry.active)
      .pipe(finalize(() => (this.togglingId = '')))
      .subscribe({
        next: (updated) =>
          this.entries.update((entries) =>
            entries.map((item) => (item.id === updated.id ? updated : item)),
          ),
        error: () =>
          (this.errorMessage = 'Não foi possível alterar o estado do FIXO. Tente novamente.'),
      });
  }

  delete(entry: FixedEntry): void {
    if (this.deletingId) return;
    this.deletingId = entry.id;
    this.errorMessage = '';
    this.fixedEntryService
      .delete(entry.id)
      .pipe(finalize(() => (this.deletingId = '')))
      .subscribe({
        next: () =>
          this.entries.update((entries) => entries.filter((item) => item.id !== entry.id)),
        error: () => (this.errorMessage = 'Não foi possível excluir o FIXO. Tente novamente.'),
      });
  }

  categoryName(entry: FixedEntry): string {
    return (
      this.categories().find((category) => category.id === entry.categoryId)?.name ??
      'Categoria removida'
    );
  }
}
