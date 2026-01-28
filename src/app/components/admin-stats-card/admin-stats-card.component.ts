import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@lk/core';

export interface StatCard {
  label: string;
  value: string | number;
  icon?: string;
  iconColor?: string;
  valueColor?: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
}

@Component({
    selector: 'app-admin-stats-card',
    imports: [CommonModule, IconComponent],
    templateUrl: './admin-stats-card.component.html',
    styleUrl: './admin-stats-card.component.scss'
})
export class AdminStatsCardComponent {
  @Input() stats: StatCard[] = [];
  @Input() columns: number = 4;
  @Input() showTrends: boolean = false;
  
  getGridColumns(): string {
    return `repeat(auto-fit, minmax(200px, 1fr))`;
  }
}
