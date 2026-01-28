import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent, AppButtonComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface AdmissionDialogData {
  patientId: string;
  patientName: string;
  wardOptions: string[];
  bedOptions: string[];
  doctorOptions: string[];
}

@Component({
    selector: 'app-admission-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AppInputComponent,
        AppSelectboxComponent,
        AppButtonComponent
    ],
    templateUrl: './admission-dialog.component.html',
    styleUrls: ['./admission-dialog.component.scss']
})
export class AdmissionDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<AdmissionDialogComponent>);
  data = inject<AdmissionDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  admissionForm!: FormGroup;

  constructor() {
    this.admissionForm = this.fb.group({
      ward: ['', Validators.required],
      room: ['', Validators.required],
      bed: ['', Validators.required],
      attendingDoctor: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'confirm' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'confirm') {
        if (this.admissionForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'confirm',
              formData: this.admissionForm.value
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

