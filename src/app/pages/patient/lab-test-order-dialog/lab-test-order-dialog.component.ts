import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface LabTestOrderDialogData {
  patientId: string;
  patientName: string;
  testCategories?: string[];
}

@Component({
    selector: 'app-lab-test-order-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AppInputComponent,
        AppSelectboxComponent
    ],
    templateUrl: './lab-test-order-dialog.component.html',
    styleUrls: ['./lab-test-order-dialog.component.scss']
})
export class LabTestOrderDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<LabTestOrderDialogComponent>);
  data = inject<LabTestOrderDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  labTestOrderForm!: FormGroup;

  testCategories: string[] = [
    'Hematology',
    'Biochemistry',
    'Diabetes',
    'Cardiovascular',
    'Liver Function',
    'Kidney Function',
    'Thyroid',
    'Lipid Profile',
    'Infectious Disease',
    'Immunology',
    'Other'
  ];

  constructor() {
    this.labTestOrderForm = this.fb.group({
      testName: ['', Validators.required],
      category: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Use provided categories or default ones
    if (this.data.testCategories && this.data.testCategories.length > 0) {
      this.testCategories = this.data.testCategories;
    }

    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'order' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'order') {
        if (this.labTestOrderForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'order',
              formData: this.labTestOrderForm.value
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

