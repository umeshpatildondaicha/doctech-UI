import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent, AppButtonComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface PrescriptionDialogData {
  patientId: string;
  patientName: string;
}

@Component({
    selector: 'app-prescription-dialog',
    imports: [
    ReactiveFormsModule,
    AppInputComponent,
    AppSelectboxComponent,
    AppButtonComponent
],
    templateUrl: './prescription-dialog.component.html',
    styleUrls: ['./prescription-dialog.component.scss']
})
export class PrescriptionDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<PrescriptionDialogComponent>);
  data = inject<PrescriptionDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  prescriptionForm!: FormGroup;

  frequencyOptions = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 
    'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'As needed', 
    'Before meals', 'After meals'
  ];

  routeOptions = [
    'Oral', 'IV', 'IM', 'Subcutaneous', 'Topical', 'Inhalation', 
    'Rectal', 'Ophthalmic', 'Otic', 'Nasal'
  ];

  constructor() {
    this.prescriptionForm = this.fb.group({
      medicineName: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      route: ['', Validators.required],
      duration: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      instructions: [''],
      isSubstitutable: [false],
      diagnosis: ['', Validators.required],
      notes: [''],
      followUpDate: ['']
    });
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'prescribe' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'prescribe') {
        if (this.prescriptionForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'prescribe',
              formData: this.prescriptionForm.value
            });
          }, 0);
        } else {
          // Prevent close if form is invalid
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

