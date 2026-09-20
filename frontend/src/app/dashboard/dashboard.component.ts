import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { ComparisonMetrics, DashboardComparison } from './dashboard-comparison.model';
import { DashboardService } from './dashboard.service';

type MetricKey = keyof ComparisonMetrics;
type ComparisonDirection = 'increase' | 'decrease' | 'stable';
type ComparisonTone = 'favorable' | 'warning' | 'neutral';

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
    const period = `${this.selectedYear}-${this.selectedMonth}`;
    if (period === this.activePeriod && this.activeRequest && !this.activeRequest.closed) return;

    this.activeRequest?.unsubscribe();
    const currentRequestId = ++this.requestId;
    this.activePeriod = period;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.comparison.set(undefined);

    const request = this.dashboardService
      .getComparison(this.selectedYear, this.selectedMonth)
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
      next: (comparison) => {
        if (this.requestId !== currentRequestId) return;
        if (!this.isValidComparison(comparison)) {
          this.errorMessage.set('Não foi possível carregar a comparação. Tente novamente.');
          return;
        }

        const [year, month] = comparison.currentPeriod.split('-').map(Number);
        if (!this.years.includes(year)) this.years = [...this.years, year].sort((a, b) => b - a);
        this.selectedYear = year;
        this.selectedMonth = month;
        this.comparison.set(comparison);
      },
      error: () => {
        if (this.requestId !== currentRequestId) return;
        this.comparison.set(undefined);
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

  private isValidPeriod(period: string): boolean {
    if (typeof period !== 'string') return false;
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(period);
    return match !== null && Number(match[1]) > 0;
  }

  private isFiniteNumber(value: number): boolean {
    return typeof value === 'number' && Number.isFinite(value);
  }
}
