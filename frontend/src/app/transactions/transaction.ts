export interface Transaction {
  id: string;
  description: string;
  amount: number;
  occurredOn: string;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  source: 'MANUAL' | 'PLUGGY';
  createdAt: string;
  updatedAt: string;
}
