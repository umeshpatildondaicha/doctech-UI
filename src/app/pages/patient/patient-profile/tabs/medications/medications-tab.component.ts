import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, AppButtonComponent, GridComponent, ExtendedGridOptions, DialogboxService, DialogFooterAction } from '@lk/core';
import { MedicationAssignDialogComponent } from '../../../medication-assign-dialog/medication-assign-dialog.component';
import { NewMedicationDialogComponent } from '../../../new-medication-dialog/new-medication-dialog.component';
import { MedicationTemplateDialogComponent } from '../../../medication-template-dialog/medication-template-dialog.component';

export interface PatientMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  status: 'active' | 'discontinued' | 'completed';
  instructions: string;
  sideEffects?: string[];
  interactions?: string[];
  quantity?: number;
  urgency?: 'Low' | 'Medium' | 'High';
  requestedOn?: Date;
  selected?: boolean;
}

@Component({
  selector: 'app-medications-tab',
  standalone: true,
  imports: [CommonModule, IconComponent, AppButtonComponent, GridComponent],
  templateUrl: './medications-tab.component.html',
  styleUrl: './medications-tab.component.scss'
})
export class MedicationsTabComponent implements OnInit {
  @Input() patientId: string = '';
  @Input() patientName: string = '';
  @Input() primaryDoctor: string = 'Dr. Michael Chen';

  medications: PatientMedication[] = [];
  selectedAssignMedicines: PatientMedication[] = [];
  medicationTemplates: { id: string; name: string; medicineIds: string[] }[] = [];
  today: Date = new Date();

  medicationsColumns: any[] = [];
  medicationsGridOptions: ExtendedGridOptions = {};

  constructor(private readonly dialogService: DialogboxService) {}

  ngOnInit(): void {
    this.medications = [
      {
        id: 'M001', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', route: 'Oral',
        startDate: new Date('2024-01-15'), prescribedBy: 'Dr. Michael Chen', status: 'active',
        instructions: 'Take with meals to reduce stomach upset', sideEffects: ['Nausea', 'Diarrhea'],
        quantity: 30, urgency: 'Low', requestedOn: new Date('2025-11-12')
      },
      {
        id: 'M002', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', route: 'Oral',
        startDate: new Date('2024-01-18'), prescribedBy: 'Dr. Michael Chen', status: 'active',
        instructions: 'Take in the morning', sideEffects: ['Dry cough', 'Dizziness'],
        quantity: 60, urgency: 'Medium', requestedOn: new Date('2025-11-10')
      },
      {
        id: 'M003', name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', route: 'Oral',
        startDate: new Date('2024-01-16'), prescribedBy: 'Dr. Michael Chen', status: 'active',
        instructions: 'Take at bedtime', sideEffects: ['Muscle pain', 'Liver enzyme elevation'],
        quantity: 21, urgency: 'High', requestedOn: new Date('2025-11-08')
      }
    ];

    this.medicationsColumns = [
      { field: 'name', headerName: 'Medicine', flex: 1 },
      { field: 'dosage', headerName: 'Dosage', width: 120 },
      { field: 'frequency', headerName: 'Frequency', flex: 1 },
      { field: 'route', headerName: 'Route', width: 100 },
      { field: 'prescribedBy', headerName: 'Prescribed By', flex: 1 },
      { field: 'status', headerName: 'Status', width: 110,
        cellRenderer: (params: any) => `<span class="status-badge ${params.value}">${params.value}</span>` }
    ];

    this.medicationsGridOptions = { suppressRowClickSelection: false };
  }

  canCreateMedicationTemplate(): boolean {
    return this.selectedAssignMedicines.length > 0;
  }

  openAssignMedicationsDialog(): void {
    this.openMedicationDialog('medicines');
  }

  openNewMedicationDialog(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'basic' },
      { id: 'add', text: 'Add Medications', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(NewMedicationDialogComponent, {
      title: 'New Medication Assignment',
      data: { selectedMedicines: this.selectedAssignMedicines, mode: 'create' },
      width: '90%', height: '90%', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'add' && result.selectedMedicines) {
        const toAdd: PatientMedication[] = result.selectedMedicines.map((med: any) => ({
          id: med.id || `M-${Date.now()}`, name: med.name, dosage: med.dosage || '',
          frequency: med.frequency || '', route: med.route || 'Oral', startDate: new Date(),
          prescribedBy: this.primaryDoctor, status: 'active' as const,
          instructions: med.symptoms || '', quantity: parseInt(med.quantity) || 30,
          urgency: 'Low' as const, requestedOn: new Date(), selected: false
        }));
        this.medications = [...this.medications, ...toAdd];
      }
    });
  }

  openCreateTemplateDialog(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'create', text: 'Create Template', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(MedicationTemplateDialogComponent, {
      title: 'Create Medication Template',
      data: { selectedMedicines: this.selectedAssignMedicines },
      width: '600px', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'create' && result.templateName) {
        this.medicationTemplates.push({
          id: `TPL${Date.now()}`, name: result.templateName,
          medicineIds: this.selectedAssignMedicines.map(m => m.id)
        });
      }
    });
  }

  private openMedicationDialog(activeTab: 'medicines' | 'template'): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'basic' },
      { id: 'assign', text: 'Assign Medicines', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(MedicationAssignDialogComponent, {
      title: 'New Medication Assignment',
      data: { activeTab, availableMedicines: this.medications, selectedMedicines: this.selectedAssignMedicines, medicationTemplates: this.medicationTemplates, today: this.today },
      width: '90%', height: '90%', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'assign' && result.selectedMedicines) {
        const toAdd: PatientMedication[] = result.selectedMedicines.map((med: any) => ({
          id: med.id || `M-${Date.now()}`, name: med.name, dosage: med.dosage || '',
          frequency: med.frequency || '', route: med.route || 'Oral', startDate: new Date(),
          prescribedBy: this.primaryDoctor, status: 'active' as const,
          instructions: med.symptoms || '', quantity: parseInt(med.quantity) || 30,
          urgency: 'Low' as const, requestedOn: new Date(), selected: false
        }));
        this.medications = [...this.medications, ...toAdd];
        this.selectedAssignMedicines = [];
      }
    });
  }
}
