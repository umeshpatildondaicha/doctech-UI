import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { CoreEventService, DialogboxService, DialogFooterAction } from '@lk/core';
import { IconComponent, AppButtonComponent } from '@lk/core';
import { TabConfigDialogComponent } from '../tab-config-dialog/tab-config-dialog.component';
import { AdmissionDialogComponent } from '../admission-dialog/admission-dialog.component';
import { PatientNotesDialogComponent } from '../../../components/patient-notes-dialog/patient-notes-dialog.component';
import { AppointmentBookingComponent } from '../../appointment-booking/appointment-booking.component';
import { LabTestOrderDialogComponent } from '../lab-test-order-dialog/lab-test-order-dialog.component';

// Tab components
import { OverviewTabComponent, OverviewPatientInfo, OverviewPatientStats, OverviewVitalSign, QuickAction } from './tabs/overview/overview-tab.component';
import { MedicalRecordTabComponent, CareTimetableItem } from './tabs/medical-record/medical-record-tab.component';
import { ProfileTabComponent } from './tabs/profile/profile-tab.component';
import { VitalsTabComponent } from './tabs/vitals/vitals-tab.component';
import { MedicationsTabComponent } from './tabs/medications/medications-tab.component';
import { AppointmentsTabComponent } from './tabs/appointments/appointments-tab.component';
import { LabReportsTabComponent } from './tabs/lab-reports/lab-reports-tab.component';
import { RelativesTabComponent } from './tabs/relatives/relatives-tab.component';
import { ExerciseAssignmentTabComponent } from './tabs/exercise-assignment/exercise-assignment-tab.component';
import { DietAssignmentTabComponent } from './tabs/diet-assignment/diet-assignment-tab.component';
import { FitnessAssessmentTabComponent } from './tabs/fitness-assessment/fitness-assessment-tab.component';
import { BillingTabComponent } from './tabs/billing/billing-tab.component';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    IconComponent,
    AppButtonComponent,
    OverviewTabComponent,
    MedicalRecordTabComponent,
    ProfileTabComponent,
    VitalsTabComponent,
    MedicationsTabComponent,
    AppointmentsTabComponent,
    LabReportsTabComponent,
    RelativesTabComponent,
    ExerciseAssignmentTabComponent,
    DietAssignmentTabComponent,
    FitnessAssessmentTabComponent,
    BillingTabComponent
  ],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.scss']
})
export class PatientProfileComponent implements OnInit {
  // ── Navigation ─────────────────────────────────────────────────────────────
  tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', badge: 0 },
    { id: 'medical-record', label: 'Medical Record', icon: 'receipt', badge: 0 },
    { id: 'profile', label: 'Profile', icon: 'person', badge: 0 },
    { id: 'vitals', label: 'Vitals', icon: 'favorite', badge: 3 },
    { id: 'medications', label: 'Medications', icon: 'local_pharmacy', badge: 0 },
    { id: 'appointments', label: 'Appointments', icon: 'event', badge: 2 },
    { id: 'lab-reports', label: 'Lab Reports', icon: 'assessment', badge: 1 },
    { id: 'relatives', label: 'Relatives', icon: 'people', badge: 0 },
    { id: 'exercise-assignment', label: 'Exercise Assignment', icon: 'fitness_center', badge: 0 },
    { id: 'diet-assignment', label: 'Diet Assignment', icon: 'restaurant_menu', badge: 0 },
    { id: 'fitness-assessment', label: 'Fitness Assessment', icon: 'monitor_heart', badge: 0 },
    { id: 'billing', label: 'Billing', icon: 'receipt_long', badge: 0 }
  ];

  selectedTab = 'overview';
  billingOpenInvoiceId = '';
  private queryTabConsumed = false;

  // ── Patient core data (passed as @Input to tab components) ─────────────────
  patientId = 'P001';
  patientName = 'Sarah Johnson';
  patientPublicId: string | null = null;
  primaryDoctor = 'Dr. Michael Chen';

  // ── Data passed to overview / medical-record tabs ─────────────────────────
  patientInfo: OverviewPatientInfo = {
    id: 'P001', name: 'Sarah Johnson', age: 34, gender: 'Female', bloodGroup: 'O+',
    contactNumber: '+1 (555) 123-4567', primaryDoctor: 'Dr. Michael Chen',
    department: 'Cardiology', diagnosis: ['Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia'],
    allergies: ['Penicillin', 'Sulfa drugs', 'Latex'], admissionStatus: 'OPD',
    emergencyContact: '+1 (555) 987-6543'
  };

  patientStats: OverviewPatientStats = {
    totalAppointments: 24, completedAppointments: 20, pendingAppointments: 3,
    activeMedications: 3, labReports: 8, abnormalLabReports: 2,
    clinicalNotes: 12, readmissionCount: 1
  };

  vitalSigns: OverviewVitalSign[] = [
    { type: 'Blood Pressure', value: 142, unit: 'mmHg', isNormal: false },
    { type: 'Heart Rate', value: 78, unit: 'bpm', isNormal: true },
    { type: 'Blood Glucose', value: 185, unit: 'mg/dL', isNormal: false },
    { type: 'Temperature', value: 37.2, unit: '°C', isNormal: true },
    { type: 'SpO2', value: 97, unit: '%', isNormal: true }
  ];

  careSchedule: CareTimetableItem[] = [
    { id: 1, type: 'medication', title: 'Morning Medication', description: 'Metformin 500mg, Lisinopril 10mg', assignee: 'Nurse Sarah', startTime: new Date('2024-01-20T08:00:00'), endTime: new Date('2024-01-20T08:30:00'), status: 'completed', priority: 'high' },
    { id: 2, type: 'vitals', title: 'Vital Signs Check', description: 'Blood pressure, heart rate, temperature', assignee: 'Nurse Mike', startTime: new Date('2024-01-20T09:00:00'), endTime: new Date('2024-01-20T09:15:00'), status: 'completed', priority: 'medium' },
    { id: 3, type: 'consultation', title: 'Doctor Consultation', description: 'Review treatment progress', assignee: 'Dr. Michael Chen', startTime: new Date('2024-01-20T10:00:00'), endTime: new Date('2024-01-20T10:30:00'), status: 'scheduled', priority: 'high' }
  ];

  quickActions: QuickAction[] = [
    { id: 'admit-patient', label: 'Admit Patient', icon: 'local_hospital', color: 'primary' },
    { id: 'add-note', label: 'Add Note', icon: 'note_add', color: 'primary' },
    { id: 'schedule-appointment', label: 'Schedule Appointment', icon: 'event', color: 'primary' },
    { id: 'order-lab', label: 'Order Lab Test', icon: 'science', color: 'primary' }
  ];

  // ── Tab customization ─────────────────────────────────────────────────────
  private readonly allAvailableTabs = this.tabs.map(t => ({ ...t, builtIn: true }));
  tabConfigItems: { id: string; label: string; icon: string; enabled: boolean; builtIn: boolean; badge?: number }[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: CoreEventService,
    private readonly dialogService: DialogboxService
  ) {
    this.eventService.setBreadcrumb({ label: 'Patient Profile', icon: 'person' });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.patientId = this.normalizePatientId(params['id']);
        this.patientInfo = { ...this.patientInfo, id: this.patientId };
      }
    });

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      const invoiceId = params['invoiceId'];

      if (tab && this.tabs.find(t => t.id === tab) && !this.queryTabConsumed) {
        this.selectedTab = tab;
        this.queryTabConsumed = true;
      }

      if (invoiceId) {
        this.billingOpenInvoiceId = invoiceId;
        this.selectedTab = 'billing';
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

      if (params['patientId'] && params['patientName']) {
        this.patientId = this.normalizePatientId(params['patientId']);
        this.patientName = params['patientName'];
        this.patientInfo = { ...this.patientInfo, id: this.patientId, name: this.patientName };
        if (params['patientPublicId']) {
          this.patientPublicId = params['patientPublicId'];
        }
        this.loadTabsFromStorage();
      }
    });

    this.loadTabsFromStorage();
    this.updateTabBadges();
  }

  onTabChange(tabId: string): void {
    this.selectedTab = tabId;
  }

  onQuickAction(actionId: string): void {
    switch (actionId) {
      case 'admit-patient': this.admitPatient(); break;
      case 'add-note': this.addClinicalNote(); break;
      case 'schedule-appointment': this.scheduleAppointment(); break;
      case 'order-lab': this.orderLabTest(); break;
    }
  }

  openTabConfig(): void {
    this.initTabConfigFromCurrentTabs();
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'save', text: 'Save', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(TabConfigDialogComponent, {
      title: 'Customize Tabs',
      data: { tabConfigItems: this.tabConfigItems },
      width: '600px', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'save' && result.tabConfigItems) {
        this.tabConfigItems = result.tabConfigItems;
        this.saveTabConfig();
      }
    });
  }

  // ── Quick Action handlers ──────────────────────────────────────────────────
  private admitPatient(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'admit', text: 'Admit Patient', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(AdmissionDialogComponent, {
      title: 'Admit Patient',
      data: { patientId: this.patientId, patientName: this.patientName },
      width: '600px', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'admit') {
        this.patientInfo = { ...this.patientInfo, admissionStatus: 'IPD' };
      }
    });
  }

  private addClinicalNote(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'save', text: 'Save Note', color: 'primary', appearance: 'raised' }
    ];
    this.dialogService.openDialog(PatientNotesDialogComponent, {
      title: 'Add Clinical Note',
      data: { patientName: this.patientName, defaultValue: '', placeholder: 'Enter clinical note...' },
      width: '600px', footerActions
    });
  }

  private scheduleAppointment(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'book', text: 'Book Appointment', color: 'primary', appearance: 'raised' }
    ];
    this.dialogService.openDialog(AppointmentBookingComponent, {
      title: 'Schedule Appointment',
      data: { patientId: this.patientId, patientName: this.patientName },
      width: '700px', footerActions
    });
  }

  private orderLabTest(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'order', text: 'Order Test', color: 'primary', appearance: 'raised' }
    ];
    this.dialogService.openDialog(LabTestOrderDialogComponent, {
      title: 'Order Lab Test',
      data: { patientId: this.patientId, patientName: this.patientName },
      width: '600px', footerActions
    });
  }

  // ── Tab config helpers ────────────────────────────────────────────────────
  private initTabConfigFromCurrentTabs(): void {
    const enabledIds = new Set(this.tabs.map(t => t.id));
    const orderMap = new Map<string, number>();
    this.tabs.forEach((t, i) => orderMap.set(t.id, i));
    const sorted = [...this.allAvailableTabs].sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : Number.MAX_SAFE_INTEGER;
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
    this.tabConfigItems = sorted.map(m => ({
      id: m.id, label: m.label, icon: m.icon, builtIn: true,
      enabled: m.id === 'overview' ? true : enabledIds.has(m.id),
      badge: this.tabs.find(t => t.id === m.id)?.badge ?? 0
    }));
  }

  private saveTabConfig(): void {
    const enabled = this.tabConfigItems.filter(i => i.enabled);
    const overview = { id: 'overview', label: 'Overview', icon: 'dashboard', badge: 0 };
    const others = enabled.filter(i => i.id !== 'overview').map(i => ({ id: i.id, label: i.label, icon: i.icon, badge: i.badge ?? 0 }));
    this.tabs = [overview, ...others];
    if (!this.tabs.find(t => t.id === this.selectedTab)) {
      this.selectedTab = 'overview';
    }
    this.updateTabBadges();
    this.saveTabsToStorage();
  }

  private updateTabBadges(): void {
    const abnormalVitals = this.vitalSigns.filter(v => !v.isNormal).length;
    const vitalsTab = this.tabs.find(t => t.id === 'vitals');
    if (vitalsTab) vitalsTab.badge = abnormalVitals;
  }

  private normalizePatientId(raw: any): string {
    const v = (raw ?? '').toString().trim();
    if (!v) return '';
    if (/^\d+$/.test(v)) return `P${v.padStart(3, '0')}`;
    return v;
  }

  private getPatientTabsStorageKey(): string {
    return `patientTabs:${this.patientId}`;
  }

  private loadTabsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.getPatientTabsStorageKey());
      if (!raw) return;
      const stored: { id: string; label: string; icon: string; badge?: number }[] = JSON.parse(raw);
      if (!Array.isArray(stored) || !stored.length) return;
      const allowedIds = new Set(this.allAvailableTabs.map(t => t.id));
      let filtered = stored.filter(t => allowedIds.has(t.id));
      if (!filtered.find(t => t.id === 'overview')) {
        filtered = [{ id: 'overview', label: 'Overview', icon: 'dashboard', badge: 0 }, ...filtered];
      }
      filtered.sort((a, b) => (a.id === 'overview' ? -1 : b.id === 'overview' ? 1 : 0));
      this.tabs = filtered.map(t => ({ id: t.id, label: t.label, icon: t.icon, badge: t.badge ?? 0 }));
    } catch { /* ignore */ }
  }

  private saveTabsToStorage(): void {
    try {
      localStorage.setItem(this.getPatientTabsStorageKey(), JSON.stringify(this.tabs));
    } catch { /* ignore */ }
  }
}
