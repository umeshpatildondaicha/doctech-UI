import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

// Custom Components
import { IconComponent, AppButtonComponent, AppInputComponent, AppSelectboxComponent, GridComponent } from '@lk/core';
import { ExerciseListComponent } from '../../../components/exercise-list/exercise-list.component';
import { ExerciseCardComponent } from '../../../components/exercise-card/exercise-card.component';
import { DietPlanCardComponent } from '../../../components/diet-plan-card/diet-plan-card.component';
import { DietCardComponent } from '../../../components/diet-card/diet-card.component';
import { PatientBillingDashboardComponent } from '../../billing/patient-billing-dashboard.component';
import { CoreEventService, DialogboxService, DialogFooterAction } from "@lk/core";
import { DoctorSearchDialogComponent } from '../../doctor-search-dialog/doctor-search-dialog.component';
import { AppointmentBookingComponent } from '../../appointment-booking/appointment-booking.component';
import { ExerciseAssignmentDialogComponent } from '../../exercise-assignment-dialog/exercise-assignment-dialog.component';
import { DietAssignmentDialogComponent } from '../../diet-assignment-dialog/diet-assignment-dialog.component';
import { ExerciseSetsConfigDialogComponent } from '../../exercise-sets-config-dialog/exercise-sets-config-dialog.component';
import { MedicationAssignDialogComponent } from '../medication-assign-dialog/medication-assign-dialog.component';
import { MedicationTemplateDialogComponent } from '../medication-template-dialog/medication-template-dialog.component';
import { NewMedicationDialogComponent } from '../new-medication-dialog/new-medication-dialog.component';
import { AdmissionDialogComponent } from '../admission-dialog/admission-dialog.component';
import { PrescriptionDialogComponent } from '../prescription-dialog/prescription-dialog.component';
import { MedicineRequestDialogComponent } from '../medicine-request-dialog/medicine-request-dialog.component';
import { TabConfigDialogComponent } from '../tab-config-dialog/tab-config-dialog.component';
import { PatientNotesDialogComponent } from '../../patient-queue/patient-notes-dialog/patient-notes-dialog.component';
import { LabTestOrderDialogComponent } from '../lab-test-order-dialog/lab-test-order-dialog.component';
import { AddRoundDialogComponent } from '../add-round-dialog/add-round-dialog.component';
import { ScheduleRoundsDialogComponent } from '../schedule-rounds-dialog/schedule-rounds-dialog.component';
import { AddRelativeDialogComponent } from '../add-relative-dialog/add-relative-dialog.component';
import { FullBodyDiagnosisComponent } from '../../full-body-diagnosis/full-body-diagnosis.component';

// Import new interfaces
import { PatientRound, RoundSchedule } from '../../../interfaces/patient-rounds.interface';
import { MedicineRequest } from '../../../interfaces/medicine-request.interface';
import { PatientRelative } from '../../../interfaces/patient-relatives.interface';
import { Exercise } from '../../../interfaces/exercise.interface';
import { Diet } from '../../../interfaces/diet.interface';

// Interfaces
interface CareTimetableItem {
  id: number;
  type: string;
  title: string;
  description: string;
  assignee: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  column?: number;
}

interface PatientMedication {
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
  // UI-only fields for professional medications UI
  quantity?: number;
  urgency?: 'Low' | 'Medium' | 'High';
  requestedOn?: Date;
  selected?: boolean;
}

interface VitalSign {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: Date;
  time: Date;
  recordedBy: string;
  notes?: string;
  isNormal: boolean;
}

interface LabReport {
  id: string;
  testName: string;
  category: string;
  result: string;
  normalRange: string;
  unit: string;
  date: Date;
  status: 'pending' | 'completed' | 'abnormal';
  orderedBy: string;
  notes?: string;
}

interface Appointment {
  id: string;
  date: Date;
  time: Date;
  type: string;
  doctor: string;
  department: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  followUp?: Date;
}

interface ClinicalNote {
  id: string;
  date: Date;
  type: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  isPrivate: boolean;
}

interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyContactRelation: string;
  admissionStatus: 'IPD' | 'OPD' | 'DISCHARGED';
  admissionDate?: Date;
  dischargeDate?: Date;
  roomNumber?: string;
  bedNumber?: string;
  primaryDoctor: string;
  department: string;
  diagnosis: string[];
  allergies: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceExpiry?: Date;
  occupation?: string;
  maritalStatus?: string;
  nextOfKin?: string;
  medicalHistory?: string[];
  familyHistory?: string[];
  lifestyle?: {
    smoking: boolean;
    alcohol: boolean;
    exercise: string;
    diet: string;
  };
}

interface PatientStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  totalPrescriptions: number;
  activeMedications: number;
  labReports: number;
  abnormalLabReports: number;
  vitalReadings: number;
  clinicalNotes: number;
  daysInHospital?: number;
  readmissionCount: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  color: 'primary' | 'accent' | 'warn';
  disabled?: boolean;
}

// IPD Management Interfaces
interface IPDAdmissionDetails {
  ward: string;
  room: string;
  bed: string;
  admissionDate: Date;
  attendingDoctor: string;
  expectedDischarge?: Date;
  lengthOfStay: number;
  daysLeft: number;
}

interface IPDVitalSigns {
  pulse: number;
  temperature: number;
  bloodPressure: string;
  spO2: number;
  lastUpdated: Date;
}

interface IPDCareSchedule {
  time: string;
  activity: string;
  description: string;
  type: 'nursing' | 'medication' | 'doctor-visit' | 'lab' | 'diet';
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface IPDQuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: () => void;
}

// Search and Notification Interfaces
interface SearchResult {
  id: string;
  text: string;
  category: string;
  icon: string;
  action: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  icon: string;
  color: string;
  time: Date;
  read: boolean;
  action?: () => void;
}

interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  color: string;
  phone?: string;
  email?: string;
  availability: 'available' | 'busy' | 'offline';
}

interface VitalTrend {
  type: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    MatExpansionModule,
    MatDividerModule,
    MatSelectModule,
    MatProgressBarModule,
    HighchartsChartModule,
    ReactiveFormsModule,
    FormsModule,
    IconComponent,
    AppButtonComponent,
    AppInputComponent,
    AppSelectboxComponent,
    GridComponent,
    ExerciseListComponent,
    ExerciseCardComponent,
    DietPlanCardComponent,
    DietCardComponent,
    PatientBillingDashboardComponent,
    FullBodyDiagnosisComponent,
    MedicationAssignDialogComponent,
    MedicationTemplateDialogComponent,
    AddRoundDialogComponent,
    ScheduleRoundsDialogComponent,
    AddRelativeDialogComponent
  ],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.scss']
})
export class PatientProfileComponent implements OnInit {
  // View Mode Management
  viewMode: 'profile' | 'ipd' = 'profile';
  
  // Search and UI State
  searchQuery: string = '';
  searchResults: SearchResult[] = [];
  showNotifications: boolean = false;
  showCareTeamDialog: boolean = false;
  isFullscreen: boolean = false;
  chartPeriod: '24h' | '7d' = '24h';
  
  // Notifications
  notifications: Notification[] = [];
  unreadNotifications: number = 0;
  
  // Care Team
  careTeam: CareTeamMember[] = [];
  
  // Vital Signs Trends
  vitalTrends: VitalTrend[] = [];
  
  // Navigation
  tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', badge: 0 },
    { id: 'medical-record', label: 'Medical Record', icon: 'receipt', badge: 0 },
    { id: 'profile', label: 'Profile', icon: 'person', badge: 0 },
    { id: 'vitals', label: 'Vitals', icon: 'favorite', badge: 3 },
    { id: 'medications', label: 'Medications', icon: 'local_pharmacy', badge: 0 },
    { id: 'appointments', label: 'Appointments', icon: 'event', badge: 2 },
    { id: 'lab-reports', label: 'Lab Reports', icon: 'assessment', badge: 1 },
    { id: 'clinical-notes', label: 'Clinical Notes', icon: 'note', badge: 0 },
    { id: 'care-plan', label: 'Care Plan', icon: 'date_range', badge: 0 },
    { id: 'rounds', label: 'Rounds', icon: 'access_time', badge: 0 },
    { id: 'medicine-requests', label: 'Medicine Requests', icon: 'healing', badge: 0 },
    { id: 'relatives', label: 'Relatives', icon: 'people', badge: 0 },
    { id: 'exercise-assignment', label: 'Exercise Assignment', icon: 'fitness_center', badge: 0 },
    { id: 'diet-assignment', label: 'Diet Assignment', icon: 'restaurant_menu', badge: 0 },
    { id: 'body-diagnosis', label: 'Body Diagnosis', icon: 'healing', badge: 0 },
    { id: 'billing', label: 'Billing', icon: 'receipt_long', badge: 0 }
  ];

  selectedTab = 'overview';
  billingOpenInvoiceId: string = '';
  private queryTabConsumed = false;
  private normalizePatientId(raw: any): string {
    const v = (raw ?? '').toString().trim();
    if (!v) return '';
    // If it's purely numeric, keep legacy behavior: P001, P002...
    if (/^\d+$/.test(v)) return `P${v.padStart(3, '0')}`;
    // If it already looks like an id (PAT-1001, PAT001, P001, etc.) don't double-prefix it.
    return v;
  }

  // Tab customization state (UI-only, no API wiring yet)
  allAvailableTabs: { id: string; label: string; icon: string; builtIn: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', builtIn: true },
    { id: 'medical-record', label: 'Medical Record', icon: 'receipt', builtIn: true },
    { id: 'profile', label: 'Profile', icon: 'person', builtIn: true },
    { id: 'vitals', label: 'Vitals', icon: 'favorite', builtIn: true },
    { id: 'medications', label: 'Medications', icon: 'local_pharmacy', builtIn: true },
    { id: 'appointments', label: 'Appointments', icon: 'event', builtIn: true },
    { id: 'lab-reports', label: 'Lab Reports', icon: 'assessment', builtIn: true },
    { id: 'clinical-notes', label: 'Clinical Notes', icon: 'note', builtIn: true },
    { id: 'care-plan', label: 'Care Plan', icon: 'date_range', builtIn: true },
    { id: 'rounds', label: 'Rounds', icon: 'access_time', builtIn: true },
    { id: 'medicine-requests', label: 'Medicine Requests', icon: 'healing', builtIn: true },
    { id: 'relatives', label: 'Relatives', icon: 'people', builtIn: true },
    { id: 'exercise-assignment', label: 'Exercise Assignment', icon: 'fitness_center', builtIn: true },
    { id: 'diet-assignment', label: 'Diet Assignment', icon: 'restaurant_menu', builtIn: true },
    { id: 'body-diagnosis', label: 'Body Diagnosis', icon: 'healing', builtIn: true },
    { id: 'billing', label: 'Billing', icon: 'receipt_long', builtIn: true }
  ];

  tabConfigItems: { id: string; label: string; icon: string; enabled: boolean; builtIn: boolean; badge?: number }[] = [];

  // Patient Data
  patientInfo: PatientInfo = {
    id: 'P001',
    name: 'Sarah Johnson',
    age: 34,
    gender: 'Female',
    bloodGroup: 'O+',
    contactNumber: '+1 (555) 123-4567',
    email: 'sarah.johnson@email.com',
    address: '123 Main Street, New York, NY 10001',
    emergencyContact: '+1 (555) 987-6543',
    emergencyContactRelation: 'Spouse',
    admissionStatus: 'OPD',
    primaryDoctor: 'Dr. Michael Chen',
    department: 'Cardiology',
    diagnosis: ['Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia'],
    allergies: ['Penicillin', 'Sulfa drugs', 'Latex'],
    insuranceProvider: 'Blue Cross Blue Shield',
    insuranceNumber: 'BCBS123456789',
    insuranceExpiry: new Date('2025-12-31'),
    occupation: 'Software Engineer',
    maritalStatus: 'Married',
    nextOfKin: 'John Johnson (Spouse)',
    medicalHistory: ['Hypertension (2018)', 'Gestational Diabetes (2020)'],
    familyHistory: ['Father: Heart Disease', 'Mother: Diabetes'],
    lifestyle: {
      smoking: false,
      alcohol: false,
      exercise: 'Light walking 3x/week',
      diet: 'Low sodium, diabetic diet'
    }
  };

  // IPD Management Data
  ipdAdmissionDetails: IPDAdmissionDetails = {
    ward: '',
    room: '',
    bed: '',
    admissionDate: new Date(),
    attendingDoctor: '',
    expectedDischarge: new Date(),
    lengthOfStay: 0,
    daysLeft: 0
  };

  // Admission Form
  admissionForm!: FormGroup;

  // Form Options
  wardOptions = [
    'General Ward',
    'ICU',
    'Cardiac Ward',
    'Pediatric Ward',
    'Maternity Ward',
    'Surgical Ward'
  ];

  bedOptions = [
    'Bed A',
    'Bed B',
    'Bed C',
    'Bed D'
  ];

  doctorOptions = [
    'Dr. Michael Chen',
    'Dr. Sarah Smith',
    'Dr. Robert Johnson',
    'Dr. Emily Wilson',
    'Dr. David Brown'
  ];

  ipdVitalSigns: IPDVitalSigns = {
    pulse: 98,
    temperature: 37.2,
    bloodPressure: '120/80',
    spO2: 97,
    lastUpdated: new Date()
  };

  ipdCareSchedule: IPDCareSchedule[] = [
    {
      time: '4:00 PM',
      activity: 'Vital Check',
      description: 'Regular monitoring of vital signs',
      type: 'nursing',
      assignedTo: 'Nurse Williams',
      status: 'pending'
    },
    {
      time: '6:00 PM',
      activity: 'Antibiotics',
      description: 'IV Ceftriaxone 1g',
      type: 'medication',
      assignedTo: 'Nurse Johnson',
      status: 'pending'
    },
    {
      time: '7:30 PM',
      activity: 'Evening Rounds',
      description: 'By attending physician',
      type: 'doctor-visit',
      assignedTo: 'Dr. Williams',
      status: 'pending'
    }
  ];

  ipdQuickActions: IPDQuickAction[] = [
    {
      id: 'daily-rounds',
      label: 'Daily Rounds',
      icon: 'assessment',
      color: '#3b82f6',
      action: () => this.performDailyRounds()
    },
    {
      id: 'medication-order',
      label: 'Medication Order',
      icon: 'medication',
      color: '#10b981',
      action: () => this.orderMedication()
    },
    {
      id: 'record-vitals',
      label: 'Record Vitals',
      icon: 'favorite',
      color: '#06b6d4',
      action: () => this.recordVitals()
    },
    {
      id: 'care-plan',
      label: 'Care Plan',
      icon: 'people',
      color: '#6b7280',
      action: () => this.updateCarePlan()
    },
    {
      id: 'diet-order',
      label: 'Diet Order',
      icon: 'restaurant',
      color: '#f59e0b',
      action: () => this.orderDiet()
    },
    {
      id: 'discharge-patient',
      label: 'Discharge Patient',
      icon: 'exit_to_app',
      color: '#dc2626',
      action: () => this.dischargePatient()
    },
    {
      id: 'discharge-summary',
      label: 'Discharge Summary',
      icon: 'description',
      color: '#ef4444',
      action: () => this.generateDischargeSummary()
    }
  ];

  patientStats: PatientStats = {
    totalAppointments: 24,
    completedAppointments: 20,
    pendingAppointments: 4,
    cancelledAppointments: 2,
    totalPrescriptions: 15,
    activeMedications: 8,
    labReports: 12,
    abnormalLabReports: 3,
    vitalReadings: 45,
    clinicalNotes: 8,
    daysInHospital: 5,
    readmissionCount: 1
  };

  // Medications
  medications: PatientMedication[] = [
    {
      id: 'M001',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      route: 'Oral',
      startDate: new Date('2024-01-20'),
      prescribedBy: 'Dr. Michael Chen',
      status: 'active',
      instructions: 'Take with meals to reduce stomach upset',
      sideEffects: ['Nausea', 'Diarrhea'],
      interactions: ['Alcohol may increase risk of lactic acidosis'],
      quantity: 30,
      urgency: 'Low',
      requestedOn: new Date('2025-11-12')
    },
    {
      id: 'M002',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      route: 'Oral',
      startDate: new Date('2024-01-18'),
      prescribedBy: 'Dr. Michael Chen',
      status: 'active',
      instructions: 'Take in the morning',
      sideEffects: ['Dry cough', 'Dizziness'],
      interactions: ['NSAIDs may reduce effectiveness'],
      quantity: 60,
      urgency: 'Medium',
      requestedOn: new Date('2025-11-10')
    },
    {
      id: 'M003',
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      route: 'Oral',
      startDate: new Date('2024-01-16'),
      prescribedBy: 'Dr. Michael Chen',
      status: 'active',
      instructions: 'Take at bedtime',
      sideEffects: ['Muscle pain', 'Liver enzyme elevation'],
      interactions: ['Grapefruit juice may increase levels'],
      quantity: 21,
      urgency: 'High',
      requestedOn: new Date('2025-11-08')
    }
  ];

  // Medications UI state
  medicationsSearch: string = '';
  activeMedicationAssignTab: 'medicines' | 'template' = 'medicines';

  availableMedicines = [
    { id: 'A001', name: 'Paracetamol', dosage: '500mg', frequency: 'Twice a day', quantityAvailable: 42 },
    { id: 'A002', name: 'Ibuprofen', dosage: '250mg', frequency: 'When needed', quantityAvailable: 23 },
    { id: 'A003', name: 'Amoxicillin', dosage: '500mg', frequency: '2 times a day', quantityAvailable: 12 }
  ];

  selectedAssignMedicines: PatientMedication[] = [];

  get filteredMedications(): PatientMedication[] {
    const q = this.medicationsSearch.trim().toLowerCase();
    if (!q) {
      return this.medications;
    }
    return this.medications.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.dosage.toLowerCase().includes(q) ||
      m.frequency.toLowerCase().includes(q)
    );
  }

  today: Date = new Date();

  // Medications grid
  medicationsColumns: any[] = [];
  medicationsGridOptions: any = {};

  // Medication templates
  medicationTemplates: {
    id: string;
    name: string;
    medicineIds: string[];
  }[] = [];

  newTemplateName: string = '';

  openAssignMedicationsDialog(): void {
    this.openMedicationDialog('medicines');
  }

  openMedicationTemplateDialog(): void {
    this.openMedicationDialog('template');
  }

  private openMedicationDialog(activeTab: 'medicines' | 'template' = 'medicines'): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'basic'
      },
      {
        id: 'assign',
        text: 'Assign Medicines',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(MedicationAssignDialogComponent, {
      title: 'New Medication Assignment',
      data: {
        activeTab: activeTab,
        availableMedicines: this.medications,
        selectedMedicines: this.selectedAssignMedicines,
        medicationTemplates: this.medicationTemplates,
        today: this.today
      },
      width: '90%',
      height: '90%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'cancel') {
        return;
      }
      
      if (result?.action === 'assign' && result.selectedMedicines) {
        this.handleAssignMedicinesFromDialog(result.selectedMedicines);
      }
    });
  }

  closeAssignMedicationsDialog(): void {
    // No longer needed - dialog closes automatically
  }

  openNewMedicationDialog(medication?: PatientMedication): void {
    const isEditMode = !!medication;
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'basic'
      },
      {
        id: isEditMode ? 'save' : 'add',
        text: isEditMode ? 'Save Changes' : 'Add Medications',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(NewMedicationDialogComponent, {
      title: isEditMode ? 'Edit Medication' : 'New Medication Assignment',
      data: {
        selectedMedicines: this.selectedAssignMedicines,
        mode: isEditMode ? 'edit' : 'create',
        medication: medication
      },
      width: '90%',
      height: '90%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === false || result?.action === 'cancel') {
        return;
      }
      
      if (result?.action === 'save' && result.medication) {
        this.handleUpdateMedicationFromDialog(result.medication);
      } else if (result?.action === 'add' && result.selectedMedicines) {
        this.handleAddMedicinesFromDialog(result.selectedMedicines);
      }
    });
  }

  closeNewMedicationDialog(): void {
    // No longer needed - dialog closes automatically
  }

  handleAddMedicinesFromDialog(selectedMedicines: any[]): void {
    // Convert to PatientMedication format and add to main medications list
    const medicationsToAdd: PatientMedication[] = selectedMedicines.map(med => ({
      id: med.id || `M-${Date.now()}`,
      name: med.name,
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      route: med.route || 'Oral',
      startDate: new Date(),
      prescribedBy: this.patientInfo.primaryDoctor,
      status: 'active',
      instructions: med.symptoms || '',
      quantity: parseInt(med.quantity) || 30,
      urgency: 'Low',
      requestedOn: new Date(),
      selected: false
    }));
    
    this.medications = [...this.medications, ...medicationsToAdd];
    this.selectedAssignMedicines = [];
  }

  handleUpdateMedicationFromDialog(updatedMedication: PatientMedication): void {
    // Find and update the medication in the list
    const index = this.medications.findIndex(m => m.id === updatedMedication.id);
    if (index !== -1) {
      this.medications = [
        ...this.medications.slice(0, index),
        updatedMedication,
        ...this.medications.slice(index + 1)
      ];
    }
  }

  handleAddMedicineToForm(med: any): void {
    // This is handled by the dialog component itself
    // The dialog will show the form when a medicine is clicked
  }

  handleAddMedicineToCart(medicineData: any): void {
    // Add medicine to cart with form data
    const medicineToAdd: PatientMedication = {
      id: medicineData.id || `M-${Date.now()}`,
      name: medicineData.name,
      dosage: medicineData.dosage || '',
      frequency: medicineData.frequency || '',
      route: medicineData.route || 'Oral',
      startDate: new Date(),
      prescribedBy: this.patientInfo.primaryDoctor,
      status: 'active',
      instructions: medicineData.symptoms || '',
      quantity: parseInt(medicineData.quantity) || 30,
      urgency: 'Low',
      requestedOn: new Date(),
      selected: false
    };
    this.selectedAssignMedicines = [...this.selectedAssignMedicines, medicineToAdd];
  }

  handleEditSelectedMedicine(med: PatientMedication): void {
    // TODO: Open form with medicine data pre-filled for editing
    // For now, just remove and let user re-add
    this.removeSelectedAssignMedicine(med.id);
  }

  handleSelectTemplate(templateId: string): void {
    // Find the template
    const template = this.medicationTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Find all medicines from the template and add them to cart
    template.medicineIds.forEach(medId => {
      const med = this.medications.find(m => m.id === medId);
      if (med && !this.selectedAssignMedicines.find(m => m.id === medId)) {
        this.selectedAssignMedicines = [
          ...this.selectedAssignMedicines,
          {
            ...med,
            selected: false
          }
        ];
      }
    });
  }

  handleAssignMedicines(): void {
    // Add all selected medicines to the main medications list
    this.medications = [...this.medications, ...this.selectedAssignMedicines];
    this.selectedAssignMedicines = [];
    this.closeAssignMedicationsDialog();
  }

  handleAssignMedicinesFromDialog(selectedMedicines: any[]): void {
    // Convert to PatientMedication format and add to main medications list
    const medicationsToAdd: PatientMedication[] = selectedMedicines.map(med => ({
      id: med.id || `M-${Date.now()}`,
      name: med.name,
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      route: med.route || 'Oral',
      startDate: new Date(),
      prescribedBy: this.patientInfo.primaryDoctor,
      status: 'active',
      instructions: med.symptoms || '',
      quantity: parseInt(med.quantity) || 30,
      urgency: 'Low',
      requestedOn: new Date(),
      selected: false
    }));
    
    this.medications = [...this.medications, ...medicationsToAdd];
    this.selectedAssignMedicines = [];
  }

  removeSelectedAssignMedicine(medId: string): void {
    this.selectedAssignMedicines = this.selectedAssignMedicines.filter(m => m.id !== medId);
  }

  // Vital Signs
  vitalSigns: VitalSign[] = [
    {
      id: 'V001',
      type: 'Blood Pressure',
      value: 140,
      unit: 'mmHg',
      date: new Date('2024-01-20'),
      time: new Date('2024-01-20T08:00:00'),
      recordedBy: 'Nurse Sarah',
      notes: 'Systolic elevated',
      isNormal: false
    },
    {
      id: 'V002',
      type: 'Heart Rate',
      value: 72,
      unit: 'bpm',
      date: new Date('2024-01-20'),
      time: new Date('2024-01-20T08:00:00'),
      recordedBy: 'Nurse Sarah',
      isNormal: true
    },
    {
      id: 'V003',
      type: 'Temperature',
      value: 98.6,
      unit: '°F',
      date: new Date('2024-01-20'),
      time: new Date('2024-01-20T08:00:00'),
      recordedBy: 'Nurse Sarah',
      isNormal: true
    },
    {
      id: 'V004',
      type: 'Blood Glucose',
      value: 180,
      unit: 'mg/dL',
      date: new Date('2024-01-20'),
      time: new Date('2024-01-20T08:00:00'),
      recordedBy: 'Nurse Sarah',
      notes: 'Fasting glucose elevated',
      isNormal: false
    }
  ];

  // Lab Reports
  labReports: LabReport[] = [
    {
      id: 'L001',
      testName: 'Complete Blood Count',
      category: 'Hematology',
      result: 'Normal',
      normalRange: '4.5-11.0',
      unit: 'K/µL',
      date: new Date('2024-01-19'),
      status: 'completed',
      orderedBy: 'Dr. Michael Chen'
    },
    {
      id: 'L002',
      testName: 'HbA1c',
      category: 'Diabetes',
      result: '8.2',
      normalRange: '4.0-5.6',
      unit: '%',
      date: new Date('2024-01-19'),
      status: 'abnormal',
      orderedBy: 'Dr. Michael Chen',
      notes: 'Poor glycemic control'
    },
    {
      id: 'L003',
      testName: 'Lipid Panel',
      category: 'Cardiovascular',
      result: 'Elevated',
      normalRange: '<200',
      unit: 'mg/dL',
      date: new Date('2024-01-19'),
      status: 'abnormal',
      orderedBy: 'Dr. Michael Chen',
      notes: 'Total cholesterol 240 mg/dL'
    }
  ];

  // Appointments
  appointments: Appointment[] = [
    {
      id: 'A001',
      date: new Date('2024-01-22'),
      time: new Date('2024-01-22T10:00:00'),
      type: 'Follow-up',
      doctor: 'Dr. Michael Chen',
      department: 'Cardiology',
      status: 'scheduled',
      notes: 'Review medication effectiveness'
    },
    {
      id: 'A002',
      date: new Date('2024-01-25'),
      time: new Date('2024-01-25T14:00:00'),
      type: 'Consultation',
      doctor: 'Dr. Emily Rodriguez',
      department: 'Endocrinology',
      status: 'scheduled',
      notes: 'Diabetes management consultation'
    }
  ];

  // Clinical Notes
  clinicalNotes: ClinicalNote[] = [
    {
      id: 'C001',
      date: new Date('2024-01-20'),
      type: 'Progress Note',
      title: 'Daily Progress Note',
      content: 'Patient showing improvement in blood pressure control. Blood glucose levels remain elevated. Continue current medication regimen.',
      author: 'Dr. Michael Chen',
      tags: ['progress', 'medication'],
      isPrivate: false
    },
    {
      id: 'C002',
      date: new Date('2024-01-19'),
      type: 'Assessment',
      title: 'Initial Assessment',
      content: 'Patient admitted for uncontrolled hypertension and diabetes. Started on appropriate medications. Monitoring vital signs closely.',
      author: 'Dr. Michael Chen',
      tags: ['assessment', 'admission'],
      isPrivate: false
    }
  ];

  // Care Schedule
  careSchedule: CareTimetableItem[] = [
    {
      id: 1,
      type: 'medication',
      title: 'Morning Medication',
      description: 'Metformin 500mg, Lisinopril 10mg',
      assignee: 'Nurse Sarah',
      startTime: new Date('2024-01-20T08:00:00'),
      endTime: new Date('2024-01-20T08:30:00'),
      status: 'completed',
      priority: 'high'
    },
    {
      id: 2,
      type: 'vitals',
      title: 'Vital Signs Check',
      description: 'Blood pressure, heart rate, temperature, blood glucose',
      assignee: 'Nurse Mike',
      startTime: new Date('2024-01-20T09:00:00'),
      endTime: new Date('2024-01-20T09:15:00'),
      status: 'completed',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'consultation',
      title: 'Doctor Consultation',
      description: 'Review treatment progress and adjust medications',
      assignee: 'Dr. Michael Chen',
      startTime: new Date('2024-01-20T10:00:00'),
      endTime: new Date('2024-01-20T10:30:00'),
      status: 'scheduled',
      priority: 'high'
    },
    {
      id: 4,
      type: 'lab',
      title: 'Blood Test',
      description: 'Fasting blood glucose and HbA1c',
      assignee: 'Lab Technician',
      startTime: new Date('2024-01-20T11:00:00'),
      endTime: new Date('2024-01-20T11:30:00'),
      status: 'scheduled',
      priority: 'medium'
    }
  ];

  // Quick Actions
  quickActions: QuickAction[] = [
    {
      id: 'admit-patient',
      label: 'Admit Patient',
      icon: 'local_hospital',
      action: () => this.admitPatient(),
      color: 'primary',
      disabled: this.patientInfo.admissionStatus === 'IPD'
    },
    {
      id: 'add-note',
      label: 'Add Note',
      icon: 'note_add',
      action: () => this.addClinicalNote(),
      color: 'primary'
    },
    {
      id: 'schedule-appointment',
      label: 'Schedule Appointment',
      icon: 'event',
      action: () => this.scheduleAppointment(),
      color: 'accent'
    },
    {
      id: 'refer-patient',
      label: 'Refer Patient',
      icon: 'person_add',
      action: () => this.referPatient(),
      color: 'warn'
    },
    {
      id: 'order-lab',
      label: 'Order Lab Test',
      icon: 'add_shopping_cart',
      action: () => this.orderLabTest(),
      color: 'warn'
    },
    {
      id: 'prescribe-medication',
      label: 'Prescribe Medication',
      icon: 'local_pharmacy',
      action: () => this.prescribeMedication(),
      color: 'primary'
    }
  ];

  // Forms
  editForm: FormGroup;
  isEditing = false;
  isLoading = false;
  showDischargeDialog = false;

  // New Forms for Enhanced Features
  medicineRequestForm!: FormGroup;
  prescriptionForm!: FormGroup;

  // Enhanced Data Properties
  patientRounds: PatientRound[] = [];
  roundSchedules: RoundSchedule[] = [];
  medicineRequests: MedicineRequest[] = [];
  patientRelatives: PatientRelative[] = [];

  // Exercise Assignment
  exerciseAssignments: any[] = [];

  // Diet Assignment
  dietAssignments: any[] = [];
  exerciseAssignmentSearchQuery: string = '';
  exerciseAssignmentStatusFilter: string = 'all';
  exerciseAssignmentCategoryFilter: string = 'all';
  exerciseAssignmentViewMode: 'cards' | 'list' = 'cards';
  // Diet Assignment redesigned view state
  dietAssignmentSubtabIndex: number = 0; // 0 = Weekly Plans, 1 = Specific Diet Library
  selectedDietDayIndex: number = new Date().getDay(); // 0 = Sunday
  mealTimesForWeeklyPlan: Array<{ label: string; time?: string }> = [
    { label: 'Breakfast', time: '6:00 AM' },
    { label: 'Morning Snack', time: '9:00 AM' },
    { label: 'Lunch', time: '12:30 PM' },
    { label: 'Evening Snack', time: '4:00 PM' },
    { label: 'Dinner', time: '8:00 PM' }
  ];
  // No embedded catalog; using the dialog for assignments
  exerciseGroups = [
    { 
      id: 1, 
      name: 'Post-Knee Surgery Rehab', 
      exercises: [
        { name: 'Leg Press', category: 'Strength', intensity: 'Low Intensity', details: '3 sets of 10 repetitions' },
        { name: 'Bicep Curls', category: 'Strength', intensity: 'Low Intensity', details: '3 sets of 12 repetitions' },
        { name: 'Treadmill Walk', category: 'Cardio', intensity: 'Moderate Intensity', details: '30 minutes, moderate pace' }
      ]
    },
    { 
      id: 2, 
      name: 'Low-Impact Cardio', 
      exercises: [
        { name: 'Stationary Bike', category: 'Cardio', intensity: 'Low Intensity', details: '20 minutes' },
        { name: 'Elliptical', category: 'Cardio', intensity: 'Moderate Intensity', details: '15 minutes' },
        { name: 'Swimming', category: 'Cardio', intensity: 'Low Intensity', details: '30 minutes' }
      ]
    }
  ];
  individualExercises = [
    { id: 1, name: 'Leg Press', category: 'Strength', intensity: 'Low Intensity' },
    { id: 2, name: 'Bicep Curls', category: 'Strength', intensity: 'Low Intensity' },
    { id: 3, name: 'Treadmill Walk', category: 'Cardio', intensity: 'Moderate Intensity' }
  ];
  assignedExercises: Array<{exercise: Exercise, assignedDate: Date, dueDate: Date | null, status: string}> = [];
  exerciseAssignmentDate = '';

  // Chart Data
  vitalTrendsData = [
    { date: '2024-01-15', bp: 150, hr: 75, temp: 98.6, glucose: 200 },
    { date: '2024-01-16', bp: 145, hr: 72, temp: 98.4, glucose: 190 },
    { date: '2024-01-17', bp: 140, hr: 70, temp: 98.5, glucose: 185 },
    { date: '2024-01-18', bp: 138, hr: 71, temp: 98.3, glucose: 180 },
    { date: '2024-01-19', bp: 135, hr: 69, temp: 98.4, glucose: 175 },
    { date: '2024-01-20', bp: 140, hr: 72, temp: 98.6, glucose: 180 }
  ];

  medicineChartData = [
    { name: 'Metformin', y: 30, color: '#3b82f6' },
    { name: 'Lisinopril', y: 25, color: '#10b981' },
    { name: 'Atorvastatin', y: 20, color: '#f59e0b' },
    { name: 'Aspirin', y: 15, color: '#ef4444' },
    { name: 'Others', y: 10, color: '#8b5cf6' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly eventService: CoreEventService,
    private readonly dialog: MatDialog,
    private readonly dialogService: DialogboxService
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      gender: ['', Validators.required],
      bloodGroup: ['', Validators.required],
      contactNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      emergencyContact: ['', Validators.required],
      emergencyContactRelation: ['', Validators.required],
      primaryDoctor: ['', Validators.required],
      department: ['', Validators.required],
      diagnosis: [''],
      allergies: [''],
      insuranceProvider: [''],
      insuranceNumber: [''],
      occupation: [''],
      maritalStatus: [''],
      nextOfKin: ['']
    });

    this.eventService.setBreadcrumb({
      label: 'Patient Profile',
      icon: 'person'
    });
  }

  ngOnInit(): void {
    // Get patient ID from route params
    this.route.params.subscribe(params => {
      const patientId = params['id'];
      if (patientId) {
        // Load patient data based on ID
        // For now, we'll use the ID as is
        this.patientInfo.id = patientId;
      }
    });

    // Get patient data from query parameters and handle tab selection
    this.route.queryParams.subscribe(params => {
      const patientId = params['patientId'];
      const patientName = params['patientName'];
      const tab = params['tab'];
      const invoiceId = params['invoiceId'];
      
      // Handle tab selection from query params
      if (tab && this.tabs.find(t => t.id === tab) && !this.queryTabConsumed) {
        this.selectedTab = tab;
        this.queryTabConsumed = true;
      }
      if (invoiceId) {
        this.billingOpenInvoiceId = invoiceId;
        // If invoiceId is provided, ensure billing tab is visible/selected
        if (this.tabs.find(t => t.id === 'billing')) {
          this.selectedTab = 'billing';
        }
        // One-time deep-link: remove invoiceId + tab from URL so user can freely switch tabs afterwards
        Promise.resolve().then(() => {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { invoiceId: null, tab: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        });
      } else {
        this.billingOpenInvoiceId = '';
      }
      
      if (patientId && patientName) {
        // Update patient info with the selected patient
        this.patientInfo.name = patientName;
        this.patientInfo.id = this.normalizePatientId(patientId);
        
        // You could also load patient data from a service here
        console.log('Loading patient:', patientId, patientName);

        // Load any saved tab configuration for this patient (local only)
        this.loadTabsFromStorage();
      }
    });

    this.initializeForm();
    this.initializeEnhancedForms();
    this.loadEnhancedData();
    this.updateTabBadges();
    this.initializeSearchData();
    this.initializeNotifications();
    this.initializeCareTeam();
    this.initializeVitalTrends();
    this.startRealTimeUpdates();
    this.initializeMedicationsGrid();

    // Fallback: if no patient id in URL updated the tabs yet, try loading defaults from storage
    this.loadTabsFromStorage();
  }

  private initializeMedicationsGrid(): void {
    this.medicationsColumns = [
      {
        colId: 'select',
        headerName: '',
        width: 48,
        minWidth: 48,
        maxWidth: 48,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        lockPosition: 'left',
        pinned: 'left',
        suppressSizeToFit: true,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
        // Custom checkbox renderer so we are not dependent on ag-grid's internal selection column,
        // and we can directly control the `selected` flag used for template creation.
        cellRenderer: (params: any) => {
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.checked = !!params.data?.selected;
          input.addEventListener('change', () => {
            params.data.selected = input.checked;
          });
          return input;
        }
      },
      { headerName: 'Medicine Name', field: 'name', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Dosage', field: 'dosage', sortable: true, filter: 'agTextColumnFilter', width: 120 },
      { headerName: 'Frequency', field: 'frequency', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Quantity', field: 'quantity', width: 110 },
      { headerName: 'Urgency', field: 'urgency', width: 110 },
      { headerName: 'Requested On', field: 'requestedOn', valueGetter: (p: any) => p.data.requestedOn ? new Date(p.data.requestedOn).toLocaleDateString() : new Date(p.data.startDate).toLocaleDateString(), width: 130 },
      { headerName: 'Status', field: 'status', width: 120 }
    ];

    this.medicationsGridOptions = {
      // We rely on the custom checkbox column above and the `selected` flag,
      // so no special ag-grid selection configuration is required.
      rowSelection: 'single',
      menuActions: [
        {
          title: 'Edit',
          icon: 'edit',
          click: (param: any) => {
            console.log('Edit medication', param.data);
            this.openNewMedicationDialog(param.data);
          }
        },
        {
          title: 'Delete',
          icon: 'delete',
          click: (param: any) => {
            console.log('Delete medication', param.data);
            this.medications = this.medications.filter(m => m.id !== param.data.id);
          }
        }
      ]
    };
  }

  // Template creation helpers
  getSelectedMedicationsForTemplate(): PatientMedication[] {
    return this.medications.filter(m => m.selected);
  }

  canCreateMedicationTemplate(): boolean {
    return this.getSelectedMedicationsForTemplate().length > 0;
  }

  openCreateTemplateDialog(): void {
    if (!this.canCreateMedicationTemplate()) {
      // Require at least one selection
      return;
    }

    const selectedMedications = this.getSelectedMedicationsForTemplate();
    const isFormValid = selectedMedications.length > 0;
    
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'basic'
      },
      {
        id: 'save',
        text: 'Save Template',
        color: 'primary',
        appearance: 'raised',
        disabled: !isFormValid // Will be updated dynamically in component
      }
    ];

    const dialogRef = this.dialogService.openDialog(MedicationTemplateDialogComponent, {
      title: 'Create Medication Template',
      data: {
        selectedMedications: selectedMedications.map(m => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency
        })),
        templateName: this.newTemplateName
      },
      width: '500px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === false || result?.action === 'cancel') {
        return;
      }
      
      if (result?.action === 'save' && result.templateName && result.selectedMedications) {
        this.saveMedicationTemplateFromDialog(result.templateName, result.selectedMedications);
      }
    });
  }

  closeCreateTemplateDialog(): void {
    // No longer needed - dialog closes automatically
  }

  saveMedicationTemplate(): void {
    // Legacy method - kept for compatibility
    const selected = this.getSelectedMedicationsForTemplate();
    if (!this.newTemplateName.trim() || selected.length === 0) {
      return;
    }
    const template = {
      id: `T-${Date.now()}`,
      name: this.newTemplateName.trim(),
      medicineIds: selected.map(m => m.id)
    };
    this.medicationTemplates.push(template);
    this.newTemplateName = '';
  }

  saveMedicationTemplateFromDialog(templateName: string, selectedMedications: any[]): void {
    const newTemplate = {
      id: `T-${Date.now()}`,
      name: templateName,
      medicineIds: selectedMedications.map(m => m.id)
    };

    this.medicationTemplates = [...this.medicationTemplates, newTemplate];
    this.newTemplateName = '';
  }

  initializeForm(): void {
    this.editForm.patchValue({
      name: this.patientInfo.name,
      age: this.patientInfo.age,
      gender: this.patientInfo.gender,
      bloodGroup: this.patientInfo.bloodGroup,
      contactNumber: this.patientInfo.contactNumber,
      email: this.patientInfo.email,
      address: this.patientInfo.address,
      emergencyContact: this.patientInfo.emergencyContact,
      emergencyContactRelation: this.patientInfo.emergencyContactRelation,
      primaryDoctor: this.patientInfo.primaryDoctor,
      department: this.patientInfo.department,
      diagnosis: this.patientInfo.diagnosis.join(', '),
      allergies: this.patientInfo.allergies.join(', '),
      insuranceProvider: this.patientInfo.insuranceProvider,
      insuranceNumber: this.patientInfo.insuranceNumber,
      occupation: this.patientInfo.occupation,
      maritalStatus: this.patientInfo.maritalStatus,
      nextOfKin: this.patientInfo.nextOfKin
    });
  }

  initializeAdmissionForm(): void {
    this.admissionForm = this.fb.group({
      ward: ['General Ward', Validators.required],
      room: ['301', Validators.required],
      bed: ['Bed A', Validators.required],
      attendingDoctor: ['Dr. Michael Chen', Validators.required]
    });
  }

  updateTabBadges(): void {
    // Update badges based on data
    this.tabs.find(t => t.id === 'vitals')!.badge = this.vitalSigns.filter(v => !v.isNormal).length;
    this.tabs.find(t => t.id === 'appointments')!.badge = this.appointments.filter(a => a.status === 'scheduled').length;
    this.tabs.find(t => t.id === 'lab-reports')!.badge = this.labReports.filter(l => l.status === 'abnormal').length;
  }

  onTabChange(tabId: string): void {
    this.selectedTab = tabId;
    if (tabId === 'exercise-assignment') {
      this.updateProgressChart();
    }
  }

  // Tabs: helpers and configuration UI logic
  getTabById(tabId: string): { id: string; label: string; icon: string; badge: number } | undefined {
    return this.tabs.find(t => t.id === tabId);
  }

  openTabConfig(): void {
    this.initTabConfigFromCurrentTabs();
    
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'stroked',
        disabled: false
      },
      {
        id: 'save',
        text: 'Save',
        color: 'primary',
        appearance: 'raised',
        disabled: false
      }
    ];

    const dialogRef = this.dialogService.openDialog(TabConfigDialogComponent, {
      title: 'Customize Tabs',
      data: {
        tabConfigItems: this.tabConfigItems
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save' && result.tabConfigItems) {
        // Update tabConfigItems with the result
        this.tabConfigItems = result.tabConfigItems;
        // Save the configuration
        this.saveTabConfig();
      }
    });
  }

  closeTabConfig(): void {
    // This method is no longer needed as dialog handles closing
  }

  private initTabConfigFromCurrentTabs(): void {
    const enabledIds = new Set(this.tabs.map(t => t.id));
    const merged: { id: string; label: string; icon: string; builtIn: boolean }[] = [
      ...this.allAvailableTabs
    ];
    // Preserve current order: first, items in current tabs order, then any remaining available ones
    const orderMap = new Map<string, number>();
    this.tabs.forEach((t, idx) => orderMap.set(t.id, idx));
    merged.sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : Number.MAX_SAFE_INTEGER;
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : Number.MAX_SAFE_INTEGER;
      return ai - bi || a.label.localeCompare(b.label);
    });
    this.tabConfigItems = merged.map(m => ({
      id: m.id,
      label: m.label,
      icon: m.icon,
      builtIn: m.builtIn,
      enabled: m.id === 'overview' ? true : enabledIds.has(m.id),
      badge: this.tabs.find(t => t.id === m.id)?.badge ?? 0
    }));
  }


  saveTabConfig(): void {
    const enabled = this.tabConfigItems.filter(i => i.enabled);
    // Build with Overview always first and enabled
    const overview = { id: 'overview', label: 'Overview', icon: 'dashboard', badge: this.tabs.find(t => t.id === 'overview')?.badge ?? 0 };
    const others = enabled.filter(i => i.id !== 'overview').map(i => ({ id: i.id, label: i.label, icon: i.icon, badge: i.badge ?? 0 }));
    this.tabs = [overview, ...others];
    // Validate selected tab
    if (!this.tabs.find(t => t.id === this.selectedTab)) {
      this.selectedTab = this.tabs[0].id;
    }
    this.updateTabBadges();
    this.saveTabsToStorage();
  }

  private getPatientTabsStorageKey(): string {
    return `patientTabs:${this.patientInfo.id}`;
  }

  private loadTabsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.getPatientTabsStorageKey());
      if (!raw) return;
      const stored: { id: string; label: string; icon: string; badge?: number }[] = JSON.parse(raw);
      if (Array.isArray(stored) && stored.length) {
        // Keep only built-ins, ignore unknowns
        const allowedIds = new Set<string>(this.allAvailableTabs.map(t => t.id));
        let filtered = stored.filter(t => allowedIds.has(t.id));
        // Ensure overview exists and is first
        if (!filtered.find(t => t.id === 'overview')) {
          filtered = [{ id: 'overview', label: 'Overview', icon: 'dashboard', badge: 0 }, ...filtered];
        }
        // Move overview to front if not already
        filtered = filtered.sort((a, b) => (a.id === 'overview' ? -1 : b.id === 'overview' ? 1 : 0));
        this.tabs = filtered.map(t => ({ id: t.id, label: t.label, icon: t.icon, badge: t.badge ?? 0 }));
      }
    } catch {
      // ignore
    }
  }

  private saveTabsToStorage(): void {
    try {
      localStorage.setItem(this.getPatientTabsStorageKey(), JSON.stringify(this.tabs));
    } catch {
      // ignore
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.initializeForm();
    }
  }

  saveChanges(): void {
    if (this.editForm.valid) {
      this.isLoading = true;
      
      // Simulate API call
      setTimeout(() => {
        const formValue = this.editForm.value;
        this.patientInfo = {
          ...this.patientInfo,
          name: formValue.name,
          age: formValue.age,
          gender: formValue.gender,
          bloodGroup: formValue.bloodGroup,
          contactNumber: formValue.contactNumber,
          email: formValue.email,
          address: formValue.address,
          emergencyContact: formValue.emergencyContact,
          emergencyContactRelation: formValue.emergencyContactRelation,
          primaryDoctor: formValue.primaryDoctor,
          department: formValue.department,
          diagnosis: formValue.diagnosis.split(',').map((d: string) => d.trim()),
          allergies: formValue.allergies.split(',').map((a: string) => a.trim()),
          insuranceProvider: formValue.insuranceProvider,
          insuranceNumber: formValue.insuranceNumber,
          occupation: formValue.occupation,
          maritalStatus: formValue.maritalStatus,
          nextOfKin: formValue.nextOfKin
        };
        
        this.isEditing = false;
        this.isLoading = false;
      }, 1000);
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.initializeForm();
  }

  toggleAdmissionStatus(): void {
    if (this.patientInfo.admissionStatus === 'IPD') {
      this.patientInfo.admissionStatus = 'OPD';
    } else if (this.patientInfo.admissionStatus === 'OPD') {
      this.patientInfo.admissionStatus = 'IPD';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'scheduled': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'in-progress': return 'pending';
      case 'scheduled': return 'schedule';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }

  getCurrentTabLabel(): string {
    const currentTab = this.tabs.find(tab => tab.id === this.selectedTab);
    return currentTab ? currentTab.label : 'Unknown';
  }

  // Quick Action Methods
  addClinicalNote(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'stroked',
        disabled: false
      },
      {
        id: 'save',
        text: 'Save Note',
        color: 'primary',
        appearance: 'raised',
        disabled: false
      }
    ];

    const dialogRef = this.dialogService.openDialog(PatientNotesDialogComponent, {
      title: 'Add Clinical Note',
      data: {
        patientName: this.patientInfo.name,
        defaultValue: '',
        placeholder: 'Enter clinical note, observations, or instructions...'
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save' && result.notes) {
        const newNote: ClinicalNote = {
          id: `C${Date.now()}`,
          date: new Date(),
          type: 'Clinical Note',
          title: 'Clinical Note',
          content: result.notes,
          author: 'Dr. Current Doctor', // TODO: Get from auth service
          tags: [],
          isPrivate: false
        };

        this.clinicalNotes.unshift(newNote);
        console.log('Clinical note added:', newNote);
        // TODO: Implement actual API call to save clinical note
        // this.clinicalNotesService.createNote(newNote).subscribe(...)
      }
    });
  }

  scheduleAppointment(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'stroked',
        disabled: false
      },
      {
        id: 'continue',
        text: 'Continue',
        color: 'primary',
        appearance: 'raised',
        disabled: false,
        fontIcon: 'schedule'
      }
    ];

    const dialogRef = this.dialogService.openDialog(AppointmentBookingComponent, {
      title: 'Pick a time slot',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name,
        doctorId: 'DOC001', // Current doctor ID
        doctorName: this.patientInfo.primaryDoctor,
        doctorSpecialization: 'General Medicine',
        doctorHospital: 'Shree Clinic',
        doctorLocation: 'Texas, United States',
        doctorImage: 'assets/avatars/default-avatar.jpg',
        isReferral: false
      },
      width: '90%',
      maxWidth: '800px',
      height: '90%',
      maxHeight: '90vh',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'book') {
        console.log('Appointment scheduled:', result.appointment);
        // You can add a success message or notification here
      }
    });
  }

  referPatient(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'stroked',
        disabled: false
      },
      {
        id: 'refer',
        text: 'Refer Patient',
        color: 'primary',
        appearance: 'raised',
        disabled: false,
        fontIcon: 'person_add'
      }
    ];

    const dialogRef = this.dialogService.openDialog(DoctorSearchDialogComponent, {
      title: 'Refer Patient to Doctor',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name,
        currentDoctorId: this.patientInfo.primaryDoctor
      },
      width: '70%',
      height: '70%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'refer') {
        this.openAppointmentDialog(result.doctor, result.patientId, result.patientName);
      }
    });
  }

  private openAppointmentDialog(doctor: any, patientId: string, patientName: string): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'continue',
        text: 'Book Appointment',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'schedule'
      }
    ];

    const appointmentDialogRef = this.dialogService.openDialog(AppointmentBookingComponent, {
      title: 'Book Appointment',
      data: {
        patientId: patientId,
        patientName: patientName,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorHospital: doctor.hospital,
        doctorLocation: 'Texas, United States', // You can get this from doctor data
        doctorImage: doctor.profileImageUrl,
        isReferral: true,
        referringDoctor: this.patientInfo.primaryDoctor
      },
      width: '90%',
      maxWidth: '800px',
      height: '90%',
      maxHeight: '90vh',
      footerActions: footerActions
    });

    appointmentDialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'book') {
        console.log('Appointment booked for referral:', result.appointment);
        // You can add a success message or notification here
        // this.showSuccessMessage(`Patient ${patientName} has been referred to ${doctor.name}`);
      }
    });
  }

  orderLabTest(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'stroked',
        disabled: false
      },
      {
        id: 'order',
        text: 'Order Test',
        color: 'primary',
        appearance: 'raised',
        disabled: false,
        fontIcon: 'add_shopping_cart'
      }
    ];

    // Extract unique categories from existing lab reports for suggestions
    const existingCategories = [...new Set(this.labReports.map(r => r.category))];

    const dialogRef = this.dialogService.openDialog(LabTestOrderDialogComponent, {
      title: 'Order Lab Test',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name,
        testCategories: existingCategories.length > 0 ? existingCategories : undefined
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'order' && result.formData) {
        const formData = result.formData;
        const newLabTest: LabReport = {
          id: `L${Date.now()}`,
          testName: formData.testName,
          category: formData.category,
          result: 'Pending',
          normalRange: 'N/A',
          unit: 'N/A',
          date: new Date(),
          status: 'pending',
          orderedBy: 'Dr. Current Doctor', // TODO: Get from auth service
          notes: formData.notes || undefined
        };

        this.labReports.unshift(newLabTest);
        this.updateTabBadges();
        console.log('Lab test ordered:', newLabTest);
        // TODO: Implement actual API call to order lab test
        // this.labTestService.orderTest(newLabTest).subscribe(...)
      }
    });
  }

  prescribeMedication(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'stroked',
        disabled: false
      },
      {
        id: 'prescribe',
        text: 'Prescribe Medication',
        color: 'primary',
        appearance: 'raised',
        disabled: false
      }
    ];

    const dialogRef = this.dialogService.openDialog(PrescriptionDialogComponent, {
      title: 'Prescribe Medication',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name
      },
      width: '800px',
      height: '80%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'prescribe' && result.formData) {
        const prescriptionData = {
          ...result.formData,
          patientId: this.patientInfo.id,
          patientName: this.patientInfo.name,
          doctorId: 'current-doctor-id', // This should come from auth service
          doctorName: 'Dr. Current Doctor', // This should come from auth service
          prescriptionDate: new Date(),
          status: 'ACTIVE'
        };

        console.log('Prescription submitted:', prescriptionData);
        // TODO: Implement actual API call to save prescription
        alert('Prescription created successfully!');
      }
    });
  }

  cancelPrescription(): void {
    // This method is no longer needed as dialog handles cancellation
  }

  submitPrescription(): void {
    // This method is no longer needed as dialog handles submission
  }

  onBreadcrumbClick(): void {
    this.router.navigate(['/patients']);
  }

  // Utility Methods
  getDaysInHospital(): number {
    if (!this.patientInfo.admissionDate) return 0;
    const today = new Date();
    const admissionDate = new Date(this.patientInfo.admissionDate);
    const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getLatestVitalSign(type: string): VitalSign | null {
    const vital = this.vitalSigns
      .filter(v => v.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return vital || null;
  }

  getAbnormalVitalSigns(): VitalSign[] {
    return this.vitalSigns.filter(v => !v.isNormal);
  }

  getUpcomingAppointments(): Appointment[] {
    return this.appointments
      .filter(a => a.status === 'scheduled' && new Date(a.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getActiveMedications(): PatientMedication[] {
    return this.medications.filter(m => m.status === 'active');
  }

  getAbnormalLabReports(): LabReport[] {
    return this.labReports.filter(l => l.status === 'abnormal');
  }

  // IPD Management Methods
  performDailyRounds(): void {
    console.log('Performing daily rounds');
    // Implementation for daily rounds
  }

  orderMedication(): void {
    console.log('Ordering medication');
    // Implementation for ordering medication
  }

  recordVitals(): void {
    console.log('Recording vitals');
    // Implementation for recording vitals
  }

  updateCarePlan(): void {
    console.log('Updating care plan');
    // Implementation for updating care plan
  }

  orderDiet(): void {
    console.log('Ordering diet');
    // Implementation for ordering diet
  }

  generateDischargeSummary(): void {
    console.log('Generating discharge summary');
    // Implementation for generating discharge summary
  }

  // Admission and Discharge Methods
  admitPatient(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'stroked',
        disabled: false
      },
      {
        id: 'confirm',
        text: 'Confirm Admission',
        color: 'primary',
        appearance: 'raised',
        disabled: false
      }
    ];

    const dialogRef = this.dialogService.openDialog(AdmissionDialogComponent, {
      title: 'Admit Patient',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name,
        wardOptions: this.wardOptions,
        bedOptions: this.bedOptions,
        doctorOptions: this.doctorOptions
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'confirm' && result.formData) {
        const formValue = result.formData;
        this.patientInfo.admissionStatus = 'IPD';
        this.patientInfo.admissionDate = new Date();
        this.patientInfo.roomNumber = formValue.room;
        this.patientInfo.bedNumber = formValue.bed;
        this.viewMode = 'ipd';
        
        // Update IPD admission details with form data
        this.ipdAdmissionDetails = {
          admissionDate: new Date(),
          ward: formValue.ward,
          room: formValue.room,
          bed: formValue.bed,
          attendingDoctor: formValue.attendingDoctor,
          expectedDischarge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          lengthOfStay: 0,
          daysLeft: 7
        };
      }
    });
  }

  confirmAdmission(): void {
    // This method is no longer needed as dialog handles confirmation
  }

  cancelAdmission(): void {
    // This method is no longer needed as dialog handles cancellation
  }

  dischargePatient(): void {
    this.showDischargeDialog = true;
  }

  confirmDischarge(): void {
    this.patientInfo.admissionStatus = 'OPD';
    this.patientInfo.dischargeDate = new Date();
    this.viewMode = 'profile';
    this.showDischargeDialog = false;
    
    // Reset IPD admission details
    this.ipdAdmissionDetails = {
      ward: '',
      room: '',
      bed: '',
      admissionDate: new Date(),
      attendingDoctor: '',
      expectedDischarge: new Date(),
      lengthOfStay: 0,
      daysLeft: 0
    };
  }

  cancelDischarge(): void {
    this.showDischargeDialog = false;
  }

  // View Mode Management
  switchToIPDView(): void {
    this.viewMode = 'ipd';
  }

  switchToProfileView(): void {
    this.viewMode = 'profile';
  }

  // IPD Utility Methods
  getTypeIcon(type: string): string {
    switch (type) {
      case 'nursing': return 'medical_services';
      case 'medication': return 'medication';
      case 'doctor-visit': return 'person';
      case 'lab': return 'science';
      case 'diet': return 'restaurant';
      default: return 'schedule';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'nursing': return '#3b82f6';
      case 'medication': return '#10b981';
      case 'doctor-visit': return '#8b5cf6';
      case 'lab': return '#f59e0b';
      case 'diet': return '#ef4444';
      default: return '#6b7280';
    }
  }

  // IPD Schedule Methods
  addSchedule(): void {
    console.log('Adding new schedule item');
    // Implementation for adding schedule
  }

  viewFullSchedule(): void {
    console.log('Viewing full schedule');
    // Implementation for viewing full schedule
  }

  // Utility Methods
  getCurrentDate(): Date {
    return new Date();
  }

  // Search Methods
  initializeSearchData(): void {
    // Initialize search data
  }

  onSearchInput(): void {
    if (this.searchQuery.trim()) {
      this.performSearch();
    } else {
      this.searchResults = [];
    }
  }

  performSearch(): void {
    const query = this.searchQuery.toLowerCase();
    this.searchResults = [];
    
    // Search in medications
    this.medications.forEach(med => {
      if (med.name.toLowerCase().includes(query)) {
        this.searchResults.push({
          id: med.id,
          text: med.name,
          category: 'Medication',
          icon: 'medication',
          action: () => this.navigateToTab('medications')
        });
      }
    });

    // Search in vital signs
    this.vitalSigns.forEach(vital => {
      if (vital.type.toLowerCase().includes(query)) {
        this.searchResults.push({
          id: vital.id,
          text: vital.type,
          category: 'Vital Signs',
          icon: 'favorite',
          action: () => this.navigateToTab('vitals')
        });
      }
    });

    // Search in clinical notes
    this.clinicalNotes.forEach(note => {
      if (note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)) {
        this.searchResults.push({
          id: note.id,
          text: note.title,
          category: 'Clinical Notes',
          icon: 'note',
          action: () => this.navigateToTab('clinical-notes')
        });
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  navigateToSearchResult(result: SearchResult): void {
    result.action();
    this.clearSearch();
  }

  navigateToTab(tabId: string): void {
    this.selectedTab = tabId;
  }

  // Notification Methods
  initializeNotifications(): void {
    this.notifications = [
      {
        id: '1',
        title: 'Abnormal Vital Signs',
        message: 'Blood pressure reading is elevated',
        type: 'warning',
        icon: 'warning',
        color: '#f59e0b',
        time: new Date(),
        read: false,
        action: () => this.navigateToTab('vitals')
      },
      {
        id: '2',
        title: 'Medication Due',
        message: 'Metformin 500mg is due in 30 minutes',
        type: 'info',
        icon: 'medication',
        color: '#3b82f6',
        time: new Date(Date.now() - 300000),
        read: false,
        action: () => this.navigateToTab('medications')
      },
      {
        id: '3',
        title: 'Lab Results Ready',
        message: 'New lab results available for review',
        type: 'success',
        icon: 'science',
        color: '#10b981',
        time: new Date(Date.now() - 600000),
        read: true,
        action: () => this.navigateToTab('lab-reports')
      }
    ];
    this.updateUnreadNotifications();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationRead(notification: Notification): void {
    notification.read = true;
    this.updateUnreadNotifications();
  }

  handleNotificationAction(notification: Notification): void {
    if (notification.action) {
      notification.action();
    }
    this.markNotificationRead(notification);
  }

  updateUnreadNotifications(): void {
    this.unreadNotifications = this.notifications.filter(n => !n.read).length;
  }

  // Care Team Methods
  initializeCareTeam(): void {
    this.careTeam = [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        role: 'Attending Physician',
        department: 'Cardiology',
        color: '#3b82f6',
        phone: '+1-555-0123',
        email: 'sarah.johnson@hospital.com',
        availability: 'available'
      },
      {
        id: '2',
        name: 'Nurse Williams',
        role: 'Primary Nurse',
        department: 'Cardiology',
        color: '#10b981',
        phone: '+1-555-0124',
        email: 'nurse.williams@hospital.com',
        availability: 'available'
      },
      {
        id: '3',
        name: 'Dr. Michael Chen',
        role: 'Consultant',
        department: 'Endocrinology',
        color: '#f59e0b',
        phone: '+1-555-0125',
        email: 'michael.chen@hospital.com',
        availability: 'busy'
      },
      {
        id: '4',
        name: 'Nurse Johnson',
        role: 'Charge Nurse',
        department: 'Cardiology',
        color: '#ef4444',
        phone: '+1-555-0126',
        email: 'nurse.johnson@hospital.com',
        availability: 'available'
      }
    ];
  }

  viewFullCareTeam(): void {
    this.showCareTeamDialog = true;
  }

  closeCareTeamDialog(): void {
    this.showCareTeamDialog = false;
  }

  contactTeamMember(member: CareTeamMember): void {
    console.log('Contacting:', member.name);
    // Implementation for contacting team member
  }

  messageTeamMember(member: CareTeamMember): void {
    console.log('Messaging:', member.name);
    // Implementation for messaging team member
  }

  // Vital Signs Methods
  initializeVitalTrends(): void {
    this.vitalTrends = [
      { type: 'pulse', current: 98, previous: 95, trend: 'up', change: 3 },
      { type: 'temperature', current: 37.2, previous: 37.0, trend: 'up', change: 0.2 },
      { type: 'bp', current: 120, previous: 118, trend: 'up', change: 2 },
      { type: 'spO2', current: 97, previous: 98, trend: 'down', change: -1 }
    ];
  }

  isVitalAbnormal(type: string, value: number | string): boolean {
    if (type === 'bp' && typeof value === 'string') {
      // Handle blood pressure as string (e.g., "120/80")
      const bpParts = value.split('/');
      if (bpParts.length === 2) {
        const systolic = parseInt(bpParts[0]);
        const diastolic = parseInt(bpParts[1]);
        return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
      }
      return false;
    }

    // Handle numeric values
    const numericValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numericValue)) return false;

    const ranges = {
      pulse: { min: 60, max: 100 },
      temperature: { min: 36.5, max: 37.5 },
      spO2: { min: 95, max: 100 }
    };
    
    const range = ranges[type as keyof typeof ranges];
    return range ? numericValue < range.min || numericValue > range.max : false;
  }

  getVitalTrend(type: string): string | null {
    const trend = this.vitalTrends.find(t => t.type === type);
    if (!trend) return null;
    
    const changePrefix = trend.change > 0 ? '+' : '';
    return `${changePrefix}${trend.change}`;
  }

  getVitalTrendIcon(type: string): string {
    const trend = this.vitalTrends.find(t => t.type === type);
    if (!trend) return 'trending_flat';
    
    switch (trend.trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  refreshVitals(): void {
    // Simulate real-time vital signs update
    this.ipdVitalSigns = {
      pulse: Math.floor(Math.random() * 20) + 70,
      temperature: 36.5 + Math.random() * 1.5,
      bloodPressure: `${Math.floor(Math.random() * 40) + 100}/${Math.floor(Math.random() * 20) + 60}`,
      spO2: Math.floor(Math.random() * 5) + 95,
      lastUpdated: new Date()
    };
    this.initializeVitalTrends();
  }

  setChartPeriod(period: '24h' | '7d'): void {
    this.chartPeriod = period;
    // Implementation for updating chart data
  }



  startRealTimeUpdates(): void {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
      if (this.viewMode === 'ipd') {
        this.refreshVitals();
      }
    }, 30000);
  }

  // Enhanced Features Methods
  initializeEnhancedForms(): void {
    this.medicineRequestForm = this.fb.group({
      requestedBy: ['Patient', Validators.required],
      requestedByRole: ['PATIENT', Validators.required],
      medicineName: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      route: ['', Validators.required],
      quantity: ['', Validators.required],
      urgency: ['MEDIUM', Validators.required],
      reason: ['', Validators.required],
      currentSymptoms: [''],
      notes: [''],
      isPrescriptionRequired: [true]
    });

    this.prescriptionForm = this.fb.group({
      medicineName: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      route: ['', Validators.required],
      duration: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      instructions: [''],
      isSubstitutable: [false],
      diagnosis: ['', Validators.required],
      notes: [''],
      followUpDate: ['']
    });
  }

  loadEnhancedData(): void {
    // Load patient rounds
    this.patientRounds = [
      {
        id: 'R001',
        patientId: this.patientInfo.id,
        roundType: 'DOCTOR_ROUND',
        performedBy: 'Dr. Sarah Johnson',
        performedById: 'DOC001',
        performedByRole: 'DOCTOR',
        roundDate: new Date(),
        roundTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'COMPLETED',
        priority: 'HIGH',
        notes: 'Patient showing improvement. Vital signs stable. Continue current treatment.',
        observations: ['Patient alert and responsive', 'No signs of respiratory distress', 'Pain level decreased'],
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 75,
          temperature: 36.8,
          respiratoryRate: 18,
          oxygenSaturation: 98,
          painLevel: 3
        },
        medications: [
          {
            medicationName: 'Metformin',
            dosage: '500mg',
            route: 'Oral',
            time: new Date(),
            status: 'GIVEN',
            notes: 'Taken with breakfast'
          }
        ],
        careInstructions: ['Continue current medication', 'Monitor vital signs every 4 hours', 'Encourage mobility'],
        nextRoundScheduled: new Date(Date.now() + 4 * 60 * 60 * 1000),
        isCritical: false,
        requiresFollowUp: true,
        followUpNotes: 'Schedule follow-up appointment in 1 week'
      },
      {
        id: 'R002',
        patientId: this.patientInfo.id,
        roundType: 'NURSE_ROUND',
        performedBy: 'Nurse Williams',
        performedById: 'NURSE001',
        performedByRole: 'NURSE',
        roundDate: new Date(),
        roundTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        status: 'COMPLETED',
        priority: 'MEDIUM',
        notes: 'Patient comfortable. No complaints. Medications administered on time.',
        observations: ['Patient resting comfortably', 'No pain complaints', 'Appetite good'],
        vitalSigns: {
          bloodPressure: '118/78',
          heartRate: 72,
          temperature: 36.6,
          respiratoryRate: 16,
          oxygenSaturation: 99,
          painLevel: 2
        },
        medications: [
          {
            medicationName: 'Lisinopril',
            dosage: '10mg',
            route: 'Oral',
            time: new Date(),
            status: 'GIVEN',
            notes: 'Taken as prescribed'
          }
        ],
        careInstructions: ['Continue monitoring', 'Encourage fluid intake', 'Assist with mobility'],
        nextRoundScheduled: new Date(Date.now() + 2 * 60 * 60 * 1000),
        isCritical: false,
        requiresFollowUp: false
      }
    ];

    // Load medicine requests
    this.medicineRequests = [
      {
        id: 'MR001',
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name,
        requestedBy: 'Patient',
        requestedById: this.patientInfo.id,
        requestedByRole: 'PATIENT',
        requestDate: new Date(),
        requestTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        medicineName: 'Pain Relief',
        dosage: '500mg',
        frequency: 'As needed',
        route: 'Oral',
        quantity: 10,
        urgency: 'MEDIUM',
        reason: 'Headache and body pain',
        currentSymptoms: ['Headache', 'Body aches'],
        status: 'APPROVED',
        approvedBy: 'Dr. Sarah Johnson',
        approvedById: 'DOC001',
        approvedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        notes: 'Approved for pain management',
        isPrescriptionRequired: true,
        prescriptionId: 'RX001',
        pharmacyNotes: 'Dispensed successfully',
        cost: 25.50,
        insuranceCovered: true
      }
    ];

    // Load patient relatives
    this.patientRelatives = [
      {
        id: 'REL001',
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name,
        relativeName: 'John Johnson',
        relationship: 'SPOUSE',
        contactNumber: '+1-555-0123',
        alternateContactNumber: '+1-555-0124',
        email: 'john.johnson@email.com',
        address: '123 Main Street, New York, NY 10001',
        emergencyContact: true,
        canMakeDecisions: true,
        canReceiveUpdates: true,
        canVisit: true,
        visitingHours: {
          startTime: '09:00',
          endTime: '21:00',
          days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        },
        addedBy: 'Dr. Sarah Johnson',
        addedDate: new Date(),
        lastContactDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
        notes: 'Primary emergency contact',
        isActive: true,
        verificationStatus: 'VERIFIED',
        verificationNotes: 'Contact verified via phone call'
      },
      {
        id: 'REL002',
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name,
        relativeName: 'Mary Johnson',
        relationship: 'CHILD',
        contactNumber: '+1-555-0125',
        email: 'mary.johnson@email.com',
        address: '456 Oak Avenue, New York, NY 10002',
        emergencyContact: false,
        canMakeDecisions: false,
        canReceiveUpdates: true,
        canVisit: true,
        visitingHours: {
          startTime: '10:00',
          endTime: '20:00',
          days: ['SATURDAY', 'SUNDAY']
        },
        addedBy: 'Dr. Sarah Johnson',
        addedDate: new Date(),
        notes: 'Daughter - weekend visits only',
        isActive: true,
        verificationStatus: 'VERIFIED',
        verificationNotes: 'Contact verified via email'
      }
    ];

    // Load round schedules
    this.roundSchedules = [
      {
        id: 'RS001',
        patientId: this.patientInfo.id,
        roundType: 'DOCTOR_ROUND',
        scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        frequency: 'DAILY',
        assignedTo: 'Dr. Sarah Johnson',
        assignedToId: 'DOC001',
        assignedToRole: 'DOCTOR',
        priority: 'HIGH',
        isActive: true,
        createdBy: 'Dr. Sarah Johnson',
        createdDate: new Date(),
        lastPerformed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        nextScheduled: new Date(Date.now() + 4 * 60 * 60 * 1000)
      },
      {
        id: 'RS002',
        patientId: this.patientInfo.id,
        roundType: 'NURSE_ROUND',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        frequency: 'EVERY_4_HOURS',
        assignedTo: 'Nurse Williams',
        assignedToId: 'NURSE001',
        assignedToRole: 'NURSE',
        priority: 'MEDIUM',
        isActive: true,
        createdBy: 'Dr. Sarah Johnson',
        createdDate: new Date(),
        lastPerformed: new Date(Date.now() - 1 * 60 * 60 * 1000),
        nextScheduled: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    ];
  }

  // Round Management Methods
  addNewRound(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'save',
        text: 'Save Round',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(AddRoundDialogComponent, {
      title: 'Add Patient Round',
      width: '60%',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name
      },
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      // Check if result has form data (not just action), it means form was submitted successfully
      if (result && (result.formData || (!result.action && result !== null))) {
        const roundData = result.formData || result;
        const newRound: PatientRound = {
          id: `R${Date.now()}`,
          patientId: this.patientInfo.id,
          roundType: roundData.roundType,
          performedBy: roundData.performedBy,
          performedById: 'DOC001',
          performedByRole: roundData.performedByRole,
          roundDate: roundData.roundDate ? new Date(roundData.roundDate) : new Date(),
          roundTime: roundData.roundTime ? new Date(roundData.roundTime) : new Date(),
          status: roundData.status || 'COMPLETED',
          priority: roundData.priority || 'MEDIUM',
          notes: roundData.notes || '',
          observations: roundData.observations || [],
          medications: [],
          careInstructions: roundData.careInstructions || [],
          isCritical: roundData.isCritical || false,
          requiresFollowUp: roundData.requiresFollowUp || false
        };

        this.patientRounds.unshift(newRound);
        this.updateTabBadges();
      }
    });
  }

  scheduleRounds(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'schedule',
        text: 'Schedule Rounds',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(ScheduleRoundsDialogComponent, {
      title: 'Schedule Patient Rounds',
      width: '60%',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name
      },
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      // Check if result has form data (not just action), it means form was submitted successfully
      if (result && (result.formData || (!result.action && result !== null))) {
        const scheduleData = result.formData || result;
        const newSchedule: RoundSchedule = {
          id: `SCH${Date.now()}`,
          patientId: this.patientInfo.id,
          roundType: scheduleData.roundType,
          scheduledTime: scheduleData.scheduledTime ? new Date(scheduleData.scheduledTime) : new Date(),
          frequency: scheduleData.frequency,
          assignedTo: scheduleData.assignedTo,
          assignedToId: 'STAFF001',
          assignedToRole: scheduleData.assignedToRole,
          priority: scheduleData.priority || 'MEDIUM',
          isActive: scheduleData.isActive !== false,
          createdBy: 'Current User',
          createdDate: new Date()
        };

        this.roundSchedules.push(newSchedule);
        this.updateTabBadges();
      }
    });
  }

  completeRound(): void {
    // This method is no longer needed as dialog handles completion
  }

  cancelRound(): void {
    // This method is no longer needed as dialog handles cancellation
  }

  // Medicine Request Methods
  addMedicineRequest(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'stroked',
        disabled: false
      },
      {
        id: 'submit',
        text: 'Submit Request',
        color: 'primary',
        appearance: 'raised',
        disabled: false
      }
    ];

    const dialogRef = this.dialogService.openDialog(MedicineRequestDialogComponent, {
      title: 'Request Medicine',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name
      },
      width: '700px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'submit' && result.formData) {
        const requestData = result.formData;
        const newRequest: MedicineRequest = {
          id: `MR${Date.now()}`,
          patientId: this.patientInfo.id,
          patientName: this.patientInfo.name,
          ...requestData,
          requestedById: this.patientInfo.id,
          requestDate: new Date(),
          requestTime: new Date(),
          currentSymptoms: requestData.currentSymptoms ? requestData.currentSymptoms.split(',').map((s: string) => s.trim()) : [],
          status: 'PENDING',
          isPrescriptionRequired: requestData.isPrescriptionRequired || true
        };

        this.medicineRequests.unshift(newRequest);
        this.updateTabBadges();
      }
    });
  }

  submitMedicineRequest(): void {
    // This method is kept for backward compatibility but should use addMedicineRequest()
    this.addMedicineRequest();
  }

  cancelMedicineRequest(): void {
    // This method is no longer needed as dialog handles cancellation
  }

  approveMedicineRequest(request: MedicineRequest): void {
    request.status = 'APPROVED';
    request.approvedBy = 'Dr. Sarah Johnson';
    request.approvedById = 'DOC001';
    request.approvedDate = new Date();
  }

  rejectMedicineRequest(request: MedicineRequest): void {
    request.status = 'REJECTED';
    request.rejectionReason = 'Not medically necessary at this time';
  }

  // Relative Management Methods
  addRelative(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'save',
        text: 'Add Relative',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(AddRelativeDialogComponent, {
      title: 'Add Patient Relative',
      width: '60%',
      data: {
        patientId: this.patientInfo.id,
        patientName: this.patientInfo.name
      },
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      // Check if result has form data (not just action), it means form was submitted successfully
      if (result && (result.formData || (!result.action && result !== null))) {
        const relativeData = result.formData || result;
        const newRelative: PatientRelative = {
          id: `REL${Date.now()}`,
          patientId: this.patientInfo.id,
          patientName: this.patientInfo.name,
          relativeName: relativeData.relativeName,
          relationship: relativeData.relationship,
          contactNumber: relativeData.contactNumber,
          alternateContactNumber: relativeData.alternateContactNumber,
          email: relativeData.email,
          address: relativeData.address,
          emergencyContact: relativeData.emergencyContact || false,
          canMakeDecisions: relativeData.canMakeDecisions || false,
          canReceiveUpdates: relativeData.canReceiveUpdates !== false,
          canVisit: relativeData.canVisit !== false,
          notes: relativeData.notes,
          addedBy: 'Dr. Sarah Johnson',
          addedDate: new Date(),
          isActive: true,
          verificationStatus: 'PENDING',
          verificationNotes: 'Pending verification'
        };

        this.patientRelatives.push(newRelative);
        this.updateTabBadges();
      }
    });
  }

  addRelativeSubmit(): void {
    // This method is no longer needed as dialog handles submission
  }

  cancelRelative(): void {
    // This method is no longer needed as dialog handles cancellation
  }

  contactRelative(relative: PatientRelative): void {
    console.log('Contacting relative:', relative.relativeName, 'at', relative.contactNumber);
    // Implementation for contacting relative
  }

  verifyRelative(relative: PatientRelative): void {
    relative.verificationStatus = 'VERIFIED';
    relative.verificationNotes = 'Verified via phone call';
    relative.lastContactDate = new Date();
  }

  // Utility Methods for Enhanced Features
  getRoundTypeIcon(roundType: string): string {
    switch (roundType) {
      case 'DOCTOR_ROUND': return 'person';
      case 'NURSE_ROUND': return 'medical_services';
      case 'CLEANING_ROUND': return 'cleaning_services';
      case 'DIET_ROUND': return 'restaurant';
      case 'PHYSIOTHERAPY_ROUND': return 'fitness_center';
      default: return 'assessment';
    }
  }

  getRoundTypeColor(roundType: string): string {
    switch (roundType) {
      case 'DOCTOR_ROUND': return '#3b82f6';
      case 'NURSE_ROUND': return '#10b981';
      case 'CLEANING_ROUND': return '#6b7280';
      case 'DIET_ROUND': return '#f59e0b';
      case 'PHYSIOTHERAPY_ROUND': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getMedicineRequestStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      case 'DISPENSED': return '#3b82f6';
      case 'CANCELLED': return '#6b7280';
      default: return '#6b7280';
    }
  }

  getRelativeRelationshipIcon(relationship: string): string {
    switch (relationship) {
      case 'SPOUSE': return 'favorite';
      case 'PARENT': return 'family_restroom';
      case 'CHILD': return 'child_care';
      case 'SIBLING': return 'group';
      case 'GRANDPARENT': return 'elderly';
      case 'GRANDCHILD': return 'child_friendly';
      case 'FRIEND': return 'person';
      case 'GUARDIAN': return 'security';
      default: return 'person';
    }
  }

  getRelativeRelationshipColor(relationship: string): string {
    switch (relationship) {
      case 'SPOUSE': return '#e91e63';
      case 'PARENT': return '#3f51b5';
      case 'CHILD': return '#4caf50';
      case 'SIBLING': return '#ff9800';
      case 'GRANDPARENT': return '#9c27b0';
      case 'GRANDCHILD': return '#00bcd4';
      case 'FRIEND': return '#607d8b';
      case 'GUARDIAN': return '#795548';
      default: return '#6b7280';
    }
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  formatDateShort(date: Date): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  }

  getDietPlanFromAssignment(assignment: any): any {
    return {
      planId: assignment.planId || undefined,
      name: assignment.planName,
      description: assignment.description,
      type: assignment.planId ? 'weekly' : 'individual',
      status: assignment.status.toLowerCase(),
      duration: assignment.duration,
      dietsCount: undefined,
      progress: undefined,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      assignmentType: assignment.planId ? 'weekly' : 'individual',
      avgCaloriesPerDay: assignment.avgCaloriesPerDay,
      keyNutrients: assignment.keyNutrients
    };
  }

  // Get mock schedule for a weekly plan (in production, this would come from API)
  private getMockScheduleForPlan(planId: string): any {
    // Mock schedule structure: day_0 (Sunday) to day_6 (Saturday)
    // Each day has meals: [breakfast, morning_snack, lunch, evening_snack, dinner]
    const mockSchedules: any = {
      'plan1': {
        day_0: [ // Sunday
          [{ dietId: '4', name: 'Morning Oatmeal', calories: 320 }], // Breakfast
          [], // Morning Snack
          [{ dietId: '1', name: 'Balanced Veg Bowl', calories: 520 }], // Lunch
          [], // Evening Snack
          [{ dietId: '6', name: 'Grilled Salmon', calories: 480 }] // Dinner
        ],
        day_1: [ // Monday
          [{ dietId: '5', name: 'Greek Yogurt Parfait', calories: 280 }],
          [{ dietId: '7', name: 'Apple with Almonds', calories: 150 }],
          [{ dietId: '1', name: 'Balanced Veg Bowl', calories: 520 }],
          [],
          [{ dietId: '8', name: 'Chicken Salad', calories: 450 }]
        ],
        day_2: [ // Tuesday
          [{ dietId: '4', name: 'Morning Oatmeal', calories: 320 }],
          [],
          [{ dietId: '2', name: 'Keto Chicken Salad', calories: 450 }],
          [{ dietId: '9', name: 'Trail Mix', calories: 200 }],
          [{ dietId: '3', name: 'Vegan Buddha Bowl', calories: 380 }]
        ],
        day_3: [ // Wednesday
          [{ dietId: '5', name: 'Greek Yogurt Parfait', calories: 280 }],
          [],
          [{ dietId: '1', name: 'Balanced Veg Bowl', calories: 520 }],
          [],
          [{ dietId: '6', name: 'Grilled Salmon', calories: 480 }]
        ],
        day_4: [ // Thursday
          [{ dietId: '4', name: 'Morning Oatmeal', calories: 320 }],
          [{ dietId: '7', name: 'Apple with Almonds', calories: 150 }],
          [{ dietId: '2', name: 'Keto Chicken Salad', calories: 450 }],
          [],
          [{ dietId: '8', name: 'Chicken Salad', calories: 450 }]
        ],
        day_5: [ // Friday
          [{ dietId: '5', name: 'Greek Yogurt Parfait', calories: 280 }],
          [],
          [{ dietId: '1', name: 'Balanced Veg Bowl', calories: 520 }],
          [{ dietId: '9', name: 'Trail Mix', calories: 200 }],
          [{ dietId: '3', name: 'Vegan Buddha Bowl', calories: 380 }]
        ],
        day_6: [ // Saturday
          [{ dietId: '4', name: 'Morning Oatmeal', calories: 320 }],
          [],
          [{ dietId: '2', name: 'Keto Chicken Salad', calories: 450 }],
          [],
          [{ dietId: '6', name: 'Grilled Salmon', calories: 480 }]
        ]
      }
    };
    return mockSchedules[planId] || {};
  }

  // Get weekly assignments (those with planId)
  getWeeklyDietAssignments(): any[] {
    return this.dietAssignments.filter(a => a.assignmentType === 'weekly' || a.planId);
  }

  // Get individual diet assignments (those without planId)
  getIndividualDietAssignments(): any[] {
    return this.dietAssignments.filter(a => a.assignmentType === 'individual' || (!a.planId && a.diets));
  }

  // Get diets organized by day for a weekly plan
  getDietsByDay(assignment: any): { [key: string]: any[] } {
    if (!assignment.schedule) return {};
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const result: { [key: string]: any[] } = {};
    
    days.forEach((dayName, index) => {
      const dayKey = `day_${index}`;
      const daySchedule = assignment.schedule[dayKey];
      if (daySchedule && daySchedule.length > 0) {
        result[dayName] = [];
        daySchedule.forEach((meal: any[]) => {
          if (meal && meal.length > 0) {
            result[dayName].push(...meal);
          }
        });
      }
    });
    
    return result;
  }

  // Helper method to get diets array from day entry (for template usage)
  getDietsArray(dayEntry: any): any[] {
    if (!dayEntry || !dayEntry.value) return [];
    return Array.isArray(dayEntry.value) ? dayEntry.value : [];
  }

  // Get days array for tabs
  getWeekDays(): string[] {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  // Get short day name for tabs
  getShortDayName(dayName: string): string {
    const shortNames: { [key: string]: string } = {
      'Sunday': 'Sun',
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat'
    };
    return shortNames[dayName] || dayName;
  }

  // Get diets for a specific day
  getDietsForDay(assignment: any, dayName: string): any[] {
    const dietsByDay = this.getDietsByDay(assignment);
    return dietsByDay[dayName] || [];
  }

  // Get total weekly diets count
  getTotalWeeklyDiets(assignment: any): number {
    const days = this.getWeekDays();
    let total = 0;
    for (const day of days) {
      total += this.getDietsForDay(assignment, day).length;
    }
    return total;
  }

  // Get total individual diets count
  getTotalIndividualDiets(): number {
    const assignments = this.getIndividualDietAssignments();
    let total = 0;
    for (const assignment of assignments) {
      total += this.getIndividualDietsFromAssignment(assignment).length;
    }
    return total;
  }

  // Track selected day tab for each weekly plan
  selectedDayTab: { [planId: string]: string } = {};

  selectDayTab(planId: string, dayName: string): void {
    this.selectedDayTab[planId] = dayName;
  }

  getSelectedDayTab(planId: string): string {
    if (this.selectedDayTab[planId]) {
      return this.selectedDayTab[planId];
    }
    
    // Find the assignment to get its schedule
    const assignment = this.dietAssignments.find(a => a.planId === planId);
    if (assignment) {
      const days = this.getWeekDays();
      const dietsByDay = this.getDietsByDay(assignment);
      // Find first day with diets
      const firstDayWithDiets = days.find(day => dietsByDay[day] && dietsByDay[day].length > 0);
      return firstDayWithDiets || days[0];
    }
    
    return this.getWeekDays()[0];
  }

  // Get all individual diets from an assignment
  getIndividualDietsFromAssignment(assignment: any): any[] {
    return assignment.diets || [];
  }

  // Convert schedule diet item to full Diet object
  getDietObjectFromSchedule(scheduleItem: any): Diet {
    // Find the diet in mock data or create a basic Diet object
    const mockDiets: any = {
      '1': { dietId: '1', name: 'Balanced Veg Bowl', description: 'Quinoa, chickpeas, mixed veggies, olive oil dressing.', dietType: 'Mediterranean', calories: 520, protein: 22, carbs: 68, fat: 18, fiber: 11, isActive: true, tags: ['lunch'] },
      '2': { dietId: '2', name: 'Keto Chicken Salad', description: 'Grilled chicken, avocado, mixed greens, olive oil.', dietType: 'Keto', calories: 450, protein: 35, carbs: 8, fat: 32, fiber: 6, isActive: true, tags: ['lunch'] },
      '3': { dietId: '3', name: 'Vegan Buddha Bowl', description: 'Brown rice, tofu, vegetables, tahini dressing.', dietType: 'Vegan', calories: 380, protein: 18, carbs: 45, fat: 15, fiber: 12, isActive: true, tags: ['dinner'] },
      '4': { dietId: '4', name: 'Morning Oatmeal', description: 'Steel-cut oats with berries, nuts, and honey.', dietType: 'Mediterranean', calories: 320, protein: 12, carbs: 55, fat: 8, fiber: 8, isActive: true, tags: ['breakfast'] },
      '5': { dietId: '5', name: 'Greek Yogurt Parfait', description: 'Greek yogurt with granola, honey, and fresh fruits.', dietType: 'Mediterranean', calories: 280, protein: 20, carbs: 35, fat: 6, fiber: 4, isActive: true, tags: ['breakfast'] },
      '6': { dietId: '6', name: 'Grilled Salmon', description: 'Fresh salmon with vegetables and quinoa.', dietType: 'Mediterranean', calories: 480, protein: 35, carbs: 30, fat: 22, fiber: 5, isActive: true, tags: ['dinner'] },
      '7': { dietId: '7', name: 'Apple with Almonds', description: 'Fresh apple with a handful of almonds.', dietType: 'Mediterranean', calories: 150, protein: 5, carbs: 20, fat: 8, fiber: 4, isActive: true, tags: ['snack'] },
      '8': { dietId: '8', name: 'Chicken Salad', description: 'Grilled chicken breast with mixed greens.', dietType: 'Mediterranean', calories: 450, protein: 40, carbs: 15, fat: 25, fiber: 6, isActive: true, tags: ['dinner'] },
      '9': { dietId: '9', name: 'Trail Mix', description: 'Mixed nuts, dried fruits, and seeds.', dietType: 'Mediterranean', calories: 200, protein: 6, carbs: 18, fat: 12, fiber: 3, isActive: true, tags: ['snack'] }
    };

    const fullDiet = mockDiets[scheduleItem.dietId];
    if (fullDiet) {
      return {
        ...fullDiet,
        createdAt: new Date(),
        createdByDoctorId: 'doc1'
      } as Diet;
    }

    // Fallback: create minimal Diet object from schedule item
    return {
      dietId: scheduleItem.dietId || 'unknown',
      name: scheduleItem.name || 'Unknown Diet',
      description: '',
      dietType: 'Mediterranean',
      calories: scheduleItem.calories || 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      createdByDoctorId: 'doc1',
      createdAt: new Date(),
      isActive: true,
      tags: []
    } as Diet;
  }

  viewDietDetails(diet: any): void {
    console.log('View diet details:', diet);
    // TODO: Open view dialog
  }

  editDietDetails(diet: any): void {
    console.log('Edit diet details:', diet);
    // TODO: Open edit dialog
  }

  removeDietFromAssignment(diet: Diet, assignment: any): void {
    if (confirm('Are you sure you want to remove this diet from the assignment?')) {
      const diets = assignment.diets || [];
      const index = diets.findIndex((d: Diet) => d.dietId === diet.dietId);
      if (index > -1) {
        diets.splice(index, 1);
        // Update assignment
        assignment.dietIds = diets.map((d: Diet) => d.dietId);
        if (diets.length === 0) {
          // Remove entire assignment if no diets left
          this.removeDietAssignment(assignment);
        }
      }
    }
  }

  // Exercise Assignment Methods
  openExerciseAssignmentDialog(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'basic'
      },
      {
        id: 'assign',
        text: 'Assign Exercises',
        color: 'primary',
        appearance: 'raised',
        disabled: false // Validation handled in component
      }
    ];

    const dialogRef = this.dialogService.openDialog(ExerciseAssignmentDialogComponent, {
      title: `Assign Exercises to ${this.patientInfo.name}`,
      data: {
        patientName: this.patientInfo.name,
        patientId: this.patientInfo.id || '',
        exerciseGroups: this.exerciseGroups.map(group => ({
          groupId: group.id?.toString() || `GROUP${Date.now()}`,
          groupName: group.name,
          description: '',
          category: '',
          difficulty: '',
          exercises: group.exercises.map(ex => this.mapExerciseToInterface(ex))
        })),
        availableExercises: this.individualExercises.map(ex => this.mapExerciseToInterface(ex))
      },
      width: '90%',
      height: '95%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === false || result?.action === 'cancel') {
        return;
      }
      
      if (result?.action === 'assign' && result.exercises && result.exercises.length > 0) {
        // Store Exercise objects directly
        result.exercises.forEach((exercise: Exercise) => {
          this.assignedExercises.push({
            exercise: exercise,
            assignedDate: result.assignmentDate || new Date(),
            dueDate: result.endDate || null,
            status: 'Active'
          });
        });
        this.updateProgressChart();
      }
    });
  }

  // Diet Assignment Methods
  openDietAssignmentDialog(defaultType?: 'weekly' | 'individual', defaultStartDate?: Date, defaultEndDate?: Date): void {
    // Mock diet plans data (in production, fetch from service)
    const mockDietPlans = [
      {
        planId: 'plan1',
        name: 'Weekly Mediterranean Plan',
        description: 'A balanced 7-day Mediterranean diet plan for healthy eating',
        type: 'weekly',
        status: 'active',
        duration: 7,
        dietsCount: 21,
        progress: 75,
        createdAt: new Date('2024-01-15')
      },
      {
        planId: 'plan2',
        name: 'Keto Weight Loss Plan',
        description: '4-week ketogenic diet plan for weight loss',
        type: 'monthly',
        status: 'active',
        duration: 28,
        dietsCount: 84,
        progress: 45,
        createdAt: new Date('2024-01-10')
      },
      {
        planId: 'plan3',
        name: 'Vegan Wellness Plan',
        description: 'Plant-based diet plan for overall wellness',
        type: 'custom',
        status: 'active',
        duration: 14,
        dietsCount: 42,
        progress: 0,
        createdAt: new Date('2024-01-20')
      }
    ];

    // Mock individual diets data (in production, fetch from service)
    const mockIndividualDiets = [
      {
        dietId: '1',
        name: 'Balanced Veg Bowl',
        description: 'Quinoa, chickpeas, mixed veggies, olive oil dressing.',
        dietType: 'Mediterranean',
        calories: 520,
        protein: 22,
        carbs: 68,
        fat: 18,
        fiber: 11,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['lunch', 'quick']
      },
      {
        dietId: '2',
        name: 'Keto Chicken Salad',
        description: 'Grilled chicken, avocado, mixed greens, olive oil.',
        dietType: 'Keto',
        calories: 450,
        protein: 35,
        carbs: 8,
        fat: 32,
        fiber: 6,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['lunch', 'high-protein']
      },
      {
        dietId: '3',
        name: 'Vegan Buddha Bowl',
        description: 'Brown rice, tofu, vegetables, tahini dressing.',
        dietType: 'Vegan',
        calories: 380,
        protein: 18,
        carbs: 45,
        fat: 15,
        fiber: 12,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['dinner', 'plant-based']
      },
      {
        dietId: '4',
        name: 'Morning Oatmeal',
        description: 'Steel-cut oats with berries, nuts, and honey.',
        dietType: 'Mediterranean',
        calories: 320,
        protein: 12,
        carbs: 55,
        fat: 8,
        fiber: 8,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['breakfast', 'fiber-rich']
      },
      {
        dietId: '5',
        name: 'Greek Yogurt Parfait',
        description: 'Greek yogurt with granola, honey, and fresh fruits.',
        dietType: 'Mediterranean',
        calories: 280,
        protein: 20,
        carbs: 35,
        fat: 6,
        fiber: 4,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['breakfast', 'protein-rich']
      }
    ];

    const dialogRef = this.dialog.open(DietAssignmentDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        patientName: this.patientInfo.name,
        patientId: this.patientInfo.id || '',
        availableDietPlans: mockDietPlans,
        individualDiets: mockIndividualDiets,
        patientAllergies: this.patientInfo.allergies || []
      },
      disableClose: true,
      panelClass: 'diet-assignment-dialog-panel'
    });

    // Default dialog mode/dates if requested
    if (defaultType) {
      dialogRef.componentInstance.assignmentType = defaultType;
    }
    if (defaultStartDate) {
      dialogRef.componentInstance.startDate = defaultStartDate;
    }
    if (defaultEndDate) {
      dialogRef.componentInstance.endDate = defaultEndDate;
    }

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.assignedPlan) {
        const assignedPlan = result.assignedPlan;
        const startDate = new Date(assignedPlan.startDate);
        const endDate = new Date(assignedPlan.endDate);

        if (assignedPlan.assignmentType === 'weekly') {
          // Get the full plan schedule from mock data
          const schedule = this.getMockScheduleForPlan(assignedPlan.planId);
          
          this.dietAssignments.push({
            planId: assignedPlan.planId,
            planName: assignedPlan.name,
            duration: assignedPlan.duration,
            description: assignedPlan.description,
            startDate: startDate,
            endDate: endDate,
            status: 'Active',
            assignmentType: 'weekly',
            schedule: schedule
          });
        } else if (assignedPlan.assignmentType === 'individual') {
          // Store individual Diet objects
          const selectedDiets = result.selectedDiets || [];
          this.dietAssignments.push({
            planId: null,
            planName: assignedPlan.name,
            duration: assignedPlan.duration,
            description: assignedPlan.description,
            startDate: startDate,
            endDate: endDate,
            status: 'Active',
            assignmentType: 'individual',
            dietIds: assignedPlan.dietIds,
            diets: selectedDiets // Store full diet objects
          });
        }
      }
    });
  }

  // New UI helpers for the redesigned Diet Assignment representation
  getActiveWeeklyPlanAssignment(): any | null {
    const weekly = this.getWeeklyDietAssignments();
    if (!weekly || weekly.length === 0) { return null; }
    // Pick the most recent by startDate
    return [...weekly].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
  }

  onSelectDietDayIndex(index: number): void {
    this.selectedDietDayIndex = index;
  }

  getMealsForSelectedDay(assignment: any): Array<{ label: string; time?: string; diets: any[] }> {
    if (!assignment || !assignment.schedule) return [];
    const dayKey = `day_${this.selectedDietDayIndex}`;
    const mealsForDay: any[][] = assignment.schedule[dayKey] || [];
    const results: Array<{ label: string; time?: string; diets: any[] }> = [];
    for (let i = 0; i < this.mealTimesForWeeklyPlan.length; i++) {
      const diets = mealsForDay[i] || [];
      const mealTime = this.mealTimesForWeeklyPlan[i];
      results.push({ 
        label: mealTime?.label || `Meal ${i + 1}`, 
        time: mealTime?.time,
        diets 
      });
    }
    return results;
  }

  // Get total for a specific nutrition value across all diets in a meal
  getMealTotal(diets: any[], nutritionType: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber'): number {
    let total = 0;
    for (const diet of diets) {
      const dietObj = this.getDietObjectFromSchedule(diet);
      const value = dietObj[nutritionType] || 0;
      total += typeof value === 'number' ? value : 0;
    }
    return total;
  }

  assignSpecificDietForToday(): void {
    const today = new Date();
    // set endDate to same day
    this.openDietAssignmentDialog('individual', today, today);
  }

  createWeeklyPlan(): void {
    this.router.navigate(['/diet-plan-create']);
  }

  private mapExerciseToInterface(exercise: any): any {
    return {
      exerciseId: exercise.id?.toString() || `EX${Date.now()}`,
      name: exercise.name,
      description: exercise.description || '',
      createdByDoctorId: 'DOC001',
      exerciseType: exercise.category || 'Strength',
      category: exercise.category || 'Strength',
      difficulty: this.mapIntensityToDifficulty(exercise.intensity),
      targetMuscles: exercise.targetMuscles || [],
      equipment: exercise.equipment || [],
      tags: exercise.tags || [],
      coachingCues: exercise.coachingCues || '',
      contraindications: exercise.contraindications || '',
      sets: exercise.sets || [],
      imageUrl: exercise.imageUrl || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private mapIntensityToDifficulty(intensity: string): string {
    if (!intensity) return 'Beginner';
    if (intensity.includes('Low')) return 'Beginner';
    if (intensity.includes('Moderate')) return 'Intermediate';
    return 'Advanced';
  }

  viewExerciseDetails(assignment: any): void {
    console.log('View exercise details:', assignment);
    // TODO: Open view dialog for exercise
  }

  editExerciseSets(assignment: any): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'save',
        text: 'Save Configuration',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    const dialogRef = this.dialogService.openDialog(ExerciseSetsConfigDialogComponent, {
      title: 'Edit Exercise Sets',
      width: '600px',
      maxWidth: '95vw',
      data: {
        exercise: assignment.exercise,
        mode: 'edit'
      },
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Check if result has form data (not just action), it means form was submitted successfully
      if (result && (result.sets || (!result.action && result !== null))) {
        // Update the exercise's sets
        assignment.exercise.sets = result.sets;
        // Update assignment details if provided (details is a property of assignment, not exercise)
        if (result.details) {
          assignment.details = result.details;
        }
      }
    });
  }

  getAverageReps(sets: any[]): number {
    if (!sets || sets.length === 0) return 0;
    const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
    return Math.round(totalReps / sets.length);
  }

  removeAssignedExercise(assignment: any): void {
    if (confirm('Are you sure you want to remove this exercise assignment?')) {
      const index = this.assignedExercises.findIndex(a => a === assignment);
      if (index > -1) {
        this.assignedExercises.splice(index, 1);
      }
      this.updateProgressChart();
    }
  }

  // Exercise Assignment Dashboard Methods
  getActiveAssignmentsCount(): number {
    return this.exerciseAssignments.filter(a => a.status === 'Active').length;
  }

  getCompletedAssignmentsCount(): number {
    return this.exerciseAssignments.filter(a => a.status === 'Completed').length;
  }

  getUniqueCategoriesCount(): number {
    const categories = new Set(this.exerciseAssignments.map(a => a.category));
    return categories.size;
  }

  // Diet Assignment Dashboard Methods
  getActiveDietAssignmentsCount(): number {
    return this.dietAssignments.filter(a => a.status === 'Active').length;
  }

  getCompletedDietAssignmentsCount(): number {
    return this.dietAssignments.filter(a => a.status === 'Completed').length;
  }

  // Diet Assignment Actions
  viewDietAssignment(diet: any): void {
    // TODO: Open view dialog for diet assignment
    console.log('View diet assignment:', diet);
  }

  editDietAssignment(diet: any): void {
    // TODO: Open edit dialog for diet assignment
    console.log('Edit diet assignment:', diet);
    // Could reuse the DietAssignmentDialogComponent with edit mode
  }

  removeDietAssignment(diet: any): void {
    // TODO: Confirm deletion and remove from list
    const index = this.dietAssignments.findIndex(a => 
      (a.planId && diet.planId && a.planId === diet.planId) ||
      (a.startDate && diet.startDate && new Date(a.startDate).getTime() === new Date(diet.startDate).getTime())
    );
    if (index > -1) {
      this.dietAssignments.splice(index, 1);
    }
  }

  getFilteredExerciseAssignments(): any[] {
    return this.exerciseAssignments.filter(assignment => {
      // Search filter
      const matchesSearch = !this.exerciseAssignmentSearchQuery || 
        assignment.exerciseName.toLowerCase().includes(this.exerciseAssignmentSearchQuery.toLowerCase()) ||
        assignment.category.toLowerCase().includes(this.exerciseAssignmentSearchQuery.toLowerCase()) ||
        assignment.details.toLowerCase().includes(this.exerciseAssignmentSearchQuery.toLowerCase());

      // Status filter
      const matchesStatus = this.exerciseAssignmentStatusFilter === 'all' || 
        assignment.status === this.exerciseAssignmentStatusFilter;

      // Category filter
      const matchesCategory = this.exerciseAssignmentCategoryFilter === 'all' || 
        assignment.category === this.exerciseAssignmentCategoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  clearExerciseAssignmentFilters(): void {
    this.exerciseAssignmentSearchQuery = '';
    this.exerciseAssignmentStatusFilter = 'all';
    this.exerciseAssignmentCategoryFilter = 'all';
  }

  editExerciseAssignment(assignment: any): void {
    console.log('Edit exercise assignment:', assignment);
    // TODO: Open edit dialog
  }

  toggleExerciseAssignmentStatus(assignment: any): void {
    if (assignment.status === 'Active') {
      assignment.status = 'Paused';
    } else if (assignment.status === 'Paused') {
      assignment.status = 'Active';
    }
    this.updateProgressChart();
  }

  markExerciseAssignmentComplete(assignment: any): void {
    assignment.status = 'Completed';
    assignment.completedDate = new Date();
    this.updateProgressChart();
  }

  deleteExerciseAssignment(assignment: any): void {
    if (confirm('Are you sure you want to delete this exercise assignment?')) {
      const index = this.exerciseAssignments.findIndex(a => a === assignment);
      if (index > -1) {
        this.exerciseAssignments.splice(index, 1);
      }
      this.updateProgressChart();
    }
  }

  // Get assigned exercises for display
  getAssignedExercisesForDisplay(): Exercise[] {
    return this.assignedExercises.map((assignment) => assignment.exercise);
  }

  // Progress helpers
  getAssignmentProgress(assignment: any): number {
    const start = new Date(assignment.assignedDate).getTime();
    const end = assignment.dueDate ? new Date(assignment.dueDate).getTime() : start;
    const now = Date.now();
    if (end <= start) {
      return now >= start ? 100 : 0;
    }
    const pct = ((now - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  getDaysLeft(assignment: any): number | null {
    if (!assignment.dueDate) return null;
    const end = new Date(assignment.dueDate).getTime();
    const days = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  }

  // Highcharts - Progress chart
  Highcharts: typeof Highcharts = Highcharts;
  progressChartOptions: Highcharts.Options = {
    chart: { type: 'line', height: 400, backgroundColor: 'transparent' },
    title: { text: 'Exercise Duration Over Time' },
    credits: { enabled: false },
    xAxis: { 
      title: { text: 'Days' },
      categories: [],
      labels: { format: 'Day {value}' }
    },
    yAxis: {
      min: 0,
      title: { text: 'Duration (minutes)' },
      labels: { format: '{value} min' }
    },
    tooltip: {
      useHTML: true,
      formatter: function (this: any) {
        return `<b>Day ${this.x}</b><br/><b>${this.series.name}</b><br/>Duration: <b>${this.y} min</b>`;
      }
    },
    plotOptions: {
      line: {
        marker: { enabled: true, radius: 4 },
        lineWidth: 2
      }
    },
    legend: { enabled: true },
    series: []
  };

  private updateProgressChart(): void {
    if (this.exerciseAssignments.length === 0) {
      this.progressChartOptions = {
        ...this.progressChartOptions,
        xAxis: { ...(this.progressChartOptions.xAxis as Highcharts.XAxisOptions), categories: [] },
        series: []
      };
      return;
    }

    // Calculate days range from earliest start to latest end (or today if no end)
    const DAY = 1000 * 60 * 60 * 24;
    const now = Date.now();
    let minStartDay = Number.MAX_SAFE_INTEGER;
    let maxEndDay = 0;
    
    for (const a of this.exerciseAssignments) {
      const startMs = new Date(a.assignedDate).getTime();
      const endMs = a.dueDate ? new Date(a.dueDate).getTime() : now;
      const startDay = Math.floor((startMs - now) / DAY);
      const endDay = Math.ceil((endMs - now) / DAY);
      minStartDay = Math.min(minStartDay, startDay);
      maxEndDay = Math.max(maxEndDay, endDay);
    }

    // Generate day categories (0, 1, 2, ...)
    const totalDays = Math.max(1, maxEndDay - minStartDay + 1);
    const dayCategories: string[] = [];
    for (let d = 0; d < totalDays; d++) {
      dayCategories.push(d.toString());
    }

    // Generate series data for each exercise (one line per exercise)
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const series: any[] = [];
    
    for (let i = 0; i < this.exerciseAssignments.length; i++) {
      const a = this.exerciseAssignments[i];
      const assignmentStart = new Date(a.assignedDate).getTime();
      const assignmentEnd = a.dueDate ? new Date(a.dueDate).getTime() : now;
      const startDayOffset = Math.floor((assignmentStart - now) / DAY);
      const endDayOffset = Math.ceil((assignmentEnd - now) / DAY);

      // Parse duration from details (e.g., "30 minutes" or "3 sets of 10 repetitions")
      let baseDuration = 15; // default 15 min
      if (a.details) {
        const minMatch = a.details.match(/(\d+)\s*min/i);
        if (minMatch) {
          baseDuration = Number.parseInt(minMatch[1], 10);
        } else if (a.category === 'Cardio') {
          baseDuration = 30;
        } else if (a.category === 'Strength') {
          baseDuration = 20;
        }
      }

      // Generate data points for each day (0 to totalDays-1)
      const exerciseData: (number | null)[] = [];
      for (let day = 0; day < totalDays; day++) {
        const actualDay = minStartDay + day;
        if (actualDay >= startDayOffset && actualDay <= endDayOffset) {
          // Within assignment period - show duration (with some variation for realism)
          const variation = 0.8 + (Math.random() * 0.4); // 80% to 120% of base
          exerciseData.push(Math.round(baseDuration * variation));
        } else {
          // Outside assignment period - null (no data point)
          exerciseData.push(null);
        }
      }

      series.push({
        type: 'line',
        name: a.exerciseName,
        color: colors[i % colors.length],
        data: exerciseData
      });
    }

    this.progressChartOptions = {
      ...this.progressChartOptions,
      chart: { ...(this.progressChartOptions.chart as Highcharts.ChartOptions), height: 400, type: 'line' },
      xAxis: { ...(this.progressChartOptions.xAxis as Highcharts.XAxisOptions), categories: dayCategories },
      series: series
    };
  }

  
}
