import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExerciseCardComponent } from '../exercise-card/exercise-card.component';
import { Exercise } from '../../interfaces/exercise.interface';
import { AppButtonComponent } from '@lk/core';

export interface ExerciseListConfig {
  showFilters?: boolean;
  showViewToggle?: boolean;
  showActions?: boolean;
  allowSelection?: boolean;
  selectionMode?: 'single' | 'multiple';
  displayMode?: 'cards' | 'list';
  showGroupView?: boolean;
  onSelectAction?: (exercise: Exercise) => void;
  selectButtonText?: string;
  selectButtonIcon?: string;
}

@Component({
    selector: 'app-exercise-list',
    imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ExerciseCardComponent,
    AppButtonComponent
],
    templateUrl: './exercise-list.component.html',
    styleUrl: './exercise-list.component.scss'
})
export class ExerciseListComponent implements OnInit {
  @Input() exercises: Exercise[] = [];
  @Input() exerciseGroups?: any[] = [];
  @Input() config: ExerciseListConfig = {
    showFilters: true,
    showViewToggle: false,
    showActions: true,
    allowSelection: false,
    selectionMode: 'multiple',
    displayMode: 'cards',
    showGroupView: false
  };
  @Input() selectedExercises: Exercise[] = [];
  
  @Output() exerciseSelected = new EventEmitter<Exercise>();
  @Output() exerciseUnselected = new EventEmitter<Exercise>();
  @Output() exerciseView = new EventEmitter<Exercise>();
  @Output() exerciseEdit = new EventEmitter<Exercise>();
  @Output() exerciseDelete = new EventEmitter<Exercise>();
  @Output() groupSelected = new EventEmitter<any>();

  searchQuery: string = '';
  selectedCategory: string = '';
  selectedDifficulty: string = '';
  viewMode: 'cards' | 'list' = 'cards';

  categories = [
    { label: 'All Categories', value: '' },
    { label: 'Strength', value: 'Strength' },
    { label: 'Cardio', value: 'Cardio' },
    { label: 'Flexibility', value: 'Flexibility' },
    { label: 'Balance', value: 'Balance' }
  ];

  difficulties = [
    { label: 'All Difficulties', value: '' },
    { label: 'Beginner', value: 'Beginner' },
    { label: 'Intermediate', value: 'Intermediate' },
    { label: 'Advanced', value: 'Advanced' }
  ];

  ngOnInit() {
    this.viewMode = this.config.displayMode || 'cards';
  }

  getFilteredExercises(): Exercise[] {
    return this.exercises.filter(exercise => {
      const matchesSearch = !this.searchQuery || 
        exercise.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        exercise.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchesCategory = !this.selectedCategory || exercise.category === this.selectedCategory;
      const matchesDifficulty = !this.selectedDifficulty || exercise.difficulty === this.selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }

  getFilteredGroups(): any[] {
    if (!this.exerciseGroups) return [];
    return this.exerciseGroups.filter(group => {
      const matchesSearch = !this.searchQuery || 
        group.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchesSearch;
    });
  }

  isExerciseSelected(exercise: Exercise): boolean {
    return this.selectedExercises.some(ex => ex.exerciseId === exercise.exerciseId);
  }

  toggleExerciseSelection(exercise: Exercise): void {
    if (this.isExerciseSelected(exercise)) {
      this.selectedExercises = this.selectedExercises.filter(ex => ex.exerciseId !== exercise.exerciseId);
      this.exerciseUnselected.emit(exercise);
    } else {
      if (this.config.selectionMode === 'single') {
        this.selectedExercises = [exercise];
      } else {
        this.selectedExercises = [...this.selectedExercises, exercise];
      }
      this.exerciseSelected.emit(exercise);
    }
  }

  onSelectExercise(exercise: Exercise): void {
    if (this.config.allowSelection) {
      this.toggleExerciseSelection(exercise);
    } else if (this.config.onSelectAction) {
      this.config.onSelectAction(exercise);
    }
  }

  onViewExercise(exercise: Exercise): void {
    this.exerciseView.emit(exercise);
  }

  onEditExercise(exercise: Exercise): void {
    this.exerciseEdit.emit(exercise);
  }

  onDeleteExercise(exercise: Exercise): void {
    this.exerciseDelete.emit(exercise);
  }

  onSelectGroup(group: any): void {
    this.groupSelected.emit(group);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedDifficulty = '';
  }

  getSetsDisplay(exercise: Exercise): string {
    if (!exercise.sets || exercise.sets.length === 0) {
      return 'No sets defined';
    }
    const setCount = exercise.sets.length;
    const totalReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
    return `${setCount} set${setCount > 1 ? 's' : ''}, ${totalReps} reps total`;
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Strength': '#ff6b6b',
      'Cardio': '#4ecdc4',
      'Flexibility': '#95e1d3',
      'Balance': '#f38181'
    };
    return colors[category] || '#95a5a6';
  }
}


