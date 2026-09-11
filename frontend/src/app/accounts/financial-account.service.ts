import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FinancialAccount } from './financial-account';

@Injectable({ providedIn: 'root' })
export class FinancialAccountService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<FinancialAccount[]> {
    return this.http.get<FinancialAccount[]>('http://localhost:8080/api/accounts');
  }
}
