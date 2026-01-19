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
  @Input() showDates: boolean = false; // For assigned plans
  @Input() dateFormatter?: (date: Date) => string;

  @Output() cardClick = new EventEmitter<DietPlan>();
  @Output() viewClick = new EventEmitter<DietPlan>();
  @Output() editClick = new EventEmitter<DietPlan>();
  @Output() deleteClick = new EventEmitter<DietPlan>();

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'check_circle';
      case 'completed':
        return 'done';
      case 'inactive':
        return 'cancel';
      case 'draft':
        return 'edit';
      default:
        return 'info';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    if (this.dateFormatter) {
      return this.dateFormatter(date);
    }
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  }

  onCardClick(): void {
    this.cardClick.emit(this.plan);
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
}


