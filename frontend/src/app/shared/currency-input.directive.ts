import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[currencyInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputDirective),
      multi: true,
    },
  ],
})
export class CurrencyInputDirective implements ControlValueAccessor {
  private readonly input = inject(ElementRef<HTMLInputElement>).nativeElement;
  private onChange: (value: number | null) => void = () => {};
  private onTouched = () => {};

  writeValue(value: number | null): void {
    this.input.value = value === null ? '' : this.format(value);
  }

  registerOnChange(onChange: (value: number | null) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.input.disabled = disabled;
  }

  @HostListener('input')
  onInput(): void {
    const rawValue = this.input.value;
    if (!rawValue) {
      this.onChange(null);
      return;
    }

    const cents = Number(rawValue.replace(/\D/g, '')) / 100;
    const value = rawValue.includes('-') ? -cents : cents;
    this.input.value = this.format(value);
    this.onChange(value);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private format(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
