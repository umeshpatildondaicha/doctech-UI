import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DIALOG_DATA_TOKEN, DialogboxService, DialogFooterAction, AppButtonComponent } from "@lk/core";
import { Exercise, ExerciseSet } from '../../interfaces/exercise.interface';
import { ExerciseCreateComponent } from '../exercise-create/exercise-create.component';
import { ExerciseSetsConfigDialogComponent } from '../exercise-sets-config-dialog/exercise-sets-config-dialog.component';
import { Subject, takeUntil, filter } from 'rxjs';

export interface ExerciseAssignmentDialogData {
  patientName: string;
  patientId?: string;
  availableExercises?: Exercise[];
  exerciseGroups?: ExerciseGroup[];
}

export interface ExerciseGroup {
  groupId?: string;
  id?: string;
  groupName?: string;
  name?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  exercises: Exercise[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-exercise-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    AppButtonComponent
  ],
  templateUrl: './exercise-assignment-dialog.component.html',
  styleUrl: './exercise-assignment-dialog.component.scss'
})
export class ExerciseAssignmentDialogComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  viewTab: 'exercises' | 'groups' = 'exercises';
  assignmentDate: Date = new Date();
  endDate: Date = new Date();
  
  exerciseGroups: ExerciseGroup[] = [];
  individualExercises: Exercise[] = [];
  selectedExercises: Exercise[] = [];

  dialogRef = inject(MatDialogRef<ExerciseAssignmentDialogComponent>);
  data = inject<ExerciseAssignmentDialogData>(DIALOG_DATA_TOKEN);
  private readonly dialogService = inject(DialogboxService);
  private readonly destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit() {
    // Initialize with provided data or use defaults
    if (this.data.exerciseGroups) {
      this.exerciseGroups = this.data.exerciseGroups;
    } else {
      this.exerciseGroups = this.getDefaultExerciseGroups();
    }

    if (this.data.availableExercises) {
      this.individualExercises = this.data.availableExercises;
    } else {
      this.individualExercises = this.getDefaultIndividualExercises();
    }

    // Set default date to today
    this.assignmentDate = new Date();
    // Default end date = +14 days from assignment
    this.endDate = new Date(this.assignmentDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'assign' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        return;
      }
      
      if (result?.action === 'assign') {
        // Validate before closing
        if (this.selectedExercises.length === 0) {
          // Prevent close if no exercises selected
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
        } else {
          // Close with exercise data
          setTimeout(() => {
            this.dialogRef.close({
              action: 'assign',
              exercises: this.selectedExercises,
              assignmentDate: this.assignmentDate,
              endDate: this.endDate
            });
          }, 0);
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDefaultExerciseGroups(): ExerciseGroup[] {
    return [
      {
        groupId: 'GROUP001',
        groupName: 'Core Stability',
        description: 'Core strengthening exercises for better stability and posture',
        category: 'strength',
        difficulty: 'beginner',
        exercises: [
          {
            exerciseId: 'EX001',
            name: 'Leg Press',
            description: 'Low impact leg strengthening exercise',
            createdByDoctorId: 'DOC001',
            exerciseType: 'Strength',
            category: 'Strength',
            difficulty: 'Beginner',
            targetMuscles: ['Quadriceps', 'Glutes'],
            equipment: ['Leg Press Machine'],
            tags: ['Low Impact', 'Rehabilitation'],
            coachingCues: 'Keep your back pressed against the pad',
            contraindications: 'Avoid if knee pain exceeds 4/10',
            sets: [],
            imageUrl: '',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            exerciseId: 'EX002',
            name: 'Bicep Curls',
            description: 'Arm strengthening exercise',
            createdByDoctorId: 'DOC001',
            exerciseType: 'Strength',
            category: 'Strength',
            difficulty: 'Beginner',
            targetMuscles: ['Biceps'],
            equipment: ['Dumbbells'],
            tags: ['Upper Body'],
            coachingCues: 'Keep your elbows stationary',
            contraindications: '',
            sets: [],
            imageUrl: '',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        groupId: 'GROUP002',
        groupName: 'Core Stability',
        description: 'Core strengthening exercises for better stability and posture',
        category: 'strength',
        difficulty: 'beginner',
        exercises: [
          {
            exerciseId: 'EX003',
            name: 'Stationary Bike',
            description: 'Low impact cardiovascular exercise',
            createdByDoctorId: 'DOC001',
            exerciseType: 'Cardio',
            category: 'Cardio',
            difficulty: 'Beginner',
            targetMuscles: ['Quadriceps', 'Hamstrings', 'Calves'],
            equipment: ['Stationary Bike'],
            tags: ['Cardio', 'Low Impact'],
            coachingCues: 'Maintain consistent cadence',
            contraindications: '',
            sets: [],
            imageUrl: '',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      }
    ];
  }

  getDefaultIndividualExercises(): Exercise[] {
    return [
      {
        exerciseId: 'EX001',
        name: 'Leg Press',
        description: 'Low impact leg strengthening exercise',
        createdByDoctorId: 'DOC001',
        exerciseType: 'Strength',
        category: 'Strength',
        difficulty: 'Beginner',
        targetMuscles: ['Quadriceps', 'Glutes'],
        equipment: ['Leg Press Machine'],
        tags: ['Low Impact', 'Rehabilitation'],
        coachingCues: 'Keep your back pressed against the pad',
        contraindications: 'Avoid if knee pain exceeds 4/10',
        sets: [
          {
            setId: 'SET001',
            exerciseId: 'EX001',
            setNumber: 1,
            reps: 10,
            holdTime: 0,
            restTime: 60,
            tempo: 'tempo'
          }
        ],
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        exerciseId: 'EX002',
        name: 'Bicep Curls',
        description: 'Arm strengthening exercise',
        createdByDoctorId: 'DOC001',
        exerciseType: 'Strength',
        category: 'Strength',
        difficulty: 'Beginner',
        targetMuscles: ['Biceps'],
        equipment: ['Dumbbells'],
        tags: ['Upper Body'],
        coachingCues: 'Keep your elbows stationary',
        contraindications: '',
        sets: [
          {
            setId: 'SET002',
            exerciseId: 'EX002',
            setNumber: 1,
            reps: 12,
            holdTime: 0,
            restTime: 60,
            tempo: 'tempo'
          }
        ],
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        exerciseId: 'EX003',
        name: 'Treadmill Walk',
        description: 'Moderate pace walking exercise',
        createdByDoctorId: 'DOC001',
        exerciseType: 'Cardio',
        category: 'Cardio',
        difficulty: 'Beginner',
        targetMuscles: ['Full Body'],
        equipment: ['Treadmill'],
        tags: ['Cardio', 'Low Impact'],
        coachingCues: 'Maintain steady pace',
        contraindications: '',
        sets: [],
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        exerciseId: 'EX004',
        name: 'Push Ups',
        description: 'Upper body strength exercise',
        createdByDoctorId: 'DOC001',
        exerciseType: 'Strength',
        category: 'Strength',
        difficulty: 'Intermediate',
        targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
        equipment: ['Bodyweight'],
        tags: ['Upper Body'],
        coachingCues: 'Maintain a straight line from head to heels',
        contraindications: 'Avoid if you have shoulder issues',
        sets: [
          {
            setId: 'SET003',
            exerciseId: 'EX004',
            setNumber: 1,
            reps: 10,
            holdTime: 0,
            restTime: 60,
            tempo: 'tempo'
          }
        ],
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  getFilteredExercises(): Exercise[] {
    if (!this.searchQuery) return this.individualExercises;
    
    const query = this.searchQuery.toLowerCase();
    return this.individualExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(query) ||
      exercise.description.toLowerCase().includes(query) ||
      exercise.category.toLowerCase().includes(query) ||
      (exercise.targetMuscles || []).some(m => m.toLowerCase().includes(query)) ||
      (exercise.tags || []).some(t => t.toLowerCase().includes(query))
    );
  }

  getFilteredGroups(): ExerciseGroup[] {
    if (!this.searchQuery) return this.exerciseGroups;
    
    const query = this.searchQuery.toLowerCase();
    return this.exerciseGroups.filter(group => {
      const groupName = (group.groupName || group.name || '').toLowerCase();
      return groupName.includes(query) ||
        (group.description || '').toLowerCase().includes(query) ||
        (group.exercises || []).some(ex => 
          ex.name.toLowerCase().includes(query) ||
          ex.description.toLowerCase().includes(query)
        );
    });
  }

  isExerciseSelected(exercise: Exercise): boolean {
    return this.selectedExercises.some(ex => ex.exerciseId === exercise.exerciseId);
  }

  isGroupSelected(group: ExerciseGroup): boolean {
    // A group is selected if all its exercises are in selectedExercises
    if (!group.exercises || group.exercises.length === 0) return false;
    return group.exercises.every(groupEx => 
      this.selectedExercises.some(selEx => selEx.exerciseId === groupEx.exerciseId)
    );
  }

  toggleExerciseSelection(exercise: Exercise): void {
    const index = this.selectedExercises.findIndex(ex => ex.exerciseId === exercise.exerciseId);
    if (index >= 0) {
      this.selectedExercises.splice(index, 1);
    } else {
      // Create a deep copy of the exercise with its sets
      const exerciseCopy: Exercise = {
        ...exercise,
        sets: exercise.sets && exercise.sets.length > 0 
          ? exercise.sets.map(set => ({ ...set })) 
          : this.getDefaultSets(exercise)
      };
      this.selectedExercises.push(exerciseCopy);
    }
  }

  getDefaultSets(exercise: Exercise): ExerciseSet[] {
    // If exercise has sets, use them; otherwise create default sets
    if (exercise.sets && exercise.sets.length > 0) {
      return exercise.sets.map(set => ({ ...set }));
    }
    
    // Create default sets based on exercise category
    const defaultSets: ExerciseSet[] = [];
    const setCount = 3;
    const defaultReps = exercise.category === 'Cardio' ? 0 : 10;
    
    for (let i = 0; i < setCount; i++) {
      defaultSets.push({
        setId: `set-${exercise.exerciseId}-${i + 1}`,
        exerciseId: exercise.exerciseId,
        setNumber: i + 1,
        reps: defaultReps,
        holdTime: 0,
        restTime: 60,
        tempo: ''
      });
    }
    
    return defaultSets;
  }

  selectGroup(group: ExerciseGroup): void {
    if (!group.exercises || group.exercises.length === 0) return;
    
    // If all exercises are already selected, deselect them
    if (this.isGroupSelected(group)) {
      group.exercises.forEach(groupEx => {
        const index = this.selectedExercises.findIndex(selEx => selEx.exerciseId === groupEx.exerciseId);
        if (index !== -1) {
          this.selectedExercises.splice(index, 1);
        }
      });
    } else {
      // Add all exercises from the group with their default sets
      group.exercises.forEach(groupEx => {
        if (!this.selectedExercises.some(selEx => selEx.exerciseId === groupEx.exerciseId)) {
          const exerciseCopy: Exercise = {
            ...groupEx,
            sets: groupEx.sets && groupEx.sets.length > 0 
              ? groupEx.sets.map(set => ({ ...set })) 
              : this.getDefaultSets(groupEx)
          };
          this.selectedExercises.push(exerciseCopy);
        }
      });
    }
  }

  addGroup(group: ExerciseGroup, event: Event): void {
    event.stopPropagation();
    this.selectGroup(group);
  }

  removeExercise(index: number): void {
    this.selectedExercises.splice(index, 1);
  }

  getSelectedExercisesCount(): number {
    return this.selectedExercises.length;
  }

  getSetsDisplay(exercise: Exercise): string {
    if (!exercise.sets || exercise.sets.length === 0) {
      return 'No sets';
    }
    const setCount = exercise.sets.length;
    const avgReps = Math.round(
      exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0) / setCount
    );
    if (exercise.category === 'Cardio') {
      const totalDuration = exercise.sets.reduce((sum, set) => sum + (set.restTime || 0), 0);
      const minutes = Math.round(totalDuration / 60);
      return `${setCount} set${setCount > 1 ? 's' : ''} × ${minutes} min`;
    }
    return `${setCount} set${setCount > 1 ? 's' : ''} × ${avgReps} rep${avgReps > 1 ? 's' : ''}`;
  }

  editExerciseSets(exercise: Exercise, index: number): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'save',
        text: 'Save Configuration',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    const dialogRef = this.dialogService.openDialog(ExerciseSetsConfigDialogComponent, {
      title: 'Edit Exercise Sets',
      width: '600px',
      data: {
        exercise: exercise,
        mode: 'edit'
      },
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Check if result has form data (not just action), it means form was submitted successfully
      if (result && (result.sets || (!result.action && result !== null))) {
        // Update the selected exercise's sets
        this.selectedExercises[index].sets = result.sets;
        // Details are computed dynamically via getSetsDisplay() method, so no need to store them
      }
    });
  }

  viewExercise(exercise: Exercise, event: Event): void {
    event.stopPropagation();
    const footerActions: DialogFooterAction[] = [
      {
        id: 'duplicate',
        text: 'Duplicate',
        color: 'primary',
        appearance: 'basic'
      },
      {
        id: 'cancel',
        text: 'Close',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    this.dialogService.openDialog(ExerciseCreateComponent, {
      title: 'View Exercise',
      width: '900px',
      data: {
        mode: 'view',
        exercise: exercise
      },
      footerActions: footerActions
    });
  }

  viewGroup(group: ExerciseGroup, event: Event): void {
    event.stopPropagation();
    // Open group view dialog or show group details
    console.log('View group:', group);
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  onConfirm(): void {
    if (this.selectedExercises.length > 0) {
      this.dialogRef.close({
        action: 'assign',
        exercises: this.selectedExercises,
        assignmentDate: this.assignmentDate,
        endDate: this.endDate
      });
    }
  }

  get canAssign(): boolean {
    return this.selectedExercises.length > 0;
  }
}
