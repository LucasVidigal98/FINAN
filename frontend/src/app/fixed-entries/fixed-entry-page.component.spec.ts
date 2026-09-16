import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { CategoryService } from '../categories/category.service';
import { FixedEntry } from './fixed-entry.model';
import { FixedEntryPageComponent } from './fixed-entry-page.component';
import { FixedEntryService } from './fixed-entry.service';

describe('FixedEntryPageComponent', () => {
  let fixture: ComponentFixture<FixedEntryPageComponent>;
  const entry: FixedEntry = {
    id: '1',
    description: 'Academia',
    amount: 99.9,
    type: 'EXPENSE',
    categoryId: 'c1',
    startsOn: '2026-09-10',
    active: true,
    eligibleFrom: '2026-09-01',
    createdAt: '',
    updatedAt: '',
  };
  const fixedEntryService = {
    findAll: vi.fn(() => of([entry])),
    create: vi.fn(),
    setActive: vi.fn(),
    delete: vi.fn(),
  };
  const categoryService = {
    findAll: vi.fn(() =>
      of([
        {
          id: 'c1',
          name: 'Saúde',
          type: 'EXPENSE',
          color: null,
          active: true,
          createdAt: '',
          updatedAt: '',
        },
      ]),
    ),
  };
  beforeEach(async () => {
    fixedEntryService.findAll.mockReset().mockReturnValue(of([entry]));
    fixedEntryService.create.mockReset();
    fixedEntryService.setActive.mockReset();
    fixedEntryService.delete.mockReset();
    await TestBed.configureTestingModule({
      imports: [FixedEntryPageComponent],
      providers: [
        { provide: FixedEntryService, useValue: fixedEntryService },
        { provide: CategoryService, useValue: categoryService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FixedEntryPageComponent);
  });
  it('cadastra com descrição normalizada', () => {
    fixedEntryService.create.mockReturnValue(of({ ...entry, id: '2' }));
    fixture.componentInstance.form.setValue({
      description: ' Academia ',
      amount: 99.9,
      type: 'EXPENSE',
      categoryId: 'c1',
      startsOn: '2026-09-10',
    });
    fixture.componentInstance.submit();
    expect(fixedEntryService.create).toHaveBeenCalledWith({
      description: 'Academia',
      amount: 99.9,
      type: 'EXPENSE',
      categoryId: 'c1',
      startsOn: '2026-09-10',
    });
  });

  it('atualiza as categorias ao trocar o tipo', () => {
    fixture.componentInstance.categories.set([
      {
        id: 'c1',
        name: 'Saúde',
        type: 'EXPENSE',
        color: null,
        active: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'c2',
        name: 'Salário',
        type: 'INCOME',
        color: null,
        active: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    expect(fixture.componentInstance.compatibleCategories().map((category) => category.id)).toEqual(
      ['c1'],
    );
    fixture.componentInstance.form.controls.type.setValue('INCOME');
    expect(fixture.componentInstance.compatibleCategories().map((category) => category.id)).toEqual(
      ['c2'],
    );
  });
  it('preserva o estado salvo quando a alternância falha', () => {
    fixedEntryService.setActive.mockReturnValue(throwError(() => new Error('network')));
    fixture.componentInstance.toggle(entry);
    expect(fixture.componentInstance.entries()[0].active).toBe(true);
    expect(fixture.componentInstance.errorMessage).toContain('Não foi possível');
  });
  it('bloqueia alternâncias duplicadas', () => {
    const response = new Subject<FixedEntry>();
    fixedEntryService.setActive.mockReturnValue(response);
    fixture.componentInstance.toggle(entry);
    fixture.componentInstance.toggle(entry);
    expect(fixedEntryService.setActive).toHaveBeenCalledOnce();
  });

  it('remove da lista somente depois da exclusão bem-sucedida', () => {
    fixedEntryService.delete.mockReturnValue(of(void 0));
    fixture.componentInstance.delete(entry);
    expect(fixedEntryService.delete).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.entries()).toEqual([]);
  });
});
