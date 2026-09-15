import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../app.config';
import { AccountListComponent } from './account-list.component';
import { FinancialAccount } from './financial-account';

describe('Accounts route', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let component: AccountListComponent;
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
    component = await harness.navigateByUrl('/accounts', AccountListComponent);
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

  describe('manual creation', () => {
    beforeEach(() => {
      http.expectOne('http://localhost:8080/api/accounts').flush([account]);
      harness.detectChanges();
    });

    it('blocks empty, whitespace and overlong names and missing balances', () => {
      const button =
        harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      expect(button.disabled).toBe(true);
      for (const name of ['', '   ', 'a'.repeat(81)]) {
        component.form.setValue({ name, type: 'CHECKING', initialBalance: 0 });
        harness.detectChanges();
        expect(button.disabled).toBe(true);
        component.submit();
      }
      component.form.setValue({ name: 'Conta', type: 'CHECKING', initialBalance: null });
      component.submit();
      expect(component.form.invalid).toBe(true);
      http.expectNone('http://localhost:8080/api/accounts');
    });

    it.each([0, -1500.25])(
      'posts only manual fields with balance %s and appends the response',
      (initialBalance) => {
        component.form.setValue({ name: '  Nubank  ', type: 'CHECKING', initialBalance });
        harness.detectChanges();
        harness
          .routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!
          .click();
        const request = http.expectOne('http://localhost:8080/api/accounts');
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ name: 'Nubank', type: 'CHECKING', initialBalance });
        const created = { ...account, id: 'new', name: 'Nubank', initialBalance };
        request.flush(created);
        harness.detectChanges();
        expect(component.accounts()).toEqual([account, created]);
        expect(harness.routeNativeElement!.querySelectorAll('tbody tr')).toHaveLength(2);
        expect(harness.routeNativeElement!.querySelector('tbody')!.textContent).toContain('Nubank');
        expect(component.form.getRawValue()).toEqual({
          name: '',
          type: 'CHECKING',
          initialBalance: null,
        });
        http.expectNone('http://localhost:8080/api/accounts');
      },
    );

    it('prevents duplicate submissions while saving', () => {
      component.form.setValue({ name: 'Conta', type: 'CASH', initialBalance: 0 });
      component.submit();
      component.submit();
      harness.detectChanges();
      expect(
        harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!
          .disabled,
      ).toBe(true);
      expect(harness.routeNativeElement!.textContent).toContain('Salvando…');
      http.expectOne('http://localhost:8080/api/accounts').flush(account);
      expect(component.saving()).toBe(false);
    });

    it.each([409, 500])('keeps form data after error %s', (status) => {
      const value = { name: 'Conta', type: 'CASH' as const, initialBalance: -10 };
      component.form.setValue(value);
      component.submit();
      http
        .expectOne('http://localhost:8080/api/accounts')
        .flush(null, { status, statusText: 'Error' });
      harness.detectChanges();
      expect(component.form.getRawValue()).toEqual(value);
      expect(component.accounts()).toEqual([account]);
      expect(component.saving()).toBe(false);
      expect(harness.routeNativeElement!.querySelector('[role="alert"]')!.textContent).toContain(
        status === 409
          ? 'Já existe uma conta ativa com esse nome'
          : 'Não foi possível cadastrar a conta.',
      );
      expect(
        harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!
          .disabled,
      ).toBe(false);
    });
  });
});
