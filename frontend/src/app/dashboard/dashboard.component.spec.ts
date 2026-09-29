import { registerLocaleData } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { defer, Observable, of, Subject, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { DashboardComparison, MetricComparison } from './dashboard-comparison.model';
import { DashboardEvolution } from './dashboard-evolution.model';
import { ExpenseDistribution } from './expense-distribution.model';

registerLocaleData(localePt);

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let response: DashboardComparison;
  const dashboardService = {
    getComparison: vi.fn<(...args: number[]) => Observable<DashboardComparison>>(),
    getEvolution: vi.fn<(...args: number[]) => Observable<DashboardEvolution>>(),
    getExpenseDistribution: vi.fn<(...args: number[]) => Observable<ExpenseDistribution>>(),
    getMonthlySummary: vi.fn(),
  };
  const text = (element: Element = fixture.nativeElement): string =>
    (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  const cards = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('article'));
  const render = () => {
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  };
  const metric = (
    current: number,
    previous: number,
    percentageChange: number | null,
  ): MetricComparison => ({
    current,
    previous,
    absoluteChange: current - previous,
    percentageChange,
  });
  const evolution = (year: number, month: number): DashboardEvolution => {
    const points = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(year, month - 6 + index, 1);
      return {
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        income: index === 5 ? 8500 : 0,
        expense: index === 5 ? 3000 : 0,
        investment: index === 5 ? 1000 : 0,
      };
    });
    return { startPeriod: points[0].period, endPeriod: points[5].period, points };
  };
  const expenseDistribution = (year: number, month: number): ExpenseDistribution => {
    const totalExpense = response.metrics.expense.current;
    const period = `${year}-${String(month).padStart(2, '0')}`;
    return {
      period,
      totalExpense,
      categories:
        totalExpense === 0
          ? []
          : [
              {
                categoryId: '11111111-1111-4111-8111-111111111111',
                categoryName: 'Mercado',
                amount: totalExpense * 0.6,
                percentage: 60,
              },
              {
                categoryId: null,
                categoryName: 'Sem categoria',
                amount: totalExpense * 0.4,
                percentage: 40,
              },
            ],
    };
  };

  beforeEach(async () => {
    response = {
      currentPeriod: '2026-09',
      previousPeriod: '2026-08',
      metrics: {
        income: metric(8500, 8000, 6.25),
        expense: metric(3000, 4000, -25),
        balance: metric(4500, 4000, 12.5),
        investment: metric(1000, 0, null),
      },
    };
    dashboardService.getComparison.mockReset().mockImplementation(() => of(response));
    dashboardService.getEvolution
      .mockReset()
      .mockImplementation((year, month) => of(evolution(year, month)));
    dashboardService.getExpenseDistribution
      .mockReset()
      .mockImplementation((year, month) => of(expenseDistribution(year, month)));
    dashboardService.getMonthlySummary.mockReset();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compileComponents();
  });

  it('loads all dashboard data together and renders metrics and expenses with Brazilian formatting', () => {
    render();
    const today = new Date();
    expect(dashboardService.getComparison).toHaveBeenCalledWith(
      today.getFullYear(),
      today.getMonth() + 1,
    );
    expect(dashboardService.getEvolution).toHaveBeenCalledWith(
      today.getFullYear(),
      today.getMonth() + 1,
    );
    expect(dashboardService.getExpenseDistribution).toHaveBeenCalledWith(
      today.getFullYear(),
      today.getMonth() + 1,
    );
    expect(dashboardService.getMonthlySummary).not.toHaveBeenCalled();
    expect(cards()).toHaveLength(4);
    ['Receitas', 'Despesas', 'Saldo', 'Investimentos'].forEach((label, index) =>
      expect(text(cards()[index])).toContain(label),
    );
    expect(text(cards()[0])).toContain('R$ 8.500,00');
    expect(text(cards()[0])).toContain('R$ 500,00');
    expect(text(cards()[0])).toContain('6,25%');
    expect(text(cards()[1])).toContain('R$ 1.000,00');
    expect(text(cards()[1])).toContain('-25%');
    expect(text(cards()[1])).not.toContain('-R$');
    expect(text(cards()[2])).toContain('R$ 4.500,00');
    cards().forEach((card) => expect(text(card)).toContain('em relação a agosto de 2026'));
    expect(text(cards()[3])).toContain('Sem base de comparação');
    expect(text(cards()[0])).not.toContain('Sem base de comparação');
    expect(text(fixture.nativeElement.querySelector('.expense-distribution')!)).toContain(
      'Despesas por categoria',
    );
    expect(text(fixture.nativeElement.querySelector('.expense-distribution')!)).toContain(
      'R$ 1.800,00',
    );
    expect(text(fixture.nativeElement.querySelector('.expense-distribution')!)).toContain('60,00%');
    expect(text(fixture.nativeElement.querySelector('.expense-distribution')!)).toContain(
      'Sem categoria',
    );
    expect(fixture.nativeElement.querySelectorAll('.donut-chart path')).toHaveLength(2);
    expect(text()).not.toMatch(/NaN|Infinity|null|undefined|Saldo disponível|movimentações/);
  });

  it('preserves negative balances and the percentage sign independently of monetary direction', () => {
    response.metrics.balance = metric(-50, -100, -50);
    response.metrics.investment = metric(0, 0, 0);
    render();
    expect(text(cards()[2])).toContain('-R$ 50,00');
    expect(text(cards()[2])).toContain('-50%');
    expect(text(cards()[2])).toContain('Aumento');
    expect(text(cards()[3])).toContain('R$ 0,00');
    expect(text(cards()[3])).toContain('0%');
    expect(text(cards()[3])).toContain('Sem alteração em relação ao mês anterior');
  });

  it('keeps all cards for empty months, including reductions from a nonempty previous month', () => {
    Object.keys(response.metrics).forEach((key) => {
      response.metrics[key as keyof typeof response.metrics] = metric(0, 0, 0);
    });
    render();
    expect(cards()).toHaveLength(4);
    cards().forEach((card) =>
      expect(text(card)).toContain('Sem alteração em relação ao mês anterior'),
    );
    response = { ...response, metrics: { ...response.metrics, income: metric(0, 100, -100) } };
    fixture.componentInstance.loadSummary();
    fixture.detectChanges();
    expect(cards()).toHaveLength(4);
    expect(text(cards()[0])).toContain('Redução');
    expect(text(cards()[0])).toContain('-100%');
  });

  it('inverts expense colors, uses monetary direction for negative bases and keeps stability neutral', () => {
    response.metrics.income = metric(80, 100, -20);
    response.metrics.expense = metric(120, 100, 20);
    response.metrics.balance = metric(-50, -100, -50);
    response.metrics.investment = metric(0, 0, 0);
    render();
    expect(cards().map((card) => card.querySelector('.comparison')?.className)).toEqual([
      expect.stringContaining('warning'),
      expect.stringContaining('warning'),
      expect.stringContaining('favorable'),
      expect.stringContaining('neutral'),
    ]);
    response.metrics.expense = metric(80, 100, -20);
    fixture.componentInstance.loadSummary();
    fixture.detectChanges();
    expect(cards()[1].querySelector('.comparison')?.classList.contains('favorable')).toBe(true);
    expect(text(cards()[1])).toContain('Redução');
  });

  it('queries the same selected month and year for all three dashboard results', async () => {
    render();
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelectorAll(
      'select',
    ) as NodeListOf<HTMLSelectElement>;
    const choose = async (element: HTMLSelectElement, label: string) => {
      element.value = Array.from(element.options).find(
        (option) => option.textContent?.trim() === label,
      )!.value;
      element.dispatchEvent(new Event('change'));
      await fixture.whenStable();
      fixture.detectChanges();
    };
    response = { ...response, currentPeriod: '2026-01', previousPeriod: '2025-12' };
    await choose(select[0], 'Janeiro');
    expect(dashboardService.getComparison).toHaveBeenLastCalledWith(2026, 1);
    expect(text()).toContain('em relação a dezembro de 2025');
    const year = Number(select[1].options[1].textContent);
    response = {
      ...response,
      currentPeriod: `${year}-01`,
      previousPeriod: `${year - 1}-12`,
    };
    await choose(select[1], String(year));
    expect(dashboardService.getComparison).toHaveBeenLastCalledWith(year, 1);
    expect(dashboardService.getEvolution).toHaveBeenLastCalledWith(year, 1);
    expect(dashboardService.getExpenseDistribution).toHaveBeenLastCalledWith(year, 1);
    expect(dashboardService.getComparison).toHaveBeenCalledTimes(3);
    expect(select[1].selectedOptions[0].textContent?.trim()).toBe(String(year));
    expect(text()).toContain(`em relação a dezembro de ${year - 1}`);
  });

  it('clears old cards, cancels obsolete requests, deduplicates pending periods and cancels on destroy', () => {
    render();
    const first = new Subject<DashboardComparison>();
    const latest = new Subject<DashboardComparison>();
    dashboardService.getComparison.mockReturnValueOnce(first).mockReturnValueOnce(latest);
    const dashboard = fixture.componentInstance;
    dashboard.selectedMonth = 1;
    dashboard.loadSummary();
    fixture.detectChanges();
    expect(cards()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    dashboard.selectedMonth = 2;
    dashboard.loadSummary();
    dashboard.loadSummary();
    expect(first.observed).toBe(false);
    expect(latest.observed).toBe(true);
    expect(dashboardService.getComparison).toHaveBeenCalledTimes(3);
    first.next(response);
    first.complete();
    fixture.detectChanges();
    expect(cards()).toHaveLength(0);
    expect(dashboard.isLoading()).toBe(true);
    latest.next({ ...response, currentPeriod: '2026-02', previousPeriod: '2026-01' });
    latest.complete();
    fixture.detectChanges();
    expect(dashboard.selectedMonth).toBe(2);
    expect(text()).toContain('em relação a janeiro de 2026');
    expect(dashboard.isLoading()).toBe(false);
    const pending = new Subject<DashboardComparison>();
    dashboardService.getComparison.mockReturnValue(pending);
    dashboard.loadSummary();
    fixture.destroy();
    expect(pending.observed).toBe(false);
  });

  it('offers retry after errors and requests the selected period again', () => {
    dashboardService.getExpenseDistribution.mockReturnValueOnce(
      throwError(() => new Error('technical secret')),
    );
    render();
    expect(cards()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(text()).not.toContain('technical secret');
    fixture.componentInstance.selectedMonth = 3;
    response = { ...response, currentPeriod: '2026-03', previousPeriod: '2026-02' };
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(dashboardService.getComparison).toHaveBeenLastCalledWith(2026, 3);
    expect(dashboardService.getEvolution).toHaveBeenLastCalledWith(2026, 3);
    expect(dashboardService.getExpenseDistribution).toHaveBeenLastCalledWith(2026, 3);
    expect(cards()).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('retries a connection failure during backend startup', async () => {
    let firstRequest = true;
    let subscriptions = 0;
    dashboardService.getComparison.mockReturnValue(
      defer(() => {
        subscriptions++;
        if (firstRequest) {
          firstRequest = false;
          return throwError(() => new HttpErrorResponse({ status: 0 }));
        }
        return of(response);
      }),
    );

    render();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 6000));
    fixture.detectChanges();

    expect(cards()).toHaveLength(4);
    expect(subscriptions).toBe(2);
  }, 10000);

  it('shows the empty expense state while keeping the cards and evolution', () => {
    response.metrics.expense = metric(0, 0, 0);
    render();
    expect(cards()).toHaveLength(4);
    expect(text(fixture.nativeElement.querySelector('.expense-distribution')!)).toContain(
      'Nenhuma despesa neste mês',
    );
    expect(fixture.nativeElement.querySelector('.donut-chart')).toBeNull();
    expect(fixture.nativeElement.querySelector('.distribution-list')).toBeNull();
    expect(fixture.nativeElement.querySelector('.evolution')).not.toBeNull();
  });

  it('offers category details to keyboard and touch users and dismisses them with Escape', () => {
    render();
    const figure = fixture.nativeElement.querySelector('.expense-distribution') as HTMLElement;
    const firstSlice = fixture.nativeElement.querySelector('.donut-chart path') as SVGPathElement;
    firstSlice.focus();
    fixture.detectChanges();
    expect(text(figure.querySelector('.distribution-tooltip')!)).toContain('Mercado');
    expect(text(figure.querySelector('.distribution-tooltip')!)).toContain('60,00%');
    firstSlice.blur();
    firstSlice.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(figure.querySelector('.distribution-tooltip')).not.toBeNull();
    figure.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(figure.querySelector('.distribution-tooltip')).toBeNull();
    expect(firstSlice.getAttribute('aria-label')).toContain('Mercado');
  });

  it('keeps same-name categories separate and includes period details in the text alternative', () => {
    dashboardService.getExpenseDistribution.mockReturnValueOnce(
      of({
        period: '2026-09',
        totalExpense: 3000,
        categories: [
          {
            categoryId: '11111111-1111-4111-8111-111111111111',
            categoryName: 'Casa',
            amount: 1500,
            percentage: 50,
          },
          {
            categoryId: '22222222-2222-4222-8222-222222222222',
            categoryName: 'Casa',
            amount: 1500,
            percentage: 50,
          },
        ],
      }),
    );
    render();
    expect(fixture.nativeElement.querySelectorAll('.distribution-item')).toHaveLength(2);
    expect(text(fixture.nativeElement.querySelector('.expense-distribution'))).toContain(
      'setembro de 2026: Casa',
    );
  });

  it.each([
    { period: '2026-08' },
    { totalExpense: -1 },
    { totalExpense: 2999 },
    {
      categories: [
        {
          categoryId: '11111111-1111-4111-8111-111111111111',
          categoryName: 'A',
          amount: 1500,
          percentage: 50,
        },
        {
          categoryId: '11111111-1111-4111-8111-111111111111',
          categoryName: 'B',
          amount: 1500,
          percentage: 50,
        },
      ],
    },
    {
      categories: [
        { categoryId: null, categoryName: 'Sem categoria', amount: 1000, percentage: 33.33 },
        {
          categoryId: '11111111-1111-4111-8111-111111111111',
          categoryName: 'Mercado',
          amount: 2000,
          percentage: 66.67,
        },
      ],
    },
    {
      categories: [
        {
          categoryId: '11111111-1111-4111-8111-111111111111',
          categoryName: 'Mercado',
          amount: 1800,
          percentage: 80,
        },
        { categoryId: null, categoryName: 'Sem categoria', amount: 1200, percentage: 20 },
      ],
    },
  ])('rejects incoherent expense distribution: %j', (invalid) => {
    const valid = expenseDistribution(2026, 9);
    dashboardService.getExpenseDistribution.mockReturnValueOnce(
      of({ ...valid, ...invalid } as ExpenseDistribution),
    );
    render();
    expect(cards()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.expense-distribution')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it.each(['current', 'previous', 'absoluteChange', 'percentageChange'] as const)(
    'rejects nonfinite %s without rendering technical values',
    (field) => {
      for (const invalid of [NaN, Infinity, -Infinity]) {
        response.metrics.income[field] = invalid;
        render();
        expect(cards()).toHaveLength(0);
        expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
        expect(text()).not.toMatch(/NaN|Infinity|null|undefined/);
        fixture.destroy();
      }
    },
  );

  it.each([
    null,
    { currentPeriod: '2026-13' },
    { currentPeriod: '0000-01' },
    { previousPeriod: '2026-00' },
    { previousPeriod: '2026-1' },
    { metrics: {} },
    { metrics: { income: null } },
    { metrics: { income: { current: '8500' } } },
  ])('rejects malformed responses: %j', (invalid) => {
    const payload = invalid === null ? null : { ...response, ...invalid };
    dashboardService.getComparison.mockReturnValue(of(payload as DashboardComparison));
    render();
    expect(cards()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
