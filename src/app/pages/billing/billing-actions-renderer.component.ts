import { Component } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
    selector: 'app-billing-actions-renderer',
    imports: [MatIconModule, MatButtonModule, MatMenuModule],
    template: `
    <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Invoice actions" (click)="$event.stopPropagation()">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #menu="matMenu">
      <button mat-menu-item (click)="onViewPatient($event)"><mat-icon>person</mat-icon><span>View Patient Profile</span></button>
      <button mat-menu-item (click)="onEdit($event)"><mat-icon>edit</mat-icon><span>Edit</span></button>
      <button mat-menu-item (click)="onPayment($event)"><mat-icon>payments</mat-icon><span>Record Payment</span></button>
      <button mat-menu-item (click)="onPreview($event)"><mat-icon>visibility</mat-icon><span>Preview</span></button>
      <button mat-menu-item (click)="onDownload($event)"><mat-icon>picture_as_pdf</mat-icon><span>Download PDF</span></button>
      <button mat-menu-item (click)="onDelete($event)" class="warn"><mat-icon color="warn">delete</mat-icon><span>Delete</span></button>
    </mat-menu>
  `
})
export class BillingActionsRendererComponent {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(params: any): boolean {
    this.params = params;
    return true;
  }

  onEdit(evt?: Event) { evt?.stopPropagation(); this.params?.onEdit?.(this.params.data); }
  onViewPatient(evt?: Event) { evt?.stopPropagation(); this.params?.onViewPatient?.(this.params.data); }
  onPayment(evt?: Event) { evt?.stopPropagation(); this.params?.onPayment?.(this.params.data); }
  onPreview(evt?: Event) { evt?.stopPropagation(); this.params?.onPreview?.(this.params.data); }
  onDownload(evt?: Event) { evt?.stopPropagation(); this.params?.onDownload?.(this.params.data); }
  onDelete(evt?: Event) { evt?.stopPropagation(); this.params?.onDelete?.(this.params.data); }
}





