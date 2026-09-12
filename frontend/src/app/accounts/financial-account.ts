export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CASH: 'Dinheiro',
  INVESTMENT: 'Investimento',
};

export interface CreateFinancialAccountRequest {
  name: string;
  type: AccountType;
  initialBalance: number;
}

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
