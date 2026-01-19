import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export type ListingCardVariant = 'default' | 'compact';
export type ListingCardLayout = 'row' | 'column';
export type ListingCardActionStyle = 'neutral' | 'primary' | 'accent' | 'warn';

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
  fullWidth?: boolean;
}

export interface ListingCardAction {
  id: string;
  label: string;
  icon: string;
  style?: ListingCardActionStyle;
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

  /** Optional pill actions displayed below the image */
  @Input() headerActions: ListingCardAction[] = [];

  /** Optional tags displayed under the description */
  @Input() tags: string[] = [];

  /** Optional stats grid displayed at the bottom of the card content */
  @Input() stats: ListingCardStat[] = [];

  /** Footer actions displayed at the bottom (row/column layouts supported) */
  @Input() footerActions: ListingCardAction[] = [];
  @Input() footerLayout: ListingCardLayout = 'row';

  /** Selection indicator overlay (useful for multi-select flows) */
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
  trackByTag = (_: number, t: string) => t;
  trackByStatLabel = (_: number, s: ListingCardStat) => s.label;

  badgeStyle(badge?: ListingCardBadge): Record<string, string> | null {
    if (!badge?.backgroundColor) return null;
    return { backgroundColor: badge.backgroundColor };
  }
}

