import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface NewMedicationDialogData {
  selectedMedicines?: any[];
  mode?: 'create' | 'edit';
  medication?: any; // Medication to edit
}

@Component({
    selector: 'app-new-medication-dialog',
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
    templateUrl: './new-medication-dialog.component.html',
    styleUrls: ['./new-medication-dialog.component.scss']
})
export class NewMedicationDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<NewMedicationDialogComponent>);
  data = inject<NewMedicationDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  mode: 'create' | 'edit' = this.data.mode || 'create';
  selectedMedicines: any[] = [...(this.data.selectedMedicines || [])];
  
  // Form fields
  formData = {
    medicineName: '',
    dosage: '',
    frequency: '',
    quantity: '',
    timing: 'Morning',
    route: '',
    reasonForRequest: '',
    currentSymptoms: ''
  };

  constructor() {
    // If editing, populate form with medication data
    if (this.mode === 'edit' && this.data.medication) {
      const med = this.data.medication;
      this.formData = {
        medicineName: med.name || '',
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        quantity: med.quantity?.toString() || '',
        timing: med.timing || 'Morning',
        route: med.route || '',
        reasonForRequest: med.reason || med.instructions || '',
        currentSymptoms: med.symptoms || med.instructions || ''
      };
    }
  }

  ngOnInit() {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'add' || result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        return;
      }
      
      if (result?.action === 'add' || result?.action === 'save') {
        // Validate before closing
        if (!this.formData.medicineName.trim() || !this.formData.dosage.trim()) {
          // Prevent close if invalid
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
        } else {
          if (this.mode === 'edit' && this.data.medication) {
            // Update existing medication
            const updatedMedication = {
              ...this.data.medication,
              name: this.formData.medicineName,
              dosage: this.formData.dosage,
              frequency: this.formData.frequency,
              quantity: parseInt(this.formData.quantity) || this.data.medication.quantity,
              timing: this.formData.timing,
              route: this.formData.route,
              instructions: this.formData.currentSymptoms || this.formData.reasonForRequest,
              updatedDate: new Date()
            };
            
            setTimeout(() => {
              this.dialogRef.close({ 
                action: 'save', 
                medication: updatedMedication 
              });
            }, 0);
          } else {
            // Add medicine to selectedMedicines and close
            const medicineToAdd = {
              id: `M-${Date.now()}`,
              name: this.formData.medicineName,
              dosage: this.formData.dosage,
              frequency: this.formData.frequency,
              quantity: this.formData.quantity,
              timing: this.formData.timing,
              route: this.formData.route,
              reason: this.formData.reasonForRequest,
              symptoms: this.formData.currentSymptoms
            };
            
            this.selectedMedicines = [...this.selectedMedicines, medicineToAdd];
            
            setTimeout(() => {
              this.dialogRef.close({ 
                action: 'add', 
                selectedMedicines: this.selectedMedicines 
              });
            }, 0);
          }
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTiming(timing: string): void {
    this.formData.timing = timing;
  }

  onRemoveMedicine(medId: string): void {
    this.selectedMedicines = this.selectedMedicines.filter(m => m.id !== medId);
  }

  onEditMedicine(med: any): void {
    // Remove from list and populate form
    this.selectedMedicines = this.selectedMedicines.filter(m => m.id !== med.id);
    this.formData = {
      medicineName: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      quantity: med.quantity || '',
      timing: med.timing || 'Morning',
      route: med.route || '',
      reasonForRequest: med.reason || '',
      currentSymptoms: med.symptoms || ''
    };
  }

  onAddToCart(): void {
    if (!this.formData.medicineName.trim() || !this.formData.dosage.trim()) {
      return;
    }
    
    const medicineToAdd = {
      id: `M-${Date.now()}`,
      name: this.formData.medicineName,
      dosage: this.formData.dosage,
      frequency: this.formData.frequency,
      quantity: this.formData.quantity,
      timing: this.formData.timing,
      route: this.formData.route,
      reason: this.formData.reasonForRequest,
      symptoms: this.formData.currentSymptoms
    };
    
    this.selectedMedicines = [...this.selectedMedicines, medicineToAdd];
    
    // Reset form
    this.formData = {
      medicineName: '',
      dosage: '',
      frequency: '',
      quantity: '',
      timing: 'Morning',
      route: '',
      reasonForRequest: '',
      currentSymptoms: ''
    };
  }

  get isFormValid(): boolean {
    return this.formData.medicineName.trim().length > 0 && this.formData.dosage.trim().length > 0;
  }
}

