import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Doctor } from '../../interfaces/doctor.interface';
import { AppInputComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CheckboxComponent } from "@lk/core";
import { Mode } from '../../types/mode.type';

@Component({
    selector: 'app-doctor-create',
    templateUrl: './doctor-create.component.html',
    styleUrl: './doctor-create.component.scss',
    imports: [
        AppInputComponent,
        AppButtonComponent,
        AppSelectboxComponent,
        IconComponent,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        CheckboxComponent
    ] // Add form controls, app-input, app-selectbox, app-button, etc. as needed
})
export class DoctorCreateComponent {
  doctorForm: FormGroup;
  mode: Mode = 'create';
  submitButtonText: string = 'Create Doctor';
  doctorStatusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Retired', label: 'Retired' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DoctorCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: Mode, doctor?: Doctor }
  ) {
    this.mode = data?.mode || 'create';
    this.submitButtonText = this.getSubmitButtonText();
    this.doctorForm = this.fb.group({
      firstName: [data?.doctor?.firstName || '', Validators.required],
      lastName: [data?.doctor?.lastName || '', Validators.required],
      registrationNumber: [data?.doctor?.registrationNumber || '', Validators.required],
      hospitalId: [data?.doctor?.hospitalId || '', Validators.required],
      specialization: [data?.doctor?.specialization || '', Validators.required],
      globalNumber: [data?.doctor?.globalNumber || '', Validators.required],
      persanalNumber: [data?.doctor?.persanalNumber || '', Validators.required],
      email: [data?.doctor?.email || '', [Validators.required, Validators.email]],
      qualifications: [data?.doctor?.qualifications || '', Validators.required],
      profileImageUrl: [data?.doctor?.profileImageUrl || ''],
      doctorStatus: [data?.doctor?.doctorStatus || 'Active', Validators.required],
      departmentId: [data?.doctor?.departmentId || '', Validators.required],
      isDeleted: [data?.doctor?.isDeleted || false]
    });
    if (this.isViewMode) {
      this.doctorForm.disable();
    }
  }

  get isViewMode() {
    return this.mode === 'view';
  }

  getSubmitButtonText(): string {
    switch (this.mode) {
      case 'create': return 'Create Doctor';
      case 'edit': return 'Update Doctor';
      case 'view': return 'Close';
      default: return 'Submit';
    }
  }

  onSubmit() {
    if (this.isViewMode) {
      this.dialogRef.close();
      return;
    }
    if (this.doctorForm.valid) {
      this.dialogRef.close(this.doctorForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 