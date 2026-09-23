import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, retry, Subscription, throwError, timer } from 'rxjs';
import { ComparisonMetrics, DashboardComparison } from './dashboard-comparison.model';
import { DashboardEvolution, DashboardEvolutionPoint } from './dashboard-evolution.model';
import { DashboardService } from './dashboard.service';
import { ExpenseDistribution, ExpenseDistributionCategory } from './expense-distribution.model';

type MetricKey = keyof ComparisonMetrics;
type ComparisonDirection = 'increase' | 'decrease' | 'stable';
type ComparisonTone = 'favorable' | 'warning' | 'neutral';
type EvolutionKey = 'income' | 'expense' | 'investment';

interface ExpenseSlice {
  index: number;
  category: ExpenseDistributionCategory;
  color: string;
  path: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly today = new Date();
  private activeRequest?: Subscription;
  private activePeriod = '';
  private requestId = 0;

  readonly months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  years = Array.from({ length: 5 }, (_, index) => this.today.getFullYear() - index);

  readonly metricDefinitions: ReadonlyArray<{ key: MetricKey; label: string }> = [
    { key: 'income', label: 'Receitas' },
    { key: 'expense', label: 'Despesas' },
    { key: 'balance', label: 'Saldo' },
    { key: 'investment', label: 'Investimentos' },
  ];

  selectedYear = this.today.getFullYear();
  selectedMonth = this.today.getMonth() + 1;
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly comparison = signal<DashboardComparison | undefined>(undefined);
  readonly evolution = signal<DashboardEvolution | undefined>(undefined);
  readonly expenseDistribution = signal<ExpenseDistribution | undefined>(undefined);
  readonly activePoint = signal<number | undefined>(undefined);
  readonly activeExpenseCategory = signal<number | undefined>(undefined);
  readonly expenseSlices = computed(() => {
    const distribution = this.expenseDistribution();
    if (!distribution || distribution.totalExpense <= 0 || !distribution.categories.length)
      return [];

    const percentageTotal = distribution.categories.reduce(
      (total, category) => total + category.percentage,
      0,
    );
    const total = percentageTotal || distribution.totalExpense;
    let angle = -Math.PI / 2;
    const colors = [
      '#818cf8',
      '#f472b6',
      '#4ade80',
      '#60a5fa',
      '#fbbf24',
      '#a78bfa',
      '#2dd4bf',
      '#fb7185',
    ];

    return distribution.categories.map((category, index) => {
      const portion = percentageTotal ? category.percentage / total : category.amount / total;
      const end =
        index === distribution.categories.length - 1
          ? -Math.PI / 2 + 2 * Math.PI
          : angle + 2 * Math.PI * portion;
      const slice = {
        index,
        category,
        color: colors[index % colors.length],
        path: this.sectorPath(angle, end),
      };
      angle = end;
      return slice;
    });
  });
  readonly activeExpenseItem = computed(() => {
    const index = this.activeExpenseCategory();
    return index === undefined ? undefined : this.expenseDistribution()?.categories[index];
  });
  readonly evolutionSeries: ReadonlyArray<{
    key: EvolutionKey;
    label: string;
    color: string;
    dash: string;
  }> = [
    { key: 'income', label: 'Receitas', color: '#4ade80', dash: '' },
    { key: 'expense', label: 'Despesas', color: '#f87171', dash: '7 4' },
    { key: 'investment', label: 'Investimentos', color: '#60a5fa', dash: '2 4' },
  ];
  readonly cards = computed(() => {
    const comparison = this.comparison();
    return comparison
      ? this.metricDefinitions.map((definition) => ({
          ...definition,
          metric: comparison.metrics[definition.key],
        }))
      : [];
  });

  constructor() {
    this.loadSummary();
  }

  loadSummary(): void {
    const year = this.selectedYear;
    const month = this.selectedMonth;
    const period = `${year}-${String(month).padStart(2, '0')}`;
    if (period === this.activePeriod && this.activeRequest && !this.activeRequest.closed) return;

    this.activeRequest?.unsubscribe();
    const currentRequestId = ++this.requestId;
    this.activePeriod = period;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.comparison.set(undefined);
    this.evolution.set(undefined);
    this.expenseDistribution.set(undefined);
    this.activePoint.set(undefined);
    this.activeExpenseCategory.set(undefined);

    const request = forkJoin({
      comparison: this.dashboardService.getComparison(year, month),
      evolution: this.dashboardService.getEvolution(year, month),
      expenseDistribution: this.dashboardService.getExpenseDistribution(year, month),
    })
      .pipe(
        retry({
          count: 12,
          delay: (error: unknown) =>
            error instanceof HttpErrorResponse && error.status === 0
              ? timer(5000)
              : throwError(() => error),
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .pipe(
        finalize(() => {
          if (this.requestId !== currentRequestId) return;
          this.activeRequest = undefined;
          this.activePeriod = '';
          this.isLoading.set(false);
        }),
      );

    this.activeRequest = request.subscribe({
      next: ({ comparison, evolution, expenseDistribution }) => {
        if (this.requestId !== currentRequestId) return;
        if (
          !this.isValidComparison(comparison) ||
          !this.isValidEvolution(evolution, period) ||
          comparison.currentPeriod !== period ||
          comparison.currentPeriod !== evolution.endPeriod ||
          !this.isValidExpenseDistribution(expenseDistribution, period) ||
          !this.isClose(
            expenseDistribution.totalExpense,
            comparison.metrics.expense.current,
            expenseDistribution.categories.length,
          )
        ) {
          this.errorMessage.set('Não foi possível carregar o resumo do período. Tente novamente.');
          return;
        }

        this.comparison.set(comparison);
        this.evolution.set(evolution);
        this.expenseDistribution.set(expenseDistribution);
      },
      error: () => {
        if (this.requestId !== currentRequestId) return;
        this.comparison.set(undefined);
        this.evolution.set(undefined);
        this.expenseDistribution.set(undefined);
        this.errorMessage.set('Não foi possível carregar o resumo do período. Tente novamente.');
      },
    });
  }

  direction(change: number): ComparisonDirection {
    return change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable';
  }

  directionLabel(change: number): string {
    return this.direction(change) === 'increase'
      ? 'Aumento'
      : this.direction(change) === 'decrease'
        ? 'Redução'
        : 'Sem alteração';
  }

  directionIcon(change: number): string {
    return this.direction(change) === 'increase'
      ? '↑'
      : this.direction(change) === 'decrease'
        ? '↓'
        : '→';
  }

  comparisonTone(key: MetricKey, change: number): ComparisonTone {
    const direction = this.direction(change);
    if (direction === 'stable') return 'neutral';
    if (key === 'expense') return direction === 'increase' ? 'warning' : 'favorable';
    return direction === 'increase' ? 'favorable' : 'warning';
  }

  absoluteDifference(change: number): number {
    return Math.abs(change);
  }

  previousPeriodLabel(period: string): string {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(period);
    if (!match || Number(match[1]) < 1) return '';
    return `${this.months[Number(match[2]) - 1].toLowerCase()} de ${match[1]}`;
  }

  monthLabel(period: string, long = false): string {
    const [year, month] = period.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', {
      month: long ? 'long' : 'short',
      ...(long ? { year: 'numeric' } : {}),
    })
      .format(new Date(year, month - 1, 1))
      .replace('.', '');
  }

  linePoints(key: EvolutionKey): string {
    const points = this.evolution()?.points ?? [];
    const maximum = Math.max(
      1,
      ...points.flatMap((point) => this.evolutionSeries.map(({ key }) => point[key])),
    );
    return points
      .map((point, index) => `${60 + index * 105},${210 - (point[key] / maximum) * 170}`)
      .join(' ');
  }

  pointX(index: number): number {
    return 60 + index * 105;
  }

  pointY(point: DashboardEvolutionPoint, key: EvolutionKey): number {
    const points = this.evolution()?.points ?? [];
    const maximum = Math.max(
      1,
      ...points.flatMap((item) => this.evolutionSeries.map(({ key }) => item[key])),
    );
    return 210 - (point[key] / maximum) * 170;
  }

  axisLabel(): string {
    const points = this.evolution()?.points ?? [];
    const maximum = Math.max(
      0,
      ...points.flatMap((point) => this.evolutionSeries.map(({ key }) => point[key])),
    );
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(maximum);
  }

  isEmptyEvolution(): boolean {
    return (
      this.evolution()?.points.every((point) =>
        this.evolutionSeries.every(({ key }) => point[key] === 0),
      ) ?? false
    );
  }

  hideTooltip(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.activePoint.set(undefined);
      this.activeExpenseCategory.set(undefined);
    }
  }

  hideExpenseTooltip(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.target !== document.activeElement) {
      this.activeExpenseCategory.set(undefined);
    }
  }

  private isValidComparison(
    value: DashboardComparison | null | undefined,
  ): value is DashboardComparison {
    if (
      !value ||
      !this.isValidPeriod(value.currentPeriod) ||
      !this.isValidPeriod(value.previousPeriod)
    ) {
      return false;
    }

    return this.metricDefinitions.every(({ key }) => {
      const metric = value.metrics?.[key];
      return (
        metric != null &&
        this.isFiniteNumber(metric.current) &&
        this.isFiniteNumber(metric.previous) &&
        this.isFiniteNumber(metric.absoluteChange) &&
        (metric.percentageChange === null || this.isFiniteNumber(metric.percentageChange))
      );
    });
  }

  private isValidEvolution(
    value: DashboardEvolution | null | undefined,
    currentPeriod: string,
  ): value is DashboardEvolution {
    if (
      !value ||
      !this.isValidPeriod(value.startPeriod) ||
      value.endPeriod !== currentPeriod ||
      !Array.isArray(value.points) ||
      value.points.length !== 6
    )
      return false;
    return (
      value.points.every((point, index) => {
        const expected = this.periodAfter(value.startPeriod, index);
        return (
          point?.period === expected &&
          this.isValidPeriod(point.period) &&
          this.evolutionSeries.every(
            ({ key }) => this.isFiniteNumber(point[key]) && point[key] >= 0,
          )
        );
      }) && value.points[5].period === value.endPeriod
    );
  }

  private isValidExpenseDistribution(
    value: ExpenseDistribution | null | undefined,
    currentPeriod: string,
  ): value is ExpenseDistribution {
    if (
      !value ||
      value.period !== currentPeriod ||
      !this.isValidPeriod(value.period) ||
      !this.isFiniteNumber(value.totalExpense) ||
      value.totalExpense < 0 ||
      !Array.isArray(value.categories) ||
      (value.totalExpense === 0 ? value.categories.length !== 0 : value.categories.length === 0)
    ) {
      return false;
    }

    const identities = new Set<string>();
    let total = 0;
    let previous: ExpenseDistributionCategory | undefined;
    for (const category of value.categories) {
      if (
        !category ||
        (category.categoryId !== null &&
          (typeof category.categoryId !== 'string' ||
            !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(category.categoryId))) ||
        typeof category.categoryName !== 'string' ||
        category.categoryName.trim() === '' ||
        !this.isFiniteNumber(category.amount) ||
        category.amount < 0 ||
        !this.isFiniteNumber(category.percentage) ||
        category.percentage < 0 ||
        category.percentage > 100
      ) {
        return false;
      }

      const identity = category.categoryId?.toLowerCase() ?? 'uncategorized';
      const expectedPercentage = (category.amount / value.totalExpense) * 100;
      const roundedExpectedPercentage =
        Math.round((expectedPercentage + Number.EPSILON * Math.max(1, expectedPercentage)) * 100) /
        100;
      if (
        identities.has(identity) ||
        !this.isClose(category.percentage, Math.round(category.percentage * 100) / 100) ||
        !this.isClose(category.percentage, roundedExpectedPercentage) ||
        (previous &&
          (previous.amount < category.amount ||
            (previous.amount === category.amount &&
              (previous.categoryName > category.categoryName ||
                (previous.categoryName === category.categoryName &&
                  ((previous.categoryId === null && category.categoryId !== null) ||
                    (previous.categoryId !== null &&
                      category.categoryId !== null &&
                      previous.categoryId > category.categoryId)))))))
      ) {
        return false;
      }

      identities.add(identity);
      total += category.amount;
      previous = category;
    }

    return this.isClose(total, value.totalExpense, value.categories.length);
  }

  private isClose(left: number, right: number, terms = 1): boolean {
    return (
      Math.abs(left - right) <=
      Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right)) * Math.max(1, terms) * 4
    );
  }

  private sectorPath(start: number, end: number): string {
    const center = 120;
    const radius = 84;
    const point = (angle: number) =>
      `${(center + radius * Math.cos(angle)).toFixed(3)} ${(center + radius * Math.sin(angle)).toFixed(3)}`;

    if (end - start >= 2 * Math.PI - 0.000001) {
      const middle = start + Math.PI;
      return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${point(middle)} A ${radius} ${radius} 0 1 1 ${center} ${center - radius} L ${center} ${center} Z`;
    }

    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${center} ${center} L ${point(start)} A ${radius} ${radius} 0 ${largeArc} 1 ${point(end)} Z`;
  }

  private periodAfter(period: string, months: number): string {
    const [year, month] = period.split('-').map(Number);
    const value = new Date(year, month - 1 + months, 1);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
  }

  private isValidPeriod(period: string): boolean {
    if (typeof period !== 'string') return false;
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(period);
    return match !== null && Number(match[1]) > 0;
  }

  private isFiniteNumber(value: number): boolean {
    return typeof value === 'number' && Number.isFinite(value);
  }
}
