import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface ConnectTokenResponse {
  connectToken: string;
}

@Injectable({ providedIn: 'root' })
export class OpenFinanceService {
  private readonly http = inject(HttpClient);

  createConnectToken(): Observable<ConnectTokenResponse> {
    return this.http.post<ConnectTokenResponse>(
      'http://localhost:8080/api/open-finance/connect-token',
      null,
    );
  }
}
