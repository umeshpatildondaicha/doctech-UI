import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppButtonComponent, AppInputComponent } from '@lk/core';

@Component({
  selector: 'app-floor-edit',
  imports: [AppButtonComponent,AppInputComponent,ReactiveFormsModule],
  templateUrl: './floor-edit.component.html',
  styleUrl: './floor-edit.component.scss',
})
export class FloorEditComponent {

 floorForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FloorEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.floorForm = this.fb.group({
      floorNumber: [data.floor.floorNumber, [Validators.required]],
      floorName: [data.floor.floorName, [Validators.required]]
    });
  }

  onUpdate() {
    if (this.floorForm.invalid) return;

    this.dialogRef.close({
      id: this.data.floor.id,
      payload: {
        ...this.floorForm.value,
        updatedBy: 'ADMIN'
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
