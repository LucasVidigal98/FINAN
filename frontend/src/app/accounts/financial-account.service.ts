import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateFinancialAccountRequest, FinancialAccount } from './financial-account';

@Injectable({ providedIn: 'root' })
export class FinancialAccountService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/accounts';

  findAll(): Observable<FinancialAccount[]> {
    return this.http.get<FinancialAccount[]>(this.apiUrl);
  }

  create(request: CreateFinancialAccountRequest): Observable<FinancialAccount> {
    return this.http.post<FinancialAccount>(this.apiUrl, request);
  }
}
