import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface ScheduleRoundsDialogData {
  patientId: string;
  patientName: string;
}

@Component({
    selector: 'app-schedule-rounds-dialog',
    imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    AppInputComponent,
    AppSelectboxComponent
],
    templateUrl: './schedule-rounds-dialog.component.html',
    styleUrls: ['./schedule-rounds-dialog.component.scss']
})
export class ScheduleRoundsDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<ScheduleRoundsDialogComponent>);
  data = inject<ScheduleRoundsDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  scheduleForm!: FormGroup;

  roundTypes = [
    { value: 'DOCTOR_ROUND', label: 'Doctor Round' },
    { value: 'NURSE_ROUND', label: 'Nurse Round' },
    { value: 'CLEANING_ROUND', label: 'Cleaning Round' },
    { value: 'DIET_ROUND', label: 'Diet Round' },
    { value: 'PHYSIOTHERAPY_ROUND', label: 'Physiotherapy Round' }
  ];

  frequencies = [
    { value: 'ONCE', label: 'Once' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'TWICE_DAILY', label: 'Twice Daily' },
    { value: 'EVERY_4_HOURS', label: 'Every 4 Hours' },
    { value: 'EVERY_6_HOURS', label: 'Every 6 Hours' },
    { value: 'WEEKLY', label: 'Weekly' }
  ];

  priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  assignedToRoles = [
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

  get frequencyOptions(): string[] {
    return this.frequencies.map(f => f.value);
  }

  get priorityOptions(): string[] {
    return this.priorities.map(p => p.value);
  }

  get assignedToRoleOptions(): string[] {
    return this.assignedToRoles.map(r => r.value);
  }

  constructor() {
    const now = new Date();
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const datetimeStr = now.toISOString().slice(0, 16);
    
    this.scheduleForm = this.fb.group({
      roundType: ['DOCTOR_ROUND', Validators.required],
      frequency: ['DAILY', Validators.required],
      assignedTo: ['', Validators.required],
      assignedToRole: ['DOCTOR', Validators.required],
      scheduledTime: [datetimeStr, Validators.required],
      priority: ['MEDIUM', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'schedule' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'schedule') {
        if (this.scheduleForm.valid) {
          setTimeout(() => {
            const formValue = this.scheduleForm.value;
            // Convert datetime-local string to Date object
            const scheduledTime = formValue.scheduledTime ? new Date(formValue.scheduledTime) : new Date();
            
            this.dialogRef.close({
              action: 'schedule',
              formData: {
                ...formValue,
                scheduledTime: scheduledTime
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

