import { Component, EventEmitter, Input, Output } from '@angular/core';

import { IconComponent } from '@lk/core';

export interface StatCard {
  /** Optional identifier (also enables click events when set) */
  id?: string;
  label: string;
  value: string | number;
  icon?: string;
  iconColor?: string;
  valueColor?: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
  /** Optional supporting text under label */
  hint?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
}

@Component({
    selector: 'app-admin-stats-card',
    imports: [IconComponent],
    templateUrl: './admin-stats-card.component.html',
    styleUrl: './admin-stats-card.component.scss'
})
export class AdminStatsCardComponent {
  @Input() stats: StatCard[] = [];
  @Input() columns: number = 4;
  @Input() showTrends: boolean = false;

  /** Emits when a stat card with an id is clicked */
  @Output() statClick = new EventEmitter<StatCard>();
  
  getGridColumns(): string {
    return `repeat(auto-fit, minmax(200px, 1fr))`;
  }

  isClickable(stat: StatCard): boolean {
    return Boolean(stat?.id) && !stat?.disabled;
  }

  onStatClick(stat: StatCard): void {
    if (!this.isClickable(stat)) return;
    this.statClick.emit(stat);
  }
}
