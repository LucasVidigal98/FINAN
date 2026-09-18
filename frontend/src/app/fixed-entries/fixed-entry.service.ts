import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateFixedEntryRequest, FixedEntry } from './fixed-entry.model';

@Injectable({ providedIn: 'root' })
export class FixedEntryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/fixed-entries';

  findAll(): Observable<FixedEntry[]> {
    return this.http.get<FixedEntry[]>(this.apiUrl);
  }

  create(request: CreateFixedEntryRequest): Observable<FixedEntry> {
    return this.http.post<FixedEntry>(this.apiUrl, request);
  }

  setActive(id: string, active: boolean): Observable<FixedEntry> {
    return this.http.patch<FixedEntry>(`${this.apiUrl}/${id}/active`, { active });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
