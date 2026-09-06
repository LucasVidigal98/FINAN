export type TransactionType = 'INCOME' | 'EXPENSE' | 'INVESTMENT';

export interface TransactionCategory {
  id: string;
  name: string;
  color: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  occurredOn: string;
  type: TransactionType;
  source: 'MANUAL' | 'PLUGGY';
  category: TransactionCategory | null;
  createdAt: string;
  updatedAt: string;
}
