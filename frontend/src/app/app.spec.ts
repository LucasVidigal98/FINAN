import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withDisabledInitialNavigation()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    expect(compiled.querySelector('aside nav[aria-label="Navegação principal"]')).not.toBeNull();
    expect(compiled.querySelectorAll('aside nav a')).toHaveLength(6);
    expect(compiled.querySelector('nav a[href="/accounts"]')?.textContent).toContain('Contas');
    expect(compiled.querySelector('nav a[href="/open-finance"]')?.textContent).toContain(
      'Open Finance',
    );
  });

  it('navigates the Open Finance link to its page', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/open-finance');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-open-finance-page')).not.toBeNull();
  });
});
