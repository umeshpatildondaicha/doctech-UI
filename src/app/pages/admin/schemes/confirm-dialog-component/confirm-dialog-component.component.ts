import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppButtonComponent } from '@lk/core';

@Component({
    selector: 'app-confirm-dialog-component',
    imports: [AppButtonComponent],
    templateUrl: './confirm-dialog-component.component.html',
    styleUrl: './confirm-dialog-component.component.scss'
})
export class ConfirmDialogComponentComponent {
constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
