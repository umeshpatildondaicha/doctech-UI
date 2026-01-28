import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent, AppButtonComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface MedicineRequestDialogData {
  patientId: string;
  patientName: string;
}

@Component({
    selector: 'app-medicine-request-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AppInputComponent,
        AppSelectboxComponent,
        AppButtonComponent
    ],
    templateUrl: './medicine-request-dialog.component.html',
    styleUrls: ['./medicine-request-dialog.component.scss']
})
export class MedicineRequestDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<MedicineRequestDialogComponent>);
  data = inject<MedicineRequestDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  medicineRequestForm!: FormGroup;

  routeOptions = ['Oral', 'IV', 'IM', 'Topical', 'Inhalation'];
  urgencyOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  constructor() {
    this.medicineRequestForm = this.fb.group({
      requestedBy: ['Patient', Validators.required],
      requestedByRole: ['PATIENT', Validators.required],
      medicineName: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      route: ['', Validators.required],
      quantity: ['', Validators.required],
      urgency: ['MEDIUM', Validators.required],
      reason: ['', Validators.required],
      currentSymptoms: [''],
      notes: [''],
      isPrescriptionRequired: [true]
    });
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'submit' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'submit') {
        if (this.medicineRequestForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'submit',
              formData: this.medicineRequestForm.value
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

