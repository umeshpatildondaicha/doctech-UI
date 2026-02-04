import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, filter } from 'rxjs';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { AppButtonComponent } from "@lk/core";
import { AppInputComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { Patient } from '../../interfaces/patient.interface';
import { PatientService } from '../../services/patient.service';
import { DialogRef } from '@angular/cdk/dialog';

export type DialogMode = 'create' | 'edit' | 'view';

export interface DialogData {
  patient?: Patient;
  mode: DialogMode;
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
    IconComponent
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

  dialogRef = inject(MatDialogRef<PatientCreateComponent>);
  data = inject<DialogData>(DIALOG_DATA_TOKEN);

  constructor(
    private fb: FormBuilder,
    private patientService:PatientService,
    private dialogRefs :DialogRef
  ) {
    this.mode = this.data?.mode || 'create';
    this.submitButtonText = this.getsubmitButtonText();
    
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      dateOfBirth: ['', Validators.required],
      gender: ['FEMALE', Validators.required],     // 🔥 default backend-compatible
      contact: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],         // 🔥 REQUIRED
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],              // 🔥 REQUIRED
      bloodGroup: ['A_POSITIVE', Validators.required] // 🔥 backend enum
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

  ngOnInit() {
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'submit' || result?.action === 'cancel')
    ).subscribe((result) => {
  
      if (result?.action === 'cancel') {
        return;
      }
  
      if (result?.action === 'submit') {
  
        if (this.isViewMode) {
          this.dialogRef.close();
          return;
        }
  
        if (!this.patientForm.valid) {
          this.markFormGroupTouched();
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
          return;
        }
  
        // 🔥 ONLY SWAGGER-COMPATIBLE PAYLOAD
        const payload = {
          firstName: this.patientForm.value.firstName,
          lastName: this.patientForm.value.lastName,
          dateOfBirth: this.patientForm.value.dateOfBirth,
          gender: this.patientForm.value.gender,      // e.g. FEMALE
          contact: this.patientForm.value.contact,
          email: this.patientForm.value.email,
          password: this.patientForm.value.password,  // MUST
          address: this.patientForm.value.address,
          city: this.patientForm.value.city,
          bloodGroup: this.patientForm.value.bloodGroup // e.g. A_POSITIVE
        };
  
        console.log('🟢 Dialog payload 👉', payload);
  
        setTimeout(() => {
          this.dialogRef.close(payload);
        }, 0);
      }
    });
  }
  

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    debugger;

    if (this.mode === 'view') {
      this.dialogRef.close();
      return;
    }
  
    if (this.patientForm.invalid) {
      this.markFormGroupTouched();
      return;
    }
  
    // 🔥 EXACT SWAGGER PAYLOAD
    const payload = {
      firstName: this.patientForm.value.firstName,
      lastName: this.patientForm.value.lastName,
      dateOfBirth: this.patientForm.value.dateOfBirth,
      gender: this.patientForm.value.gender || 'FEMALE',
      contact: this.patientForm.value.contact,
      email: this.patientForm.value.email,
      password: this.patientForm.value.password, // MUST
      address: this.patientForm.value.address,
      city: this.patientForm.value.city,
      bloodGroup: this.patientForm.value.bloodGroup || 'A_POSITIVE'
    };
  
    console.log('🟢 Dialog payload 👉', payload);
    console.log(this.patientForm.value);

    this.dialogRef.close(payload);
  }
  

  generatePatientId(): string {
    return 'D' + Date.now().toString().slice(-6);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onEdit() {
    // Enable form for editing
    this.mode = 'edit';
    this.patientForm.enable();
  }

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