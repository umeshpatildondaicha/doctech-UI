import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppButtonComponent, IconComponent, DialogboxService, DialogFooterAction } from "@lk/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, filter } from 'rxjs';
import { CreateShiftDialogComponent } from '../create-shift-dialog/create-shift-dialog.component';
import { AddStaffToShiftDialogComponent } from '../add-staff-to-shift-dialog/add-staff-to-shift-dialog.component';

export interface StaffScheduleDialogData {
  staffMembers: any[];
  shifts?: any[];
  selectedDate?: Date;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  staffCount: number;
  staffIds: string[];
}

@Component({
    selector: 'app-staff-schedule-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AppButtonComponent,
        IconComponent
    ],
    templateUrl: './staff-schedule-dialog.component.html',
    styleUrls: ['./staff-schedule-dialog.component.scss']
})
export class StaffScheduleDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<StaffScheduleDialogComponent>);
  data = inject<StaffScheduleDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogboxService);
  private destroy$ = new Subject<void>();

  scheduleForm: FormGroup;
  selectedView: 'today' | 'week' = 'today';
  
  shifts: Shift[] = [
    {
      id: 'day',
      name: 'Day Shift',
      startTime: '08:00',
      endTime: '16:00',
      staffCount: 0,
      staffIds: []
    },
    {
      id: 'evening',
      name: 'Evening Shift',
      startTime: '16:00',
      endTime: '00:00',
      staffCount: 0,
      staffIds: []
    },
    {
      id: 'night',
      name: 'Night Shift',
      startTime: '00:00',
      endTime: '08:00',
      staffCount: 0,
      staffIds: []
    }
  ];

  constructor() {
    this.scheduleForm = this.fb.group({
      selectedDate: [new Date(), Validators.required],
      selectedShift: ['', Validators.required],
      selectedStaff: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    // Initialize shifts with existing staff assignments if provided
    if (this.data?.shifts) {
      this.shifts = this.data.shifts.map((shift: any) => ({
        ...shift,
        staffIds: shift.staffIds || []
      }));
    } else {
      // Initialize from staff members' current shifts
      this.initializeShiftsFromStaff();
    }

    // Listen for footer action clicks
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'save') {
        setTimeout(() => {
          this.dialogRef.close({ 
            action: 'save', 
            scheduleData: this.getScheduleData() 
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

  initializeShiftsFromStaff(): void {
    this.shifts.forEach(shift => {
      const staffInShift = this.getStaffMembers().filter(staff => {
        const staffShift = staff.shift || '';
        return shift.name.toLowerCase().includes(staffShift.toLowerCase()) || 
               staffShift.toLowerCase().includes(shift.name.toLowerCase());
      });
      shift.staffIds = staffInShift.map(s => s.id);
      shift.staffCount = staffInShift.length;
    });
  }

  getStaffMembers(): any[] {
    return this.data?.staffMembers || [];
  }

  getStaffForShift(shiftId: string): any[] {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (!shift) return [];
    
    return this.getStaffMembers().filter(staff => shift.staffIds.includes(staff.id));
  }

  addStaffToShift(shiftId: string, staffId: string): void {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (shift && !shift.staffIds.includes(staffId)) {
      shift.staffIds.push(staffId);
      shift.staffCount = shift.staffIds.length;
    }
  }

  removeStaffFromShift(shiftId: string, staffId: string): void {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (shift) {
      shift.staffIds = shift.staffIds.filter(id => id !== staffId);
      shift.staffCount = shift.staffIds.length;
    }
  }

  getAvailableStaffForShift(shiftId: string): any[] {
    const shift = this.shifts.find(s => s.id === shiftId);
    const assignedStaffIds = shift ? shift.staffIds : [];
    return this.getStaffMembers().filter(staff => !assignedStaffIds.includes(staff.id));
  }

  onViewChange(view: 'today' | 'week'): void {
    this.selectedView = view;
  }

  getScheduleData(): any {
    return {
      shifts: this.shifts,
      selectedDate: this.scheduleForm.get('selectedDate')?.value,
      view: this.selectedView
    };
  }

  openCreateShiftDialog(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'save', text: 'Create Shift', color: 'primary', appearance: 'raised', fontIcon: 'save', disabled: true }
    ];

    const dialogRef = this.dialogService.openDialog(CreateShiftDialogComponent, {
      title: 'Create New Shift',
      data: {
        staffMembers: this.getStaffMembers(),
        existingShifts: this.shifts
      },
      width: '700px',
      maxWidth: '90vw',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save' && result.shiftData) {
        const newShift: Shift = {
          id: `shift-${Date.now()}`,
          name: result.shiftData.name,
          startTime: result.shiftData.startTime,
          endTime: result.shiftData.endTime,
          staffCount: result.shiftData.staffCount,
          staffIds: result.shiftData.staffIds
        };
        this.shifts.push(newShift);
      }
    });
  }

  openAddStaffDialog(shiftId: string): void {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (!shift) return;

    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'save', text: 'Add Staff', color: 'primary', appearance: 'raised', fontIcon: 'save' }
    ];

    const dialogRef = this.dialogService.openDialog(AddStaffToShiftDialogComponent, {
      title: `Add Staff to ${shift.name}`,
      data: {
        shift: shift,
        availableStaff: this.getAvailableStaffForShift(shiftId),
        allStaff: this.getStaffMembers()
      },
      width: '600px',
      maxWidth: '90vw',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save' && result.selectedStaffIds) {
        result.selectedStaffIds.forEach((staffId: string) => {
          this.addStaffToShift(shiftId, staffId);
        });
      }
    });
  }
}

