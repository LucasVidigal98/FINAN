import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardComparison } from './dashboard-comparison.model';
import { DashboardEvolution } from './dashboard-evolution.model';
import { MonthlySummary } from './monthly-summary.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/dashboard';

  getMonthlySummary(year: number, month: number): Observable<MonthlySummary> {
    return this.http.get<MonthlySummary>(`${this.apiUrl}/monthly`, {
      params: { year, month },
    });
  }

  getComparison(year: number, month: number): Observable<DashboardComparison> {
    return this.http.get<DashboardComparison>(`${this.apiUrl}/comparison`, {
      params: { year, month },
    });
  }

  getEvolution(year: number, month: number): Observable<DashboardEvolution> {
    return this.http.get<DashboardEvolution>(`${this.apiUrl}/evolution`, {
      params: { year, month },
    });
  }
}
