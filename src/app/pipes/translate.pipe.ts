import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MultilingualService } from '../services/multilingual.service';
import { Subscription } from 'rxjs';

/**
 * Translates a message key to the current language's label.
 * Uses MultilingualService; falls back to the key if no translation exists.
 * Impure so that language changes trigger re-render.
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription: Subscription | null = null;
  private lastKey: string | null = null;
  private lastLang: string | null = null;
  private cachedValue: string | null = null;

  constructor(
    private readonly multilingual: MultilingualService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.subscription = this.multilingual.activeLanguage$.subscribe((lang) => {
      if (this.lastLang !== lang) {
        this.lastLang = lang;
        this.cachedValue = null;
        this.cdr.markForCheck();
      }
    });
  }

  transform(key: string | null | undefined, fallback?: string): string {
    if (key == null || key === '') {
      return fallback ?? '';
    }
    const lang = this.multilingual.activeLanguage;
    if (this.lastKey === key && this.lastLang === lang && this.cachedValue !== null) {
      return this.cachedValue;
    }
    this.lastKey = key;
    this.lastLang = lang;
    const value = this.multilingual.getLabel(key);
    this.cachedValue = value === key && fallback != null ? fallback : value;
    return this.cachedValue;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
