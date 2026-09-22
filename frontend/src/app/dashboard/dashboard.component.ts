import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { ComparisonMetrics, DashboardComparison } from './dashboard-comparison.model';
import { DashboardEvolution, DashboardEvolutionPoint } from './dashboard-evolution.model';
import { DashboardService } from './dashboard.service';

type MetricKey = keyof ComparisonMetrics;
type ComparisonDirection = 'increase' | 'decrease' | 'stable';
type ComparisonTone = 'favorable' | 'warning' | 'neutral';
type EvolutionKey = 'income' | 'expense' | 'investment';

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
  readonly activePoint = signal<number | undefined>(undefined);
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
    const period = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
    if (period === this.activePeriod && this.activeRequest && !this.activeRequest.closed) return;

    this.activeRequest?.unsubscribe();
    const currentRequestId = ++this.requestId;
    this.activePeriod = period;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.comparison.set(undefined);
    this.evolution.set(undefined);
    this.activePoint.set(undefined);

    const request = forkJoin({
      comparison: this.dashboardService.getComparison(this.selectedYear, this.selectedMonth),
      evolution: this.dashboardService.getEvolution(this.selectedYear, this.selectedMonth),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(
        finalize(() => {
          if (this.requestId !== currentRequestId) return;
          this.activeRequest = undefined;
          this.activePeriod = '';
          this.isLoading.set(false);
        }),
      );

    this.activeRequest = request.subscribe({
      next: ({ comparison, evolution }) => {
        if (this.requestId !== currentRequestId) return;
        if (
          !this.isValidComparison(comparison) ||
          !this.isValidEvolution(evolution, period) ||
          comparison.currentPeriod !== evolution.endPeriod
        ) {
          this.errorMessage.set('Não foi possível carregar a comparação. Tente novamente.');
          return;
        }

        const [year, month] = comparison.currentPeriod.split('-').map(Number);
        if (!this.years.includes(year)) this.years = [...this.years, year].sort((a, b) => b - a);
        this.selectedYear = year;
        this.selectedMonth = month;
        this.comparison.set(comparison);
        this.evolution.set(evolution);
      },
      error: () => {
        if (this.requestId !== currentRequestId) return;
        this.comparison.set(undefined);
        this.evolution.set(undefined);
        this.errorMessage.set('Não foi possível carregar a comparação. Tente novamente.');
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
    if (event.key === 'Escape') this.activePoint.set(undefined);
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
