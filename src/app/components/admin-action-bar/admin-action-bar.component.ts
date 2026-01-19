import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent, IconComponent } from '@lk/core';

export interface ActionButton {
  id: string;
  text: string;
  icon?: string;
  color: 'primary' | 'accent' | 'warn';
  variant?: 'solid' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
}

@Component({
  selector: 'app-admin-action-bar',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, IconComponent],
  templateUrl: './admin-action-bar.component.html',
  styleUrl: './admin-action-bar.component.scss'
})
export class AdminActionBarComponent {
  @Input() actions: ActionButton[] = [];
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';
  @Input() align: 'left' | 'center' | 'right' | 'space-between' = 'left';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() fullWidth: boolean = false;
  
  @Output() actionClicked = new EventEmitter<string>();

  onActionClick(actionId: string): void {
    this.actionClicked.emit(actionId);
  }
}
