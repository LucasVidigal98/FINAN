import { TransactionType } from '../transaction';

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  occurredOn: string;
  type: TransactionType;
}
