import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConnectResult, OpenFinanceService } from './open-finance.service';

type ConnectionState = 'idle' | 'requesting' | 'active' | 'closing';

@Component({
  selector: 'app-open-finance-page',
  templateUrl: './open-finance-page.component.html',
  styleUrl: './open-finance-page.component.scss',
})
export class OpenFinancePageComponent implements OnDestroy {
  private readonly service = inject(OpenFinanceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private attemptSequence = 0;
  private activeAttempt: number | null = null;
  private destroyed = false;

  @ViewChild('connectButton') private connectButton?: ElementRef<HTMLButtonElement>;

  readonly state = signal<ConnectionState>('idle');
  readonly message = signal('');
  readonly messageRole = signal<'status' | 'alert'>('status');

  connect(): void {
    if (this.state() !== 'idle' || this.destroyed) return;

    const attempt = ++this.attemptSequence;
    this.activeAttempt = attempt;
    this.state.set('requesting');
    this.message.set('');

    this.service
      .createConnectToken()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (token) => {
          if (!this.isCurrentAttempt(attempt)) return;
          this.openWidget(attempt, token);
        },
        error: () => this.finish(attempt, 'error'),
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.activeAttempt = null;
    const cleanup = this.service.destroyConnectWidget();
    if (cleanup) void cleanup.then(undefined, () => undefined);
  }

  private openWidget(attempt: number, token: string): void {
    try {
      this.service.openConnectWidget(token, (result) => this.finish(attempt, result));
      this.state.set('active');
    } catch {
      this.finish(attempt, 'error');
    }
  }

  private finish(attempt: number, result: ConnectResult): void {
    if (!this.isCurrentAttempt(attempt)) return;
    this.activeAttempt = null;
    this.message.set(
      result === 'success'
        ? 'Conexão realizada com sucesso. A importação de contas e transações estará disponível em uma próxima etapa.'
        : result === 'closed'
          ? 'Janela de conexão encerrada. Você pode tentar novamente.'
          : 'Não foi possível concluir a conexão. Tente novamente.',
    );
    this.messageRole.set(result === 'error' ? 'alert' : 'status');

    const cleanup = this.service.destroyConnectWidget();
    this.state.set(cleanup ? 'closing' : 'idle');
    const release = () => {
      if (this.destroyed) return;
      this.state.set('idle');
      afterNextRender(
        () => {
          if (!this.destroyed) this.connectButton?.nativeElement.focus();
        },
        { injector: this.injector },
      );
    };
    if (!cleanup) {
      release();
      return;
    }
    void cleanup.then(release, release);
  }

  private isCurrentAttempt(attempt: number): boolean {
    return !this.destroyed && this.activeAttempt === attempt;
  }
}
