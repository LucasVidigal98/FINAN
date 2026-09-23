import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardComparison } from './dashboard-comparison.model';
import { DashboardEvolution } from './dashboard-evolution.model';
import { ExpenseDistribution } from './expense-distribution.model';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets a typed monthly comparison with the selected period', () => {
    const response: DashboardComparison = {
      currentPeriod: '2026-09',
      previousPeriod: '2026-08',
      metrics: {
        income: { current: 8500, previous: 8000, absoluteChange: 500, percentageChange: 6.25 },
        expense: {
          current: 3000,
          previous: 4000,
          absoluteChange: -1000,
          percentageChange: -25,
        },
        balance: { current: 4500, previous: 4000, absoluteChange: 500, percentageChange: 12.5 },
        investment: {
          current: 1000,
          previous: 0,
          absoluteChange: 1000,
          percentageChange: null,
        },
      },
    };
    let actual: DashboardComparison | undefined;

    service.getComparison(2026, 9).subscribe((comparison) => (actual = comparison));

    const request = http.expectOne(
      'http://localhost:8080/api/dashboard/comparison?year=2026&month=9',
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);

    expect(actual).toEqual(response);
    expect(actual?.metrics.investment.percentageChange).toBeNull();
  });

  it('propagates comparison request errors', () => {
    let error: unknown;

    service.getComparison(2026, 9).subscribe({ error: (responseError) => (error = responseError) });

    const request = http.expectOne(
      'http://localhost:8080/api/dashboard/comparison?year=2026&month=9',
    );
    request.flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(error).toMatchObject({ status: 503 });
  });

  it('gets the six-point evolution for the selected period', () => {
    const response: DashboardEvolution = {
      startPeriod: '2026-04',
      endPeriod: '2026-09',
      points: Array.from({ length: 6 }, (_, index) => ({
        period: `2026-${String(index + 4).padStart(2, '0')}`,
        income: 0,
        expense: 0,
        investment: 0,
      })),
    };
    let actual: DashboardEvolution | undefined;

    service.getEvolution(2026, 9).subscribe((evolution) => (actual = evolution));

    const request = http.expectOne(
      'http://localhost:8080/api/dashboard/evolution?year=2026&month=9',
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);

    expect(actual).toEqual(response);
  });

  it('gets the typed expense distribution for the selected period', () => {
    const response: ExpenseDistribution = {
      period: '2026-09',
      totalExpense: 750,
      categories: [
        {
          categoryId: '11111111-1111-4111-8111-111111111111',
          categoryName: 'Mercado',
          amount: 600,
          percentage: 80,
        },
        { categoryId: null, categoryName: 'Sem categoria', amount: 150, percentage: 20 },
      ],
    };
    let actual: ExpenseDistribution | undefined;

    service.getExpenseDistribution(2026, 9).subscribe((distribution) => (actual = distribution));

    const request = http.expectOne(
      'http://localhost:8080/api/dashboard/expense-distribution?year=2026&month=9',
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);

    expect(actual).toEqual(response);
  });

  it('propagates expense distribution request errors', () => {
    let error: unknown;

    service
      .getExpenseDistribution(2026, 9)
      .subscribe({ error: (responseError) => (error = responseError) });

    const request = http.expectOne(
      'http://localhost:8080/api/dashboard/expense-distribution?year=2026&month=9',
    );
    request.flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(error).toMatchObject({ status: 503 });
  });
});
