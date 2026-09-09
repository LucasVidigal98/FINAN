import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTransactionRequest } from './models/create-transaction-request';
import { Transaction } from './transaction';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly apiUrl = 'http://localhost:8080/api/transactions';

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  create(request: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, request);
  }

  updateCategory(transactionId: string, categoryId: string | null): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${transactionId}/category`, { categoryId });
  }
}
