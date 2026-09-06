import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { CategoryResponse } from './category.model';
import { CategoryPageComponent } from './category-page.component';
import { CategoryService } from './category.service';

describe('CategoryPageComponent', () => {
  let fixture: ComponentFixture<CategoryPageComponent>;
  const categories: CategoryResponse[] = [
    {
      id: '1',
      name: 'Salário',
      type: 'INCOME',
      color: '#22C55E',
      active: true,
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z',
    },
    {
      id: '2',
      name: 'Alimentação',
      type: 'EXPENSE',
      color: '#EF4444',
      active: false,
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z',
    },
    {
      id: '3',
      name: 'Tesouro',
      type: 'INVESTMENT',
      color: '#3B82F6',
      active: true,
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z',
    },
  ];
  const categoryService = {
    findAll: vi.fn(() => of(categories)),
    create: vi.fn(),
  };

  beforeEach(async () => {
    categoryService.findAll.mockReset().mockReturnValue(of(categories));
    categoryService.create.mockReset();
    await TestBed.configureTestingModule({
      imports: [CategoryPageComponent],
      providers: [{ provide: CategoryService, useValue: categoryService }],
    }).compileComponents();
    fixture = TestBed.createComponent(CategoryPageComponent);
  });

  it('carrega, exibe e traduz as categorias', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(categoryService.findAll).toHaveBeenCalledOnce();
    expect(content).toContain('Alimentação');
    expect(content).toContain('Salário');
    expect(content).toContain('Receita');
    expect(content).toContain('Despesa');
    expect(content).toContain('Investimento');
    expect(content).toContain('Inativa');
  });

  it('bloqueia o formulário inválido', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('form button') as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    fixture.componentInstance.submit();
    expect(categoryService.create).not.toHaveBeenCalled();
  });

  it('envia os dados normalizados e atualiza a lista', () => {
    const created = { ...categories[1], id: '4', name: 'Moradia', active: true };
    categoryService.create.mockReturnValue(of(created));
    fixture.componentInstance.form.setValue({
      name: '  Moradia  ',
      type: 'EXPENSE',
      color: '#EF4444',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(categoryService.create).toHaveBeenCalledWith({
      name: 'Moradia',
      type: 'EXPENSE',
      color: '#EF4444',
    });
    expect(fixture.componentInstance.categories()).toContain(created);
    expect(fixture.nativeElement.textContent).toContain('Moradia');
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      name: '',
      type: 'EXPENSE',
      color: '#EF4444',
    });
  });

  it('preserva os dados e mostra uma mensagem para conflito', () => {
    categoryService.create.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );
    fixture.componentInstance.form.setValue({
      name: 'Alimentação',
      type: 'EXPENSE',
      color: '#EF4444',
    });

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.form.controls.name.value).toBe('Alimentação');
    expect(fixture.componentInstance.errorMessage).toContain('Já existe');
  });

  it('mostra erro de carregamento', () => {
    categoryService.findAll.mockReturnValue(throwError(() => new Error('network')));
    const errorFixture = TestBed.createComponent(CategoryPageComponent);
    errorFixture.detectChanges();

    expect(errorFixture.nativeElement.textContent).toContain(
      'Não foi possível carregar as categorias.',
    );
  });

  it('impede submissões duplicadas', () => {
    const response = new Subject<CategoryResponse>();
    categoryService.create.mockReturnValue(response);
    fixture.componentInstance.form.setValue({
      name: 'Moradia',
      type: 'EXPENSE',
      color: '#EF4444',
    });

    fixture.componentInstance.submit();
    fixture.componentInstance.submit();

    expect(categoryService.create).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.isSubmitting).toBe(true);
  });
});
