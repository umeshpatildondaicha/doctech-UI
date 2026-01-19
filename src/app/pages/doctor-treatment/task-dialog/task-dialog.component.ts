import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent, AppButtonComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface TaskDialogData {
  patientId?: string | null;
  patientName?: string;
  location?: string;
  taskType?: 'ROUND' | 'CONSULTATION' | 'PROCEDURE' | 'DISCHARGE' | 'EMERGENCY' | 'FOLLOW_UP' | 'GENERAL';
  task?: any; // Existing task data for edit mode
  isEditMode?: boolean;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppSelectboxComponent,
    AppButtonComponent
  ],
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.scss']
})
export class TaskDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<TaskDialogComponent>);
  data = inject<TaskDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  taskForm!: FormGroup;

  taskTypeOptions = ['ROUND', 'CONSULTATION', 'PROCEDURE', 'DISCHARGE', 'EMERGENCY', 'FOLLOW_UP', 'GENERAL'];
  priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  constructor() {
    const isEditMode = this.data.isEditMode || false;
    const task = this.data.task || {};
    const isGeneralTask = !this.data.patientId || this.data.patientName === 'General Task';
    
    // Format dueDate for edit mode
    let dueDateValue = '';
    if (isEditMode && task.dueTime) {
      // Convert ISO string or date to format suitable for datetime-local input
      const dueDate = new Date(task.dueTime);
      if (!isNaN(dueDate.getTime())) {
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        const year = dueDate.getFullYear();
        const month = String(dueDate.getMonth() + 1).padStart(2, '0');
        const day = String(dueDate.getDate()).padStart(2, '0');
        const hours = String(dueDate.getHours()).padStart(2, '0');
        const minutes = String(dueDate.getMinutes()).padStart(2, '0');
        dueDateValue = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }
    
    this.taskForm = this.fb.group({
      patientId: [isEditMode ? (task.patientId || '') : (this.data.patientId || '')],
      taskType: [isEditMode ? (task.taskType || 'ROUND') : (this.data.taskType || 'ROUND'), Validators.required],
      title: [isEditMode ? (task.title || '') : '', Validators.required],
      description: [isEditMode ? (task.description || '') : '', Validators.required],
      priority: [isEditMode ? (task.priority || 'MEDIUM') : 'MEDIUM', Validators.required],
      dueDate: [dueDateValue, Validators.required],
      estimatedDuration: [isEditMode ? (task.estimatedDuration || '') : ''],
      location: [isEditMode ? (task.location || '') : (this.data.location || ''), isGeneralTask ? [] : Validators.required],
      notes: [isEditMode ? (task.notes || '') : ''],
      requiresFollowUp: [isEditMode ? (task.requiresFollowUp || false) : false],
      followUpDate: [isEditMode ? (task.followUpDate || '') : '']
    });
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
        if (this.taskForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'save',
              formData: this.taskForm.value
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

  get taskTypeOptionsArray(): string[] {
    return this.taskTypeOptions;
  }

  get priorityOptionsArray(): string[] {
    return this.priorityOptions;
  }
}

