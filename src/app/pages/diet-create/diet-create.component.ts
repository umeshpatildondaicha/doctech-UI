import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { AppButtonComponent, DIALOG_DATA_TOKEN } from '@lk/core';
import { Mode } from '../../types/mode.type';
import { Subject, takeUntil, filter } from 'rxjs';

export interface DialogData {
  diet?: any;  // API diet object (id, nutritionalInformation, mediaLinks, ingredients, recipe)
  mode: Mode;
}

@Component({
    selector: 'app-diet-create',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    AppButtonComponent
],
    templateUrl: './diet-create.component.html',
    styleUrl: './diet-create.component.scss'
})
export class DietCreateComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<DietCreateComponent>);
  data = inject<DialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  difficulty :string = 'EASY';

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
      const d = this.data.diet;
      const nutr = d.nutritionalInformation;
      const firstMedia = Array.isArray(d.mediaLinks) && d.mediaLinks[0] ? d.mediaLinks[0] : {};
      this.dietForm.patchValue({
        name: d.name || '',
        description: d.description || '',
        dietType: d.dietType || '',
        calories: d.calories ?? nutr?.caloriesKcal ?? '',
        protein: d.protein ?? nutr?.protein ?? '',
        carbs: d.carbs ?? nutr?.carbohydrates ?? '',
        fat: d.fat ?? nutr?.fat ?? '',
        fiber: d.fiber ?? nutr?.fiber ?? '',
        imageUrl: d.imageUrl || '',
        videoUrl: firstMedia.youtubeUrl || d.videoUrl || '',
        documentUrl: firstMedia.documentUrl || d.documentUrl || '',
        tags: d.tags ? (Array.isArray(d.tags) ? d.tags.join(', ') : d.tags) : ''
      });

      // Load ingredients
      const ingList = d.ingredients || [];
      this.ingredientsArray.clear();
      ingList.forEach((ing: any) => {
        this.ingredientsArray.push(this.fb.group({
          id: [ing.id ?? null],
          name: [ing.name || ''],
          quantity: [ing.quantity ?? ''],
          unit: [this.mapUnitToFormFormat(ing.unit)],
          category: [ing.category || ''],
          notes: [ing.notes || '']
        }));
      });

      // Load recipe
      const rec = d.recipe || {};
      this.dietForm.patchValue({
        prepTime: rec.preparationTimeMinutes ?? rec.prepTime ?? '',
        cookTime: rec.cookTimeMinutes ?? rec.cookTime ?? '',
        servings: rec.servings ?? '',
        difficulty: rec.difficulty ? this.mapDifficultyToForm(rec.difficulty) : 'Easy',
        instructions: Array.isArray(rec.instructions)
          ? rec.instructions.join('\n')
          : (rec.instructions || ''),
        tips: Array.isArray(rec.cookingTips)
          ? rec.cookingTips.join('\n')
          : (rec.tips || rec.cookingTips || ''),
        notes: rec.recipeNotes ?? rec.notes ?? ''
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
        if (this.isViewMode) {
          setTimeout(() => this.dialogRef.close(), 0);
          return;
        }
        if (this.dietForm.valid) {
          this.handleSaveAndClose();
        } else {
          this.dietForm.markAllAsTouched();
          setTimeout(() => this.dialogRef.close(false), 0);
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

  /** Called when form is submitted (e.g. in-form Save button) - ensures updateDietPlan is triggered */
  onSubmit() {
    if (this.isViewMode) return;
    if (!this.dietForm.valid) {
      this.dietForm.markAllAsTouched();
      return;
    }
    this.handleSaveAndClose();
  }

  private handleSaveAndClose() {
    if (!this.dietForm.valid || this.isViewMode) return;
    const formValue = this.dietForm.value;
    const d = this.data?.diet;
    const isEdit = this.mode === 'edit' && d;

    const nutritionalInformation: any = {
      caloriesKcal: Number(formValue.calories) || 0,
      protein: Number(formValue.protein) || 0,
      carbohydrates: Number(formValue.carbs) || 0,
      fat: Number(formValue.fat) || 0,
      fiber: Number(formValue.fiber) || 0
    };
    if (isEdit && d?.nutritionalInformation?.id != null) nutritionalInformation.id = d.nutritionalInformation.id;

    const youtubeUrl = formValue.videoUrl?.trim() || null;
    const documentUrl = formValue.documentUrl?.trim() || null;
    const mediaLinks: any[] = [];
    if (youtubeUrl || documentUrl) {
      const link: any = { youtubeUrl, documentUrl };
      const firstMedia = Array.isArray(d?.mediaLinks) && d.mediaLinks[0];
      if (isEdit && firstMedia?.id != null) link.id = firstMedia.id;
      mediaLinks.push(link);
    }

    const ingredients = formValue.ingredients.map((ing: any) => {
      const item: any = {
        name: ing.name,
        quantity: Number(ing.quantity) || 0,
        unit: this.mapUnitToApiFormat(ing.unit),
        category: ing.category ? (ing.category + '').toUpperCase() : undefined,
        notes: ing.notes || undefined
      };
      if (isEdit && ing.id != null) item.id = ing.id;
      return item;
    });

    const instructions = this.getInstructionsArray();
    const cookingTips = this.getTipsArray();
    const recipe: any = {
      preparationTimeMinutes: Number(formValue.prepTime) || 0,
      cookTimeMinutes: Number(formValue.cookTime) || 0,
      servings: Number(formValue.servings) || 1,
      difficulty: (formValue.difficulty || 'EASY').toString().toUpperCase(),
      instructions: instructions.map(i => i.trim()).filter(Boolean),
      cookingTips: cookingTips.filter(Boolean),
      recipeNotes: formValue.notes || undefined
    };
    if (isEdit && d?.recipe?.id != null) recipe.id = d.recipe.id;

    const apiPayload: any = {
      name: formValue.name,
      description: formValue.description,
      dietType: formValue.dietType,
      nutritionalInformation,
      mediaLinks,
      ingredients,
      recipe
    };
    if (isEdit && d?.id != null) apiPayload.id = d.id;

    this.dialogRef.close({ action: 'save', payload: apiPayload });
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
      id: [null],
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

  /** Maps form unit values (e.g. KG, ML) to API enum format (e.g. KILOGRAM, MILLILITER) */
  private mapUnitToApiFormat(unit: string | undefined): string {
    const u = (unit || '').trim().toUpperCase();
    const map: Record<string, string> = {
      KG: 'KILOGRAM',
      G: 'GRAM',
      GRAM: 'GRAM',
      ML: 'MILLILITER',
      L: 'LITER',
      TBSP: 'TABLESPOON',
      TSP: 'TEASPOON',
      CUP: 'CUP',
      PIECE: 'PIECE'
    };
    return map[u] || u || 'GRAM';
  }

  /** Maps API unit (e.g. KILOGRAM) to form dropdown value (e.g. KG) */
  private mapUnitToFormFormat(unit: string | undefined): string {
    const u = (unit || '').trim().toUpperCase();
    const map: Record<string, string> = {
      KILOGRAM: 'KG',
      GRAM: 'GRAM',
      MILLILITER: 'ML',
      LITER: 'L',
      TABLESPOON: 'TBSP',
      TEASPOON: 'TSP',
      CUP: 'CUP',
      PIECE: 'PIECE'
    };
    return map[u] || u || 'GRAM';
  }

  /** Maps API difficulty (e.g. MEDIUM) to form value (e.g. Medium) */
  private mapDifficultyToForm(diff: string): string {
    const d = (diff || '').trim().toUpperCase();
    const map: Record<string, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };
    return map[d] || (d.charAt(0) + d.slice(1).toLowerCase()) || 'Easy';
  }
}
