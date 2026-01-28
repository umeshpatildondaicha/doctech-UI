import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, IconComponent, AppButtonComponent } from '@lk/core';
import { Subject, takeUntil, filter } from 'rxjs';

export interface PatientDetailsDialogData {
  bed: any;
  room: any;
}

@Component({
    selector: 'app-patient-details-dialog',
    imports: [IconComponent, AppButtonComponent],
    templateUrl: './patient-details-dialog.component.html',
    styleUrls: ['./patient-details-dialog.component.scss']
})
export class PatientDetailsDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<PatientDetailsDialogComponent>);
  data = inject<PatientDetailsDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  get bed() {
    return this.data?.bed || null;
  }

  get room() {
    return this.data?.room || null;
  }

  get patientInfo() {
    return this.bed?.patientInfo || null;
  }

  ngOnInit() {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'admit' || result?.action === 'transfer' || result?.action === 'discharge')
    ).subscribe((result) => {
      if (result?.action) {
        setTimeout(() => {
          this.dialogRef.close({
            action: result.action,
            bed: this.bed
          });
        }, 0);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

