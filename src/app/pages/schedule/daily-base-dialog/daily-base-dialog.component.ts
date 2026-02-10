import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimingManageService } from '../../../services/timing-manage.service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '@lk/core';

@Component({
  selector: 'app-daily-base-dialog',
  imports: [CommonModule,ReactiveFormsModule,AppButtonComponent],
  templateUrl: './daily-base-dialog.component.html',
  styleUrl: './daily-base-dialog.component.scss',
})
export class DailyBaseDialogComponent implements OnInit {
  doctorCode!: string;
  isEdit =false ;
  existingId?:number;
  existing :any;

  form = this.fb.group({
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    maxAppointmentsPerSlot: [null, Validators.required],
    notes: ['']
  });

  constructor(
    private fb: FormBuilder,
    private TimeMangeservice: TimingManageService,
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: any
  ) {
    this.doctorCode = data.doctorCode;
     this.existing = data.existing
  }
  // patchForm(item: any) {
  //   this.form.patchValue({
  //     startTime: item.startTime ?? null,
  //     endTime: item.endTime ?? null,
  //     maxAppointmentsPerSlot: item.maxAppointmentsPerSlot ?? null,
  //     notes: item.notes ?? ''
  //   });
  // }
  ngOnInit() {
    if (this.existing) {
      console.log('EDIT MODE DATA:', this.existing);

      this.form.patchValue({
        startTime: this.existing.startTime,
        endTime: this.existing.endTime,
        maxAppointmentsPerSlot: this.existing.maxAppointmentsPerSlot,
        notes: this.existing.notes
      });
    }
  }

  save() {
    if (this.form.invalid) return;
  
    const payload = {
      startTime: this.form.value.startTime,
      endTime: this.form.value.endTime,
      maxAppointmentsPerSlot: this.form.value.maxAppointmentsPerSlot,
      notes: this.form.value.notes,
      isAvailable: true,
      isRecurring: false,
      isLeave: false
    };
  
    if (this.existing) {
      const updated ={
        ...this.existing,...payload
      };
      console.log('Edit Successfully',payload);
      this.dialogRef.close(updated);
      return;
    }
  
    this.TimeMangeservice.addTiming(this.doctorCode, payload as any).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => console.error(err)
    });
  }
  
  
  

  close() {
    this.dialogRef.close(false);
  }
}
