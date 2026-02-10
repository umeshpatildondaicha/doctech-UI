import { Component } from '@angular/core';
import { TimingManageService } from '../../../services/timing-manage.service';
import { DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '@lk/core';

@Component({
  selector: 'app-leave-dialog',
  imports: [CommonModule,ReactiveFormsModule,AppButtonComponent],
  templateUrl: './leave-dialog.component.html',
  styleUrl: './leave-dialog.component.scss',
})
export class LeaveDialogComponent {
  leaveForm!: FormGroup;
  doctorCode = 'DR1'; // parent कडून येऊ शकतो

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef,
    private timingMangeServices :TimingManageService
  ) {
    this.leaveForm = this.fb.group({
      specificDate: [null, Validators.required],
      notes: ['']
    });
    this.saveLeave();
  }

  saveLeave() {
    console.log('SAVE LEAVE CLICKED');
  
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      return;
    }
  
    // 👉 इथे payload add करायचा
    const payload = {
      specificDate: this.leaveForm.value.specificDate,
      isRecurring: false,
      isLeave: true,
      notes: this.leaveForm.value.notes || 'On leave'
    };
  
    console.log('PAYLOAD READY', payload);
  
    // 👉 इथून API call करायचा
    this.timingMangeServices
      .addLeave(this.doctorCode, payload)
      .subscribe({
        next: () => {
          console.log('LEAVE SAVED SUCCESSFULLY');
          this.dialogRef.close(true); // popup बंद
        },
        error: (err) => {
          console.error('LEAVE SAVE FAILED', err);
        }
      });
  }
  
  

  close() {
    this.dialogRef.close(false);
  }

}
