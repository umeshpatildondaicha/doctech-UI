import { Component, inject, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppButtonComponent, IconComponent, AppInputComponent } from "@lk/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, filter, combineLatest } from 'rxjs';

export interface CreateShiftDialogData {
  staffMembers: any[];
  existingShifts?: any[];
}

@Component({
    selector: 'app-create-shift-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AppButtonComponent,
        IconComponent,
        AppInputComponent
    ],
    templateUrl: './create-shift-dialog.component.html',
    styleUrls: ['./create-shift-dialog.component.scss']
})
export class CreateShiftDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  dialogRef = inject(MatDialogRef<CreateShiftDialogComponent>);
  data = inject<CreateShiftDialogData>(DIALOG_DATA_TOKEN);
  private dialogData = inject<any>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  shiftForm: FormGroup;
  scheduleType: 'days' | 'week' = 'days';
  selectedDays: string[] = [];
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  availableStaff: any[] = [];
  selectedStaffIds: string[] = [];
  daysError: string = '';
  staffError: string = '';

  constructor() {
    this.shiftForm = this.fb.group({
      name: ['', [Validators.required]],
      startTime: ['08:00', [Validators.required]],
      endTime: ['16:00', [Validators.required]],
      scheduleType: ['days', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.availableStaff = this.data?.staffMembers || [];
    
    // Initial validation
    this.validateDays();
    this.validateStaff();
    this.updateFooterActions();

    // Subscribe to form changes to update button state
    combineLatest([
      this.shiftForm.statusChanges,
      this.shiftForm.valueChanges
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.validateDays();
      this.validateStaff();
      this.updateFooterActions();
    });

    // Listen for footer action clicks
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'save') {
        // Validate all fields
        this.validateDays();
        this.validateStaff();
        
        if (!this.isFormValid()) {
          // Mark form as touched to show errors
          this.shiftForm.markAllAsTouched();
          // Prevent closing - return undefined to cancel
          return;
        }
        
        // Form is valid, proceed with save
        setTimeout(() => {
          this.dialogRef.close({ 
            action: 'save', 
            shiftData: this.getShiftData() 
          });
        }, 0);
      } else if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
      }
    });
  }

  ngAfterViewInit(): void {
    // Update footer actions after view init
    setTimeout(() => {
      this.updateFooterActions();
    }, 0);
  }

  updateFooterActions(): void {
    // Use setTimeout to ensure change detection runs after current cycle
    setTimeout(() => {
      try {
        // Access the parent DialogboxContentComponent through the dialog ref
        const containerInstance = (this.dialogRef as any)?._containerInstance;
        const componentRef = containerInstance?._componentRef;
        const dialogboxComponent = componentRef?.instance;
        
        const isValid = this.isFormValid();
        
        if (dialogboxComponent && dialogboxComponent.data && dialogboxComponent.data.footerActions) {
          const saveAction = dialogboxComponent.data.footerActions.find((action: any) => action.id === 'save');
          if (saveAction) {
            saveAction.disabled = !isValid;
            
            // Trigger change detection on the dialog component
            if (componentRef?.changeDetectorRef) {
              componentRef.changeDetectorRef.detectChanges();
            }
            
            // Also try to trigger change detection on the parent
            if (dialogboxComponent.changeDetectorRef) {
              dialogboxComponent.changeDetectorRef.detectChanges();
            }
          }
        }
        
        // Alternative approach: access through dialogData (passed to DialogboxContentComponent)
        // The data object is shared, so updating it should reflect in the template
        if (this.dialogData && this.dialogData.footerActions) {
          const saveAction = this.dialogData.footerActions.find((action: any) => action.id === 'save');
          if (saveAction) {
            saveAction.disabled = !isValid;
          }
        }
        
        // Trigger change detection on this component as well
        this.cdr.detectChanges();
      } catch (error) {
        // Silently fail if we can't access the dialog component
        console.debug('Could not update footer actions:', error);
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onScheduleTypeChange(type: 'days' | 'week'): void {
    this.scheduleType = type;
    this.shiftForm.patchValue({ scheduleType: type });
    if (type === 'week') {
      this.selectedDays = [];
      this.daysError = '';
    } else {
      this.validateDays();
    }
    this.updateFooterActions();
  }

  toggleDay(day: string): void {
    const index = this.selectedDays.indexOf(day);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(day);
    }
    this.validateDays();
    this.updateFooterActions();
  }

  validateDays(): void {
    if (this.scheduleType === 'days') {
      if (this.selectedDays.length === 0) {
        this.daysError = 'Please select at least one day';
      } else {
        this.daysError = '';
      }
    } else {
      this.daysError = '';
    }
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }

  toggleStaffSelection(staffId: string): void {
    const index = this.selectedStaffIds.indexOf(staffId);
    if (index > -1) {
      this.selectedStaffIds.splice(index, 1);
    } else {
      this.selectedStaffIds.push(staffId);
    }
    this.validateStaff();
    this.updateFooterActions();
  }

  validateStaff(): void {
    if (this.selectedStaffIds.length === 0) {
      this.staffError = 'Please select at least one staff member';
    } else {
      this.staffError = '';
    }
  }

  isStaffSelected(staffId: string): boolean {
    return this.selectedStaffIds.includes(staffId);
  }

  getSelectedStaffNames(): string[] {
    return this.availableStaff
      .filter(staff => this.selectedStaffIds.includes(staff.id))
      .map(staff => staff.name);
  }

  isFormValid(): boolean {
    const formValid = this.shiftForm.valid;
    const daysValid = this.scheduleType === 'week' || this.selectedDays.length > 0;
    const staffValid = this.selectedStaffIds.length > 0;
    
    return formValid && daysValid && staffValid;
  }

  getFieldError(fieldName: string): string {
    const control = this.shiftForm.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return `${fieldName === 'name' ? 'Shift Name' : fieldName === 'startTime' ? 'Start Time' : 'End Time'} is required`;
      }
    }
    return '';
  }

  getShiftData(): any {
    return {
      name: this.shiftForm.get('name')?.value,
      startTime: this.shiftForm.get('startTime')?.value,
      endTime: this.shiftForm.get('endTime')?.value,
      scheduleType: this.scheduleType,
      selectedDays: this.scheduleType === 'days' ? this.selectedDays : [],
      staffIds: this.selectedStaffIds,
      staffCount: this.selectedStaffIds.length
    };
  }
}

