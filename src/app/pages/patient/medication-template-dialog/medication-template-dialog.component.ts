
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

// Lightweight shape used only for displaying selected medicines in the template dialog
export interface TemplateMedicationView {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export interface MedicationTemplateDialogData {
  selectedMedications: TemplateMedicationView[];
  templateName?: string;
}

@Component({
    selector: 'app-medication-template-dialog',
    imports: [FormsModule, MatButtonModule, MatIconModule],
    templateUrl: './medication-template-dialog.component.html',
    styleUrls: ['./medication-template-dialog.component.scss']
})
export class MedicationTemplateDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<MedicationTemplateDialogComponent>);
  data = inject<MedicationTemplateDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  selectedMedications: TemplateMedicationView[] = this.data.selectedMedications || [];
  templateName: string = this.data.templateName || '';

  ngOnInit() {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        return;
      }
      
      if (result?.action === 'save') {
        // Validate before closing
        if (!this.templateName.trim() || this.selectedMedications.length === 0) {
          // Prevent close if invalid
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
        } else {
          // Close with template data
          setTimeout(() => {
            this.dialogRef.close({ 
              action: 'save', 
              templateName: this.templateName,
              selectedMedications: this.selectedMedications
            });
          }, 0);
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNameInput(value: string): void {
    this.templateName = value;
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  onSave(): void {
    if (this.templateName.trim() && this.selectedMedications.length > 0) {
      this.dialogRef.close({ 
        action: 'save', 
        templateName: this.templateName,
        selectedMedications: this.selectedMedications
      });
    }
  }

  get isFormValid(): boolean {
    return this.templateName.trim().length > 0 && this.selectedMedications.length > 0;
  }
}


