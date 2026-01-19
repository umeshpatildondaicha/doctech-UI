import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface DietPlan {
  planId: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  duration: number;
  dietsCount?: number;
  progress?: number;
  createdAt?: Date;
  startDate?: Date;
  endDate?: Date;
  // Additional fields for assigned plans
  assignmentType?: 'weekly' | 'individual';
  avgCaloriesPerDay?: number;
  keyNutrients?: string[];
  goal?: string;
  mealsIncluded?: DietPlanMealPreview[];
  reviewedByName?: string;
  reviewedAt?: Date;
}

export interface DietPlanMealPreview {
  title: string;
  subtitle?: string;
  tags?: string[];
  imageUrl?: string;
}

@Component({
  selector: 'app-diet-plan-card',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './diet-plan-card.component.html',
  styleUrl: './diet-plan-card.component.scss'
})
export class DietPlanCardComponent {
  @Input() plan!: DietPlan;
  @Input() showActions: boolean = true;
  @Input() showFooter: boolean = true;

  @Output() cardClick = new EventEmitter<DietPlan>();
  @Output() viewClick = new EventEmitter<DietPlan>();
  @Output() editClick = new EventEmitter<DietPlan>();
  @Output() deleteClick = new EventEmitter<DietPlan>();
  @Output() addMealClick = new EventEmitter<DietPlan>();

  get isActive(): boolean {
    return (this.plan?.status || '').toLowerCase() === 'active';
  }

  onCardClick(): void {
    this.cardClick.emit(this.plan);
  }

  onKeyActivate(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick();
    }
  }

  onView(event: Event): void {
    event.stopPropagation();
    this.viewClick.emit(this.plan);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.editClick.emit(this.plan);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteClick.emit(this.plan);
  }

  onAddMeal(event: Event): void {
    event.stopPropagation();
    this.addMealClick.emit(this.plan);
  }

  formatReviewedAt(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const month = d.toLocaleString(undefined, { month: 'short' });
    const day = d.getDate();
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hr12 = ((hours + 11) % 12) + 1;
    return `${month} ${day}, ${hr12}:${mins} ${ampm}`;
  }
}


