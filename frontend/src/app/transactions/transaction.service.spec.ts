import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  it('patches the account endpoint to assign and remove an account', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TransactionService);
    const http = TestBed.inject(HttpTestingController);

    for (const accountId of ['account-id', null]) {
      const response = { id: 'transaction-id', account: accountId ? { id: accountId } : null };
      service.updateAccount('transaction-id', accountId).subscribe((saved) => {
        expect(saved).toEqual(response);
      });
      const request = http.expectOne(
        'http://localhost:8080/api/transactions/transaction-id/account',
      );
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ accountId });
      request.flush(response);
    }
    http.verify();
  });
});
