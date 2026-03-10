import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IconComponent, AppButtonComponent, DialogboxService, DialogFooterAction } from '@lk/core';
import { ExerciseAssignmentDialogComponent } from '../../../../exercise-assignment-dialog/exercise-assignment-dialog.component';
import { ExerciseSetsConfigDialogComponent } from '../../../../exercise-sets-config-dialog/exercise-sets-config-dialog.component';
import { ExerciseListComponent } from '../../../../../components/exercise-list/exercise-list.component';
import { Exercise } from '../../../../../interfaces/exercise.interface';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';

interface AssignedExercise {
  exercise: Exercise;
  assignedDate: Date;
  dueDate: Date | null;
  status: string;
}

@Component({
  selector: 'app-exercise-assignment-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, IconComponent, AppButtonComponent, ExerciseListComponent,TranslatePipe],
  templateUrl: './exercise-assignment-tab.component.html',
  styleUrl: './exercise-assignment-tab.component.scss'
})
export class ExerciseAssignmentTabComponent implements OnInit {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  assignedExercises: AssignedExercise[] = [];
  exerciseAssignments: any[] = [];

  constructor(private readonly dialogService: DialogboxService) {}

  ngOnInit(): void {}

  getActiveAssignmentsCount(): number {
    return this.assignedExercises.filter(a => a.status === 'Active').length;
  }

  getCompletedAssignmentsCount(): number {
    return this.assignedExercises.filter(a => a.status === 'Completed').length;
  }

  getUniqueCategoriesCount(): number {
    const categories = new Set(this.assignedExercises.map(a => a.exercise.category).filter(Boolean));
    return categories.size;
  }

  getAverageReps(sets: any[]): number {
    if (!sets || sets.length === 0) return 0;
    return Math.round(sets.reduce((sum, s) => sum + (s.reps || 0), 0) / sets.length);
  }

  openExerciseAssignmentDialog(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'basic' },
      { id: 'assign', text: 'Assign Exercises', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(ExerciseAssignmentDialogComponent, {
      title: `Assign Exercises to ${this.patientName}`,
      data: { patientName: this.patientName, patientId: this.patientId, exerciseGroups: [], availableExercises: [] },
      width: '90%', height: '95%', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'assign' && result.exercises?.length > 0) {
        result.exercises.forEach((exercise: Exercise) => {
          this.assignedExercises.push({
            exercise, assignedDate: result.assignmentDate || new Date(),
            dueDate: result.endDate || null, status: 'Active'
          });
        });
      }
    });
  }

  editExerciseSets(assignment: AssignedExercise): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'save', text: 'Save Sets', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(ExerciseSetsConfigDialogComponent, {
      title: `Configure Sets: ${assignment.exercise.name}`,
      data: { exercise: assignment.exercise },
      width: '600px', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'save' && result.sets) {
        assignment.exercise = { ...assignment.exercise, sets: result.sets };
      }
    });
  }

  removeExercise(assignment: AssignedExercise): void {
    this.assignedExercises = this.assignedExercises.filter(a => a !== assignment);
  }
}
