import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface DoctorScheduleDialogData {
  doctor: any;
}

@Component({
    selector: 'app-doctor-schedule-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        AppInputComponent,
        AppSelectboxComponent
    ],
    templateUrl: './doctor-schedule-dialog.component.html',
    styleUrls: ['./doctor-schedule-dialog.component.scss']
})
export class DoctorScheduleDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<DoctorScheduleDialogComponent>);
  data = inject<DoctorScheduleDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  scheduleForm!: FormGroup;

  // Time slots for selection
  timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  scheduleTypes = [
    'slots',
    'flexible'
  ];

  constructor() {
    const now = new Date();
    const datetimeStr = now.toISOString().slice(0, 16);
    
    this.scheduleForm = this.fb.group({
      doctorId: [{ value: this.data?.doctor?.id || '', disabled: true }, Validators.required],
      doctorName: [{ value: this.data?.doctor?.name || '', disabled: true }, Validators.required],
      scheduleType: ['slots', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required],
      slotDuration: [30, Validators.required],
      workingDays: [[], Validators.required],
      breakStartTime: ['12:00'],
      breakEndTime: ['13:00'],
      maxAppointmentsPerSlot: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    // Set default working days (Monday to Friday)
    if (this.scheduleForm.get('workingDays')?.value.length === 0) {
      this.scheduleForm.patchValue({
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      });
    }

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
        if (this.scheduleForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'save',
              formData: this.scheduleForm.value
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

  toggleDay(day: string): void {
    const workingDays = this.scheduleForm.get('workingDays')?.value || [];
    const index = workingDays.indexOf(day);
    
    if (index > -1) {
      workingDays.splice(index, 1);
    } else {
      workingDays.push(day);
    }
    
    this.scheduleForm.patchValue({ workingDays });
  }

  isDaySelected(day: string): boolean {
    const workingDays = this.scheduleForm.get('workingDays')?.value || [];
    return workingDays.includes(day);
  }
}

