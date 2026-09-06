export type TransactionType = 'INCOME' | 'EXPENSE' | 'INVESTMENT';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  occurredOn: string;
  type: TransactionType;
  source: 'MANUAL' | 'PLUGGY';
  createdAt: string;
  updatedAt: string;
}
