import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Diet } from '../../interfaces/diet.interface';
import {
  ListingCardAction,
  ListingCardBadge,
  ListingCardComponent,
  ListingCardStat
} from '../listing-card/listing-card.component';

@Component({
    selector: 'app-diet-card',
    imports: [
    ListingCardComponent
],
    templateUrl: './diet-card.component.html',
    styleUrl: './diet-card.component.scss'
})
export class DietCardComponent {
  @Input() diet!: Diet;
  @Input() showActions: boolean = true;
  @Input() clickable: boolean = true;

  @Output() cardClick = new EventEmitter<Diet>();
  @Output() viewClick = new EventEmitter<Diet>();
  @Output() editClick = new EventEmitter<Diet>();
  @Output() deleteClick = new EventEmitter<Diet>();
  @Output() videoClick = new EventEmitter<string>();
  @Output() pdfClick = new EventEmitter<string>();

  onCardClick(): void {
    if (this.clickable) {
      this.cardClick.emit(this.diet);
    }
  }

  emitView(): void {
    this.viewClick.emit(this.diet);
  }

  emitEdit(): void {
    this.editClick.emit(this.diet);
  }

  emitDelete(): void {
    this.deleteClick.emit(this.diet);
  }

  emitVideo(url: string): void {
    this.videoClick.emit(url);
  }

  emitPdf(url: string): void {
    this.pdfClick.emit(url);
  }

  get dietBadge(): ListingCardBadge {
    return {
      text: this.diet?.dietType || '',
      backgroundColor: this.getDietTypeColor(this.diet?.dietType)
    };
  }

  get goalBadge(): ListingCardBadge {
    const goal = this.getDietGoalLabel();
    return {
      text: goal,
      backgroundColor: '#6c757d'
    };
  }

  get primaryAction(): ListingCardAction {
    return { id: 'view', label: 'View Plan', icon: 'visibility', tooltip: 'View diet plan' };
  }

  get iconActions(): ListingCardAction[] {
    if (!this.showActions) return [];
    return [
      { id: 'edit', label: 'Edit', icon: 'edit', tooltip: 'Edit diet' },
      { id: 'delete', label: 'Delete', icon: 'delete', tooltip: 'Delete diet' }
    ];
  }

  get nutritionStats(): ListingCardStat[] {
    if (!this.diet) return [];
    return [
      { label: 'Calories', value: this.diet.calories, unit: 'kcal', icon: 'local_fire_department' },
      { label: 'Protein', value: this.diet.protein, unit: 'g', icon: 'fitness_center' },
      { label: 'Carbs', value: this.diet.carbs, unit: 'g', icon: 'grain' },
      { label: 'Fat', value: this.diet.fat, unit: 'g', icon: 'water_drop' }
    ];
  }

  onListingAction(action: ListingCardAction): void {
    switch (action.id) {
      case 'view':
        this.emitView();
        break;
      case 'edit':
        this.emitEdit();
        break;
      case 'delete':
        this.emitDelete();
        break;
      case 'video':
        if (this.diet?.videoUrl) this.emitVideo(this.diet.videoUrl);
        break;
      case 'pdf':
        if (this.diet?.documentUrl) this.emitPdf(this.diet.documentUrl);
        break;
    }
  }

  private getDietGoalLabel(): string {
    const tags = (this.diet?.tags || []).map(t => t.toLowerCase());
    if (tags.some(t => t.includes('high-protein') || t.includes('protein'))) return 'Muscle Gain';
    if (tags.some(t => t.includes('keto') || t.includes('low-carb'))) return 'Weight Loss';
    if (tags.some(t => t.includes('diabetic') || t.includes('low-gi'))) return 'Balanced';
    if (tags.some(t => t.includes('cardiac') || t.includes('low-sodium'))) return 'Low Fat';
    return 'Balanced';
  }

  private getDietTypeColor(type?: string): string {
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'mediterranean':
        return '#28a745';
      case 'keto':
        return '#1976d2';
      case 'vegan':
        return '#20c997';
      case 'vegetarian':
        return '#fd7e14';
      case 'paleo':
        return '#e83e8c';
      case 'cardiac':
        return '#1976d2';
      default:
        return '#6c757d';
    }
  }
}


