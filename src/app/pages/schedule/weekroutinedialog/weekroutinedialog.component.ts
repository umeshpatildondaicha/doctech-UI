import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimingManageService } from '../../../services/timing-manage.service';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '@lk/core';

@Component({
  selector: 'app-weekroutinedialog',
  imports: [CommonModule,ReactiveFormsModule,AppButtonComponent],
  templateUrl: './weekroutinedialog.component.html',
  styleUrl: './weekroutinedialog.component.scss',
})
export class WeekroutinedialogComponent {
  doctorCode!: string;

  days = [
    'MONDAY','TUESDAY','WEDNESDAY',
    'THURSDAY','FRIDAY','SATURDAY','SUNDAY'
  ];

  form = this.fb.group({
    day: [null, Validators.required],
    startTime: [null, Validators.required],
    endTime: [null, Validators.required],
    maxAppointmentsPerSlot: [null],
    notes: ['']
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef,
    private timingService: TimingManageService,
    @Inject(DIALOG_DATA) data: any
  ) {
    this.doctorCode = data.doctorCode;
  }

  close() {
    this.dialogRef.close(false);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      day: this.form.value.day!,
      startTime: this.form.value.startTime!,
      endTime: this.form.value.endTime!,
      maxAppointmentsPerSlot: this.form.value.maxAppointmentsPerSlot || undefined,
      notes: this.form.value.notes || 'Weekly routine',
      isAvailable: true,
      isRecurring: true,
      isLeave: false
    };

    console.log('Weekly routine payload', payload);

    this.timingService.addWeeklyRoutine(this.doctorCode, payload as any).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => console.error('Weekly routine failed', err)
    });
  }

}
