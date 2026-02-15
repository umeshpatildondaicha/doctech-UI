import { Component, OnInit, OnDestroy, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import {
  AppInputComponent,
  AppSelectboxComponent,
  AppButtonComponent,
  IconComponent
} from '@lk/core';
import { BaseConfiguration } from '../../../../services/base-configuration.service';

export interface BaseConfigFormData {
  config?: BaseConfiguration;
  isEditMode: boolean;
  isViewMode: boolean;
  onSave?: (formData: BaseConfiguration) => void;
}

@Component({
  selector: 'app-base-configuration-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppSelectboxComponent,
    AppButtonComponent,
    IconComponent
  ],
  templateUrl: './base-configuration-form.component.html',
  styleUrl: './base-configuration-form.component.scss'
})
export class BaseConfigurationFormComponent implements OnInit, OnDestroy {
  configForm!: FormGroup;
  isEditMode = false;
  isViewMode = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<BaseConfigurationFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData: { componentData?: BaseConfigFormData } | null
  ) {}

  ngOnInit(): void {
    this.initForm();
    const data = this.dialogData?.componentData;
    if (data?.config && data?.isEditMode) {
      this.isEditMode = true;
      this.populateForm(data.config);
    }
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter((r: any) => r?.action === 'save')
    ).subscribe(() => {
      const formData = this.getFormValue();
      if (formData) {
        data?.onSave?.(formData);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.configForm = this.fb.group({
      id: [null],
      configKey: ['', [Validators.required, Validators.maxLength(255)]],
      configValue: ['', [Validators.required]],
      configTag: ['', [Validators.required, Validators.maxLength(255)]],
      applicationName: ['', [Validators.required, Validators.maxLength(255)]],
      customerId: [null, [Validators.required, Validators.min(1)]]
    });
  }

  /**
   * Populate form with existing data for edit/view mode
   */
  populateForm(config: BaseConfiguration): void {
    this.configForm.patchValue({
      id: config.id,
      configKey: config.configKey,
      configValue: config.configValue,
      configTag: config.configTag,
      applicationName: config.applicationName,
      customerId: config.customerId
    });
  }

  /**
   * Set view mode - disables all form controls
   */
  setViewMode(): void {
    this.isViewMode = true;
    this.configForm.disable();
  }

  /**
   * Set edit mode
   */
  setEditMode(): void {
    this.isEditMode = true;
    this.isViewMode = false;
    this.configForm.enable();
  }

  /**
   * Get form value
   */
  getFormValue(): BaseConfiguration | null {
    if (this.configForm.valid) {
      return this.configForm.getRawValue();
    }
    this.configForm.markAllAsTouched();
    return null;
  }

  /**
   * Check if a field has an error
   */
  hasError(fieldName: string): boolean {
    const control = this.configForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.configForm.get(fieldName);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (control.errors['maxlength']) return `${this.getFieldLabel(fieldName)} is too long`;
    if (control.errors['min']) return `${this.getFieldLabel(fieldName)} must be at least 1`;
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      configKey: 'Config Key',
      configValue: 'Config Value',
      configTag: 'Config Tag',
      applicationName: 'Application Name',
      customerId: 'Customer ID'
    };
    return labels[fieldName] || fieldName;
  }
}
