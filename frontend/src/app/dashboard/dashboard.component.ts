import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { MonthlySummary } from './monthly-summary.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly today = new Date();

  readonly months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  readonly years = Array.from({ length: 5 }, (_, index) => this.today.getFullYear() - index);

  selectedYear = this.today.getFullYear();
  selectedMonth = this.today.getMonth() + 1;
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly summary = signal<MonthlySummary | undefined>(undefined);

  constructor() {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.summary.set(undefined);

    this.dashboardService
      .getMonthlySummary(this.selectedYear, this.selectedMonth)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: () => this.errorMessage.set('Não foi possível carregar o resumo mensal.'),
      });
  }
}
