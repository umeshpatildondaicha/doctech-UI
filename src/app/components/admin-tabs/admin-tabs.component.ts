import { Component, Input, Output, EventEmitter } from '@angular/core';

import { AppButtonComponent, IconComponent } from '@lk/core';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  badge?: string | number;
  badgeColor?: string;
}

@Component({
    selector: 'app-admin-tabs',
    imports: [IconComponent,AppButtonComponent],
    templateUrl: './admin-tabs.component.html',
    styleUrl: './admin-tabs.component.scss'
})
export class AdminTabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() activeTabId: string = '';
  @Input() variant: 'pills' | 'underline' | 'background'|'line' = 'line';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  @Output() tabChanged = new EventEmitter<string>();

  onTabClick(tab: TabItem): void {
    if (!tab.disabled) {
      this.tabChanged.emit(tab.id);
    }
  }

  isActive(tabId: string): boolean {
    return this.activeTabId === tabId;
  }
}
