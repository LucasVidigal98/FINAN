import { CategoryType } from '../categories/category.model';

export type FixedEntryType = Exclude<CategoryType, 'INVESTMENT'>;

export interface FixedEntry {
  id: string;
  description: string;
  amount: number;
  type: FixedEntryType;
  categoryId: string;
  startsOn: string;
  active: boolean;
  eligibleFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFixedEntryRequest {
  description: string;
  amount: number;
  type: FixedEntryType;
  categoryId: string;
  startsOn: string;
}
