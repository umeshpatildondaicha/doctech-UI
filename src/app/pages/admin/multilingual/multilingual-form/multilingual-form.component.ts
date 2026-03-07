import { Component, OnInit, OnDestroy, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AppInputComponent, AppSelectboxComponent, AppButtonComponent, IconComponent } from '@lk/core';
import { MultiLingualConfiguration, SUPPORTED_LANGUAGES } from '../../../../services/multilingual.service';

export interface MultiLingualFormData {
  entry?: MultiLingualConfiguration;
  isEditMode: boolean;
  isViewMode: boolean;
  defaultLanguage?: string;
  onSave?: (formData: MultiLingualConfiguration) => void;
}

@Component({
  selector: 'app-multilingual-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppInputComponent, AppSelectboxComponent, AppButtonComponent, IconComponent],
  templateUrl: './multilingual-form.component.html',
  styleUrl: './multilingual-form.component.scss',
})
export class MultilingualFormComponent implements OnInit, OnDestroy {
  entryForm!: FormGroup;
  isEditMode = false;
  isViewMode = false;
  private readonly destroy$ = new Subject<void>();

  languageOptions = SUPPORTED_LANGUAGES.map((l) => ({ label: `${l.flag} ${l.label}`, value: l.code }));

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<MultilingualFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData: { componentData?: MultiLingualFormData } | null
  ) {}

  ngOnInit(): void {
    this.initForm();
    const data = this.dialogData?.componentData;
    if (data?.entry) {
      this.isEditMode = data.isEditMode;
      this.isViewMode = data.isViewMode;
      this.populateForm(data.entry);
      if (data.isViewMode) this.entryForm.disable();
    }
    if (data?.defaultLanguage && !data.entry) {
      this.entryForm.get('languageType')?.setValue(data.defaultLanguage);
    }
    this.dialogRef.beforeClosed()
      .pipe(takeUntil(this.destroy$), filter((r: any) => r?.action === 'save'))
      .subscribe(() => {
        const formData = this.getFormValue();
        if (formData) data?.onSave?.(formData);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.entryForm = this.fb.group({
      id: [null],
      lingualKey: ['', [Validators.required, Validators.maxLength(400), Validators.pattern(/^[A-Z0-9_.]+$/)]],
      defaultValue: [''],
      value: ['', [Validators.required, Validators.maxLength(1500)]],
      languageType: ['en', [Validators.required]],
      category: ['', [Validators.maxLength(200)]],
      appName: ['DocTech', [Validators.required, Validators.maxLength(50)]],
    });
  }

  populateForm(entry: MultiLingualConfiguration): void {
    this.entryForm.patchValue({
      id: entry.id,
      lingualKey: entry.lingualKey,
      defaultValue: entry.defaultValue ?? '',
      value: entry.value,
      languageType: entry.languageType,
      category: entry.category ?? '',
      appName: entry.appName,
    });
  }

  setViewMode(): void {
    this.isViewMode = true;
    this.entryForm.disable();
  }

  setEditMode(): void {
    this.isEditMode = true;
    this.isViewMode = false;
    this.entryForm.enable();
  }

  getFormValue(): MultiLingualConfiguration | null {
    if (this.entryForm.valid) return this.entryForm.getRawValue();
    this.entryForm.markAllAsTouched();
    return null;
  }

  hasError(field: string): boolean {
    const c = this.entryForm.get(field);
    return !!(c && c.invalid && c.touched);
  }

  getErrorMessage(field: string): string {
    const c = this.entryForm.get(field);
    if (!c?.errors) return '';
    if (c.errors['required']) return `${this.getFieldLabel(field)} is required`;
    if (c.errors['maxlength']) return `${this.getFieldLabel(field)} is too long`;
    if (c.errors['pattern']) return 'Use UPPER_SNAKE_CASE format only (A-Z, 0-9, _ or .)';
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      lingualKey: 'Message Key',
      value: 'Translation',
      languageType: 'Language',
      category: 'Category',
      appName: 'App Name',
      defaultValue: 'Default Value',
    };
    return labels[field] ?? field;
  }
}
