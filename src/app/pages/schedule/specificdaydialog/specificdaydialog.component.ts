import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimingManageService } from '../../../services/timing-manage.service';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '@lk/core';

@Component({
  selector: 'app-specificdaydialog',
  standalone: true, // ✅ IMPORTANT
  imports: [CommonModule, ReactiveFormsModule,AppButtonComponent],
  templateUrl: './specificdaydialog.component.html',
  styleUrl: './specificdaydialog.component.scss',
})
export class SpecificdaydialogComponent {

  doctorCode!: string;

  form = this.fb.group({
    specificDate: [null, Validators.required],
    startTime: [null],
    endTime: [null],
    maxAppointmentsPerSlot: [null],
    notes: ['']
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<boolean>, // ✅ typed
    private timingService: TimingManageService,
    @Inject(DIALOG_DATA) data: any
  ) {
    this.doctorCode = data?.doctorCode;

    console.log('Specific Day dialog doctorCode:', this.doctorCode);
  }

  close() {
    this.dialogRef.close(false);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.doctorCode) {
      console.error('Doctor code missing');
      return;
    }

    // ✅ SPECIFIC DAY PAYLOAD
    const payload = {
      specificDate: this.form.value.specificDate,
      startTime: this.form.value.startTime || undefined,
      endTime: this.form.value.endTime || undefined,
      maxAppointmentsPerSlot: this.form.value.maxAppointmentsPerSlot || undefined,
      notes: this.form.value.notes || 'Specific Day',
      isAvailable: true,
      isRecurring: false,
      isLeave: false
    };

    console.log('Specific Day payload:', payload);

    this.timingService.addTiming(this.doctorCode, payload).subscribe({
      next: () => {
        console.log('Specific Day saved');
        this.dialogRef.close(true);
      },
      error: err => {
        console.error('Specific Day failed', err);
      }
    });
  }
}
