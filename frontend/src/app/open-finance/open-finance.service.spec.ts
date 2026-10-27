import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OpenFinanceService } from './open-finance.service';

describe('OpenFinanceService', () => {
  let http: HttpTestingController;
  let service: OpenFinanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(OpenFinanceService);
  });

  afterEach(() => http.verify());

  it('requests a fresh connect token with an empty POST body', () => {
    let response: unknown;
    service.createConnectToken().subscribe((value) => (response = value));

    const request = http.expectOne('http://localhost:8080/api/open-finance/connect-token');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({ connectToken: 'fake-connect-token' });

    expect(response).toEqual({ connectToken: 'fake-connect-token' });
  });
});
