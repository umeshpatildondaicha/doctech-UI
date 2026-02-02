import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppButtonComponent } from '@lk/core';
import type { QueuePatient } from '@lk/template';

export interface AddEmergencyDialogData {
  queueCount: number;
}

export interface AddEmergencyDialogResult {
  name: string;
  reason: string;
  scheduledTime: string;
  insertAt: number;
}

@Component({
  selector: 'app-add-emergency-patient-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    AppButtonComponent,
  ],
  templateUrl: './add-emergency-patient-dialog.component.html',
  styleUrl: './add-emergency-patient-dialog.component.scss',
})
export class AddEmergencyPatientDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddEmergencyPatientDialogComponent>);
  data = inject<AddEmergencyDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;
  positionOptions: { value: number; label: string }[] = [];

  constructor() {
    const count = this.data?.queueCount ?? 0;
    this.positionOptions = [{ value: 0, label: 'At beginning (next in queue)' }];
    for (let i = 1; i <= count; i++) {
      this.positionOptions.push({
        value: i,
        label: i === count ? 'At end' : `After patient ${i}`,
      });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    this.form = this.fb.group({
      name: ['', Validators.required],
      reason: ['Emergency', Validators.required],
      scheduledTime: [timeStr, Validators.required],
      insertAt: [0, Validators.required],
    });
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value as AddEmergencyDialogResult);
    }
  }
}
