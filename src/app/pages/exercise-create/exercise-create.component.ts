import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppInputComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { Exercise, ExerciseSet } from '../../interfaces/exercise.interface';
import { Mode } from '../../types/mode.type';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
    selector: 'app-exercise-create',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    AppInputComponent,
    AppSelectboxComponent
],
    templateUrl: './exercise-create.component.html',
    styleUrl: './exercise-create.component.scss'
})
export class ExerciseCreateComponent implements OnInit, OnDestroy {
  exerciseForm: FormGroup;
  exerciseTypes = [
    { value: 'Strength', label: 'Strength' },
    { value: 'Core', label: 'Core' },
    { value: 'Flexibility', label: 'Flexibility' },
    { value: 'Cardio', label: 'Cardio' },
    { value: 'Balance', label: 'Balance' },
    { value: 'Stretching', label: 'Stretching' }
  ];

  categories = [
    { value: 'Strength', label: 'Strength' },
    { value: 'Cardio', label: 'Cardio' },
    { value: 'Flexibility', label: 'Flexibility' },
    { value: 'Balance', label: 'Balance' },
    { value: 'Core', label: 'Core' },
    { value: 'Stretching', label: 'Stretching' }
  ];

  difficulties = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' }
  ];

  mode: Mode = 'create';
  submitButtonText: string = 'Create Exercise';
  selectedFiles: File[] = [];

  dialogRef = inject(MatDialogRef<ExerciseCreateComponent>);
  data = inject<{ exercise?: Exercise, mode?: Mode }>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder
  ) {
    this.mode = this.data?.mode || 'create';
    this.submitButtonText = this.getsubmitButtonText();

    this.exerciseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      exerciseType: ['', Validators.required],
      category: ['', Validators.required],
      difficulty: ['', Validators.required],
      targetMuscles: ['', Validators.required],
      equipment: [''],
      tags: [''],
      coachingCues: [''],
      contraindications: [''],
      sets: this.fb.array([])
    });

    if(this.mode === 'view'){
      this.exerciseForm.disable();
    }

    // If editing existing exercise, populate form
    if (this.data?.exercise) {
      this.exerciseForm.patchValue({
        name: this.data.exercise.name,
        description: this.data.exercise.description,
        exerciseType: this.data.exercise.exerciseType,
        category: this.data.exercise.category,
        difficulty: this.data.exercise.difficulty,
        targetMuscles: this.data.exercise.targetMuscles.join(', '),
        equipment: this.data.exercise.equipment.join(', '),
        tags: this.data.exercise.tags.join(', '),
        coachingCues: this.data.exercise.coachingCues,
        contraindications: this.data.exercise.contraindications
      });

      // Add existing sets
      if (this.data.exercise.sets && this.data.exercise.sets.length > 0) {
        this.data.exercise.sets.forEach(set => {
          this.addSet(set);
        });
      }
    }

    // Add at least one default set
    if (this.setsArray.length === 0) {
      this.addSet();
    }
  }

  ngOnInit() {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'submit' || result?.action === 'cancel' || result?.action === 'duplicate')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        return;
      }
      
      if (result?.action === 'duplicate') {
        // Duplicate action
        this.onDuplicate();
        return;
      }
      
      if (result?.action === 'submit') {
        // Validate before closing
        if (!this.exerciseForm.valid) {
          // Prevent close if invalid
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
        } else {
          // Submit form
          this.onSubmit();
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get setsArray(): FormArray {
    return this.exerciseForm.get('sets') as FormArray;
  }

  getsubmitButtonText(): string {
    return this.mode === 'edit' ? 'Update Exercise' : this.mode === 'view' ? 'Close' : 'Create Exercise';
  }

  getErrorMessage(fieldName: string): string {
    const field = this.exerciseForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field?.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.getError('minlength').requiredLength} characters`;
    }
    return '';
  }

  addSet(existingSet?: ExerciseSet): void {
    const setForm = this.fb.group({
      setNumber: [existingSet?.setNumber || this.setsArray.length + 1, [Validators.required, Validators.min(1)]],
      reps: [existingSet?.reps || 10, [Validators.required, Validators.min(1)]],
      holdTime: [existingSet?.holdTime || 0, [Validators.required, Validators.min(0)]],
      restTime: [existingSet?.restTime || 60, [Validators.required, Validators.min(0)]],
      tempo: [existingSet?.tempo || 'tempo']
    });
    this.setsArray.push(setForm);
  }

  removeSet(index: number): void {
    if (this.setsArray.length > 1) {
      this.setsArray.removeAt(index);
      // Update set numbers
      this.setsArray.controls.forEach((control, i) => {
        control.patchValue({ setNumber: i + 1 });
      });
    }
  }

  applySetToAll(index: number): void {
    const sourceSet = this.setsArray.at(index).value;
    this.setsArray.controls.forEach((control, i) => {
      if (i !== index) {
        control.patchValue({
          reps: sourceSet.reps,
          holdTime: sourceSet.holdTime,
          restTime: sourceSet.restTime,
          tempo: sourceSet.tempo
        });
      }
    });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      this.selectedFiles = Array.from(files);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  onSubmit() {
    if (this.exerciseForm.valid) {
      const formValue = this.exerciseForm.value;
      
      // Convert comma-separated strings to arrays
      const exercise: Exercise = {
        exerciseId: this.data?.exercise?.exerciseId || 'EX' + Date.now(),
        name: formValue.name,
        description: formValue.description,
        createdByDoctorId: this.data?.exercise?.createdByDoctorId || 'DOC001',
        exerciseType: formValue.exerciseType,
        category: formValue.category,
        difficulty: formValue.difficulty,
        targetMuscles: formValue.targetMuscles.split(',').map((m: string) => m.trim()).filter((m: string) => m),
        equipment: formValue.equipment ? formValue.equipment.split(',').map((e: string) => e.trim()).filter((e: string) => e) : [],
        tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
        coachingCues: formValue.coachingCues || '',
        contraindications: formValue.contraindications || '',
        sets: formValue.sets.map((set: any, index: number) => ({
          setId: `SET${Date.now()}${index}`,
          exerciseId: this.data?.exercise?.exerciseId || 'EX' + Date.now(),
          setNumber: set.setNumber,
          reps: set.reps,
          holdTime: set.holdTime,
          restTime: set.restTime,
          tempo: set.tempo
        })),
        media: this.selectedFiles.map(file => URL.createObjectURL(file)),
        createdAt: this.data?.exercise?.createdAt || new Date(),
        updatedAt: new Date()
      };

      this.dialogRef.close(exercise);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDuplicate() {
    // Create a copy of the current exercise with a new ID
    if (this.data?.exercise) {
      const duplicatedExercise = {
        ...this.data.exercise,
        exerciseId: 'EX' + Date.now(),
        name: this.data.exercise.name + ' (Copy)',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.dialogRef.close(duplicatedExercise);
    }
  }
} 