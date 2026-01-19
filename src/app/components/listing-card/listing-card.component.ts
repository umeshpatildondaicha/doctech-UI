import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export type ListingCardVariant = 'default' | 'compact';
export type ListingCardLayout = 'row' | 'column';

export interface ListingCardBadge {
  text: string;
  className?: string;
  backgroundColor?: string;
}

export interface ListingCardStat {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
}

export interface ListingCardAction {
  id: string;
  label: string;
  icon: string;
  tooltip?: string;
  hidden?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './listing-card.component.html',
  styleUrl: './listing-card.component.scss'
})
export class ListingCardComponent {
  @Input() title!: string;
  @Input() description?: string;

  @Input() imageUrl?: string;
  @Input() alt?: string;
  @Input() placeholderIcon: string = 'image';
  @Input() placeholderText: string = 'No Image';

  @Input() clickable: boolean = true;
  @Input() variant: ListingCardVariant = 'default';

  @Input() topLeftBadge?: ListingCardBadge;
  @Input() topRightBadge?: ListingCardBadge;

  /** Optional stats rendered in a 2-column grid */
  @Input() stats: ListingCardStat[] = [];

  /** Footer actions */
  @Input() primaryAction?: ListingCardAction;
  @Input() iconActions: ListingCardAction[] = [];

  /** Selection indicator overlay (for multi-select flows) */
  @Input() showSelectionIndicator: boolean = false;
  @Input() selected: boolean = false;
  @Input() selectionIcon: string = 'check';

  @Output() cardClick = new EventEmitter<void>();
  @Output() actionClick = new EventEmitter<ListingCardAction>();

  onCardClick(): void {
    if (!this.clickable) return;
    this.cardClick.emit();
  }

  onKeyActivate(event: KeyboardEvent): void {
    if (!this.clickable) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.cardClick.emit();
    }
  }

  onActionClick(event: Event, action: ListingCardAction): void {
    event.stopPropagation();
    if (action.disabled) return;
    this.actionClick.emit(action);
  }

  trackByActionId = (_: number, a: ListingCardAction) => a.id;
  trackByStatLabel = (_: number, s: ListingCardStat) => s.label;

  badgeStyle(badge?: ListingCardBadge): Record<string, string> | null {
    if (!badge?.backgroundColor) return null;
    return { backgroundColor: badge.backgroundColor };
  }
}

