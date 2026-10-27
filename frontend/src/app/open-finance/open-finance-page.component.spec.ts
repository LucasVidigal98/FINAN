import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { PluggyConnectProps } from 'pluggy-connect-sdk';
import { OpenFinancePageComponent } from './open-finance-page.component';

type MockWidget = {
  props: unknown;
  init: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

const sdk = vi.hoisted(() => ({
  instances: [] as MockWidget[],
  constructor: vi.fn(),
}));

vi.mock('pluggy-connect-sdk', () => ({ PluggyConnect: sdk.constructor }));

const connectTokenUrl = 'http://localhost:8080/api/open-finance/connect-token';

describe('OpenFinancePageComponent', () => {
  let fixture: ComponentFixture<OpenFinancePageComponent>;
  let component: OpenFinancePageComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    sdk.instances.length = 0;
    sdk.constructor.mockReset();
    sdk.constructor.mockImplementation(function (props: unknown) {
      const instance: MockWidget = {
        props,
        init: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      sdk.instances.push(instance);
      return instance;
    });

    await TestBed.configureTestingModule({
      imports: [OpenFinancePageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OpenFinancePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify({ ignoreCancelled: true });
  });

  function widgetAt(index = 0): MockWidget & { props: PluggyConnectProps } {
    return sdk.instances[index] as MockWidget & { props: PluggyConnectProps };
  }

  function respondWithToken(token = 'fake-connect-token'): void {
    http.expectOne(connectTokenUrl).flush({ connectToken: token });
    fixture.detectChanges();
  }

  it('blocks duplicate requests and opens one widget with the fresh token', () => {
    component.connect();
    component.connect();
    fixture.detectChanges();

    expect(component.state()).toBe('requesting');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Preparando conexão…',
    );
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    http.expectOne(connectTokenUrl).flush({ connectToken: 'fake-connect-token' });
    fixture.detectChanges();

    expect(sdk.constructor).toHaveBeenCalledTimes(1);
    expect(widgetAt().props.connectToken).toBe('fake-connect-token');
    expect(widgetAt().props.language).toBe('pt');
    expect(widgetAt().props.theme).toBe('dark');
    expect(widgetAt().props.allowConnectInBackground).toBe(false);
    expect(widgetAt().props.includeSandbox).toBe(true);
    expect(widgetAt().init).toHaveBeenCalledTimes(1);
    expect(component.state()).toBe('active');
  });

  it('shows success after closing and returns focus after SDK cleanup', async () => {
    component.connect();
    respondWithToken();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    widgetAt().props.onSuccess?.({ item: null as never });
    widgetAt().props.onClose?.();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(widgetAt().destroy).toHaveBeenCalledTimes(1);
    expect(component.message()).toBe(
      'Conexão realizada com sucesso. A importação de contas e transações estará disponível em uma próxima etapa.',
    );
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      component.message(),
    );
    expect(component.state()).toBe('idle');
    expect(document.activeElement).toBe(button);
  });

  it('shows the close message and requests a new token for a retry', async () => {
    component.connect();
    respondWithToken('fake-first-token');
    widgetAt().props.onClose?.();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.message()).toBe('Janela de conexão encerrada. Você pode tentar novamente.');
    component.connect();
    http.expectOne(connectTokenUrl).flush({ connectToken: 'fake-second-token' });
    fixture.detectChanges();

    expect(sdk.constructor).toHaveBeenCalledTimes(2);
    expect(widgetAt(1).props.connectToken).toBe('fake-second-token');
  });

  it('sanitizes widget errors and ignores a close callback after the error', () => {
    component.connect();
    respondWithToken();
    widgetAt().props.onError?.({ message: 'remote-secret-message' });
    widgetAt().props.onClose?.();
    fixture.detectChanges();

    expect(component.message()).toBe('Não foi possível concluir a conexão. Tente novamente.');
    expect(component.messageRole()).toBe('alert');
    expect(fixture.nativeElement.textContent).not.toContain('remote-secret-message');
  });

  it('rejects empty and malformed token responses without opening the widget', () => {
    for (const response of [{ connectToken: '   ' }, {}]) {
      component.connect();
      http.expectOne(connectTokenUrl).flush(response);
      fixture.detectChanges();

      expect(sdk.constructor).not.toHaveBeenCalled();
      expect(component.message()).toBe('Não foi possível concluir a conexão. Tente novamente.');
    }
  });

  it('sanitizes token and widget initialization failures', async () => {
    component.connect();
    http
      .expectOne(connectTokenUrl)
      .flush(null, { status: 502, statusText: 'secret backend error' });
    fixture.detectChanges();

    expect(component.message()).toBe('Não foi possível concluir a conexão. Tente novamente.');
    expect(fixture.nativeElement.textContent).not.toContain('secret backend error');

    sdk.constructor.mockImplementationOnce(function (props: unknown) {
      const instance: MockWidget = {
        props,
        init: vi.fn().mockRejectedValue(new Error('secret SDK failure')),
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      sdk.instances.push(instance);
      return instance;
    });
    component.connect();
    respondWithToken();
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.message()).toBe('Não foi possível concluir a conexão. Tente novamente.');
    expect(fixture.nativeElement.textContent).not.toContain('secret SDK failure');
  });

  it('sanitizes widget construction failures and allows a new attempt', () => {
    sdk.constructor.mockImplementationOnce(function () {
      throw new Error('secret SDK construction failure');
    });
    component.connect();
    respondWithToken('fake-failed-construction-token');

    expect(component.message()).toBe('Não foi possível concluir a conexão. Tente novamente.');
    expect(fixture.nativeElement.textContent).not.toContain('secret SDK construction failure');
    component.connect();
    respondWithToken('fake-retry-token');

    expect(widgetAt().props.connectToken).toBe('fake-retry-token');
    expect(sdk.constructor).toHaveBeenCalledTimes(2);
  });

  it('keeps the action disabled until asynchronous widget destruction settles', async () => {
    component.connect();
    respondWithToken();
    let finishDestroy!: () => void;
    widgetAt().destroy.mockImplementation(
      () => new Promise<void>((resolve) => (finishDestroy = resolve)),
    );
    widgetAt().props.onClose?.();
    fixture.detectChanges();

    expect(component.state()).toBe('closing');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    component.connect();
    http.expectNone(connectTokenUrl);

    finishDestroy();
    await Promise.resolve();
    fixture.detectChanges();
    expect(component.state()).toBe('idle');
    component.connect();
    http.expectOne(connectTokenUrl);
  });

  it('releases the widget and allows a retry when asynchronous destruction rejects', async () => {
    component.connect();
    respondWithToken();
    widgetAt().destroy.mockRejectedValue(new Error('secret SDK cleanup failure'));
    widgetAt().props.onClose?.();
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.state()).toBe('idle');
    expect(component.message()).toBe('Janela de conexão encerrada. Você pode tentar novamente.');
    expect(fixture.nativeElement.textContent).not.toContain('secret SDK cleanup failure');
    component.connect();
    respondWithToken('fake-after-cleanup-error-token');

    expect(widgetAt(1).props.connectToken).toBe('fake-after-cleanup-error-token');
  });

  it('ignores callbacks from an earlier widget after a retry starts', async () => {
    component.connect();
    respondWithToken('fake-first-token');
    const oldWidget = widgetAt();
    oldWidget.props.onClose?.();
    await Promise.resolve();
    fixture.detectChanges();

    component.connect();
    respondWithToken('fake-second-token');
    oldWidget.props.onSuccess?.({ item: null as never });
    oldWidget.props.onClose?.();
    fixture.detectChanges();

    expect(component.state()).toBe('active');
    expect(component.message()).toBe('');
    expect(widgetAt(1).props.connectToken).toBe('fake-second-token');
    expect(widgetAt(1).destroy).not.toHaveBeenCalled();
  });

  it('cancels a token request and releases the widget when the page is destroyed', () => {
    component.connect();
    const request = http.expectOne(connectTokenUrl);
    fixture.destroy();
    expect(request.cancelled).toBe(true);
    expect(sdk.constructor).not.toHaveBeenCalled();

    fixture = TestBed.createComponent(OpenFinancePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.connect();
    respondWithToken();
    const oldWidget = widgetAt();
    fixture.destroy();

    expect(oldWidget.destroy).toHaveBeenCalledTimes(1);
    oldWidget.props.onSuccess?.({ item: null as never });
    expect(component.message()).toBe('');
  });
});
