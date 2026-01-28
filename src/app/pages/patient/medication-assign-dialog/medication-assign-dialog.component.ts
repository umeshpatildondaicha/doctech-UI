import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface MedicationAssignDialogData {
  activeTab?: 'medicines' | 'template';
  availableMedicines: any[];
  selectedMedicines: any[];
  medicationTemplates: { id: string; name: string; medicineIds: string[] }[];
  today: Date;
}

@Component({
    selector: 'app-medication-assign-dialog',
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
    templateUrl: './medication-assign-dialog.component.html',
    styleUrls: ['./medication-assign-dialog.component.scss']
})
export class MedicationAssignDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<MedicationAssignDialogComponent>);
  data = inject<MedicationAssignDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  activeTab: 'medicines' | 'template' = this.data.activeTab || 'medicines';
  availableMedicines: any[] = this.data.availableMedicines || [];
  selectedMedicines: any[] = [...(this.data.selectedMedicines || [])];
  medicationTemplates: { id: string; name: string; medicineIds: string[] }[] = this.data.medicationTemplates || [];
  today: Date = this.data.today || new Date();

  // Form state
  selectedMedicineForForm: any = null;
  medicineSearchText = '';
  templateSearchText = '';

  // Form fields
  formData = {
    medicineName: '',
    dosage: '',
    frequency: { beforeMeal: false, afterMeal: false, every8Hours: false },
    quantity: '',
    timing: '',
    route: '',
    reasonForRequest: '',
    currentSymptoms: ''
  };

  setTab(tab: 'medicines' | 'template'): void {
    this.activeTab = tab;
    this.selectedMedicineForForm = null; // Reset form when switching tabs
  }

  onClose(): void {
    this.dialogRef.close({ action: 'cancel' });
    this.resetForm();
  }

  onAddMedicineClick(med: any): void {
    // Open form with this medicine pre-filled
    this.selectedMedicineForForm = med;
    this.formData.medicineName = med.name;
    this.formData.dosage = med.dosage || '';
    this.formData.frequency = { beforeMeal: false, afterMeal: false, every8Hours: false };
  }

  onAddToCart(): void {
    // Add medicine to cart with form data
    const medicineToAdd = {
      id: this.selectedMedicineForForm?.id || `M-${Date.now()}`,
      name: this.formData.medicineName || this.selectedMedicineForForm?.name,
      dosage: this.formData.dosage,
      frequency: this.getFrequencyText(),
      quantity: this.formData.quantity,
      timing: this.formData.timing,
      route: this.formData.route,
      reason: this.formData.reasonForRequest,
      symptoms: this.formData.currentSymptoms
    };
    this.selectedMedicines = [...this.selectedMedicines, medicineToAdd];
    this.resetForm();
  }

  onSelectTemplate(templateId: string): void {
    // Find the template
    const template = this.medicationTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Add all medicines from the template to selectedMedicines
    template.medicineIds.forEach(medId => {
      const med = this.availableMedicines.find(m => m.id === medId);
      if (med && !this.selectedMedicines.find(m => m.id === medId)) {
        this.selectedMedicines = [...this.selectedMedicines, { ...med, selected: false }];
      }
    });
  }

  ngOnInit() {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'assign' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        return;
      }
      
      if (result?.action === 'assign') {
        // Close with selected medicines
        setTimeout(() => {
          this.dialogRef.close({ 
            action: 'assign', 
            selectedMedicines: this.selectedMedicines 
          });
        }, 0);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAssign(): void {
    // This will be called by footer action
    this.dialogRef.close({ 
      action: 'assign', 
      selectedMedicines: this.selectedMedicines 
    });
  }

  onEditSelected(med: any): void {
    // Remove from selected and open form for editing
    this.selectedMedicines = this.selectedMedicines.filter(m => m.id !== med.id);
    this.onAddMedicineClick(med);
  }

  onRemoveSelected(medId: string): void {
    this.selectedMedicines = this.selectedMedicines.filter(m => m.id !== medId);
  }

  getFrequencyText(): string {
    const parts: string[] = [];
    if (this.formData.frequency.beforeMeal) parts.push('Before Meal');
    if (this.formData.frequency.afterMeal) parts.push('After Meal');
    if (this.formData.frequency.every8Hours) parts.push('Every 8 hours');
    return parts.join(', ') || 'As needed';
  }

  resetForm(): void {
    this.selectedMedicineForForm = null;
    this.formData = {
      medicineName: '',
      dosage: '',
      frequency: { beforeMeal: false, afterMeal: false, every8Hours: false },
      quantity: '',
      timing: '',
      route: '',
      reasonForRequest: '',
      currentSymptoms: ''
    };
  }

  get filteredMedicines(): any[] {
    if (!this.medicineSearchText.trim()) return this.availableMedicines;
    const search = this.medicineSearchText.toLowerCase();
    return this.availableMedicines.filter(m =>
      m.name?.toLowerCase().includes(search) ||
      m.dosage?.toLowerCase().includes(search) ||
      m.frequency?.toLowerCase().includes(search)
    );
  }

  get filteredTemplates(): any[] {
    if (!this.templateSearchText.trim()) return this.medicationTemplates;
    const search = this.templateSearchText.toLowerCase();
    return this.medicationTemplates.filter(t =>
      t.name?.toLowerCase().includes(search)
    );
  }
}


