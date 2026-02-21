import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pure pipe for consistent INR currency formatting across all billing views.
 * Replaces repeated currencyFmt() function calls in templates, eliminating
 * redundant computation on every change-detection cycle.
 */
@Pipe({ name: 'billingCurrency', standalone: true, pure: true })
export class BillingCurrencyPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  });

  transform(value: number | string | null | undefined): string {
    return this.formatter.format(Number(value) || 0);
  }
}
