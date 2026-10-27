import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  isDevMode,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PluggyConnect } from 'pluggy-connect-sdk';
import { OpenFinanceService } from './open-finance.service';

type ConnectionState = 'idle' | 'requesting' | 'active' | 'closing';
type Result = 'success' | 'closed' | 'error';

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
  private widget: PluggyConnect | null = null;
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
        next: (response) => {
          if (!this.isCurrentAttempt(attempt)) return;
          const token = response?.connectToken;
          if (typeof token !== 'string' || token.trim().length === 0) {
            this.finish(attempt, 'error');
            return;
          }
          this.openWidget(attempt, token);
        },
        error: () => this.finish(attempt, 'error'),
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.activeAttempt = null;
    const widget = this.widget;
    this.widget = null;
    if (widget) {
      try {
        void widget.destroy().then(undefined, () => undefined);
      } catch {
        // The route is leaving; remote teardown errors cannot be shown here.
      }
    }
  }

  private openWidget(attempt: number, token: string): void {
    try {
      const widget = new PluggyConnect({
        connectToken: token,
        includeSandbox: isDevMode(),
        allowConnectInBackground: false,
        language: 'pt',
        theme: 'dark',
        onSuccess: () => this.finish(attempt, 'success'),
        onError: () => this.finish(attempt, 'error'),
        onClose: () => this.finish(attempt, 'closed'),
      });
      this.widget = widget;
      this.state.set('active');
      try {
        void widget.init().then(undefined, () => this.finish(attempt, 'error'));
      } catch {
        this.finish(attempt, 'error');
      }
    } catch {
      this.finish(attempt, 'error');
    }
  }

  private finish(attempt: number, result: Result): void {
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

    const widget = this.widget;
    this.widget = null;
    this.state.set(widget ? 'closing' : 'idle');
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
    if (!widget) {
      release();
      return;
    }
    try {
      void widget.destroy().then(release, release);
    } catch {
      release();
    }
  }

  private isCurrentAttempt(attempt: number): boolean {
    return !this.destroyed && this.activeAttempt === attempt;
  }
}
