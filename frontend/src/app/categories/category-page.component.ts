import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CategoryResponse, CategoryType } from './category.model';
import { CategoryService } from './category.service';

type CategoryFilter = CategoryType | 'ALL';

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss',
})
export class CategoryPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly defaultType: CategoryType = 'EXPENSE';
  private readonly defaultColor = '#EF4444';

  readonly typeLabels: Record<CategoryType, string> = {
    INCOME: 'Receita',
    EXPENSE: 'Despesa',
    INVESTMENT: 'Investimento',
  };
  readonly filters: ReadonlyArray<{ value: CategoryFilter; label: string }> = [
    { value: 'ALL', label: 'Todas' },
    { value: 'INCOME', label: 'Receitas' },
    { value: 'EXPENSE', label: 'Despesas' },
    { value: 'INVESTMENT', label: 'Investimentos' },
  ];
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/\S/)]],
    type: [this.defaultType, Validators.required],
    color: [this.defaultColor, [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
  });
  readonly categories = signal<CategoryResponse[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly selectedFilter = signal<CategoryFilter>('ALL');
  readonly visibleCategories = computed(() =>
    this.categories()
      .filter(
        (category) => this.selectedFilter() === 'ALL' || category.type === this.selectedFilter(),
      )
      .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
  );

  isSubmitting = false;
  errorMessage = '';

  constructor() {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.categoryService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.loadError.set(true),
      });
  }

  selectFilter(filter: CategoryFilter): void {
    this.selectedFilter.set(filter);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const name = value.name.trim();
    if (!name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.categoryService
      .create({ ...value, name })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (category) => {
          this.categories.update((categories) => [...categories, category]);
          this.form.reset({ name: '', type: this.defaultType, color: this.defaultColor });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.status === 409
              ? 'Já existe uma categoria com esse nome e tipo.'
              : 'Não foi possível cadastrar a categoria. Tente novamente.';
        },
      });
  }
}
