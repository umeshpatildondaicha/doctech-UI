import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppButtonComponent, IconComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface AddStaffToShiftDialogData {
  shift: any;
  availableStaff: any[];
  allStaff: any[];
}

@Component({
  selector: 'app-add-staff-to-shift-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AppButtonComponent,
    IconComponent
  ],
  templateUrl: './add-staff-to-shift-dialog.component.html',
  styleUrls: ['./add-staff-to-shift-dialog.component.scss']
})
export class AddStaffToShiftDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<AddStaffToShiftDialogComponent>);
  data = inject<AddStaffToShiftDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  selectedStaffIds: string[] = [];

  ngOnInit(): void {
    // Listen for footer action clicks
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'save') {
        setTimeout(() => {
          this.dialogRef.close({ 
            action: 'save', 
            selectedStaffIds: this.selectedStaffIds 
          });
        }, 0);
      } else if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleStaffSelection(staffId: string): void {
    const index = this.selectedStaffIds.indexOf(staffId);
    if (index > -1) {
      this.selectedStaffIds.splice(index, 1);
    } else {
      this.selectedStaffIds.push(staffId);
    }
  }

  isStaffSelected(staffId: string): boolean {
    return this.selectedStaffIds.includes(staffId);
  }

  get availableStaff(): any[] {
    return this.data?.availableStaff || [];
  }

  get shift(): any {
    return this.data?.shift;
  }
}

