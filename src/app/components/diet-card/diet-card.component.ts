import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Diet } from '../../interfaces/diet.interface';
import {
  ListingCardAction,
  ListingCardBadge,
  ListingCardComponent,
  ListingCardStat
} from '../listing-card/listing-card.component';

@Component({
  selector: 'app-diet-card',
  standalone: true,
  imports: [
    CommonModule,
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

  get headerActions(): ListingCardAction[] {
    const actions: ListingCardAction[] = [
      { id: 'view', label: 'View', icon: 'visibility', style: 'primary', tooltip: 'View diet' }
    ];
    if (this.diet?.videoUrl) {
      actions.push({ id: 'video', label: 'Video', icon: 'play_circle', style: 'accent', tooltip: 'Watch video' });
    }
    if (this.diet?.documentUrl) {
      actions.push({ id: 'pdf', label: 'PDF', icon: 'description', style: 'primary', tooltip: 'View PDF' });
    }
    return actions;
  }

  get footerActions(): ListingCardAction[] {
    if (!this.showActions) return [];
    return [
      { id: 'view', label: 'View', icon: 'visibility', style: 'primary', tooltip: 'View diet' },
      { id: 'edit', label: 'Edit', icon: 'edit', style: 'accent', tooltip: 'Edit diet' },
      { id: 'delete', label: 'Delete', icon: 'delete', style: 'warn', tooltip: 'Delete diet' }
    ];
  }

  get nutritionStats(): ListingCardStat[] {
    if (!this.diet) return [];
    return [
      { label: 'Calories', value: this.diet.calories, unit: 'kcal', icon: 'local_fire_department' },
      { label: 'Protein', value: this.diet.protein, unit: 'g', icon: 'fitness_center' },
      { label: 'Carbs', value: this.diet.carbs, unit: 'g', icon: 'grain' },
      { label: 'Fat', value: this.diet.fat, unit: 'g', icon: 'oil_barrel' },
      { label: 'Fiber', value: this.diet.fiber, unit: 'g', icon: 'grass', fullWidth: true }
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

  private getDietTypeColor(type?: string): string {
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'mediterranean':
        return '#28a745';
      case 'keto':
        return '#6f42c1';
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


