import { HttpClient } from '@angular/common/http';
import { inject, Injectable, isDevMode } from '@angular/core';
import { PluggyConnect } from 'pluggy-connect-sdk';
import { map, Observable } from 'rxjs';

interface ConnectTokenResponse {
  connectToken: string;
}

export type ConnectResult = 'success' | 'closed' | 'error';

@Injectable({ providedIn: 'root' })
export class OpenFinanceService {
  private readonly http = inject(HttpClient);
  private widget: PluggyConnect | null = null;

  createConnectToken(): Observable<string> {
    return this.http
      .post<ConnectTokenResponse>('http://localhost:8080/api/open-finance/connect-token', null)
      .pipe(
        map(({ connectToken }) => {
          if (typeof connectToken !== 'string' || connectToken.trim().length === 0) {
            throw new Error('Invalid connect token');
          }
          return connectToken;
        }),
      );
  }

  openConnectWidget(connectToken: string, onResult: (result: ConnectResult) => void): void {
    const widget = new PluggyConnect({
      connectToken,
      includeSandbox: isDevMode(),
      allowConnectInBackground: false,
      language: 'pt',
      theme: 'dark',
      onSuccess: () => onResult('success'),
      onError: () => onResult('error'),
      onClose: () => onResult('closed'),
    });
    this.widget = widget;
    void widget.init().then(undefined, () => onResult('error'));
  }

  destroyConnectWidget(): Promise<void> | null {
    const widget = this.widget;
    this.widget = null;
    if (!widget) return null;
    try {
      return widget.destroy();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
