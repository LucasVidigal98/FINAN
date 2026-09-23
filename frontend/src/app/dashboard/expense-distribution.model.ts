export interface ExpenseDistributionCategory {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface ExpenseDistribution {
  period: string;
  totalExpense: number;
  categories: ExpenseDistributionCategory[];
}
