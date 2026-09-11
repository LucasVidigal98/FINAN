export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT';

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  source: 'MANUAL' | 'PLUGGY';
  initialBalance: number | null;
  providerBalance: number | null;
  active: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
