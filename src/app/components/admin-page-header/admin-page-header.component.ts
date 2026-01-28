import { Component, Input, Output, EventEmitter } from '@angular/core';

import { AppButtonComponent, IconComponent, BreadcrumbItem } from '@lk/core';

export interface HeaderAction {
  text: string;
  color: 'primary' | 'accent' | 'warn';
  fontIcon?: string;
  action: string;
  disabled?: boolean;
}

@Component({
    selector: 'app-admin-page-header',
    imports: [AppButtonComponent, IconComponent],
    templateUrl: './admin-page-header.component.html',
    styleUrl: './admin-page-header.component.scss'
})
export class AdminPageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() showBackButton: boolean = false;
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() actions: HeaderAction[] = [];
  
  @Output() actionClicked = new EventEmitter<string>();
  @Output() backClicked = new EventEmitter<void>();
  @Output() breadcrumbClicked = new EventEmitter<BreadcrumbItem>();

  onActionClick(action: string): void {
    this.actionClicked.emit(action);
  }

  onBackClick(): void {
    this.backClicked.emit();
  }

  onBreadcrumbClick(breadcrumb: BreadcrumbItem): void {
    if (breadcrumb.route) {
      this.breadcrumbClicked.emit(breadcrumb);
    }
  }
}
