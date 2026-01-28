import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Exercise } from '../../interfaces/exercise.interface';
import {
  ListingCardAction,
  ListingCardBadge,
  ListingCardComponent,
  ListingCardStat
} from '../listing-card/listing-card.component';

@Component({
    selector: 'app-exercise-card',
    imports: [
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    ListingCardComponent
],
    templateUrl: './exercise-card.component.html',
    styleUrl: './exercise-card.component.scss'
})
export class ExerciseCardComponent {
  @Input() exercise!: Exercise;
  @Input() showActions: boolean = true;
  @Input() clickable: boolean = true;
  @Input() allowSelection: boolean = false;
  @Input() isSelected: boolean = false;
  @Input() variant: 'default' | 'compact' = 'default';

  @Output() cardClick = new EventEmitter<Exercise>();
  @Output() viewClick = new EventEmitter<Exercise>();
  @Output() editClick = new EventEmitter<Exercise>();
  @Output() deleteClick = new EventEmitter<Exercise>();
  @Output() selectClick = new EventEmitter<Exercise>();

  onCardClick(): void {
    if (this.allowSelection) {
      this.selectClick.emit(this.exercise);
      return;
    }
    if (this.clickable) {
      this.cardClick.emit(this.exercise);
    }
  }

  emitView(): void {
    this.viewClick.emit(this.exercise);
  }

  emitEdit(): void {
    this.editClick.emit(this.exercise);
  }

  emitDelete(): void {
    this.deleteClick.emit(this.exercise);
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Strength': '#1976d2',
      'Cardio': '#0ea5e9',
      'Core': '#8b5cf6',
      'Flexibility': '#10b981',
      'Balance': '#f59e0b'
    };
    return colors[category] || '#95a5a6';
  }

  get primaryImageUrl(): string | undefined {
    return this.exercise?.imageUrl || (this.exercise?.media && this.exercise.media.length > 0 ? this.exercise.media[0] : undefined);
  }

  get categoryBadge(): ListingCardBadge {
    return {
      text: this.exercise?.category || '',
      backgroundColor: this.getCategoryColor(this.exercise?.category || '')
    };
  }

  get difficultyBadge(): ListingCardBadge {
    return {
      text: this.exercise?.difficulty || '',
      backgroundColor: '#6c757d'
    };
  }

  get primaryAction(): ListingCardAction {
    if (this.allowSelection) {
      return {
        id: 'select',
        label: this.isSelected ? 'Remove' : 'Add',
        icon: this.isSelected ? 'remove_circle' : 'add_circle',
        tooltip: this.isSelected ? 'Remove from selection' : 'Add to selection'
      };
    }
    return { id: 'view', label: 'Preview', icon: 'visibility', tooltip: 'Preview exercise' };
  }

  get iconActions(): ListingCardAction[] {
    if (this.allowSelection) return [];
    if (!this.showActions) return [];
    return [
      { id: 'edit', label: 'Edit', icon: 'edit', tooltip: 'Edit exercise' },
      { id: 'delete', label: 'Delete', icon: 'delete', tooltip: 'Delete exercise' }
    ];
  }

  onListingAction(action: ListingCardAction): void {
    switch (action.id) {
      case 'select':
        this.selectClick.emit(this.exercise);
        break;
      case 'view':
        this.emitView();
        break;
      case 'edit':
        this.emitEdit();
        break;
      case 'delete':
        this.emitDelete();
        break;
    }
  }

  get stats(): ListingCardStat[] {
    if (!this.exercise) return [];
    const target = this.exercise.targetMuscles?.[0] || '—';
    const equipment = this.exercise.equipment?.[0] || '—';
    const setsCount = this.exercise.sets?.length || 0;
    const repsText = this.getRepsRangeDisplay();
    return [
      { label: 'Target', value: target, icon: 'my_location' },
      { label: 'Equipment', value: equipment, icon: 'fitness_center' },
      { label: 'Sets', value: setsCount, unit: 'sets', icon: 'repeat' },
      { label: 'Reps', value: repsText, icon: 'tag' }
    ];
  }

  getSetsDisplay(): string {
    if (!this.exercise.sets || this.exercise.sets.length === 0) {
      return 'No sets defined';
    }
    const setCount = this.exercise.sets.length;
    const totalReps = this.exercise.sets.reduce((sum, set) => sum + set.reps, 0);
    return `${setCount} set${setCount > 1 ? 's' : ''}, ${totalReps} reps total`;
  }

  private getRepsRangeDisplay(): string {
    const reps = (this.exercise?.sets || []).map(s => s.reps).filter(r => typeof r === 'number');
    if (!reps.length) return '—';
    const min = Math.min(...reps);
    const max = Math.max(...reps);
    if (min === max) return `${min}`;
    return `${min}-${max}`;
  }

  getTargetMusclesDisplay(): string {
    if (!this.exercise.targetMuscles || this.exercise.targetMuscles.length === 0) {
      return 'No target muscles specified';
    }
    return this.exercise.targetMuscles.join(', ');
  }

  getEquipmentDisplay(): string {
    if (!this.exercise.equipment || this.exercise.equipment.length === 0) {
      return 'No equipment needed';
    }
    return this.exercise.equipment.join(', ');
  }
}

