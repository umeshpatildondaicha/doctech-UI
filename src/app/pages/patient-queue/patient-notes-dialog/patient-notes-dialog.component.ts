import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface PatientNotesDialogData {
  patientName: string;
  defaultValue?: string;
  placeholder?: string;
}

@Component({
    selector: 'app-patient-notes-dialog',
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule
    ],
    templateUrl: './patient-notes-dialog.component.html',
    styleUrls: ['./patient-notes-dialog.component.scss']
})
export class PatientNotesDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<PatientNotesDialogComponent>);
  data = inject<PatientNotesDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  notes: string = '';

  constructor() {
    this.notes = this.data.defaultValue || '';
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
        if (this.notes.trim()) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'save',
              notes: this.notes.trim()
            });
          }, 0);
        } else {
          // Prevent close if notes are empty
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

  canSave(): boolean {
    return this.notes.trim().length > 0;
  }
}

