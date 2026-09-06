export type CategoryType = 'INCOME' | 'EXPENSE' | 'INVESTMENT';

export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  color: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  type: CategoryType;
  color: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
