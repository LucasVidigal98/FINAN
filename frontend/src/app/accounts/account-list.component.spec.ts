import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../app.config';
import { AccountListComponent } from './account-list.component';
import { FinancialAccount } from './financial-account';

describe('Accounts route', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  const account: FinancialAccount = {
    id: '1',
    name: 'Conta principal',
    type: 'CHECKING',
    source: 'MANUAL',
    initialBalance: 1234.56,
    providerBalance: null,
    active: true,
    lastSyncedAt: null,
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-09-10T12:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/accounts', AccountListComponent);
  });

  afterEach(() => http.verify());

  it('requests accounts and renders their fields and BRL balances', () => {
    expect(harness.routeNativeElement?.textContent).toContain('Carregando contas...');
    const request = http.expectOne('http://localhost:8080/api/accounts');
    expect(request.request.method).toBe('GET');
    request.flush([
      account,
      {
        ...account,
        id: '2',
        name: 'Reserva',
        type: 'SAVINGS',
        source: 'PLUGGY',
        providerBalance: 0,
      },
      { ...account, id: '3', name: 'Carteira', type: 'CASH', initialBalance: -12.5 },
      { ...account, id: '4', name: 'Corretora', type: 'INVESTMENT', providerBalance: 2500.75 },
      { ...account, id: '5', name: 'Sem saldo', source: 'PLUGGY', initialBalance: null },
    ]);
    harness.detectChanges();

    const rows = Array.from(harness.routeNativeElement!.querySelectorAll('tbody tr')).map((row) =>
      Array.from(row.querySelectorAll('td'))
        .map((cell) => cell.textContent!.replace(/\s+/g, ' ').trim())
        .join(' '),
    );
    expect(rows).toEqual([
      'Conta principal Conta corrente Manual R$ 1.234,56',
      'Reserva Poupança Pluggy R$ 0,00',
      'Carteira Dinheiro Manual -R$ 12,50',
      'Corretora Investimento Manual R$ 2.500,75',
      'Sem saldo Conta corrente Pluggy Não informado',
    ]);
  });

  it('renders an empty list', () => {
    http.expectOne('http://localhost:8080/api/accounts').flush([]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Nenhuma conta cadastrada.');
  });

  it('allows retrying a failed request', () => {
    http.expectOne('http://localhost:8080/api/accounts').flush(null, {
      status: 500,
      statusText: 'Server error',
    });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar as contas.',
    );
    harness.routeNativeElement!.querySelector('button')!.click();
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Carregando contas...');
    http.expectOne('http://localhost:8080/api/accounts').flush([account]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Conta principal');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
  });
});
