import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardComparison } from './dashboard-comparison.model';
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
        balance: { current: 5500, previous: 4000, absoluteChange: 1500, percentageChange: 37.5 },
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
});
