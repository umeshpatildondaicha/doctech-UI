import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from "@lk/core";

@Component({
    selector: 'app-billing-status-renderer',
    imports: [CommonModule],
    template: `
    <span class="status-badge" [ngClass]="statusClass">{{ label }}</span>
  `,
    styles: [`
    :host {
      display: flex;
      align-items: center;
    }
  `]
})
export class BillingStatusRendererComponent implements OnChanges {
  @Input() params: any;
  @Input() status: string = '';
  
  label = '';
  statusClass = '';

  agInit(params: any): void {
    this.params = params;
    this.update(params?.value || params?.status || '');
  }

  refresh(params: any): boolean {
    this.update(params?.value || params?.status || '');
    return true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status'] || changes['params']) {
      const statusValue = this.status || this.params?.value || this.params?.status || '';
      this.update(statusValue);
    }
  }

  private update(status: string) {
    if (!status) {
      this.label = '';
      this.statusClass = GridComponent.getStatusClass(status);
      return;
    }
    
    // Replace underscores with spaces and capitalize first letter of each word
    this.label = status.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Use the GridComponent helper method to get the correct status class
    this.statusClass = GridComponent.getStatusClass(status);
  }
}


