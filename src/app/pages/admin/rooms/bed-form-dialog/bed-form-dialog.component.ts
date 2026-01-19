import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent, IconComponent } from '@lk/core';
import { Subject, takeUntil, filter } from 'rxjs';

export interface BedFormDialogData {
  bedForm: FormGroup;
  isEditingBed: boolean;
  floors: any[];
  rooms: any[];
  bedStatusOptions: any[];
  bedFacilitiesOptions: any[];
  selectedRoom?: any;
  selectedBed?: any;
  onFloorChange?: () => void;
  onRoomChange?: () => void;
  getAvailableRooms?: () => any[];
}

@Component({
  selector: 'app-bed-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppSelectboxComponent,
    IconComponent
  ],
  templateUrl: './bed-form-dialog.component.html',
  styleUrls: ['./bed-form-dialog.component.scss']
})
export class BedFormDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<BedFormDialogComponent>);
  data = inject<BedFormDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  bedForm!: FormGroup;
  isEditingBed = false;
  floors: any[] = [];
  rooms: any[] = [];
  bedStatusOptions: any[] = [];
  bedFacilitiesOptions: any[] = [];
  selectedRoom: any = null;
  selectedBed: any = null;
  onFloorChange?: () => void;
  onRoomChange?: () => void;
  getAvailableRooms?: () => any[];

  ngOnInit() {
    // Initialize form from data
    this.bedForm = this.data.bedForm;
    this.isEditingBed = this.data.isEditingBed || false;
    this.floors = this.data.floors || [];
    this.rooms = this.data.rooms || [];
    this.bedStatusOptions = this.data.bedStatusOptions || [];
    this.bedFacilitiesOptions = this.data.bedFacilitiesOptions || [];
    this.selectedRoom = this.data.selectedRoom || null;
    this.selectedBed = this.data.selectedBed || null;
    this.onFloorChange = this.data.onFloorChange;
    this.onRoomChange = this.data.onRoomChange;
    this.getAvailableRooms = this.data.getAvailableRooms;

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
        if (this.bedForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'save',
              formValue: this.bedForm.value,
              isEditingBed: this.isEditingBed,
              selectedRoom: this.selectedRoom,
              selectedBed: this.selectedBed
            });
          }, 0);
        } else {
          // Prevent close if form is invalid
          this.bedForm.markAllAsTouched();
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleFloorChange() {
    this.bedForm.patchValue({ room: '' });
    if (this.onFloorChange) {
      this.onFloorChange();
    }
  }

  handleRoomChange() {
    if (this.onRoomChange) {
      this.onRoomChange();
    }
  }

  getFloorOptions() {
    return this.floors.map(f => ({ label: f.name, value: f.number }));
  }

  getAvailableRoomsList() {
    if (this.getAvailableRooms) {
      return this.getAvailableRooms();
    }
    return [];
  }
}

