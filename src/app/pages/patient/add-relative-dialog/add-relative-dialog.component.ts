import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DIALOG_DATA_TOKEN, AppInputComponent, AppSelectboxComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface AddRelativeDialogData {
  patientId: string;
  patientName: string;
}

@Component({
    selector: 'app-add-relative-dialog',
    imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    AppInputComponent,
    AppSelectboxComponent
],
    templateUrl: './add-relative-dialog.component.html',
    styleUrls: ['./add-relative-dialog.component.scss']
})
export class AddRelativeDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<AddRelativeDialogComponent>);
  data = inject<AddRelativeDialogData>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  relativeForm!: FormGroup;

  relationships = [
    { value: 'SPOUSE', label: 'Spouse' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'CHILD', label: 'Child' },
    { value: 'SIBLING', label: 'Sibling' },
    { value: 'GRANDPARENT', label: 'Grandparent' },
    { value: 'GRANDCHILD', label: 'Grandchild' },
    { value: 'UNCLE', label: 'Uncle' },
    { value: 'AUNT', label: 'Aunt' },
    { value: 'COUSIN', label: 'Cousin' },
    { value: 'FRIEND', label: 'Friend' },
    { value: 'GUARDIAN', label: 'Guardian' },
    { value: 'OTHER', label: 'Other' }
  ];

  // Getter method for relationship options
  get relationshipOptions(): string[] {
    return this.relationships.map(r => r.value);
  }

  constructor() {
    this.relativeForm = this.fb.group({
      relativeName: ['', Validators.required],
      relationship: ['', Validators.required],
      contactNumber: ['', Validators.required],
      alternateContactNumber: [''],
      email: [''],
      address: [''],
      emergencyContact: [false],
      canMakeDecisions: [false],
      canReceiveUpdates: [true],
      canVisit: [true],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'save') {
        if (this.relativeForm.valid) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'save',
              formData: this.relativeForm.value
            });
          }, 0);
        } else {
          // Prevent close if form is invalid
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

