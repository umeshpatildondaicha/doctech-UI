import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent, AppButtonComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface AssignTaskDialogData {
  staffId?: string;
  staffName?: string;
  availableTasks?: any[];
  availableStaff?: any[];
}

@Component({
    selector: 'app-assign-task-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AppInputComponent,
        AppSelectboxComponent,
        AppButtonComponent
    ],
    templateUrl: './assign-task-dialog.component.html',
    styleUrls: ['./assign-task-dialog.component.scss']
})
export class AssignTaskDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<AssignTaskDialogComponent>);
  data = inject<AssignTaskDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  assignTaskForm!: FormGroup;

  priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  taskTypeOptions = ['ROUND', 'CONSULTATION', 'PROCEDURE', 'DISCHARGE', 'EMERGENCY', 'FOLLOW_UP'];

  constructor() {
    this.assignTaskForm = this.fb.group({
      taskType: ['ROUND', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      assignedTo: [this.data.staffId || '', Validators.required],
      dueDate: ['', Validators.required],
      estimatedDuration: [''],
      patientId: [''],
      location: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'assign' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'assign') {
        if (this.assignTaskForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'assign',
              formData: this.assignTaskForm.value
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

  get priorityOptionsArray(): string[] {
    return this.priorityOptions;
  }

  get taskTypeOptionsArray(): string[] {
    return this.taskTypeOptions;
  }

  get staffOptions(): string[] {
    if (this.data.availableStaff) {
      return this.data.availableStaff.map(staff => staff.name || staff.id);
    }
    return [];
  }
}

