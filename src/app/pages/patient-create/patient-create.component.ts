import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, filter } from 'rxjs';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogRef } from '@angular/cdk/dialog';
import { AppButtonComponent, SnackbarService } from "@lk/core";
import { AppInputComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { Patient } from '../../interfaces/patient.interface';
import { PatientService } from '../../services/patient.service';

export type DialogMode = 'create' | 'edit' | 'view';

/** Payload returned when form is submitted (create or edit). */
export interface PatientFormPayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contact: string;
  email: string;
  password: string;
  address: string;
  city: string;
  bloodGroup: string;
}

export interface DialogData {
  patient?: Patient;
  mode: DialogMode;
  /** When set, dialog calls this with payload and does not close; parent creates/updates and closes. */
  onSubmit?: (payload: PatientFormPayload, mode: DialogMode, patientId?: number) => void;
}

@Component({
    selector: 'app-patient-create',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectboxComponent,
    IconComponent,
],
    templateUrl: './patient-create.component.html',
    styleUrl: './patient-create.component.scss'
})
export class PatientCreateComponent implements OnInit, OnDestroy {
  patientForm: FormGroup;
  mode: DialogMode = 'create';
  submitButtonText: string = 'Create Patient';
  private destroy$ = new Subject<void>();

  bloodGroups = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  /** Stable title for AppSelectbox to avoid NG0100 (null -> '' change). */
  genderSelectTitle = 'Gender';
  /** Stable title for AppSelectbox to avoid NG0100 (null -> '' change). */
  bloodGroupSelectTitle = 'Blood Group';

  private matDialogRef = inject(MatDialogRef<PatientCreateComponent>, { optional: true });
  private cdkDialogRef = inject(DialogRef, { optional: true });
  private get dialogRef(): MatDialogRef<PatientCreateComponent> | DialogRef {
    return this.matDialogRef ?? this.cdkDialogRef!;
  }
  data = inject<DialogData>(DIALOG_DATA_TOKEN);

  constructor(private fb: FormBuilder,
     private patientService: PatientService,
     private snackbarservice: SnackbarService) {
    this.mode = this.data?.mode || 'create';
    this.submitButtonText = this.getsubmitButtonText();
    
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      dateOfBirth: ['', Validators.required],
      gender: ['female', Validators.required],     //  match genderOptions value; backend normalizes to FEMALE
      contact: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],         //  REQUIRED
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],              //  REQUIRED
      bloodGroup: ['A+', Validators.required]       //  match bloodGroups value; backend normalizes to A_POSITIVE
    });

    // If editing or viewing existing patient, populate form
    if (this.data?.patient) {
      this.patientForm.patchValue({
        firstName: this.data.patient.firstName,
        lastName: this.data.patient.lastName,
        dateOfBirth: this.data.patient.dateOfBirth,
        gender: this.data.patient.gender,
        contact: this.data.patient.contact,
        email: this.data.patient.email,
        address: this.data.patient.address,
        bloodGroup: this.data.patient.bloodGroup
      });

      // Disable form in view mode
      if (this.mode === 'view') {
        this.patientForm.disable();
      }
    }
  }
  modes!: 'create' | 'edit';
patientId!: number;

  ngOnInit() {
    this.interceptFooterActions();
    if (this.matDialogRef?.beforeClosed) {
      this.matDialogRef.beforeClosed().pipe(
        takeUntil(this.destroy$),
        filter((r: any) => r?.action === 'submit' || r?.action === 'cancel')
      ).subscribe((result: any) => {
        if (result?.action === 'cancel') return;
        if (result?.action === 'submit') this.handleFooterSubmit();
      });
    }
    if (this.data?.mode === 'edit' && this.data.patient) {
      this.mode = 'edit';
      this.patientId = this.data.patient.patientId as number;
      this.patientForm.patchValue(this.data.patient as { [key: string]: any });
      this.patientForm.enable();
    }
  }

  /**
   * Intercept footer "Create Patient" / "Save Changes" so we validate and close with
   * form payload instead of the dialog closing with only { action: 'submit' }.
   */
  private interceptFooterActions() {
    setTimeout(() => {
      try {
        const container = (this.dialogRef as any)._containerInstance;
        const overlayRef = container?._overlayRef;
        const componentRef = overlayRef?._componentRef;
        const dialogboxContent = componentRef?.instance;

        if (dialogboxContent && typeof dialogboxContent.onFooterAction === 'function') {
          const original = dialogboxContent.onFooterAction.bind(dialogboxContent);
          dialogboxContent.onFooterAction = (action: any) => {
            const actionId = action?.id || action;
            const text = (action?.text ?? actionId ?? '').toString().trim().toLowerCase();

            if (actionId === 'submit' || text.includes('create') || text.includes('save')) {
              this.handleFooterSubmit();
              return;
            }
            original(action);
          };
        } else {
          const overlayPane = (overlayRef as any)?._pane as HTMLElement | undefined;
          if (overlayPane) {
            const handler = (e: Event) => {
              const btn = (e.target as HTMLElement).closest('button');
              if (!btn) return;
              const btnText = btn.textContent?.trim().toLowerCase() ?? '';
              if (btnText.includes('create patient') || btnText.includes('save changes')) {
                e.preventDefault();
                e.stopPropagation();
                this.handleFooterSubmit();
              }
            };
            overlayPane.addEventListener('click', handler, true);
            this.destroy$.subscribe(() => overlayPane.removeEventListener('click', handler, true));
          }
        }
      } catch {
        // Intercept failed; beforeClosed() in ngOnInit will still try to close with payload
      }
    }, 200);
  }

  private handleFooterSubmit() {
    if (this.isViewMode) {
      this.dialogRef.close();
      return;
    }
    if (!this.patientForm.valid) {
      this.markFormGroupTouched();
      this.dialogRef.close(false);
      return;
    }
    const payload = this.buildPayload();
    if (this.data.onSubmit) {
      console.log('[PatientCreate] Calling parent onSubmit', this.mode, this.patientId);
      this.data.onSubmit(payload, this.mode, this.patientId);
    } else {
      console.log('[PatientCreate] No onSubmit callback, closing with payload');
      this.dialogRef.close(payload);
    }
  }
  

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.isViewMode) {
      this.dialogRef.close();
      return;
    }
    if (!this.patientForm.valid) {
      this.markFormGroupTouched();
      return;
    }
    this.dialogRef.close(this.buildPayload());
    this.snackbarservice.success('Patient Created Successfully');
  }

  private buildPayload(): PatientFormPayload {
    return {
      firstName: this.patientForm.value.firstName,
      lastName: this.patientForm.value.lastName,
      dateOfBirth: this.patientForm.value.dateOfBirth,
      gender: this.patientForm.value.gender || 'female',
      contact: String(this.patientForm.value.contact ?? ''),
      email: this.patientForm.value.email,
      password: this.patientForm.value.password,
      address: this.patientForm.value.address,
      city: this.patientForm.value.city,
      bloodGroup: this.patientForm.value.bloodGroup || 'A+'
    };

  }
  

  generatePatientId(): string {
    return 'D' + Date.now().toString().slice(-6);
  }

  onCancel() {
    this.dialogRef.close();
  }

  // onEdit() {
  //   // Enable form for editing
  
  // }

  private markFormGroupTouched() {
    Object.keys(this.patientForm.controls).forEach(key => {
      const control = this.patientForm.get(key);
      control?.markAsTouched();
    });
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  get isCreateMode(): boolean {
    return this.mode === 'create';
  }

  get dialogTitle(): string {
    switch (this.mode) {
      case 'create':
        return 'Create New Patient';
      case 'edit':
        return 'Edit Patient';
      case 'view':
        return 'View Patient';
      default:
        return 'Patient';
    }
  }

  getsubmitButtonText(): string {
    switch (this.mode) {
      case 'create':
        return 'Create Patient';
      case 'edit':
        return 'Update Patient';
      case 'view':
        return 'Close';
      default:
        return 'Save';
    }
  }

  get showEditButton(): boolean {
    return this.mode === 'edit';
  }

  getErrorMessage(fieldName: string): string {
    const control = this.patientForm.get(fieldName);
    if (control?.invalid && control?.touched) {
      switch (fieldName) {
        case 'firstName':
          return 'First name is required and must be at least 3 characters';
        case 'lastName':
          return 'Last name is required and must be at least 3 characters';
        case 'dateOfBirth':
          return 'Date of birth is required';
        case 'gender':
          return 'Gender is required';
        case 'contact':
          return 'Contact is required';
        case 'email':
          return 'Email is required';
        case 'address':
          return 'Address is required';
        case 'bloodGroup':
          return 'Blood group is required';
        default:
          return 'This field is required';
      }
    }
    return '';
  }
}