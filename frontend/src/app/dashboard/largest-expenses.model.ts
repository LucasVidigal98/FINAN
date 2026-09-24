export interface LargestExpense {
  id: string;
  description: string;
  amount: number;
  occurredOn: string;
  categoryName: string;
}

export interface LargestExpenses {
  period: string;
  expenses: LargestExpense[];
}
