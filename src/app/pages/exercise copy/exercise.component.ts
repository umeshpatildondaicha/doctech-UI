import { Component, OnInit, OnDestroy } from '@angular/core';

import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { GridComponent, DialogboxService, DialogFooterAction, AppInputComponent, AppButtonComponent, CoreEventService, BreadcrumbItem } from "@lk/core";
import { ExerciseSet, Exercise, ExerciseStats } from '../../interfaces/exercise.interface';
import { IconComponent } from "@lk/core";
import { ExerciseCreateComponent } from '../exercise-create/exercise-create.component';
import { ExerciseSetCreateComponent } from '../exercise-set-create/exercise-set-create.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExerciseCardComponent } from '../../components/exercise-card/exercise-card.component';
import { ExerciseService } from '../../services/exercise.service';

@Component({
    selector: 'app-exercise',
    imports: [
    MatTabsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    AppButtonComponent,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatSelectModule,
    GridComponent,
    IconComponent,
    FormsModule,
    ReactiveFormsModule,
    ExerciseCardComponent,
    AppInputComponent
],
    templateUrl: './exercise.component.html',
    styleUrl: './exercise.component.scss'
})
export class ExerciseComponent implements OnInit, OnDestroy {
  breadcrumb: BreadcrumbItem[] = [{ label: 'Exercises', route: '/exercises' }];
  selectedTabIndex = 0;
  searchQuery: string = '';
  viewMode: 'cards' | 'table' = 'cards';
  selectedCategory: string = 'all';
  selectedDifficulty: string = 'all';
  individualExercisesCount = 0;
   groupExercisesCount = 0;


  constructor(
    private dialogService: DialogboxService,
    private eventService: CoreEventService,
    private exerciseService :ExerciseService,
  ) {}

  ngOnInit() {
    this.eventService.setBreadcrumb(this.breadcrumb);
    this.initializeGridOptions();
    this.calculateStats();
  }

  ngOnDestroy() {
    this.eventService.clearBreadcrumb();
  }

  // Sample data for Exercises with enhanced structure
  exercises: Exercise[] = [
    {
      exerciseId: 'EX001',
      name: 'ABC',
      description: 'Description',
      createdByDoctorId: 'DOC001',
      exerciseType: 'Strength',
      category: 'Strength',
      difficulty: 'Beginner',
      targetMuscles: ['Target Muscles'],
      equipment: ['Bodyweight'],
      tags: ['Tags'],
      coachingCues: 'Keep your form steady',
      contraindications: 'Avoid if you have back pain',
      sets: [
        {
          setId: 'SET001',
          exerciseId: 'EX001',
          setNumber: 1,
          reps: 8,
          holdTime: 0,
          restTime: 60,
          tempo: 'tempo'
        },
        {
          setId: 'SET002',
          exerciseId: 'EX001',
          setNumber: 2,
          reps: 8,
          holdTime: 0,
          restTime: 60,
          tempo: 'tempo'
        }
      ],
      media: [],
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      exerciseId: 'EX002',
      name: 'Goblet Squat',
      description: 'Lower-body exercise',
      createdByDoctorId: 'DOC002',
      exerciseType: 'Strength',
      category: 'Strength',
      difficulty: 'Beginner',
      targetMuscles: ['Quads', 'Glutes'],
      equipment: ['Dumbbell'],
      tags: ['legs', 'squat'],
      coachingCues: 'Keep your chest up and knees behind toes',
      contraindications: 'Avoid if you have knee problems',
      sets: [
        {
          setId: 'SET003',
          exerciseId: 'EX002',
          setNumber: 1,
          reps: 12,
          holdTime: 0,
          restTime: 60,
          tempo: 'tempo'
        }
      ],
      media: [],
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      exerciseId: 'EX003',
      name: 'Push Ups',
      description: 'Push movement',
      createdByDoctorId: 'DOC001',
      exerciseType: 'Strength',
      category: 'Strength',
      difficulty: 'Beginner',
      targetMuscles: ['Chest', 'Triceps'],
      equipment: ['Bodyweight'],
      tags: ['upper body'],
      coachingCues: 'Maintain a straight line from head to heels',
      contraindications: 'Avoid if you have shoulder issues',
      sets: [
        {
          setId: 'SET004',
          exerciseId: 'EX003',
          setNumber: 1,
          reps: 10,
          holdTime: 0,
          restTime: 60,
          tempo: 'tempo'
        }
      ],
      media: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      exerciseId: 'EX004',
      name: 'Plank Hold',
      description: 'Core strengthening exercise',
      createdByDoctorId: 'DOC002',
      exerciseType: 'Core',
      category: 'Core',
      difficulty: 'Intermediate',
      targetMuscles: ['Core', 'Shoulders'],
      equipment: ['Bodyweight'],
      tags: ['core', 'stability'],
      coachingCues: 'Keep your body in a straight line',
      contraindications: 'Avoid if you have back pain',
      sets: [
        {
          setId: 'SET005',
          exerciseId: 'EX004',
          setNumber: 1,
          reps: 1,
          holdTime: 30,
          restTime: 60,
          tempo: 'hold'
        }
      ],
      media: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      exerciseId: 'EX005',
      name: 'Jumping Jacks',
      description: 'Cardiovascular exercise',
      createdByDoctorId: 'DOC001',
      exerciseType: 'Cardio',
      category: 'Cardio',
      difficulty: 'Beginner',
      targetMuscles: ['Full Body'],
      equipment: ['Bodyweight'],
      tags: ['cardio', 'full body'],
      coachingCues: 'Land softly and maintain rhythm',
      contraindications: 'Avoid if you have joint issues',
      sets: [
        {
          setId: 'SET006',
          exerciseId: 'EX005',
          setNumber: 1,
          reps: 20,
          holdTime: 0,
          restTime: 30,
          tempo: 'fast'
        }
      ],
      media: [],
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  exerciseStats: ExerciseStats = {
    totalExercises: 5,
    categories: { 'Strength': 3, 'Core': 1, 'Cardio': 1 },
    topMuscles: ['Chest', 'Quads', 'Core']
  };

  exerciseGridOptions: any = {};
  exerciseSetGridOptions: any = {};

  // Sample data for Exercise Groups
  exerciseGroups: any[] = [
    {
      groupId: 'GROUP001',
      groupName: 'Upper Body Strength',
      description: 'Complete upper body workout focusing on chest, shoulders, and arms',
      category: 'strength',
      difficulty: 'intermediate',
      exercises: [this.exercises[0], this.exercises[1]],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      groupId: 'GROUP002',
      groupName: 'Core Stability',
      description: 'Core strengthening exercises for better stability and posture',
      category: 'strength',
      difficulty: 'beginner',
      exercises: [this.exercises[2]],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      groupId: 'GROUP003',
      groupName: 'Full Body Workout',
      description: 'Complete body workout targeting all major muscle groups',
      category: 'functional',
      difficulty: 'advanced',
      exercises: [this.exercises[0], this.exercises[1], this.exercises[2]],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05')
    }
  ];

  // Group filter properties
  groupSearchQuery: string = '';
  selectedGroupCategory: string = '';
  selectedGroupDifficulty: string = '';

  // Group categories and difficulties
  groupCategories = [
    { label: 'Strength Training', value: 'strength' },
    { label: 'Cardio', value: 'cardio' },
    { label: 'Flexibility', value: 'flexibility' },
    { label: 'Balance', value: 'balance' },
    { label: 'Functional', value: 'functional' },
    { label: 'Sports Specific', value: 'sports' },
    { label: 'Rehabilitation', value: 'rehabilitation' }
  ];

  groupDifficulties = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
    { label: 'Expert', value: 'expert' }
  ];

  // Column definitions for Exercise Sets grid
  exerciseSetColumns = [
    { field: 'setNumber', headerName: 'Set Number', sortable: true, filter: true },
    { field: 'reps', headerName: 'Reps', sortable: true, filter: true },
    { field: 'holdTime', headerName: 'Hold Time (sec)', sortable: true, filter: true },
    { field: 'restTime', headerName: 'Rest Time (sec)', sortable: true, filter: true }
  ];

  // Column definitions for Exercises grid
  exerciseColumns = [
    { field: 'name', headerName: 'Name', sortable: true, filter: true },
    { field: 'category', headerName: 'Category', sortable: true, filter: true },
    { field: 'difficulty', headerName: 'Difficulty', sortable: true, filter: true },
    { 
      field: 'sets', 
      headerName: 'Sets/Reps', 
      sortable: true, 
      filter: true,
      valueGetter: (params: any) => {
        const sets = params.data.sets;
        if (sets && sets.length > 0) {
          return `${sets.length}/${sets[0].reps}`;
        }
        return '0/0';
      }
    },
    { 
      field: 'targetMuscles', 
      headerName: 'Muscles', 
      sortable: true, 
      filter: true,
      valueGetter: (params: any) => {
        return params.data.targetMuscles?.join(', ') || '';
      }
    },
    { field: 'actions', headerName: 'Actions', sortable: false, filter: false }
  ];

  // Filter options
  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Strength', label: 'Strength' },
    { value: 'Cardio', label: 'Cardio' },
    { value: 'Core', label: 'Core' },
    { value: 'Flexibility', label: 'Flexibility' },
    { value: 'Balance', label: 'Balance' }
  ];

  difficulties = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' }
  ];
  loadExerciseCounts() {

    // 🔹 Individual Exercise Count
    this.exerciseService.getIndividualExerciseCount().subscribe({
      next: (res: any) => {
        console.log('Individual Exercise Count API =>', res);
        this.individualExercisesCount = res;
      },
      error: () => this.individualExercisesCount = 0
    });
  
    // 🔹 Group Exercise Count
    this.exerciseService.getGroupExercisesCount().subscribe({
      next: (res: any) => {
        console.log('Group Exercise Count API =>', res);
        this.groupExercisesCount = res;
      },
      error: () => this.groupExercisesCount = 0
    });
  }
  

  calculateStats() {
    this.exerciseStats = {
      totalExercises: this.exercises.length,
      categories: {},
      topMuscles: []
    };

    // Calculate categories
    this.exercises.forEach(exercise => {
      this.exerciseStats.categories[exercise.category] = 
        (this.exerciseStats.categories[exercise.category] || 0) + 1;
    });

    // Get top muscles
    const muscleCount: { [key: string]: number } = {};
    this.exercises.forEach(exercise => {
      exercise.targetMuscles.forEach(muscle => {
        muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
      });
    });

    this.exerciseStats.topMuscles = Object.keys(muscleCount)
      .sort((a, b) => muscleCount[b] - muscleCount[a])
      .slice(0, 5);
  }

  initializeGridOptions() {
    this.exerciseGridOptions.menuActions = [
      {
        "title": "View",
        "icon": "remove_red_eye",
        "click": (param: any) => { this.onViewExercise(param) }
      },
      {
        "title": "Edit",
        "icon": "edit",
        "click": (param: any) => { this.onEditExercise(param) }
      },
      {
        "title": "Duplicate",
        "icon": "content_copy",
        "click": (param: any) => { this.onDuplicateExercise(param) }
      },
      {
        "title": "Delete",
        "icon": "delete",
        "click": (param: any) => { this.onDeleteExercise(param) }
      },
    ];
  }

  getFilteredExercises() {
    let filtered = this.exercises;

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        exercise.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        exercise.category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        exercise.targetMuscles.some(muscle => 
          muscle.toLowerCase().includes(this.searchQuery.toLowerCase())
        ) ||
        exercise.tags.some(tag => 
          tag.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      );
    }

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === this.selectedCategory);
    }

    // Apply difficulty filter
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(exercise => exercise.difficulty === this.selectedDifficulty);
    }

    return filtered;
  }

  getSetsDisplay(exercise: Exercise): string {
    if (!exercise.sets || exercise.sets.length === 0) {
      return '0 sets';
    }
    return `${exercise.sets.length} sets`;
  }

  getTotalSets(): number {
    return this.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  }

  getAverageReps(): number {
    const allSets = this.exercises.flatMap(exercise => exercise.sets);
    if (allSets.length === 0) return 0;
    const totalReps = allSets.reduce((sum, set) => sum + set.reps, 0);
    return Math.round(totalReps / allSets.length);
  }

  getCategoryBreakdown(): string {
    const categories = Object.entries(this.exerciseStats.categories);
    return categories.map(([category, count]) => `${category}: ${count}`).join(', ');
  }

  getCategoryCount(): number {
    return Object.keys(this.exerciseStats.categories).length;
  }

  onViewExercise(param: any) {
    console.log('View exercise:', param);
    this.onAddExercise('view', param?.data);
  }

  onEditExercise(param: any) {
    console.log('Edit exercise:', param);
    this.onAddExercise('edit', param?.data);
  }

  onDuplicateExercise(param: any) {
    console.log('Duplicate exercise:', param);
    if (param?.data) {
      const duplicatedExercise = {
        ...param.data,
        exerciseId: 'EX' + Date.now(),
        name: param.data.name + ' (Copy)',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.exercises.push(duplicatedExercise);
      this.exercises = [...this.exercises];
      this.calculateStats();
    }
  }

  onDeleteExercise(param: any) {
    console.log('Delete exercise:', param);
    if (param?.data) {
      const index = this.exercises.findIndex(e => e.exerciseId === param.data.exerciseId);
      if (index !== -1) {
        this.exercises.splice(index, 1);
        this.exercises = [...this.exercises];
        this.calculateStats();
      }
    }
  }

  onTabChange(event: any) {
    this.selectedTabIndex = event.index;
  }

  onExerciseRowClick(event: any) {
    console.log('Exercise clicked:', event.data);
  }

  // Group dashboard methods
  getTotalExercisesInGroups(): number {
    return this.exerciseGroups.reduce((total, group) => total + group.exercises.length, 0);
  }

  getGroupCategoriesCount(): number {
    const categories = new Set(this.exerciseGroups.map(group => group.category).filter(Boolean));
    return categories.size;
  }

  getFilteredGroups(): any[] {
    return this.exerciseGroups.filter(group => {
      const matchesSearch = !this.groupSearchQuery || 
        group.groupName.toLowerCase().includes(this.groupSearchQuery.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(this.groupSearchQuery.toLowerCase())) ||
        group.exercises.some((exercise: any) => exercise.name.toLowerCase().includes(this.groupSearchQuery.toLowerCase()));

      const matchesCategory = !this.selectedGroupCategory || group.category === this.selectedGroupCategory;
      const matchesDifficulty = !this.selectedGroupDifficulty || group.difficulty === this.selectedGroupDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }

  onGroupCategoryChange(): void {
    // Filter will be applied automatically in getFilteredGroups()
  }

  onGroupDifficultyChange(): void {
    // Filter will be applied automatically in getFilteredGroups()
  }

  clearGroupFilters(): void {
    this.groupSearchQuery = '';
    this.selectedGroupCategory = '';
    this.selectedGroupDifficulty = '';
  }

  onViewGroup(param: any): void {
    console.log('View group:', param);
    this.onAddExerciseGroup('view', param?.data);
  }

  onEditGroup(param: any): void {
    console.log('Edit group:', param);
    this.onAddExerciseGroup('edit', param?.data);
  }

  onDeleteGroup(param: any): void {
    console.log('Delete group:', param);
    // Add confirmation dialog here
  }

  onExportGroups(): void {
    console.log('Export groups');
    // Add export functionality
  }

  onImportGroups(): void {
    console.log('Import groups');
    // Add import functionality
  }

  onClearGroups(): void {
    console.log('Clear groups');
    // Add confirmation dialog here
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }

  onAddExerciseGroup(mode: string = 'create', param?: any) {
    const title = mode === 'edit' ? 'Edit Exercise Group' : mode === 'view' ? 'View Exercise Group' : 'Create Exercise Group';
    
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      }
    ];

    // Add duplicate action for view mode
    if (mode === 'view' && param) {
      footerActions.push({
        id: 'duplicate',
        text: 'Duplicate',
        color: 'primary',
        appearance: 'flat',
        fontIcon: 'content_copy'
      });
    }

    // Add save action for create/edit modes
    if (mode !== 'view') {
      footerActions.push({
        id: 'save',
        text: mode === 'edit' ? 'Update Exercise Group' : 'Create Exercise Group',
        color: 'primary',
        appearance: 'raised'
      });
    }

    const dialogRef = this.dialogService.openDialog(ExerciseSetCreateComponent, {
      title: title,
      width: '80%',
      height: '90%',
      data: {
        availableExercises: this.exercises,
        mode: mode,
        exerciseGroup: param
      },
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result:any) => {
      // Handle duplicate action - reopen dialog in create mode
      if (result?.action === 'duplicate' && result.exerciseGroup) {
        this.onAddExerciseGroup('create', result.exerciseGroup);
        return;
      }
      
      // Check if result has form data (not just action), it means form was submitted successfully
      if (result && (result.groupId || result.groupName || (!result.action && result !== null))) {
        console.log('New exercise group created:', result);
        // Add the new exercise group to the array
        this.exerciseGroups.push(result);
        // Refresh the groups data
        this.exerciseGroups = [...this.exerciseGroups];
      }
    });
  }

  onAddExercise(mode: string = 'create', param?: Exercise) {
    const title = mode === 'create' ? 'Create Exercise' : mode === 'edit' ? 'Edit Exercise' : 'View Exercise';
    const isViewMode = mode === 'view';
    
    const footerActions: DialogFooterAction[] = [];
    
    if (isViewMode && param) {
      // View mode: Show Duplicate and Close buttons
      footerActions.push({
        id: 'duplicate',
        text: 'Duplicate',
        color: 'primary',
        appearance: 'basic'
      });
      footerActions.push({
        id: 'cancel',
        text: 'Close',
        color: 'primary',
        appearance: 'raised'
      });
    } else {
      // Create/Edit mode: Show Cancel and Submit buttons
      footerActions.push({
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'basic'
      });
      footerActions.push({
        id: 'submit',
        text: mode === 'create' ? 'Create Exercise' : 'Update Exercise',
        color: 'primary',
        appearance: 'raised'
      });
    }

    const dialogRef = this.dialogService.openDialog(ExerciseCreateComponent, {
      title: title,
      width: '80%',
      height: '90%',
      data: {
        mode: mode,
        exercise: param
      },
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === false || result?.action === 'cancel') {
        return;
      }
      
      if (result && (result.exerciseId || result.action === 'submit' || result.action === 'duplicate')) {
        console.log('Exercise operation completed:', result);
        if (mode === 'create' || result.action === 'duplicate') {
          this.exercises.push(result as Exercise);
        } else if (mode === 'edit' && result.action === 'submit') {
          const index = this.exercises.findIndex(e => e.exerciseId === result.exerciseId);
          if (index !== -1) {
            this.exercises[index] = result;
          }
        }
        this.exercises = [...this.exercises];
        this.calculateStats();
      }
    });
  }

  onExport() {
    console.log('Export exercises');
    // Implement export functionality
    const dataStr = JSON.stringify(this.exercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exercises.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  onImport() {
    console.log('Import exercises');
    // Implement import functionality
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const importedExercises = JSON.parse(e.target.result);
            this.exercises = [...this.exercises, ...importedExercises];
            this.calculateStats();
          } catch (error) {
            console.error('Error importing exercises:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  onClear() {
    console.log('Clear exercises');
    if (confirm('Are you sure you want to clear all exercises? This action cannot be undone.')) {
      this.exercises = [];
      this.calculateStats();
    }
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  getExerciseGroupTabs(): { label: string; value: string; count: number }[] {
    const base = [{ label: 'All', value: 'all', count: this.exercises.length }];
    const byCat = this.categories.filter(c => c.value !== 'all').map(c => ({
      label: c.label,
      value: c.value,
      count: this.exercises.filter(e => e.category === c.value).length
    }));
    return [...base, ...byCat];
  }

  selectExerciseCategoryTab(value: string): void {
    this.selectedCategory = value;
  }

  onExerciseSearchInput(): void {
    // Trigger filter recalc on next tick
    this.exercises = [...this.exercises];
  }

  getExerciseGroupsGroupTabs(): { label: string; value: string; count: number }[] {
    const base = [{ label: 'All', value: '', count: this.exerciseGroups.length }];
    const byCat = this.groupCategories.map(c => ({
      label: c.label,
      value: c.value,
      count: this.exerciseGroups.filter(g => g.category === c.value).length
    }));
    return [...base, ...byCat];
  }

  selectGroupCategoryTab(value: string): void {
    this.selectedGroupCategory = value;
  }

  onGroupSearchInput(): void {
    this.exerciseGroups = [...this.exerciseGroups];
  }

  onCategoryChange(event: any) {
    this.selectedCategory = event.value;
  }

  onDifficultyChange(event: any) {
    this.selectedDifficulty = event.value;
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedDifficulty = 'all';
  }
}
