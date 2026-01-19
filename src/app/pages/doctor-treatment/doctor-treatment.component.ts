import { Component, OnInit } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoreEventService, DialogboxService, DialogFooterAction } from "@lk/core";
import { AdmissionDialogComponent } from '../patient/admission-dialog/admission-dialog.component';
import { PatientSearchDialogComponent } from '../patient-search-dialog/patient-search-dialog.component';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TasksListDialogComponent } from './tasks-list-dialog/tasks-list-dialog.component';
import { AssignTaskDialogComponent } from './assign-task-dialog/assign-task-dialog.component';
import { StaffViewDialogComponent } from './staff-view-dialog/staff-view-dialog.component';
import { CreateShiftDialogComponent } from './create-shift-dialog/create-shift-dialog.component';
import { AddStaffToShiftDialogComponent } from './add-staff-to-shift-dialog/add-staff-to-shift-dialog.component';
import { StaffScheduleDialogComponent } from './staff-schedule-dialog/staff-schedule-dialog.component';

// Custom Components
import { IconComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { AppInputComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { GridComponent } from "@lk/core";
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';

// Interfaces
import { AdmittedPatient, DoctorTask, DoctorRound, DoctorAlert, DoctorStats, DoctorTreatmentDashboard } from '../../interfaces/doctor-treatment.interface';

@Component({
  selector: 'app-doctor-treatment',
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
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    MatExpansionModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    ReactiveFormsModule,
    FormsModule,
    IconComponent,
    AppButtonComponent,
    AppInputComponent,
    AppSelectboxComponent,
    GridComponent,
    HighchartsChartModule,
    StaffViewDialogComponent,
    StaffScheduleDialogComponent,
    CreateShiftDialogComponent,
    AddStaffToShiftDialogComponent
  ],
  templateUrl: './doctor-treatment.component.html',
  styleUrls: ['./doctor-treatment.component.scss']
})
export class DoctorTreatmentComponent implements OnInit {
  // Highcharts
  Highcharts: typeof Highcharts = Highcharts;
  
  // View Management
  selectedTab = 'dashboard';
  selectedPatient: AdmittedPatient | null = null;
  showPatientDetail = false;

  // Tabs configuration
  tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'my-patients', label: 'My Patients' },
    { id: 'all-patients', label: 'All Patients' },
    { id: 'staff', label: 'Staff' },
    { id: 'alerts', label: 'Alerts' }
  ];
  
  // Patient Type Selection
  selectedPatientType: string = 'My Patients';
  patientTypeOptions = ['My Patients', 'All Patients'];

  // Right sidebar dashboard data (for Admitted Patients layout)
  dashboardTasks = [
    { title: 'Review lab results for R. Fox', due: '11:00 AM', completed: false },
    { title: 'Consult with neurology for E. Pena', due: '2:00 PM', completed: false },
    { title: 'Prepare discharge papers for A. Black', due: '9:30 AM', completed: true }
  ];
  upcomingProcedures = [
    { title: 'Angioplasty - R. Fox', time: 'Today, 1:00 PM', location: 'OR 3' },
    { title: 'Chest X-Ray - J. Jones', time: 'Today, 3:30 PM', location: 'Radiology' }
  ];
  pendingLabResultsEmpty = true;

  // Staff Management Properties
  selectedStaffTab: string = 'overview';
  staffTabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'schedule', label: 'Schedule', icon: 'schedule' },
    { id: 'tasks', label: 'All Tasks', icon: 'assignment' },
    { id: 'doctor-tasks', label: 'Doctor Tasks', icon: 'medical_services' },
    { id: 'performance', label: 'Performance', icon: 'trending_up' }
  ];

  // Staff Data
  staffMembers = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'Senior Doctor',
      department: 'Cardiology',
      status: 'active',
      currentPatients: 8,
      maxPatients: 12,
      workload: 67,
      shift: 'Day Shift',
      nextShift: '2024-01-15T08:00:00',
      email: 'sarah.johnson@hospital.com',
      phone: '234-232-1234',
      workAddress: '200 Medical Center, Cardiology Wing',
      reportsTo: 'Dr. Anthony Jefferson',
      performance: {
        roundsCompleted: 45,
        tasksCompleted: 38,
        patientSatisfaction: 4.8,
        efficiency: 92
      }
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      role: 'Doctor',
      department: 'Neurology',
      status: 'active',
      currentPatients: 6,
      maxPatients: 10,
      workload: 60,
      shift: 'Night Shift',
      nextShift: '2024-01-15T20:00:00',
      performance: {
        roundsCompleted: 38,
        tasksCompleted: 42,
        patientSatisfaction: 4.6,
        efficiency: 88
      }
    },
    {
      id: '3',
      name: 'Dr. Emily Davis',
      role: 'Resident',
      department: 'General Medicine',
      status: 'active',
      currentPatients: 4,
      maxPatients: 8,
      workload: 50,
      shift: 'Day Shift',
      nextShift: '2024-01-15T08:00:00',
      performance: {
        roundsCompleted: 28,
        tasksCompleted: 35,
        patientSatisfaction: 4.7,
        efficiency: 85
      }
    },
    {
      id: '4',
      name: 'Nurse Jennifer Wilson',
      role: 'Senior Nurse',
      department: 'ICU',
      status: 'active',
      currentPatients: 12,
      maxPatients: 15,
      workload: 80,
      shift: 'Day Shift',
      nextShift: '2024-01-15T08:00:00',
      performance: {
        roundsCompleted: 52,
        tasksCompleted: 48,
        patientSatisfaction: 4.9,
        efficiency: 95
      }
    },
    {
      id: '5',
      name: 'Nurse Robert Brown',
      role: 'Nurse',
      department: 'General Ward',
      status: 'on_break',
      currentPatients: 8,
      maxPatients: 12,
      workload: 67,
      shift: 'Day Shift',
      nextShift: '2024-01-15T08:00:00',
      performance: {
        roundsCompleted: 41,
        tasksCompleted: 39,
        patientSatisfaction: 4.5,
        efficiency: 87
      }
    }
  ];

  // Task Management
  staffTasks = [
    // Doctor Tasks
    {
      id: '1',
      title: 'Morning Rounds - ICU',
      assignedTo: 'Dr. Sarah Johnson',
      priority: 'HIGH',
      status: 'in_progress',
      dueTime: '2024-01-15T09:00:00',
      patientId: 'P001',
      description: 'Complete morning rounds for ICU patients',
      taskType: 'doctor',
      category: 'Patient Care'
    },
    {
      id: '2',
      title: 'Discharge Planning',
      assignedTo: 'Dr. Emily Davis',
      priority: 'LOW',
      status: 'completed',
      dueTime: '2024-01-15T14:00:00',
      patientId: 'P007',
      description: 'Prepare discharge documentation',
      taskType: 'doctor',
      category: 'Administrative'
    },
    {
      id: '3',
      title: 'Patient Consultation',
      assignedTo: 'Dr. Michael Chen',
      priority: 'HIGH',
      status: 'pending',
      dueTime: '2024-01-15T11:00:00',
      patientId: 'P005',
      description: 'Consult with patient regarding treatment plan',
      taskType: 'doctor',
      category: 'Patient Care'
    },
    {
      id: '4',
      title: 'Medical Chart Review',
      assignedTo: 'Dr. Sarah Johnson',
      priority: 'MEDIUM',
      status: 'pending',
      dueTime: '2024-01-15T13:00:00',
      patientId: 'P002',
      description: 'Review and update medical charts',
      taskType: 'doctor',
      category: 'Documentation'
    },
    {
      id: '5',
      title: 'Treatment Plan Update',
      assignedTo: 'Dr. Emily Davis',
      priority: 'HIGH',
      status: 'in_progress',
      dueTime: '2024-01-15T12:00:00',
      patientId: 'P008',
      description: 'Update treatment plan based on latest test results',
      taskType: 'doctor',
      category: 'Patient Care'
    },
    {
      id: '6',
      title: 'Emergency Response',
      assignedTo: 'Dr. Michael Chen',
      priority: 'CRITICAL',
      status: 'pending',
      dueTime: '2024-01-15T10:00:00',
      patientId: 'P010',
      description: 'Respond to emergency patient situation',
      taskType: 'doctor',
      category: 'Emergency'
    },
    // Nursing Tasks
    {
      id: '7',
      title: 'Medication Review',
      assignedTo: 'Nurse Jennifer Wilson',
      priority: 'MEDIUM',
      status: 'pending',
      dueTime: '2024-01-15T10:30:00',
      patientId: 'P003',
      description: 'Review and update medication schedules',
      taskType: 'nurse',
      category: 'Medication'
    },
    {
      id: '8',
      title: 'Vital Signs Monitoring',
      assignedTo: 'Nurse Robert Brown',
      priority: 'HIGH',
      status: 'in_progress',
      dueTime: '2024-01-15T09:30:00',
      patientId: 'P004',
      description: 'Monitor and record vital signs',
      taskType: 'nurse',
      category: 'Monitoring'
    },
    {
      id: '9',
      title: 'Patient Comfort Care',
      assignedTo: 'Nurse Jennifer Wilson',
      priority: 'MEDIUM',
      status: 'pending',
      dueTime: '2024-01-15T15:00:00',
      patientId: 'P006',
      description: 'Provide comfort care and assistance',
      taskType: 'nurse',
      category: 'Patient Care'
    }
  ];

  // Shift Management
  shifts = [
    { id: '1', name: 'Day Shift', startTime: '08:00', endTime: '16:00', staffCount: 3 },
    { id: '2', name: 'Evening Shift', startTime: '16:00', endTime: '00:00', staffCount: 2 },
    { id: '3', name: 'Night Shift', startTime: '00:00', endTime: '08:00', staffCount: 1 }
  ];

  // Search and Filters
  searchQuery: string = '';
  selectedWard: string = 'All Wards';
  selectedPriority: string = 'All Priorities';
  selectedStatus: string = 'All Status';
  selectedDoctor: string = 'All Doctors';
  
  // Advanced Filtering
  filterOptions = {
    wards: ['All Wards', 'ICU', 'General Ward', 'Cardiology', 'Neurology', 'Orthopedics'],
    priorities: ['All Priorities', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    statuses: ['All Status', 'STABLE', 'CRITICAL', 'IMPROVING', 'DETERIORATING', 'RECOVERING'],
    doctors: ['All Doctors', 'Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Davis']
  };
  
  // Real-time monitoring
  isRealTimeMode = true;
  refreshInterval: any;
  lastUpdateTime = new Date();
  
  // Enhanced Patient Analytics
  patientStats = {
    total: 0,
    critical: 0,
    stable: 0,
    improving: 0,
    deteriorating: 0
  };

  // Practical Dashboard Data
  dashboardMetrics = {
    totalPatients: 0,
    criticalPatients: 0,
    pendingRounds: 0,
    dueMedications: 0,
    dischargeReady: 0,
    wardOccupancy: 0
  };

  // Chart Options
  patientStatusChartOptions: Highcharts.Options = {};
  wardOccupancyChartOptions: Highcharts.Options = {};
  roundsChartOptions: Highcharts.Options = {};
  medicationChartOptions: Highcharts.Options = {};
  
  // Staff Performance Chart Options
  staffTaskCompletionChartOptions: Highcharts.Options = {};
  staffPerformanceByDepartmentChartOptions: Highcharts.Options = {};
  staffTaskStatusChartOptions: Highcharts.Options = {};
  staffEfficiencyChartOptions: Highcharts.Options = {};

  // Critical Patients for Monitoring
  criticalPatients: any[] = [];
  
  // Pending Rounds
  pendingRounds: any[] = [];
  
  // Due Medications
  dueMedications: any[] = [];
  
  // Discharge Ready Patients
  dischargeReadyPatients: any[] = [];
  
  // Dashboard Data
  dashboardData: DoctorTreatmentDashboard = {
    doctorId: 'DOC001',
    doctorName: 'Dr. Sarah Johnson',
    department: 'Internal Medicine',
    shift: 'MORNING',
    totalPatients: 0,
    criticalPatients: 0,
    newAdmissions: 0,
    pendingDischarges: 0,
    urgentTasks: 0,
    lastLogin: new Date(),
    currentLocation: 'ICU Ward'
  };

  // Patient Data
  admittedPatients: AdmittedPatient[] = [];
  filteredPatients: AdmittedPatient[] = [];
  filteredMyPatients: AdmittedPatient[] = [];

  // Grid configs
  myPatientsColumns: any[] = [];
  allPatientsColumns: any[] = [];
  myPatientsGridOptions: any = {};
  allPatientsGridOptions: any = {};
  
  // Tasks and Rounds
  doctorTasks: DoctorTask[] = [];
  doctorRounds: DoctorRound[] = [];
  doctorAlerts: DoctorAlert[] = [];
  
  // Statistics
  doctorStats: DoctorStats = {
    totalPatients: 0,
    criticalPatients: 0,
    roundsCompleted: 0,
    roundsPending: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    alertsAcknowledged: 0,
    alertsPending: 0,
    averageRoundTime: 0,
    patientsDischarged: 0,
    emergencyCalls: 0,
    consultationRequests: 0,
    familyCommunications: 0,
    medicationOrders: 0,
    testOrders: 0,
    procedureOrders: 0
  };

  // Forms
  roundForm!: FormGroup;
  taskForm!: FormGroup;
  medicineRequestForm!: FormGroup;
  relativeForm!: FormGroup;
  staffAssignForm!: FormGroup;
  staffRoundForm!: FormGroup;
  careTaskForm!: FormGroup;
  roundScheduleForm!: FormGroup;

  // UI State
  isLoading = false;
  showRoundDialog = false;
  showTaskDialog = false;
  showMedicineRequestDialog = false;
  showRelativeDialog = false;
  showPatientRounds = false;
  showPatientMedicineRequests = false;
  showPatientRelatives = false;
  showAssignStaff = false;
  showLogStaffRound = false;

  // Filter Options
  wardOptions = [
    'All Wards',
    'ICU',
    'General Ward A',
    'General Ward B',
    'Cardiac Ward',
    'Pediatric Ward',
    'Maternity Ward',
    'Surgical Ward'
  ];

  bedOptions = [
    'Bed A',
    'Bed B',
    'Bed C',
    'Bed D',
    'Bed E',
    'Bed F'
  ];

  doctorOptions = [
    'Dr. Michael Chen',
    'Dr. Sarah Smith',
    'Dr. Robert Johnson',
    'Dr. Emily Wilson',
    'Dr. David Brown'
  ];

  priorityOptions = [
    'All Priorities',
    'Low',
    'Medium',
    'High',
    'Urgent'
  ];

  statusOptions = [
    'All Status',
    'Stable',
    'Critical',
    'Improving',
    'Deteriorating',
    'Recovering'
  ];

  // Staff Management Types
  staffRoles = ['NURSE', 'WARD_BOY', 'CLEANING', 'DIET', 'PHYSIOTHERAPY', 'OTHER'];
  staffRoundTypes = ['NURSE_ROUND', 'CLEANING_ROUND', 'DIET_ROUND', 'PHYSIOTHERAPY_ROUND', 'OTHER'];

  // Staff Management Data
  selectedStaffPatientId: string | null = null;
  staffAssignments: {
    id: string;
    patientId: string;
    staffId: string;
    staffName: string;
    role: string;
    shiftStart: Date;
    shiftEnd: Date;
    notes?: string;
  }[] = [];

  staffRounds: {
    id: string;
    patientId: string;
    staffId: string;
    staffName: string;
    role: string;
    roundType: string;
    time: Date;
    status: 'SCHEDULED' | 'COMPLETED' | 'SKIPPED';
    notes?: string;
  }[] = [];

  // Enhanced Staff Management
  availableStaff: {
    id: string;
    name: string;
    role: string;
    department: string;
    isAvailable: boolean;
    currentLoad: number;
    maxLoad: number;
    color: string;
  }[] = [];

  careTasks: {
    id: string;
    patientId: string;
    patientName: string;
    title: string;
    description: string;
    assignedTo: string;
    assignedToId: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    dueTime: Date;
    createdDate: Date;
  }[] = [];

  roundTemplates: {
    id: string;
    name: string;
    roundType: string;
    department: string;
    checklist: {
      item: string;
      isRequired: boolean;
      category: string;
    }[];
  }[] = [];

  roundSchedules: {
    id: string;
    patientId: string;
    roundType: string;
    scheduledTime: Date;
    frequency: string;
    assignedTo: string;
    assignedToId: string;
    priority: string;
    isActive: boolean;
    createdBy: string;
    createdDate: Date;
  }[] = [];

  // Staff grids
  staffAssignmentsColumns: any[] = [];
  staffRoundsColumns: any[] = [];
  careTasksColumns: any[] = [];
  staffAssignmentsGridOptions: any = {};
  staffRoundsGridOptions: any = {};
  careTasksGridOptions: any = {};

  // UI State
  showStaffAssignmentDialog = false;
  showCareTaskDialog = false;
  showRoundTemplateDialog = false;
  isDragMode = false;
  draggedStaff: any = null;

  // Quick Actions
  quickActions = [
    {
      id: 'start-round',
      label: 'Start Round',
      icon: 'assessment',
      color: '#3b82f6',
      action: () => this.startNewRound()
    },
    {
      id: 'add-task',
      label: 'Add Task',
      icon: 'add_task',
      color: '#10b981',
      action: () => this.addNewTask()
    },
    {
      id: 'view-alerts',
      label: 'View Alerts',
      icon: 'warning',
      color: '#f59e0b',
      action: () => this.viewAllAlerts()
    },
    {
      id: 'discharge-patients',
      label: 'Discharge Patients',
      icon: 'exit_to_app',
      color: '#ef4444',
      action: () => this.viewDischargeReady()
    }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly eventService: CoreEventService,
    private readonly dialogService: DialogboxService
  ) {
    this.initializeForms();
    this.initializeStaffForms();
  }

  ngOnInit(): void {
    this.setupBreadcrumb();
    this.loadDashboardData();
    this.loadAdmittedPatients();
    this.loadDoctorTasks();
    this.loadDoctorRounds();
    this.loadDoctorAlerts();
    this.updateStatistics();
    this.initializeDashboard();
    this.loadMockStaffData();
    this.initializeGrids();
    this.initializeStaffGrids();
    this.startRealTimeMonitoring();
    this.updatePatientStats();
    this.initializeStaffPerformanceCharts();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private setupBreadcrumb(): void {
    this.eventService.setBreadcrumb({
      label: 'Admitted Patients',
      icon: 'local_hospital'
    });
  }

  initializeForms(): void {
    this.roundForm = this.fb.group({
      patientId: ['', Validators.required],
      roundType: ['MORNING_ROUND', Validators.required],
      findings: this.fb.group({
        generalCondition: [''],
        vitalSigns: this.fb.group({
          bloodPressure: [''],
          heartRate: [''],
          temperature: [''],
          respiratoryRate: [''],
          oxygenSaturation: [''],
          painLevel: ['']
        }),
        physicalExamination: [''],
        mentalStatus: [''],
        mobility: [''],
        nutrition: [''],
        hygiene: ['']
      }),
      assessment: this.fb.group({
        diagnosis: [''],
        complications: [''],
        improvement: ['STABLE'],
        prognosis: ['FAIR']
      }),
      plan: this.fb.group({
        medications: [''],
        investigations: [''],
        procedures: [''],
        diet: [''],
        activity: [''],
        monitoring: [''],
        dischargePlanning: ['']
      }),
      notes: [''],
      nextRoundScheduled: [''],
      requiresConsultation: [false],
      consultationSpecialist: [''],
      familyInformed: [false],
      familyNotes: ['']
    });

    this.taskForm = this.fb.group({
      patientId: ['', Validators.required],
      taskType: ['ROUND', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      dueDate: ['', Validators.required],
      estimatedDuration: [''],
      location: [''],
      notes: [''],
      requiresFollowUp: [false],
      followUpDate: [''],
      tags: ['']
    });

    this.medicineRequestForm = this.fb.group({
      patientId: ['', Validators.required],
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

    this.relativeForm = this.fb.group({
      patientId: ['', Validators.required],
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
      visitingHours: this.fb.group({
        startTime: [''],
        endTime: [''],
        days: [[]]
      }),
      notes: ['']
    });
  }

  private initializeStaffGrids(): void {
    this.staffAssignmentsColumns = [
      { headerName: 'Staff', field: 'staffName', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Role', field: 'role', filter: 'agSetColumnFilter' },
      { headerName: 'Shift', field: 'shiftStart', valueGetter: (p: any) => `${new Date(p.data.shiftStart).toLocaleString()} - ${new Date(p.data.shiftEnd).toLocaleString()}` },
      { headerName: 'Notes', field: 'notes' }
    ];

    this.staffRoundsColumns = [
      { headerName: 'Staff', field: 'staffName', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Role', field: 'role', filter: 'agSetColumnFilter' },
      { headerName: 'Round Type', field: 'roundType', filter: 'agSetColumnFilter' },
      { headerName: 'Time', field: 'time', valueGetter: (p: any) => new Date(p.data.time).toLocaleString() },
      { headerName: 'Status', field: 'status', filter: 'agSetColumnFilter' },
      { headerName: 'Notes', field: 'notes' }
    ];

    this.careTasksColumns = [
      { headerName: 'Patient', field: 'patientName', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Task', field: 'title', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Assigned To', field: 'assignedTo', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Priority', field: 'priority', filter: 'agSetColumnFilter' },
      { headerName: 'Status', field: 'status', filter: 'agSetColumnFilter' },
      { headerName: 'Due', field: 'dueTime', valueGetter: (p: any) => new Date(p.data.dueTime).toLocaleString() }
    ];

    const commonGrid = {
      rowHeight: 56,
      headerHeight: 48,
      enableFilter: true,
      enableSorting: true
    };

    this.staffAssignmentsGridOptions = {
      ...commonGrid,
      onRowClicked: (event: any) => {
        this.selectedStaffPatientId = event.data.patientId;
      },
      menuActions: [
        { title: 'Edit', icon: 'edit', click: (param: any) => console.log('Edit assignment', param.data) },
        { title: 'Remove', icon: 'delete', click: (param: any) => this.removeAssignment(param.data) }
      ]
    };

    this.staffRoundsGridOptions = {
      ...commonGrid,
      menuActions: [
        { title: 'View', icon: 'visibility', click: (param: any) => console.log('View round', param.data) },
        { title: 'Delete', icon: 'delete', click: (param: any) => this.removeStaffRound(param.data) }
      ]
    };
  }

  removeAssignment(row: any): void {
    this.staffAssignments = this.staffAssignments.filter(a => a.id !== row.id);
  }

  removeStaffRound(row: any): void {
    this.staffRounds = this.staffRounds.filter(r => r.id !== row.id);
  }

  private initializeGrids(): void {
    this.myPatientsColumns = [
      { headerName: 'Patient', field: 'patientName', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'ID', field: 'patientId', width: 110, sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Location', field: 'ward', valueGetter: (p: any) => `${p.data.ward} • ${p.data.room}, ${p.data.bed}` },
      { headerName: 'Status', field: 'currentStatus', filter: 'agSetColumnFilter' },
      { headerName: 'Priority', field: 'priority', filter: 'agSetColumnFilter' },
      { headerName: 'Diagnosis', field: 'primaryDiagnosis', valueGetter: (p: any) => (p.data.primaryDiagnosis || []).join(', ') },
      { headerName: 'Last Round', field: 'lastDoctorRound', valueGetter: (p: any) => this.getTimeAgo(p.data.lastDoctorRound) }
    ];

    this.allPatientsColumns = [...this.myPatientsColumns];

    const commonGrid = {
      rowHeight: 56,
      headerHeight: 48,
      rowSelection: 'single',
      enableFilter: true,
      enableSorting: true,
      filterConfig: {
        fields: [
          { label: 'Ward', value: 'ward', inputType: 'select' },
          { label: 'Status', value: 'currentStatus', inputType: 'select' },
          { label: 'Priority', value: 'priority', inputType: 'select' },
          { label: 'Diagnosis', value: 'primaryDiagnosis', inputType: 'input' }
        ]
      },
      onRowClicked: (event: any) => this.selectPatient(event.data)
    };

    this.myPatientsGridOptions = { ...commonGrid };
    this.allPatientsGridOptions = { ...commonGrid };
  }

  initializeStaffForms(): void {
    this.staffAssignForm = this.fb.group({
      patientId: ['', Validators.required],
      staffName: ['', Validators.required],
      role: ['NURSE', Validators.required],
      shiftStart: ['', Validators.required],
      shiftEnd: ['', Validators.required],
      notes: ['']
    });

    this.staffRoundForm = this.fb.group({
      patientId: ['', Validators.required],
      staffName: ['', Validators.required],
      role: ['NURSE', Validators.required],
      roundType: ['NURSE_ROUND', Validators.required],
      time: ['', Validators.required],
      status: ['COMPLETED', Validators.required],
      notes: ['']
    });

    // Initialize new forms
    this.careTaskForm = this.fb.group({
      patientId: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      assignedTo: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      dueTime: ['', Validators.required],
      notes: ['']
    });

    this.roundScheduleForm = this.fb.group({
      patientId: ['', Validators.required],
      roundType: ['', Validators.required],
      assignedTo: ['', Validators.required],
      scheduledTime: ['', Validators.required],
      frequency: ['ONCE', Validators.required],
      priority: ['MEDIUM', Validators.required],
      notes: ['']
    });
  }

  loadDashboardData(): void {
    // Simulate loading dashboard data
    this.dashboardData = {
      doctorId: 'DOC001',
      doctorName: 'Dr. Sarah Johnson',
      department: 'Internal Medicine',
      shift: 'MORNING',
      totalPatients: 12,
      criticalPatients: 3,
      newAdmissions: 2,
      pendingDischarges: 1,
      urgentTasks: 5,
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      currentLocation: 'ICU Ward'
    };
  }

  loadAdmittedPatients(): void {
    // Simulate loading admitted patients
    this.admittedPatients = [
      {
        patientId: 'P001',
        patientName: 'John Smith',
        age: 65,
        gender: 'Male',
        admissionDate: new Date('2024-01-15'),
        admissionTime: new Date('2024-01-15T08:30:00'),
        ward: 'ICU',
        room: 'ICU-01',
        bed: 'Bed A',
        floor: '2nd Floor',
        primaryDiagnosis: ['Myocardial Infarction', 'Hypertension'],
        attendingDoctor: 'Dr. Sarah Johnson',
        attendingDoctorId: 'DOC001',
        currentStatus: 'CRITICAL',
        priority: 'URGENT',
        lastVitalCheck: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        lastDoctorRound: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        nextScheduledRound: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        vitalSigns: {
          bloodPressure: '140/90',
          heartRate: 95,
          temperature: 37.2,
          respiratoryRate: 22,
          oxygenSaturation: 92,
          painLevel: 6,
          isAbnormal: true
        },
        medications: [
          {
            medicationName: 'Aspirin',
            dosage: '75mg',
            frequency: 'Once daily',
            nextDue: new Date(Date.now() + 4 * 60 * 60 * 1000),
            status: 'ACTIVE'
          },
          {
            medicationName: 'Metoprolol',
            dosage: '50mg',
            frequency: 'Twice daily',
            nextDue: new Date(Date.now() + 2 * 60 * 60 * 1000),
            status: 'ACTIVE'
          }
        ],
        pendingTests: [
          {
            testName: 'ECG',
            scheduledDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
            status: 'SCHEDULED',
            priority: 'URGENT'
          }
        ],
        alerts: [
          {
            type: 'CRITICAL_VITALS',
            message: 'Blood pressure elevated, oxygen saturation low',
            severity: 'HIGH',
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
            acknowledged: false
          }
        ],
        relatives: [
          {
            name: 'Mary Smith',
            relationship: 'SPOUSE',
            contactNumber: '+1-555-0123',
            isEmergencyContact: true,
            lastContacted: new Date(Date.now() - 1 * 60 * 60 * 1000)
          }
        ],
        lengthOfStay: 3,
        expectedDischarge: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        dischargeReadiness: 'NOT_READY'
      },
      {
        patientId: 'P002',
        patientName: 'Emily Davis',
        age: 45,
        gender: 'Female',
        admissionDate: new Date('2024-01-16'),
        admissionTime: new Date('2024-01-16T14:20:00'),
        ward: 'General Ward A',
        room: 'GA-205',
        bed: 'Bed B',
        floor: '2nd Floor',
        primaryDiagnosis: ['Pneumonia', 'Diabetes Type 2'],
        attendingDoctor: 'Dr. Sarah Johnson',
        attendingDoctorId: 'DOC001',
        currentStatus: 'IMPROVING',
        priority: 'MEDIUM',
        lastVitalCheck: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        lastDoctorRound: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        nextScheduledRound: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 78,
          temperature: 36.8,
          respiratoryRate: 18,
          oxygenSaturation: 96,
          painLevel: 3,
          isAbnormal: false
        },
        medications: [
          {
            medicationName: 'Insulin',
            dosage: '10 units',
            frequency: 'Before meals',
            nextDue: new Date(Date.now() + 1 * 60 * 60 * 1000),
            status: 'ACTIVE'
          }
        ],
        pendingTests: [],
        alerts: [],
        relatives: [
          {
            name: 'Robert Davis',
            relationship: 'SPOUSE',
            contactNumber: '+1-555-0124',
            isEmergencyContact: true
          }
        ],
        lengthOfStay: 2,
        expectedDischarge: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        dischargeReadiness: 'ASSESSING'
      }
    ];
    
    this.filteredPatients = [...this.admittedPatients];
    this.filteredMyPatients = this.admittedPatients.filter(p => p.attendingDoctorId === this.dashboardData.doctorId);
  }

  loadDoctorTasks(): void {
    // Simulate loading doctor tasks
    this.doctorTasks = [
      {
        id: 'T001',
        patientId: 'P001',
        patientName: 'John Smith',
        taskType: 'ROUND',
        title: 'Morning Round - ICU Patient',
        description: 'Complete morning round for critical patient in ICU',
        priority: 'HIGH',
        status: 'PENDING',
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        estimatedDuration: 30,
        location: 'ICU-01, Bed A',
        notes: 'Patient showing signs of improvement',
        requiresFollowUp: true,
        followUpDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
        createdBy: 'Dr. Sarah Johnson',
        assignedTo: 'Dr. Sarah Johnson',
        tags: ['ICU', 'Critical', 'Morning Round']
      },
      {
        id: 'T002',
        patientId: 'P002',
        patientName: 'Emily Davis',
        taskType: 'DISCHARGE',
        title: 'Discharge Planning',
        description: 'Prepare discharge summary and medication list',
        priority: 'MEDIUM',
        status: 'PENDING',
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        estimatedDuration: 45,
        location: 'GA-205, Bed B',
        notes: 'Patient ready for discharge',
        requiresFollowUp: false,
        createdBy: 'Dr. Sarah Johnson',
        assignedTo: 'Dr. Sarah Johnson',
        tags: ['Discharge', 'Planning']
      }
    ];
  }

  loadDoctorRounds(): void {
    // Simulate loading doctor rounds
    this.doctorRounds = [
      {
        id: 'R001',
        patientId: 'P001',
        patientName: 'John Smith',
        ward: 'ICU',
        room: 'ICU-01',
        bed: 'Bed A',
        roundDate: new Date(),
        roundTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        doctorId: 'DOC001',
        doctorName: 'Dr. Sarah Johnson',
        roundType: 'MORNING_ROUND',
        status: 'COMPLETED',
        duration: 25,
        findings: {
          generalCondition: 'Patient appears more alert and responsive',
          vitalSigns: {
            bloodPressure: '140/90',
            heartRate: 95,
            temperature: 37.2,
            respiratoryRate: 22,
            oxygenSaturation: 92,
            painLevel: 6
          },
          physicalExamination: 'Chest clear, no signs of respiratory distress',
          mentalStatus: 'Alert and oriented',
          mobility: 'Bed rest, limited mobility',
          nutrition: 'NPO, IV fluids',
          hygiene: 'Good, assisted with daily care'
        },
        assessment: {
          diagnosis: ['Myocardial Infarction', 'Hypertension'],
          complications: ['Mild respiratory distress'],
          improvement: 'IMPROVING',
          prognosis: 'FAIR'
        },
        plan: {
          medications: [
            {
              medicationName: 'Aspirin',
              dosage: '75mg',
              frequency: 'Once daily',
              route: 'Oral',
              duration: 'Continue',
              changes: 'No changes'
            }
          ],
          investigations: [
            {
              testName: 'ECG',
              reason: 'Monitor cardiac rhythm',
              priority: 'URGENT',
              scheduledDate: new Date(Date.now() + 1 * 60 * 60 * 1000)
            }
          ],
          procedures: [],
          diet: 'Continue NPO, reassess in 4 hours',
          activity: 'Bed rest, passive range of motion',
          monitoring: ['Continuous cardiac monitoring', 'Hourly vital signs'],
          dischargePlanning: 'Not ready for discharge'
        },
        notes: 'Patient showing gradual improvement. Continue current treatment plan.',
        nextRoundScheduled: new Date(Date.now() + 4 * 60 * 60 * 1000),
        requiresConsultation: false,
        familyInformed: true,
        familyNotes: 'Spouse informed of patient progress'
      }
    ];
  }

  loadDoctorAlerts(): void {
    // Simulate loading doctor alerts
    this.doctorAlerts = [
      {
        id: 'A001',
        patientId: 'P001',
        patientName: 'John Smith',
        ward: 'ICU',
        room: 'ICU-01',
        bed: 'Bed A',
        alertType: 'CRITICAL_VITALS',
        title: 'Critical Vital Signs Alert',
        message: 'Blood pressure elevated (140/90), oxygen saturation low (92%)',
        severity: 'HIGH',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        acknowledged: false,
        resolved: false,
        escalationLevel: 1,
        autoEscalated: false,
        requiresImmediateAction: true
      },
      {
        id: 'A002',
        patientId: 'P002',
        patientName: 'Emily Davis',
        ward: 'General Ward A',
        room: 'GA-205',
        bed: 'Bed B',
        alertType: 'DISCHARGE_READY',
        title: 'Patient Ready for Discharge',
        message: 'Patient meets discharge criteria, discharge planning required',
        severity: 'MEDIUM',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        acknowledged: false,
        resolved: false,
        escalationLevel: 0,
        autoEscalated: false,
        requiresImmediateAction: false
      }
    ];
  }

  updateStatistics(): void {
    this.doctorStats = {
      totalPatients: this.admittedPatients.length,
      criticalPatients: this.admittedPatients.filter(p => p.currentStatus === 'CRITICAL').length,
      roundsCompleted: this.doctorRounds.filter(r => r.status === 'COMPLETED').length,
      roundsPending: this.doctorRounds.filter(r => r.status === 'SCHEDULED').length,
      tasksCompleted: this.doctorTasks.filter(t => t.status === 'COMPLETED').length,
      tasksPending: this.doctorTasks.filter(t => t.status === 'PENDING').length,
      alertsAcknowledged: this.doctorAlerts.filter(a => a.acknowledged).length,
      alertsPending: this.doctorAlerts.filter(a => !a.acknowledged).length,
      averageRoundTime: 25,
      patientsDischarged: 0,
      emergencyCalls: 0,
      consultationRequests: 0,
      familyCommunications: 0,
      medicationOrders: 0,
      testOrders: 0,
      procedureOrders: 0
    };
  }

  // Tab Management
  getSelectedIndex(): number {
    const idx = this.tabs.findIndex(t => t.id === this.selectedTab);
    return idx >= 0 ? idx : 0;
  }

  onTabChangeIndex(index: number): void {
    const tab = this.tabs[index];
    this.selectedTab = tab ? tab.id : 'dashboard';
  }

  // Search and Filter Methods
  onSearchInput(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.admittedPatients];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.patientName.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query) ||
        patient.ward.toLowerCase().includes(query) ||
        patient.room.toLowerCase().includes(query) ||
        patient.bed.toLowerCase().includes(query)
      );
    }

    // Apply ward filter
    if (this.selectedWard !== 'all') {
      filtered = filtered.filter(patient => patient.ward === this.selectedWard);
    }

    // Apply priority filter
    if (this.selectedPriority !== 'all') {
      filtered = filtered.filter(patient => patient.priority === this.selectedPriority.toUpperCase());
    }

    // Apply status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(patient => patient.currentStatus === this.selectedStatus.toUpperCase());
    }

    this.filteredPatients = filtered;
    this.filteredMyPatients = filtered.filter(patient => patient.attendingDoctorId === this.dashboardData.doctorId);
  }

  // Staff Management Methods
  loadMockStaffData(): void {
    // Default selected patient
    this.selectedStaffPatientId = this.admittedPatients[0]?.patientId || null;

    // Mock assignments
    this.staffAssignments = [
      {
        id: 'SA-001',
        patientId: 'P001',
        staffId: 'S001',
        staffName: 'Nurse Sarah',
        role: 'NURSE',
        shiftStart: new Date(Date.now() - 2 * 60 * 60 * 1000),
        shiftEnd: new Date(Date.now() + 6 * 60 * 60 * 1000),
        notes: 'Primary nurse for day shift'
      },
      {
        id: 'SA-002',
        patientId: 'P001',
        staffId: 'S002',
        staffName: 'Mike Johnson',
        role: 'CLEANING',
        shiftStart: new Date(Date.now() - 1 * 60 * 60 * 1000),
        shiftEnd: new Date(Date.now() + 3 * 60 * 60 * 1000)
      }
    ];

    // Mock staff rounds
    this.staffRounds = [
      {
        id: 'SR-001',
        patientId: 'P001',
        staffId: 'S001',
        staffName: 'Nurse Sarah',
        role: 'NURSE',
        roundType: 'NURSE_ROUND',
        time: new Date(Date.now() - 30 * 60 * 1000),
        status: 'COMPLETED',
        notes: 'Vitals checked, medication administered'
      }
    ];

    // Mock available staff
    this.availableStaff = [
      {
        id: 'S001',
        name: 'Sarah Wilson',
        role: 'NURSE',
        department: 'ICU',
        isAvailable: true,
        currentLoad: 2,
        maxLoad: 4,
        color: '#3b82f6'
      },
      {
        id: 'S002',
        name: 'Mike Johnson',
        role: 'WARD_BOY',
        department: 'ICU',
        isAvailable: true,
        currentLoad: 1,
        maxLoad: 6,
        color: '#10b981'
      },
      {
        id: 'S003',
        name: 'Lisa Chen',
        role: 'NURSE',
        department: 'ICU',
        isAvailable: false,
        currentLoad: 4,
        maxLoad: 4,
        color: '#f59e0b'
      },
      {
        id: 'S004',
        name: 'David Kim',
        role: 'CLEANING',
        department: 'ICU',
        isAvailable: true,
        currentLoad: 0,
        maxLoad: 8,
        color: '#8b5cf6'
      }
    ];

    // Mock care tasks
    this.careTasks = [
      {
        id: 'CT001',
        patientId: 'P001',
        patientName: 'John Smith',
        title: 'Administer Medication',
        description: 'Give morning dose of Metformin 500mg',
        assignedTo: 'Sarah Wilson',
        assignedToId: 'S001',
        priority: 'HIGH',
        status: 'PENDING',
        dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createdDate: new Date()
      },
      {
        id: 'CT002',
        patientId: 'P001',
        patientName: 'John Smith',
        title: 'Vital Signs Check',
        description: 'Check blood pressure, heart rate, temperature',
        assignedTo: 'Sarah Wilson',
        assignedToId: 'S001',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        dueTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdDate: new Date()
      }
    ];

    // Mock round templates
    this.roundTemplates = [
      {
        id: 'RT001',
        name: 'ICU Morning Round',
        roundType: 'NURSE_ROUND',
        department: 'ICU',
        checklist: [
          { item: 'Check vital signs', isRequired: true, category: 'VITALS' },
          { item: 'Administer medications', isRequired: true, category: 'MEDICATION' },
          { item: 'Assess pain level', isRequired: true, category: 'OBSERVATION' },
          { item: 'Check IV lines', isRequired: true, category: 'CARE' },
          { item: 'Document findings', isRequired: true, category: 'DOCUMENTATION' }
        ]
      },
      {
        id: 'RT002',
        name: 'General Ward Round',
        roundType: 'NURSE_ROUND',
        department: 'General',
        checklist: [
          { item: 'Check vital signs', isRequired: true, category: 'VITALS' },
          { item: 'Assess mobility', isRequired: true, category: 'OBSERVATION' },
          { item: 'Check wound dressings', isRequired: false, category: 'CARE' },
          { item: 'Update care plan', isRequired: true, category: 'DOCUMENTATION' }
        ]
      }
    ];
  }

  getAssignmentsForPatient(patientId: string | null): typeof this.staffAssignments {
    if (!patientId) return [];
    return this.staffAssignments.filter(a => a.patientId === patientId);
  }

  getRoundsForPatient(patientId: string | null): typeof this.staffRounds {
    if (!patientId) return [];
    return this.staffRounds.filter(r => r.patientId === patientId);
  }

  assignStaff(): void {
    if (this.staffAssignForm.invalid) return;
    const val = this.staffAssignForm.value;
    const newAssignment = {
      id: `SA-${Date.now()}`,
      patientId: val.patientId,
      staffId: `S-${Math.floor(Math.random() * 10000)}`,
      staffName: val.staffName,
      role: val.role,
      shiftStart: val.shiftStart,
      shiftEnd: val.shiftEnd,
      notes: val.notes || ''
    };
    this.staffAssignments.unshift(newAssignment);
    this.staffAssignForm.reset({ role: 'NURSE' });
  }

  logStaffRound(): void {
    if (this.staffRoundForm.invalid) return;
    const val = this.staffRoundForm.value;
    const newRound = {
      id: `SR-${Date.now()}`,
      patientId: val.patientId,
      staffId: `S-${Math.floor(Math.random() * 10000)}`,
      staffName: val.staffName,
      role: val.role,
      roundType: val.roundType,
      time: val.time,
      status: val.status,
      notes: val.notes || ''
    };
    this.staffRounds.unshift(newRound);
    this.staffRoundForm.reset({ role: 'NURSE', roundType: 'NURSE_ROUND', status: 'COMPLETED' });
  }

  // Enhanced Staff Management Methods
  openStaffAssignmentDialog(): void {
    this.showStaffAssignmentDialog = true;
  }

  openCareTaskDialog(): void {
    this.showCareTaskDialog = true;
  }

  openRoundTemplateDialog(): void {
    this.showRoundTemplateDialog = true;
  }

  closeDialogs(): void {
    this.showStaffAssignmentDialog = false;
    this.showCareTaskDialog = false;
    this.showRoundTemplateDialog = false;
  }

  // Drag and Drop Methods
  onDragStart(staff: any): void {
    this.draggedStaff = staff;
    this.isDragMode = true;
  }

  onDragEnd(): void {
    this.draggedStaff = null;
    this.isDragMode = false;
  }

  onDrop(patient: AdmittedPatient): void {
    if (this.draggedStaff && patient) {
      // Auto-assign staff to patient
      this.staffAssignForm.patchValue({
        patientId: patient.patientId,
        staffName: this.draggedStaff.name,
        role: this.draggedStaff.role,
        shiftStart: new Date(),
        shiftEnd: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours from now
      });
      this.openStaffAssignmentDialog();
    }
  }

  // Utility Methods
  getStaffColor(role: string): string {
    const colors: { [key: string]: string } = {
      'NURSE': '#3b82f6',
      'WARD_BOY': '#10b981',
      'CLEANING': '#f59e0b',
      'DIET': '#8b5cf6',
      'PHYSIOTHERAPY': '#ef4444',
      'OTHER': '#6b7280'
    };
    return colors[role] || '#6b7280';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#ef4444',
      'URGENT': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#f59e0b',
      'IN_PROGRESS': '#3b82f6',
      'COMPLETED': '#10b981',
      'OVERDUE': '#ef4444',
      'ACTIVE': '#10b981',
      'CANCELLED': '#6b7280',
      'ON_BREAK': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  }

  // Filter Methods
  getFilteredStaff(): any[] {
    return this.availableStaff.filter(staff => staff.isAvailable);
  }

  getFilteredCareTasks(): any[] {
    return this.careTasks;
  }

  getFilteredRoundTemplates(): any[] {
    return this.roundTemplates;
  }

  // Additional Methods
  useTemplate(template: any): void {
    // Implement template usage logic
    console.log('Using template:', template);
    // You can open a dialog or pre-fill forms with template data
  }

  createCareTask(): void {
    if (this.careTaskForm?.valid) {
      const formValue = this.careTaskForm.value;
      const staff = this.availableStaff.find(s => s.id === formValue.assignedTo);
      const patient = this.admittedPatients.find(p => p.patientId === formValue.patientId);
      
      if (staff && patient) {
        const task = {
          id: `CT${Date.now()}`,
          patientId: formValue.patientId,
          patientName: patient.patientName,
          title: formValue.title,
          description: formValue.description,
          assignedTo: staff.name,
          assignedToId: formValue.assignedTo,
          priority: formValue.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE',
          dueTime: formValue.dueTime,
          createdDate: new Date()
        };
        
        this.careTasks.unshift(task);
        this.careTaskForm.reset();
        this.closeDialogs();
      }
    }
  }

  scheduleRound(): void {
    if (this.roundScheduleForm?.valid) {
      const formValue = this.roundScheduleForm.value;
      const staff = this.availableStaff.find(s => s.id === formValue.assignedTo);
      const patient = this.admittedPatients.find(p => p.patientId === formValue.patientId);
      
      if (staff && patient) {
        const schedule = {
          id: `RS${Date.now()}`,
          patientId: formValue.patientId,
          roundType: formValue.roundType,
          scheduledTime: formValue.scheduledTime,
          frequency: formValue.frequency,
          assignedTo: staff.name,
          assignedToId: formValue.assignedTo,
          priority: formValue.priority,
          isActive: true,
          createdBy: 'Current Doctor',
          createdDate: new Date()
        };
        
        this.roundSchedules.unshift(schedule);
        this.roundScheduleForm.reset();
        this.closeDialogs();
      }
    }
  }

  // Patient Management Methods
  selectPatient(patient: AdmittedPatient): void {
    this.selectedPatient = patient;
    this.showPatientDetail = true;
  }

  closePatientDetail(): void {
    this.selectedPatient = null;
    this.showPatientDetail = false;
  }

  // Quick Action Methods
  startNewRound(): void {
    this.showRoundDialog = true;
  }

  addNewTask(): void {
    this.showTaskDialog = true;
  }

  viewAllAlerts(): void {
    this.selectedTab = 'alerts';
  }

  viewDischargeReady(): void {
    this.selectedTab = 'patients';
    this.selectedStatus = 'recovering';
    this.applyFilters();
  }

  // Round Management Methods
  startRoundForPatient(patient: AdmittedPatient): void {
    this.roundForm.patchValue({
      patientId: patient.patientId
    });
    this.showRoundDialog = true;
  }

  completeRound(): void {
    if (this.roundForm.valid) {
      // Simulate saving round data
      console.log('Round completed:', this.roundForm.value);
      this.showRoundDialog = false;
      this.roundForm.reset();
    }
  }

  cancelRound(): void {
    this.showRoundDialog = false;
    this.roundForm.reset();
  }

  // Task Management Methods
  addTaskForPatient(patient: AdmittedPatient): void {
    this.taskForm.patchValue({
      patientId: patient.patientId,
      location: `${patient.ward} - ${patient.room}, ${patient.bed}`
    });
    this.showTaskDialog = true;
  }

  saveTask(): void {
    if (this.taskForm.valid) {
      // Simulate saving task data
      console.log('Task added:', this.taskForm.value);
      this.showTaskDialog = false;
      this.taskForm.reset();
    }
  }

  cancelTask(): void {
    this.showTaskDialog = false;
    this.taskForm.reset();
  }

  // Medicine Request Methods
  requestMedicineForPatient(patient: AdmittedPatient): void {
    this.medicineRequestForm.patchValue({
      patientId: patient.patientId
    });
    this.showMedicineRequestDialog = true;
  }

  submitMedicineRequest(): void {
    if (this.medicineRequestForm.valid) {
      // Simulate saving medicine request
      console.log('Medicine request submitted:', this.medicineRequestForm.value);
      this.showMedicineRequestDialog = false;
      this.medicineRequestForm.reset();
    }
  }

  cancelMedicineRequest(): void {
    this.showMedicineRequestDialog = false;
    this.medicineRequestForm.reset();
  }

  // Relative Management Methods
  addRelativeForPatient(patient: AdmittedPatient): void {
    this.relativeForm.patchValue({
      patientId: patient.patientId
    });
    this.showRelativeDialog = true;
  }

  addRelative(): void {
    if (this.relativeForm.valid) {
      // Simulate saving relative data
      console.log('Relative added:', this.relativeForm.value);
      this.showRelativeDialog = false;
      this.relativeForm.reset();
    }
  }

  cancelRelative(): void {
    this.showRelativeDialog = false;
    this.relativeForm.reset();
  }

  // Alert Management Methods
  acknowledgeAlert(alert: DoctorAlert): void {
    alert.acknowledged = true;
    alert.acknowledgedBy = this.dashboardData.doctorName;
    alert.acknowledgedDate = new Date();
    this.updateStatistics();
  }

  resolveAlert(alert: DoctorAlert): void {
    alert.resolved = true;
    alert.resolvedBy = this.dashboardData.doctorName;
    alert.resolvedDate = new Date();
    this.updateStatistics();
  }

  // Utility Methods

  getAlertSeverityColor(severity: string): string {
    switch (severity) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#3b82f6';
      case 'HIGH': return '#f59e0b';
      case 'CRITICAL': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getTaskStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  getTimeAgo(date: Date | undefined): string {
    if (!date) return 'Not scheduled';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  // Navigation Methods
  navigateToPatientProfile(patient: AdmittedPatient): void {
    this.router.navigate(['/patient-profile'], {
      queryParams: {
        patientId: patient.patientId,
        patientName: patient.patientName
      }
    });
  }

  // Patient Detail View Methods
  showPatientRoundsView(): void {
    this.showPatientRounds = true;
  }

  showPatientMedicineRequestsView(): void {
    this.showPatientMedicineRequests = true;
  }

  showPatientRelativesView(): void {
    this.showPatientRelatives = true;
  }

  closePatientSubViews(): void {
    this.showPatientRounds = false;
    this.showPatientMedicineRequests = false;
    this.showPatientRelatives = false;
  }

  // Alert filter methods
  getCriticalAlertsCount(): number {
    return this.doctorAlerts.filter(a => a.severity === 'CRITICAL').length;
  }

  getHighAlertsCount(): number {
    return this.doctorAlerts.filter(a => a.severity === 'HIGH').length;
  }

  getUnacknowledgedAlertsCount(): number {
    return this.doctorAlerts.filter(a => !a.acknowledged).length;
  }

  // Helper methods for date formatting
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString();
  }

  formatShiftTime(startDate: Date, endDate: Date): string {
    return `${new Date(startDate).toLocaleString()} - ${new Date(endDate).toLocaleString()}`;
  }

  // Enhanced Patient Management Methods
  startRealTimeMonitoring(): void {
    if (this.isRealTimeMode) {
      this.refreshInterval = setInterval(() => {
        this.updateVitalSigns();
        this.updatePatientStats();
        this.lastUpdateTime = new Date();
      }, 30000); // Update every 30 seconds
    }
  }

  stopRealTimeMonitoring(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  updateVitalSigns(): void {
    // Simulate real-time vital signs updates
    this.admittedPatients.forEach(patient => {
      if (patient.vitalSigns) {
        // Simulate small variations in vital signs
        const variation = (Math.random() - 0.5) * 0.2;
        patient.vitalSigns.heartRate = Math.max(60, Math.min(120, patient.vitalSigns.heartRate + variation));
        patient.vitalSigns.temperature = Math.max(36.0, Math.min(39.0, patient.vitalSigns.temperature + variation * 0.1));
        patient.vitalSigns.oxygenSaturation = Math.max(85, Math.min(100, patient.vitalSigns.oxygenSaturation + variation * 2));
      }
    });
  }

  updatePatientStats(): void {
    this.patientStats = {
      total: this.admittedPatients.length,
      critical: this.admittedPatients.filter(p => p.currentStatus === 'CRITICAL').length,
      stable: this.admittedPatients.filter(p => p.currentStatus === 'STABLE').length,
      improving: this.admittedPatients.filter(p => p.currentStatus === 'IMPROVING').length,
      deteriorating: this.admittedPatients.filter(p => p.currentStatus === 'DETERIORATING').length
    };
  }

  // Advanced Filtering Methods
  getFilteredPatients(): AdmittedPatient[] {
    let filtered = [...this.admittedPatients];

    // Patient type filter - filter by My Patients vs All Patients
    if (this.selectedPatientType === 'My Patients') {
      // Show only patients assigned to current doctor
      filtered = filtered.filter(patient => 
        patient.attendingDoctor === 'Dr. Sarah Johnson' // Current doctor
      );
    }
    // For 'All Patients', show all patients (no additional filtering needed)

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.patientName.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query) ||
        patient.ward.toLowerCase().includes(query) ||
        patient.primaryDiagnosis.some(d => d.toLowerCase().includes(query))
      );
    }

    // Ward filter
    if (this.selectedWard !== 'All Wards') {
      filtered = filtered.filter(patient => patient.ward === this.selectedWard);
    }

    // Priority filter
    if (this.selectedPriority !== 'All Priorities') {
      filtered = filtered.filter(patient => patient.priority === this.selectedPriority);
    }

    // Status filter
    if (this.selectedStatus !== 'All Status') {
      filtered = filtered.filter(patient => patient.currentStatus === this.selectedStatus);
    }

    // Doctor filter
    if (this.selectedDoctor !== 'All Doctors') {
      filtered = filtered.filter(patient => patient.attendingDoctor === this.selectedDoctor);
    }

    return filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedWard = 'All Wards';
    this.selectedPriority = 'All Priorities';
    this.selectedStatus = 'All Status';
    this.selectedDoctor = 'All Doctors';
  }

  // Quick Actions
  quickStartRound(patient: AdmittedPatient): void {
    // Implementation for quick round start
    console.log('Starting round for patient:', patient.patientName);
  }

  quickAddMedication(patient: AdmittedPatient): void {
    // Implementation for quick medication addition
    console.log('Adding medication for patient:', patient.patientName);
  }

  quickOrderTest(patient: AdmittedPatient): void {
    // Implementation for quick test ordering
    console.log('Ordering test for patient:', patient.patientName);
  }

  quickViewVitals(patient: AdmittedPatient): void {
    // Implementation for quick vital signs view
    console.log('Viewing vitals for patient:', patient.patientName);
  }

  addNote(patient: AdmittedPatient): void {
    // Placeholder for adding a quick note to patient chart
    console.log('Add note for patient:', patient.patientName);
  }

  addTask(patient: AdmittedPatient): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'save',
        text: 'Create Task',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    const dialogRef = this.dialogService.openDialog(TaskDialogComponent, {
      title: 'Create Task',
      data: {
        patientId: patient.patientId,
        patientName: patient.patientName,
        location: `${patient.ward} - ${patient.room}, ${patient.bed}`,
        taskType: 'ROUND'
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save' && result.formData) {
        // Handle task creation
        const taskData = {
          ...result.formData,
          id: `TASK${Date.now()}`,
          status: 'PENDING',
          assignedDate: new Date(),
          createdBy: this.dashboardData.doctorName,
          assignedTo: this.dashboardData.doctorName,
          tags: []
        };
        
        console.log('Task created:', taskData);
        // You can add logic here to save the task to your service
        // For example: this.taskService.createTask(taskData);
        
        // Optionally reload tasks
        // this.loadDoctorTasks();
      }
    });
  }

  completeTask(index: number): void {
    if (this.dashboardTasks[index]) {
      this.dashboardTasks[index].completed = true;
    }
  }

  deleteTask(index: number): void {
    this.dashboardTasks.splice(index, 1);
  }

  viewAllTasks(): void {
    // Collect all tasks from different sources
    const allTasks = [
      ...this.dashboardTasks.map((task, index) => ({
        ...task,
        taskType: 'GENERAL',
        priority: 'MEDIUM',
        originalIndex: index,
        source: 'dashboard'
      })),
      ...this.staffTasks.map((task, index) => ({
        title: task.title,
        due: task.dueTime ? new Date(task.dueTime).toLocaleString() : 'No due date',
        completed: task.status === 'completed',
        priority: task.priority || 'MEDIUM',
        taskType: task.taskType || 'DOCTOR',
        assignedTo: task.assignedTo,
        originalIndex: index,
        source: 'staff'
      }))
    ];

    const footerActions: DialogFooterAction[] = [
      {
        id: 'close',
        text: 'Close',
        color: 'primary',
        appearance: 'flat'
      }
    ];

    const dialogRef = this.dialogService.openDialog(TasksListDialogComponent, {
      title: 'All Tasks',
      data: {
        tasks: allTasks,
        onTaskComplete: (task: any) => {
          if (task.source === 'dashboard' && task.originalIndex !== undefined) {
            this.completeTask(task.originalIndex);
          }
        },
        onTaskDelete: (task: any) => {
          if (task.source === 'dashboard' && task.originalIndex !== undefined) {
            this.deleteTask(task.originalIndex);
          }
        }
      },
      width: '90%',
      height: '80%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.updatedTasks) {
        // Update dashboard tasks based on changes
        const dashboardTasks = result.updatedTasks.filter((t: any) => t.source === 'dashboard');
        this.dashboardTasks = dashboardTasks.map((t: any) => ({
          title: t.title,
          due: t.due,
          completed: t.completed
        }));
      }
    });
  }

  openAddTaskDialog(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'save',
        text: 'Create Task',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    const dialogRef = this.dialogService.openDialog(TaskDialogComponent, {
      title: 'Create Task',
      data: {
        patientId: '',
        patientName: 'General Task',
        location: '',
        taskType: 'ROUND'
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save' && result.formData) {
        // Handle task creation
        const taskData = {
          ...result.formData,
          id: `TASK${Date.now()}`,
          status: 'PENDING',
          assignedDate: new Date(),
          createdBy: this.dashboardData.doctorName,
          assignedTo: this.dashboardData.doctorName,
          tags: []
        };
        
        console.log('Task created:', taskData);
        
        // Add task to dashboard tasks list
        this.dashboardTasks.push({
          title: taskData.title,
          due: this.formatTaskDueDate(taskData.dueDate),
          completed: false
        });
        
        // You can add logic here to save the task to your service
        // For example: this.taskService.createTask(taskData);
      }
    });
  }

  openAssignTaskDialog(staffId?: string, staffName?: string): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'assign',
        text: 'Assign Task',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'assignment'
      }
    ];

    const dialogRef = this.dialogService.openDialog(AssignTaskDialogComponent, {
      title: 'Assign Task',
      data: {
        staffId: staffId,
        staffName: staffName,
        availableStaff: this.availableStaff || this.staffMembers,
        availableTasks: this.staffTasks
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'assign' && result.formData) {
        // Handle task assignment
        const taskData = {
          ...result.formData,
          id: `TASK${Date.now()}`,
          status: 'pending',
          assignedDate: new Date(),
          createdBy: this.dashboardData.doctorName,
          tags: []
        };
        
        // Add to staff tasks
        this.staffTasks.push({
          id: taskData.id,
          title: taskData.title,
          assignedTo: taskData.assignedTo,
          priority: taskData.priority,
          status: 'pending',
          dueTime: taskData.dueDate,
          patientId: taskData.patientId || '',
          description: taskData.description,
          taskType: 'doctor',
          category: 'Patient Care'
        });
        
        console.log('Task assigned:', taskData);
        // You can add logic here to save the task to your service
      }
    });
  }

  formatTaskDueDate(dueDate: string): string {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${displayHours}:${displayMinutes} ${ampm}`;
    }
    
    // Check if it's tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${displayHours}:${displayMinutes} ${ampm}`;
    }
    
    // Otherwise return formatted date
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day} at ${displayHours}:${displayMinutes} ${ampm}`;
  }

  // Patient Priority Calculation
  calculatePatientPriority(patient: AdmittedPatient): number {
    let priorityScore = 0;
    
    // Status priority
    switch (patient.currentStatus) {
      case 'CRITICAL': priorityScore += 100; break;
      case 'DETERIORATING': priorityScore += 80; break;
      case 'IMPROVING': priorityScore += 40; break;
      case 'STABLE': priorityScore += 20; break;
      case 'RECOVERING': priorityScore += 10; break;
    }

    // Priority level
    switch (patient.priority) {
      case 'URGENT': priorityScore += 50; break;
      case 'HIGH': priorityScore += 30; break;
      case 'MEDIUM': priorityScore += 15; break;
      case 'LOW': priorityScore += 5; break;
    }

    // Vital signs abnormality
    if (patient.vitalSigns?.isAbnormal) {
      priorityScore += 25;
    }

    // Alert count
    priorityScore += patient.alerts?.length * 10 || 0;

    // Time since last round
    const hoursSinceLastRound = (Date.now() - patient.lastDoctorRound.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRound > 4) {
      priorityScore += 20;
    }

    return priorityScore;
  }

  getPriorityColorByScore(priority: number): string {
    if (priority >= 100) return '#dc2626'; // Critical - Red
    if (priority >= 70) return '#ea580c'; // High - Orange
    if (priority >= 40) return '#d97706'; // Medium - Amber
    return '#16a34a'; // Low - Green
  }

  getPriorityLabel(priority: number): string {
    if (priority >= 100) return 'CRITICAL';
    if (priority >= 70) return 'HIGH';
    if (priority >= 40) return 'MEDIUM';
    return 'LOW';
  }

  // Vital Signs Status
  getVitalStatus(patient: AdmittedPatient): string {
    if (!patient.vitalSigns) return 'Unknown';
    
    const vitals = patient.vitalSigns;
    if (vitals.isAbnormal) return 'Abnormal';
    if (vitals.heartRate > 100 || vitals.heartRate < 60) return 'Concerning';
    if (vitals.temperature > 38 || vitals.temperature < 36) return 'Concerning';
    if (vitals.oxygenSaturation < 95) return 'Concerning';
    
    return 'Normal';
  }

  getVitalStatusColor(patient: AdmittedPatient): string {
    const status = this.getVitalStatus(patient);
    switch (status) {
      case 'Abnormal': return '#dc2626';
      case 'Concerning': return '#ea580c';
      case 'Normal': return '#16a34a';
      default: return '#6b7280';
    }
  }

  // Alert color helper
  getAlertColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#d97706';
      case 'LOW': return '#6b7280';
      default: return '#6b7280';
    }
  }

  // Staff Management Methods
  getStaffStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#10b981';
      case 'on_break': return '#f59e0b';
      case 'off_duty': return '#6b7280';
      case 'busy': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getStaffStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'check_circle';
      case 'on_break': return 'pause_circle';
      case 'off_duty': return 'cancel';
      case 'busy': return 'schedule';
      default: return 'help';
    }
  }

  getWorkloadColor(workload: number): string {
    if (workload >= 90) return '#dc2626';
    if (workload >= 75) return '#ea580c';
    if (workload >= 50) return '#d97706';
    return '#10b981';
  }

  getTaskPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#d97706';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  }


  assignTaskToStaff(taskId: string, staffId: string): void {
    const task = this.staffTasks.find(t => t.id === taskId);
    const staff = this.staffMembers.find(s => s.id === staffId);
    if (task && staff) {
      task.assignedTo = staff.name;
      // Update task status to pending
      task.status = 'pending';
    }
  }

  updateTaskStatus(taskId: string, status: string): void {
    const task = this.staffTasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
    }
  }

  getStaffWorkload(staffId: string): number {
    const staff = this.staffMembers.find(s => s.id === staffId);
    return staff ? staff.workload : 0;
  }

  getStaffPerformance(staffId: string): any {
    const staff = this.staffMembers.find(s => s.id === staffId);
    return staff ? staff.performance : null;
  }

  getOverdueTasks(): any[] {
    const now = new Date();
    return this.staffTasks.filter(task => {
      const dueTime = new Date(task.dueTime);
      return dueTime < now && task.status !== 'completed';
    });
  }

  getStaffEfficiency(): number {
    const totalTasks = this.staffTasks.length;
    const completedTasks = this.staffTasks.filter(t => t.status === 'completed').length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  // Helper methods for template expressions
  getActiveStaffCount(): number {
    return this.staffMembers.filter(s => s.status === 'active').length;
  }

  getActiveStaffPercentage(): number {
    return Math.round((this.getActiveStaffCount() / this.staffMembers.length) * 100);
  }

  getActiveTasksCount(): number {
    return this.staffTasks.filter(t => t.status !== 'completed').length;
  }

  getAverageEfficiency(): number {
    return Math.round(this.staffMembers.reduce((acc, s) => acc + s.performance.efficiency, 0) / this.staffMembers.length);
  }

  getAveragePatientSatisfaction(): string {
    const avg = this.staffMembers.reduce((acc, s) => acc + s.performance.patientSatisfaction, 0) / this.staffMembers.length;
    return avg.toFixed(1);
  }

  getStaffForShift(shiftName: string): any[] {
    return this.staffMembers.filter(s => s.shift === shiftName);
  }

  // Doctor-specific methods
  getDoctorTasks(): any[] {
    return this.staffTasks.filter(task => task.taskType === 'doctor');
  }

  getDoctorTasksByStatus(status: string): any[] {
    return this.getDoctorTasks().filter(task => task.status === status);
  }

  getDoctorTasksByPriority(priority: string): any[] {
    return this.getDoctorTasks().filter(task => task.priority === priority);
  }

  getDoctorTasksByCategory(category: string): any[] {
    return this.getDoctorTasks().filter(task => task.category === category);
  }

  getDoctors(): any[] {
    return this.staffMembers.filter(staff => 
      staff.role.toLowerCase().includes('doctor') || 
      staff.role.toLowerCase().includes('resident')
    );
  }

  getDoctorWorkload(doctorId: string): number {
    const doctor = this.staffMembers.find(s => s.id === doctorId);
    return doctor ? doctor.workload : 0;
  }

  getDoctorTaskCount(doctorId: string): number {
    const doctor = this.staffMembers.find(s => s.id === doctorId);
    return doctor ? this.staffTasks.filter(t => t.assignedTo === doctor.name && t.taskType === 'doctor').length : 0;
  }

  getDoctorCompletedTasks(doctorId: string): number {
    const doctor = this.staffMembers.find(s => s.id === doctorId);
    return doctor ? this.staffTasks.filter(t => t.assignedTo === doctor.name && t.taskType === 'doctor' && t.status === 'completed').length : 0;
  }

  getDoctorEfficiency(doctorId: string): number {
    const totalTasks = this.getDoctorTaskCount(doctorId);
    const completedTasks = this.getDoctorCompletedTasks(doctorId);
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  // Practical Dashboard Methods
  initializeDashboard(): void {
    this.loadDashboardMetrics();
    this.loadCriticalPatients();
    this.loadPendingRounds();
    this.loadDueMedications();
    this.loadDischargeReadyPatients();
    this.initializeCharts();
  }

  loadDashboardMetrics(): void {
    this.dashboardMetrics = {
      totalPatients: this.admittedPatients.length,
      criticalPatients: this.admittedPatients.filter(p => p.currentStatus === 'CRITICAL').length,
      pendingRounds: this.doctorRounds.filter(r => r.status === 'SCHEDULED').length,
      dueMedications: this.getDueMedicationsCount(),
      dischargeReady: this.admittedPatients.filter(p => p.dischargeReadiness === 'READY').length,
      wardOccupancy: Math.round((this.admittedPatients.length / 120) * 100) // Assuming 120 total beds
    };
  }

  loadCriticalPatients(): void {
    this.criticalPatients = this.admittedPatients
      .filter(p => p.currentStatus === 'CRITICAL' || p.priority === 'URGENT')
      .slice(0, 6)
      .map(p => ({
        id: p.patientId,
        name: p.patientName,
        ward: p.ward,
        room: p.room,
        bed: p.bed,
        status: p.currentStatus,
        priority: p.priority,
        lastVitals: p.lastVitalCheck,
        alerts: p.alerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length
      }));
  }

  loadPendingRounds(): void {
    this.pendingRounds = this.doctorRounds
      .filter(r => r.status === 'SCHEDULED')
      .slice(0, 8)
      .map(r => ({
        id: r.id,
        patientName: r.patientName,
        ward: r.ward,
        room: r.room,
        bed: r.bed,
        scheduledTime: r.roundTime,
        roundType: r.roundType,
        priority: this.getRoundPriority(r.roundType)
      }));
  }

  loadDueMedications(): void {
    this.dueMedications = this.admittedPatients
      .flatMap(p => p.medications
        .filter(m => m.status === 'ACTIVE' && new Date(m.nextDue) <= new Date())
        .map(m => ({
          patientId: p.patientId,
          patientName: p.patientName,
          ward: p.ward,
          room: p.room,
          bed: p.bed,
          medication: m.medicationName,
          dosage: m.dosage,
          dueTime: m.nextDue,
          overdue: new Date(m.nextDue) < new Date()
        }))
      )
      .slice(0, 8);
  }

  loadDischargeReadyPatients(): void {
    this.dischargeReadyPatients = this.admittedPatients
      .filter(p => p.dischargeReadiness === 'READY' || p.dischargeReadiness === 'ASSESSING')
      .slice(0, 6)
      .map(p => ({
        id: p.patientId,
        name: p.patientName,
        ward: p.ward,
        room: p.room,
        bed: p.bed,
        admissionDate: p.admissionDate,
        lengthOfStay: this.calculateLengthOfStay(p.admissionDate),
        readiness: p.dischargeReadiness,
        expectedDischarge: p.expectedDischarge
      }));
  }

  initializeCharts(): void {
    this.setupPatientStatusChart();
    this.setupWardOccupancyChart();
    this.setupRoundsChart();
    this.setupMedicationChart();
  }

  setupPatientStatusChart(): void {
    this.patientStatusChartOptions = {
      chart: {
        type: 'pie',
        height: 280,
        width: null, // Let it auto-size to container
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: 'Patient Status Distribution'
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.y}'
          }
        }
      },
      series: [{
        type: 'pie',
        name: 'Patients',
        data: [
          { name: 'Critical', y: this.dashboardMetrics.criticalPatients, color: '#e74c3c' },
          { name: 'Stable', y: this.admittedPatients.filter(p => p.currentStatus === 'STABLE').length, color: '#27ae60' },
          { name: 'Improving', y: this.admittedPatients.filter(p => p.currentStatus === 'IMPROVING').length, color: '#3498db' },
          { name: 'Recovering', y: this.admittedPatients.filter(p => p.currentStatus === 'RECOVERING').length, color: '#9b59b6' }
        ]
      }]
    };
  }

  setupWardOccupancyChart(): void {
    const wardData = this.admittedPatients.reduce((acc, p) => {
      acc[p.ward] = (acc[p.ward] || 0) + 1;
      return acc;
    }, {} as any);

    this.wardOccupancyChartOptions = {
      chart: {
        type: 'column',
        height: 280,
        width: null, // Let it auto-size to container
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: 'Ward Occupancy'
      },
      xAxis: {
        categories: Object.keys(wardData)
      },
      yAxis: {
        title: {
          text: 'Number of Patients'
        }
      },
      series: [{
        type: 'column',
        name: 'Patients',
        data: Object.values(wardData),
        color: '#3498db'
      }]
    };
  }

  setupRoundsChart(): void {
    this.roundsChartOptions = {
      chart: {
        type: 'line',
        height: 280,
        width: null, // Let it auto-size to container
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: 'Rounds Completion Trend'
      },
      xAxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yAxis: {
        title: {
          text: 'Number of Rounds'
        }
      },
      series: [{
        type: 'line',
        name: 'Completed',
        data: [12, 15, 18, 14, 16, 8, 10],
        color: '#27ae60'
      }, {
        type: 'line',
        name: 'Pending',
        data: [3, 2, 1, 4, 2, 6, 4],
        color: '#e74c3c'
      }]
    };
  }

  setupMedicationChart(): void {
    this.medicationChartOptions = {
      chart: {
        type: 'bar',
        height: 280,
        width: null, // Let it auto-size to container
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: 'Medication Status'
      },
      xAxis: {
        categories: ['Due', 'Overdue', 'Completed', 'Pending']
      },
      yAxis: {
        title: {
          text: 'Number of Medications'
        }
      },
      series: [{
        type: 'bar',
        name: 'Medications',
        data: [
          this.dueMedications.filter(m => !m.overdue).length,
          this.dueMedications.filter(m => m.overdue).length,
          Math.floor(Math.random() * 20) + 30,
          Math.floor(Math.random() * 10) + 5
        ],
        color: '#3498db'
      }]
    };
  }

  // Helper methods
  getDueMedicationsCount(): number {
    return this.admittedPatients.reduce((count, p) => {
      return count + p.medications.filter(m => 
        m.status === 'ACTIVE' && new Date(m.nextDue) <= new Date()
      ).length;
    }, 0);
  }

  getRoundPriority(roundType: string): string {
    switch (roundType) {
      case 'EMERGENCY_ROUND': return 'URGENT';
      case 'MORNING_ROUND': return 'HIGH';
      case 'EVENING_ROUND': return 'MEDIUM';
      case 'DISCHARGE_ROUND': return 'HIGH';
      default: return 'LOW';
    }
  }

  calculateLengthOfStay(admissionDate: Date): number {
    const admission = new Date(admissionDate);
    const current = new Date();
    return Math.floor((current.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24));
  }

  admitPatient(): void {
    // First, open patient search dialog
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'select',
        text: 'Select',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const patientSearchRef = this.dialogService.openDialog(PatientSearchDialogComponent, {
      title: 'Search Patient',
      width: '90%',
      height: '90%',
      data: {},
      footerActions: footerActions
    });

    patientSearchRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'select' && result.patient) {
        // Open admission dialog with selected patient
        const admissionFooterActions: DialogFooterAction[] = [
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

        const admissionDialogRef = this.dialogService.openDialog(AdmissionDialogComponent, {
          title: 'Admit Patient',
          data: {
            patientId: result.patient.id,
            patientName: result.patient.fullName || `${result.patient.firstName} ${result.patient.lastName}`,
            wardOptions: this.wardOptions.filter(w => w !== 'All Wards'),
            bedOptions: this.bedOptions,
            doctorOptions: this.doctorOptions
          },
          width: '600px',
          footerActions: admissionFooterActions
        });

        admissionDialogRef.afterClosed().subscribe((admissionResult) => {
          if (admissionResult && admissionResult.action === 'confirm' && admissionResult.formData) {
            // Handle admission confirmation
            console.log('Patient admitted:', admissionResult.formData);
            // You can add logic here to update the admitted patients list
            // For example: this.loadAdmittedPatients();
          }
        });
      }
    });
  }

  viewStaffProfile(staffId: string): void {
    const staff = this.staffMembers.find(s => s.id === staffId);
    if (!staff) return;

    const footerActions: DialogFooterAction[] = [
      { id: 'close', text: 'Close', color: 'primary', appearance: 'flat' }
    ];

    this.dialogService.openDialog(StaffViewDialogComponent, {
      title: 'Staff Profile',
      data: { staff },
      width: '80%',
      height: '90%',
      footerActions: footerActions
    });
  }

  openNewScheduleDialog(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'save', text: 'Save Schedule', color: 'primary', appearance: 'raised', fontIcon: 'save' }
    ];

    // Map shifts to include staffIds based on current staff assignments
    const shiftsWithStaffIds = this.shifts.map(shift => {
      const staffInShift = this.getStaffForShift(shift.name);
      return {
        ...shift,
        staffIds: staffInShift.map(s => s.id),
        staffCount: staffInShift.length
      };
    });

    const dialogRef = this.dialogService.openDialog(StaffScheduleDialogComponent, {
      title: 'New Staff Schedule',
      data: {
        staffMembers: this.staffMembers,
        shifts: shiftsWithStaffIds,
        selectedDate: new Date()
      },
      width: '90%',
      maxWidth: '1200px',
      height: '80%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save') {
        const scheduleData = result.scheduleData;
        if (scheduleData && scheduleData.shifts) {
          // Update shifts with new assignments
          this.shifts = scheduleData.shifts.map((shift: any) => ({
            id: shift.id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            staffCount: shift.staffCount
          }));
          // Update staff members' shifts
          scheduleData.shifts.forEach((shift: any) => {
            // First, remove all staff from this shift
            this.staffMembers.forEach(staff => {
              if (staff.shift === shift.name) {
                staff.shift = '';
              }
            });
            // Then assign staff to this shift
            shift.staffIds.forEach((staffId: string) => {
              const staff = this.staffMembers.find(s => s.id === staffId);
              if (staff) {
                staff.shift = shift.name;
              }
            });
          });
          console.log('Schedule saved:', scheduleData);
        }
      }
    });
  }

  openNewTaskDialog(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'save', text: 'Create Task', color: 'primary', appearance: 'raised', fontIcon: 'save' }
    ];

    const dialogRef = this.dialogService.openDialog(TaskDialogComponent, {
      title: 'Create New Task',
      data: {
        patientId: null, // No specific patient for general tasks
        patientName: 'General Task',
        location: '',
        taskType: 'GENERAL'
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save' && result.formData) {
        const taskData = {
          ...result.formData,
          id: `TASK${Date.now()}`,
          status: 'pending',
          assignedDate: new Date(),
          createdBy: this.dashboardData.doctorName,
          assignedTo: result.formData.assignedTo || this.dashboardData.doctorName,
          tags: []
        };
        
        // Add to staffTasks array
        this.staffTasks.push({
          id: taskData.id,
          title: taskData.title,
          assignedTo: taskData.assignedTo || this.dashboardData.doctorName,
          priority: taskData.priority,
          status: 'pending',
          dueTime: taskData.dueDate,
          patientId: taskData.patientId || '',
          description: taskData.description,
          taskType: taskData.taskType || 'GENERAL',
          category: taskData.category || 'General'
        });
        
        console.log('New task created:', taskData);
      }
    });
  }

  editTask(task: any): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'save', text: 'Update Task', color: 'primary', appearance: 'raised', fontIcon: 'save' }
    ];

    const dialogRef = this.dialogService.openDialog(TaskDialogComponent, {
      title: 'Edit Task',
      data: {
        patientId: task.patientId || null,
        patientName: task.patientName || 'General Task',
        location: task.location || '',
        taskType: task.taskType || 'GENERAL',
        task: task,
        isEditMode: true
      },
      width: '600px',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'save' && result.formData) {
        // Find and update the task in staffTasks array
        const taskIndex = this.staffTasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.staffTasks[taskIndex] = {
            ...this.staffTasks[taskIndex],
            title: result.formData.title,
            description: result.formData.description,
            priority: result.formData.priority,
            dueTime: result.formData.dueDate,
            taskType: result.formData.taskType,
            patientId: result.formData.patientId || '',
            assignedTo: result.formData.assignedTo || this.staffTasks[taskIndex].assignedTo
          };
          console.log('Task updated:', this.staffTasks[taskIndex]);
        }
      }
    });
  }

  viewPatientFromTask(task: any): void {
    if (!task.patientId) {
      console.warn('No patient ID associated with this task');
      return;
    }

    // Find the patient in admittedPatients array
    const patient = this.admittedPatients.find(p => p.patientId === task.patientId);
    
    if (patient) {
      this.navigateToPatientProfile(patient);
    } else {
      // If patient not found in admittedPatients, navigate with patientId
      this.router.navigate(['/patient-profile'], {
        queryParams: { patientId: task.patientId }
      });
    }
  }

  initializeStaffPerformanceCharts(): void {
    this.setupStaffTaskCompletionChart();
    this.setupStaffPerformanceByDepartmentChart();
    this.setupStaffTaskStatusChart();
    this.setupStaffEfficiencyChart();
  }

  setupStaffTaskCompletionChart(): void {
    // Task completion rate over the last 7 days
    const last7Days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const completedTasks = [45, 52, 48, 55, 60, 35, 40];
    const totalTasks = [50, 58, 55, 62, 68, 42, 48];
    const completionRates = completedTasks.map((completed, index) => 
      Math.round((completed / totalTasks[index]) * 100)
    );

    this.staffTaskCompletionChartOptions = {
      chart: {
        type: 'line',
        height: 300,
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: 'Task Completion Rate Trend'
      },
      xAxis: {
        categories: last7Days
      },
      yAxis: {
        title: {
          text: 'Completion Rate (%)'
        },
        min: 0,
        max: 100
      },
      tooltip: {
        pointFormat: '<b>{point.y}%</b>'
      },
      series: [{
        type: 'line',
        name: 'Completion Rate',
        data: completionRates,
        color: '#3b82f6',
        marker: {
          enabled: true,
          radius: 4
        }
      }]
    };
  }

  setupStaffPerformanceByDepartmentChart(): void {
    const departmentData = this.staffMembers.reduce((acc, staff) => {
      if (!acc[staff.department]) {
        acc[staff.department] = {
          count: 0,
          totalEfficiency: 0,
          totalSatisfaction: 0
        };
      }
      acc[staff.department].count++;
      acc[staff.department].totalEfficiency += staff.performance.efficiency;
      acc[staff.department].totalSatisfaction += staff.performance.patientSatisfaction;
      return acc;
    }, {} as any);

    const departments = Object.keys(departmentData);
    const avgEfficiency = departments.map(dept => 
      Math.round(departmentData[dept].totalEfficiency / departmentData[dept].count)
    );
    const avgSatisfaction = departments.map(dept => 
      (departmentData[dept].totalSatisfaction / departmentData[dept].count).toFixed(1)
    );

    this.staffPerformanceByDepartmentChartOptions = {
      chart: {
        type: 'column',
        height: 300,
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: 'Performance by Department'
      },
      xAxis: {
        categories: departments
      },
      yAxis: {
        title: {
          text: 'Performance Score'
        }
      },
      tooltip: {
        shared: true
      },
      series: [{
        type: 'column',
        name: 'Avg Efficiency (%)',
        data: avgEfficiency,
        color: '#3b82f6'
      }, {
        type: 'column',
        name: 'Avg Satisfaction',
        data: avgSatisfaction.map(v => parseFloat(v)),
        color: '#10b981'
      }]
    };
  }

  setupStaffTaskStatusChart(): void {
    const taskStatusData = {
      completed: this.staffTasks.filter(t => t.status === 'completed').length,
      pending: this.staffTasks.filter(t => t.status === 'pending').length,
      in_progress: this.staffTasks.filter(t => t.status === 'in_progress').length,
      overdue: this.getOverdueTasks().length
    };

    this.staffTaskStatusChartOptions = {
      chart: {
        type: 'pie',
        height: 300,
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: 'Task Status Distribution'
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.y}'
          }
        }
      },
      series: [{
        type: 'pie',
        name: 'Tasks',
        data: [
          { name: 'Completed', y: taskStatusData.completed, color: '#10b981' },
          { name: 'In Progress', y: taskStatusData.in_progress, color: '#3b82f6' },
          { name: 'Pending', y: taskStatusData.pending, color: '#f59e0b' },
          { name: 'Overdue', y: taskStatusData.overdue, color: '#ef4444' }
        ]
      }]
    };
  }

  setupStaffEfficiencyChart(): void {
    // Top 5 staff members by efficiency
    const topStaff = [...this.staffMembers]
      .sort((a, b) => b.performance.efficiency - a.performance.efficiency)
      .slice(0, 5);

    const staffNames = topStaff.map(s => s.name.split(' ').pop() || s.name);
    const efficiencyData = topStaff.map(s => s.performance.efficiency);

    this.staffEfficiencyChartOptions = {
      chart: {
        type: 'bar',
        height: 300,
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: 'Top Staff by Efficiency'
      },
      xAxis: {
        categories: staffNames
      },
      yAxis: {
        title: {
          text: 'Efficiency (%)'
        },
        min: 0,
        max: 100
      },
      tooltip: {
        pointFormat: '<b>{point.y}%</b>'
      },
      series: [{
        type: 'bar',
        name: 'Efficiency',
        data: efficiencyData,
        color: '#3b82f6'
      }]
    };
  }

}
