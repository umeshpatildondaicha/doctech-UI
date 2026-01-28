import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { AppButtonComponent } from "@lk/core";

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
    selector: 'app-confirm-dialog',
    imports: [CommonModule, MatButtonModule, AppButtonComponent],
    template: `
    <div class="confirm-dialog">
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      <div class="dialog-actions">
        <app-button 
          [text]="data.cancelText || 'Cancel'" 
          (click)="close(false)"
          color="secondary">
        </app-button>
        <app-button 
          [text]="data.confirmText || 'Delete'" 
          (click)="close(true)"
          color="danger">
        </app-button>
      </div>
    </div>
  `,
    styles: [`
    .confirm-dialog {
      padding: 24px;
    }
    .dialog-content {
      margin-bottom: 24px;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  `]
})
export class ConfirmDialogComponent {
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data = inject<ConfirmDialogData>(DIALOG_DATA_TOKEN);

  close(val: boolean) {
    this.dialogRef.close(val);
  }
}





