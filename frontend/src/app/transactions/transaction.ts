import { FinancialAccount } from '../accounts/financial-account';

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
  account: Pick<FinancialAccount, 'id' | 'name' | 'type' | 'source'> | null;
  createdAt: string;
  updatedAt: string;
}
