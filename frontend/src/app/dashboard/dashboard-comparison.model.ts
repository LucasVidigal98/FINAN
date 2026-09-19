export interface MetricComparison {
  current: number;
  previous: number;
  absoluteChange: number;
  percentageChange: number | null;
}

export interface ComparisonMetrics {
  income: MetricComparison;
  expense: MetricComparison;
  balance: MetricComparison;
  investment: MetricComparison;
}

export interface DashboardComparison {
  currentPeriod: string;
  previousPeriod: string;
  metrics: ComparisonMetrics;
}
