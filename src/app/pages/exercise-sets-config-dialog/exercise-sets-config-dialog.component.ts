import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Exercise, ExerciseSet } from '../../interfaces/exercise.interface';
import { DIALOG_DATA_TOKEN, AppButtonComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface ExerciseSetsConfigDialogData {
  exercise: Exercise;
  assignedExercise?: {
    exerciseId: string;
    name: string;
    category: string;
    details: string;
    sets?: number;
    reps?: number;
    duration?: string;
  };
  mode?: 'view' | 'edit';
}

@Component({
    selector: 'app-exercise-sets-config-dialog',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    AppButtonComponent
],
    templateUrl: './exercise-sets-config-dialog.component.html',
    styleUrl: './exercise-sets-config-dialog.component.scss'
})
export class ExerciseSetsConfigDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<ExerciseSetsConfigDialogComponent>);
  data = inject<ExerciseSetsConfigDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  setsForm: FormGroup;
  mode: 'view' | 'edit';
  exercise: Exercise;

  constructor(
    private readonly fb: FormBuilder
  ) {
    this.exercise = this.data.exercise;
    this.mode = this.data.mode || 'edit';
    
    this.setsForm = this.fb.group({
      sets: this.fb.array([])
    });
  }

  ngOnInit() {
    this.initializeSets();
    if (this.mode === 'view') {
      this.setsForm.disable();
    }

    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        return;
      }
      
      if (result?.action === 'save') {
        // Handle save action from footer
        if (this.setsForm.valid) {
          // Use a small delay to ensure form validation completes
          setTimeout(() => {
            const sets: ExerciseSet[] = this.setsArray.value.map((set: any, index: number) => ({
              setId: set.setId || `set-${index + 1}`,
              exerciseId: this.exercise.exerciseId,
              setNumber: set.setNumber || index + 1,
              reps: set.reps,
              holdTime: set.holdTime,
              restTime: set.restTime,
              tempo: set.tempo
            }));

            // Calculate summary details
            const totalSets = sets.length;
            const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);
            const avgReps = Math.round(totalReps / totalSets);
            
            let details = '';
            if (this.exercise.category === 'Strength') {
              details = `${totalSets} set${totalSets > 1 ? 's' : ''} of ${avgReps} repetition${avgReps > 1 ? 's' : ''}`;
            } else if (this.exercise.category === 'Cardio') {
              const totalDuration = sets.reduce((sum, set) => sum + (set.restTime || 0), 0);
              const minutes = Math.round(totalDuration / 60);
              details = `${minutes} minutes, moderate pace`;
            } else {
              details = `${totalSets} set${totalSets > 1 ? 's' : ''} as prescribed`;
            }

            // Close with form data - this will override the action-only close
            this.dialogRef.close({
              sets,
              details,
              setsCount: totalSets,
              reps: avgReps
            });
          }, 10);
        } else {
          // If invalid, prevent close
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 10);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get setsArray(): FormArray {
    return this.setsForm.get('sets') as FormArray;
  }

  initializeSets(): void {
    // If assigned exercise has sets/reps, use those
    if (this.data.assignedExercise?.sets && this.data.assignedExercise?.reps) {
      for (let i = 0; i < this.data.assignedExercise.sets; i++) {
        this.addSet({
          setId: `set-${i + 1}`,
          exerciseId: this.exercise.exerciseId,
          setNumber: i + 1,
          reps: this.data.assignedExercise.reps,
          holdTime: 0,
          restTime: 60
        });
      }
    } else if (this.exercise.sets && this.exercise.sets.length > 0) {
      // Use exercise's existing sets
      for (const set of this.exercise.sets) {
        this.addSet(set);
      }
    } else {
      // Default: create 3 sets with 10 reps
      for (let i = 0; i < 3; i++) {
        this.addSet({
          setId: `set-${i + 1}`,
          exerciseId: this.exercise.exerciseId,
          setNumber: i + 1,
          reps: 10,
          holdTime: 0,
          restTime: 60
        });
      }
    }
  }

  addSet(existingSet?: ExerciseSet): void {
    const setForm = this.fb.group({
      setId: [existingSet?.setId || `set-${this.setsArray.length + 1}`],
      setNumber: [existingSet?.setNumber || this.setsArray.length + 1, [Validators.required, Validators.min(1)]],
      reps: [existingSet?.reps || 10, [Validators.required, Validators.min(1)]],
      holdTime: [existingSet?.holdTime || 0, [Validators.required, Validators.min(0)]],
      restTime: [existingSet?.restTime || 60, [Validators.required, Validators.min(0)]],
      tempo: [existingSet?.tempo || '']
    });
    this.setsArray.push(setForm);
    this.updateSetNumbers();
  }

  removeSet(index: number): void {
    if (this.setsArray.length > 1) {
      this.setsArray.removeAt(index);
      this.updateSetNumbers();
    }
  }

  updateSetNumbers(): void {
    for (let index = 0; index < this.setsArray.controls.length; index++) {
      const control = this.setsArray.controls[index];
      control.patchValue({
        setNumber: index + 1
      }, { emitEvent: false });
    }
  }

  applySetToAll(index: number): void {
    const setValues = this.setsArray.at(index).value;
    for (let i = 0; i < this.setsArray.controls.length; i++) {
      if (i !== index) {
        const control = this.setsArray.controls[i];
        control.patchValue({
          reps: setValues.reps,
          holdTime: setValues.holdTime,
          restTime: setValues.restTime,
          tempo: setValues.tempo
        });
      }
    }
  }

  onCancel(): void {
    // This method is now handled by beforeClosed() subscription
    this.dialogRef.close({ action: 'cancel' });
  }

  onSave(): void {
    // This method is now handled by beforeClosed() subscription
    this.dialogRef.close({ action: 'save' });
  }

  toggleEditMode(): void {
    if (this.mode === 'view') {
      this.mode = 'edit';
      this.setsForm.enable();
    } else {
      this.mode = 'view';
      this.setsForm.disable();
    }
  }
}

