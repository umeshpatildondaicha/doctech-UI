import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface AddRoundDialogData {
  patientId: string;
  patientName: string;
}

@Component({
    selector: 'app-add-round-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        AppInputComponent,
        AppSelectboxComponent
    ],
    templateUrl: './add-round-dialog.component.html',
    styleUrls: ['./add-round-dialog.component.scss']
})
export class AddRoundDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<AddRoundDialogComponent>);
  data = inject<AddRoundDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  roundForm!: FormGroup;

  roundTypes = [
    { value: 'DOCTOR_ROUND', label: 'Doctor Round' },
    { value: 'NURSE_ROUND', label: 'Nurse Round' },
    { value: 'CLEANING_ROUND', label: 'Cleaning Round' },
    { value: 'DIET_ROUND', label: 'Diet Round' },
    { value: 'PHYSIOTHERAPY_ROUND', label: 'Physiotherapy Round' }
  ];

  priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  statuses = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'SKIPPED', label: 'Skipped' }
  ];

  performedByRoles = [
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'CLEANING_STAFF', label: 'Cleaning Staff' },
    { value: 'DIETICIAN', label: 'Dietician' },
    { value: 'PHYSIOTHERAPIST', label: 'Physiotherapist' }
  ];

  // Getter methods for option arrays
  get roundTypeOptions(): string[] {
    return this.roundTypes.map(r => r.value);
  }

  get priorityOptions(): string[] {
    return this.priorities.map(p => p.value);
  }

  get statusOptions(): string[] {
    return this.statuses.map(s => s.value);
  }

  get performedByRoleOptions(): string[] {
    return this.performedByRoles.map(r => r.value);
  }

  constructor() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm format
    
    this.roundForm = this.fb.group({
      roundType: ['DOCTOR_ROUND', Validators.required],
      performedBy: ['', Validators.required],
      performedByRole: ['DOCTOR', Validators.required],
      roundDate: [dateStr, Validators.required],
      roundTime: [timeStr, Validators.required],
      status: ['COMPLETED', Validators.required],
      priority: ['MEDIUM', Validators.required],
      notes: [''],
      observations: [''],
      careInstructions: [''],
      isCritical: [false],
      requiresFollowUp: [false]
    });
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'save') {
        if (this.roundForm.valid) {
          setTimeout(() => {
            const formValue = this.roundForm.value;
            // Convert date/time strings to Date objects
            const roundDate = formValue.roundDate ? new Date(formValue.roundDate) : new Date();
            const roundTime = formValue.roundTime ? new Date(formValue.roundTime) : new Date();
            
            this.dialogRef.close({
              action: 'save',
              formData: {
                ...formValue,
                roundDate: roundDate,
                roundTime: roundTime,
                observations: formValue.observations ? formValue.observations.split(',').map((o: string) => o.trim()).filter((o: string) => o) : [],
                careInstructions: formValue.careInstructions ? formValue.careInstructions.split(',').map((c: string) => c.trim()).filter((c: string) => c) : []
              }
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

