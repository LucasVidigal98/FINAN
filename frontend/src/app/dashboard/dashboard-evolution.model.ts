export interface DashboardEvolutionPoint {
  period: string;
  income: number;
  expense: number;
  investment: number;
}

export interface DashboardEvolution {
  startPeriod: string;
  endPeriod: string;
  points: DashboardEvolutionPoint[];
}
