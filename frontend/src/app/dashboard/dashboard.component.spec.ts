import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { MonthlySummary } from './monthly-summary.model';

registerLocaleData(localePt);

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  const summary: MonthlySummary = {
    year: 2026,
    month: 9,
    totalIncome: 5000,
    totalExpense: 1200,
    totalInvestment: 800,
    availableBalance: 3000,
    transactionCount: 18,
  };
  const dashboardService = { getMonthlySummary: vi.fn(() => of(summary)) };

  beforeEach(async () => {
    dashboardService.getMonthlySummary.mockClear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
  });

  it('loads the current month and reloads when the period changes', () => {
    const dashboard = fixture.componentInstance;
    const today = new Date();

    expect(dashboardService.getMonthlySummary).toHaveBeenCalledWith(
      today.getFullYear(),
      today.getMonth() + 1,
    );

    dashboard.selectedMonth = 1;
    dashboard.loadSummary();

    expect(dashboardService.getMonthlySummary).toHaveBeenLastCalledWith(today.getFullYear(), 1);
    expect(dashboard.summary()).toEqual(summary);
    expect(dashboard.isLoading()).toBe(false);
  });

  it('updates the rendered state when the request completes', async () => {
    const response = new Subject<MonthlySummary>();
    dashboardService.getMonthlySummary.mockReturnValue(response);
    const pendingFixture = TestBed.createComponent(DashboardComponent);
    pendingFixture.detectChanges();

    expect(pendingFixture.nativeElement.textContent).toContain('Carregando resumo...');

    response.next(summary);
    response.complete();
    await pendingFixture.whenStable();

    expect(pendingFixture.nativeElement.textContent).not.toContain('Carregando resumo...');
    expect(pendingFixture.nativeElement.textContent).toContain('Saldo disponível');
  });
});
