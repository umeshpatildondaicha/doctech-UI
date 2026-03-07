import { Component, OnInit, OnDestroy, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppInputComponent, AppSelectboxComponent, AppButtonComponent, IconComponent } from '@lk/core';
import { MultilingualService } from '../../../../services/multilingual.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

export interface CreateTranslationKeyDialogData {
  onCreated?: () => void;
}

const MODULE_OPTIONS = [
  { label: 'DocTech', value: 'DocTech' },
  { label: 'Platform', value: 'Platform' },
  { label: 'Authentication', value: 'Authentication' },
  { label: 'Patient', value: 'Patient' },
  { label: 'Appointment', value: 'Appointment' },
  { label: 'Billing', value: 'Billing' },
  { label: 'Hospital', value: 'Hospital' },
  { label: 'General', value: 'General' },
  { label: 'Other', value: 'Other' },
];

/** Languages to show in step 2: English (required) and Hindi */
const WIZARD_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', required: true, placeholder: 'Enter translation in English' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳', required: false, placeholder: 'Enter translation in Hindi' },
];

@Component({
  selector: 'app-create-translation-key-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppSelectboxComponent,
    AppButtonComponent,
    IconComponent,
    TranslatePipe,
  ],
  templateUrl: './create-translation-key-dialog.component.html',
  styleUrl: './create-translation-key-dialog.component.scss',
})
export class CreateTranslationKeyDialogComponent implements OnInit, OnDestroy {
  step: 1 | 2 = 1;
  keyInfoForm!: FormGroup;
  translationsForm!: FormGroup;
  readonly moduleOptions = MODULE_OPTIONS;
  readonly wizardLanguages = WIZARD_LANGUAGES;
  readonly appName = 'DocTech';
  isSubmitting = false;
  private readonly destroy$ = new Subject<void>();

  private readonly t = (key: string, fallback: string) => {
    const value = this.multilingualService.getLabel(key);
    return value !== key ? value : fallback;
  };

  constructor(
    private readonly fb: FormBuilder,
    public readonly dialogRef: MatDialogRef<CreateTranslationKeyDialogComponent>,
    private readonly multilingualService: MultilingualService,
    @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData: { componentData?: CreateTranslationKeyDialogData } | null
  ) {}

  ngOnInit(): void {
    this.keyInfoForm = this.fb.group({
      messageKey: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[A-Z0-9_.]+$/)]],
      moduleName: ['DocTech', [Validators.required]],
      description: [''],
    });
    this.keyInfoForm.get('moduleName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
      if (v != null && typeof v === 'object' && 'value' in v) {
        this.keyInfoForm.get('moduleName')?.setValue((v as { value: string }).value, { emitEvent: false });
      }
    });
    const translationControls: Record<string, unknown> = {};
    WIZARD_LANGUAGES.forEach((lang) => {
      translationControls[lang.code] = [lang.required ? ['', Validators.required] : ''];
    });
    this.translationsForm = this.fb.group(translationControls);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get completionPct(): number {
    return this.step === 1 ? 50 : 100;
  }

  next(): void {
    if (this.step !== 1 || this.keyInfoForm.invalid) {
      this.keyInfoForm.markAllAsTouched();
      return;
    }
    this.step = 2;
  }

  back(): void {
    this.step = 1;
  }

  submitCreate(): void {
    if (this.step !== 2) return;
    if (this.translationsForm.invalid) {
      this.translationsForm.markAllAsTouched();
      return;
    }
    const keyInfo = this.keyInfoForm.getRawValue();
    const translations: Record<string, string> = {};
    this.wizardLanguages.forEach((lang) => {
      const v = this.translationsForm.get(lang.code)?.value;
      if (v != null && String(v).trim() !== '') {
        translations[lang.code] = String(v).trim();
      }
    });
    if (Object.keys(translations).length === 0) {
      return;
    }
    if (!translations['en']) {
      this.translationsForm.get('en')?.setErrors({ required: true });
      this.translationsForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const moduleNameStr =
      keyInfo.moduleName == null
        ? null
        : typeof keyInfo.moduleName === 'string'
          ? keyInfo.moduleName
          : (keyInfo.moduleName as { value?: string })?.value ?? null;
    this.multilingualService
      .createTranslationKey({
        messageKey: keyInfo.messageKey.trim(),
        moduleName: moduleNameStr,
        description: keyInfo.description?.trim() || null,
        appName: this.appName,
        translations,
      })
      .subscribe({
        next: () => {
          this.dialogData?.componentData?.onCreated?.();
          this.dialogRef.close();
        },
        error: (err) => {
          console.error('Create translation key failed', err);
          this.isSubmitting = false;
        },
      });
  }

  hasError(form: FormGroup, controlName: string): boolean {
    const c = form.get(controlName);
    return !!(c && c.invalid && c.touched);
  }

  getKeyInfoError(field: string): string {
    const c = this.keyInfoForm.get(field);
    if (!c?.errors) return '';
    if (c.errors['required']) return this.t('COMMON_FIELD_REQUIRED', 'This field is required');
    if (c.errors['maxlength']) return this.t('COMMON_MAX_LENGTH', 'Maximum 100 characters');
    if (c.errors['pattern']) return this.t('COMMON_INVALID_INPUT', 'Use UPPER_SNAKE_CASE only (A-Z, 0-9, _ or .)');
    return '';
  }
}
