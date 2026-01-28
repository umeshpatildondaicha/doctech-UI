import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN } from '@lk/core';
import { Diet, Ingredient, Recipe } from '../../interfaces/diet.interface';
import { Mode } from '../../types/mode.type';
import { Subject, takeUntil, filter } from 'rxjs';

export interface DialogData {
  diet?: Diet;
  mode: Mode;
}

@Component({
    selector: 'app-diet-create',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule
    ],
    templateUrl: './diet-create.component.html',
    styleUrl: './diet-create.component.scss'
})
export class DietCreateComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<DietCreateComponent>);
  data = inject<DialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  dietForm: FormGroup;
  mode: Mode = 'create';
  submitButtonText: string = 'Create Diet';
  dialogTitle: string = 'Create Diet';
  isViewMode: boolean = false;
  imagePreview: string | null = null;
  selectedFileName: string | null = null;

  constructor() {
    this.mode = this.data?.mode || 'create';
    this.isViewMode = this.mode === 'view';
    this.submitButtonText = this.getSubmitButtonText();
    this.dialogTitle = this.getDialogTitle();
    
    this.dietForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      dietType: ['', Validators.required],
      calories: ['', [Validators.required, Validators.min(0), Validators.max(5000)]],
      protein: ['', [Validators.required, Validators.min(0), Validators.max(500)]],
      carbs: ['', [Validators.required, Validators.min(0), Validators.max(1000)]],
      fat: ['', [Validators.required, Validators.min(0), Validators.max(200)]],
      fiber: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      imageUrl: [''],
      videoUrl: [''],
      documentUrl: [''],
      tags: [''],
      // Ingredients array
      ingredients: this.fb.array([]),
      // Recipe fields
      prepTime: ['', [Validators.min(0), Validators.max(300)]],
      cookTime: ['', [Validators.min(0), Validators.max(300)]],
      servings: ['', [Validators.min(1), Validators.max(20)]],
      difficulty: ['Easy'],
      instructions: [''],
      tips: [''],
      notes: ['']
    });

    // If editing or viewing existing diet, populate form
    if (this.data?.diet) {
      this.dietForm.patchValue({
        name: this.data.diet.name,
        description: this.data.diet.description,
        dietType: this.data.diet.dietType,
        calories: this.data.diet.calories,
        protein: this.data.diet.protein,
        carbs: this.data.diet.carbs,
        fat: this.data.diet.fat,
        fiber: this.data.diet.fiber,
        imageUrl: this.data.diet.imageUrl || '',
        videoUrl: this.data.diet.videoUrl || '',
        documentUrl: this.data.diet.documentUrl || '',
        tags: this.data.diet.tags ? this.data.diet.tags.join(', ') : ''
      });

      // Disable form in view mode
      if (this.isViewMode) {
        this.dietForm.disable();
      }
    }
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel' || result?.action === 'delete')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }

      if (result?.action === 'delete') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'delete', diet: this.data?.diet });
        }, 0);
        return;
      }
      
      if (result?.action === 'save') {
        if (this.dietForm.valid && !this.isViewMode) {
          const formValue = this.dietForm.value;
          
          // Convert tags string to array
          const tags = formValue.tags ? 
            formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : 
            [];

          // Convert ingredients form array to Ingredient objects
          const ingredients: Ingredient[] = formValue.ingredients.map((ingredient: any, index: number) => ({
            ingredientId: `ingredient_${index + 1}`,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category || undefined,
            notes: ingredient.notes || undefined
          }));

          // Create recipe object
          const recipe: Recipe = {
            recipeId: `recipe_${Date.now()}`,
            prepTime: formValue.prepTime || 0,
            cookTime: formValue.cookTime || 0,
            servings: formValue.servings || 1,
            difficulty: formValue.difficulty || 'Easy',
            instructions: this.getInstructionsArray().map((instruction, index) => ({
              stepNumber: index + 1,
              instruction: instruction.trim()
            })),
            tips: this.getTipsArray(),
            notes: formValue.notes || undefined
          };

          const dietData: Partial<Diet> = {
            name: formValue.name,
            description: formValue.description,
            dietType: formValue.dietType,
            calories: formValue.calories,
            protein: formValue.protein,
            carbs: formValue.carbs,
            fat: formValue.fat,
            fiber: formValue.fiber,
            imageUrl: formValue.imageUrl || undefined,
            videoUrl: formValue.videoUrl || undefined,
            documentUrl: formValue.documentUrl || undefined,
            tags: tags.length > 0 ? tags : undefined,
            ingredients: ingredients.length > 0 ? ingredients : undefined,
            recipe: recipe,
            createdByDoctorId: 'doc1', // TODO: Get from auth service
            createdAt: new Date(),
            isActive: true
          };

          setTimeout(() => {
            this.dialogRef.close(dietData);
          }, 0);
        } else if (this.isViewMode) {
          setTimeout(() => {
            this.dialogRef.close();
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

  getSubmitButtonText(): string {
    switch (this.mode) {
      case 'create':
        return 'Create Diet';
      case 'edit':
        return 'Save Changes';
      case 'view':
        return 'Close';
      default:
        return 'Create Diet';
    }
  }

  getDialogTitle(): string {
    switch (this.mode) {
      case 'create':
        return 'Create Diet';
      case 'edit':
        return 'Edit Diet';
      case 'view':
        return 'View Diet';
      default:
        return 'Create Diet';
    }
  }

  getTagsArray(): string[] {
    const tagsValue = this.dietForm.get('tags')?.value;
    if (!tagsValue) return [];
    return tagsValue.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
  }

  onEdit() {
    // Switch to edit mode
    this.mode = 'edit';
    this.isViewMode = false;
    this.dietForm.enable();
    this.submitButtonText = this.getSubmitButtonText();
    this.dialogTitle = this.getDialogTitle();
  }

  onDelete() {
    // TODO: Implement delete confirmation dialog
    console.log('Delete diet:', this.data?.diet);
    this.dialogRef.close({ action: 'delete', diet: this.data?.diet });
  }

  onSubmit() {
    // This method is kept for backward compatibility but form submission is handled in ngOnInit via beforeClosed()
    // The footer action will trigger the beforeClosed() subscription
  }

  onCancel() {
    // This method is kept for backward compatibility but cancellation is handled in ngOnInit via beforeClosed()
    // The footer action will trigger the beforeClosed() subscription
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.createImagePreview(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.selectedFileName = file.name;
        this.createImagePreview(file);
      }
    }
  }

  createImagePreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }

  // Ingredients methods
  get ingredientsArray(): FormArray {
    return this.dietForm.get('ingredients') as FormArray;
  }

  addIngredient(): void {
    const ingredientGroup = this.fb.group({
      name: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      category: [''],
      notes: ['']
    });
    this.ingredientsArray.push(ingredientGroup);
  }

  removeIngredient(index: number): void {
    this.ingredientsArray.removeAt(index);
  }

  // Recipe methods
  getInstructionsArray(): string[] {
    const instructionsValue = this.dietForm.get('instructions')?.value;
    return instructionsValue ? instructionsValue.split('\n').filter((instruction: string) => instruction.trim()) : [];
  }

  getTipsArray(): string[] {
    const tipsValue = this.dietForm.get('tips')?.value;
    return tipsValue ? tipsValue.split('\n').filter((tip: string) => tip.trim()) : [];
  }
}
