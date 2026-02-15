import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { AppButtonComponent, AppInputComponent, DividerComponent, IconComponent, CalendarComponent, CoreEventService, DialogboxService, DialogFooterAction, PageComponent, PageBodyDirective, GridComponent, ExtendedGridOptions, TabsComponent, TabComponent } from '@lk/core';
import { ColDef } from 'ag-grid-community';
import { AppointmentCreateComponent } from '../appointment-create/appointment-create.component';
import { AppointmentViewComponent } from '../appointment-view/appointment-view.component';
import { PatientSearchDialogComponent, PatientSearchResult } from '../patient-search-dialog/patient-search-dialog.component';
import { Appointment } from '../../interfaces/appointment.interface';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { AppCardActionsDirective } from '../../core/components/app-card/app-card-actions.directive';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TimingsService } from '../../services/timings.service';
import { AuthService } from '../../services/auth.service';
import type { AppointmentTiming, DoctorTimingsResponse, TimingsForecastDay } from '../../interfaces/timings.interface';
import { AppointmentService } from '../../services/appointment.service';
import { TimingManageService } from '../../services/timing-manage.service';
import { Dialog, DIALOG_DATA } from '@angular/cdk/dialog';
import { LeaveDialogComponent } from './leave-dialog/leave-dialog.component';
import { SpecificdaydialogComponent } from './specificdaydialog/specificdaydialog.component';
import { DailyBaseDialogComponent } from './daily-base-dialog/daily-base-dialog.component';
import { WeekroutinedialogComponent } from './weekroutinedialog/weekroutinedialog.component';
import { AvailabilitySetupDialogComponent } from './availability-setup-dialog/availability-setup-dialog.component';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';

type TimingPriorityTab = 'p4' | 'p3' | 'p2' | 'p1';

type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface TimingBreak {
  label: string;
  start: string; // HH:MM
  end: string;   // HH:MM
}

interface WeeklyRule {
  start: string; // HH:MM
  end: string;   // HH:MM
  breaks: TimingBreak[];
}

interface TimingOverride {
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  breaks: TimingBreak[];
}

interface ForecastDay {
  date: Date;
  priority: TimingPriorityTab;
  label: string;
}

interface ThisWeekScheduleCard {
  weekday: Weekday;
  date: Date;
  dateLabel: string; // e.g. "Dec 15"
  hasSchedule: boolean;
  start?: string;
  end?: string;
  patternLabel?: string;
  durationMin?: number;
  totalSlots?: number;
  isToday: boolean;
}

type TimingsMode = 'view' | 'manage';

interface ManageLeaveItem {
  label: string;
  rangeLabel: string;     // "Dec 15 – Dec 20, 2024"
  durationLabel: string;  // "6 Days"
}

interface ManageSpecificDayItem {
  label: string;
  dateLabel: string;      // "Nov 30"
  rangeLabel: string;     // "Dec 15 – Dec 20, 2024"
}

interface ManageWeeklyRoutineItem {
  label: string;
  timeLabel: string;      // "09:00 AM – 01:00 PM"
  days: Weekday[];
  partiallyOverridden?: boolean;
}

interface ManageBaseAvailabilityItem {
  id:number;
  label: string;
  timeLabel: string;
  note?: string;
  raw :any
  
}

interface ScheduleStats {
  todayAppointments: number;
  pendingApprovals: number;
  completedToday: number;
  cancelledToday: number;
  nextAppointment: string;
  availableSlots: number;
  totalPatients: number;
  averageWaitTime: number;
  flexibleAppointmentsRemaining?: number;
}

interface AvailableSlotCard {
  slotId: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  startLabel: string; // "h:mm AM/PM"
  endLabel: string;
}

interface ScheduleView {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface ScheduleWeekDay {
  date: Date;
  weekdayShort: string; // Mon, Tue...
  dayNumber: number;
  monthShort: string;   // Feb, Mar (for display when spanning months)
  isSelected: boolean;
}

interface ScheduleSummaryStats {
  totalSlots: number;
  booked: number;
  available: number;
  break: number;
}

type DoctorScheduleApiMode = 'TIME_SLOT' | 'FLEXIBLE';

interface DoctorScheduleApiOverview {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  breaksCount: number;
}

interface DoctorScheduleApiSlot {
  slotId: string;
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  slotStatus: 'AVAILABLE' | 'BOOKED' | 'BREAK' | 'BLOCKED' | string;
  type: 'SLOT' | 'BREAK' | 'BLOCKED' | string;
  breakReason: string | null;
  appointmentPublicId: string | null;
  patientName: string | null;
  appointmentStatus: string | null;
  reason: string | null;
}

interface DoctorScheduleApiResponse {
  startDate: string;
  endDate: string;
  selectedDate: string;
  mode: DoctorScheduleApiMode;
  overview: DoctorScheduleApiOverview;
  breaks: any[];
  slots: DoctorScheduleApiSlot[];
  patients: any[];
}

interface ScheduleAvailabilityInfo {
  mode: 'slots' | 'flexible';
  // slots mode
  availableTimes?: string[]; // HH:MM (24h) from timeSlots
  maxPerSlot?: number;
  // flexible mode
  maxPerDay?: number;
  bookedToday?: number;
  remainingToday?: number;
}

interface TimeSlot {
  time: string;
  appointments: Appointment[];
  isAvailable: boolean;
  isBreak: boolean;
  isConflict?: boolean;
  conflictReason?: string;
  slotType?: 'slots' | 'flexible';
  maxCapacity?: number;
  currentCapacity?: number;
}

interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  color: string;
  icon: string;
}

interface AppointmentConflict {
  type: 'overlap' | 'buffer' | 'break' | 'working_hours' | 'capacity_full';
  message: string;
  severity: 'warning' | 'error';
}

interface DoctorInfo {
  doctorId: number;
  doctorName: string;
  specialization: string;
  avatar: string;
  totalAppointments: number;
  completedAppointments: number;
  availableSlots: number;
  workingHours: {
    start: string;
    end: string;
  };
  breakTime: {
    start: string;
    end: string;
  };
  schedulingType: 'slots' | 'flexible';
  maxAppointmentsPerDay?: number;
  slotDuration?: number;
  maxAppointmentsPerSlot?: number;
}

interface DoctorSchedule {
  schedulingType: 'slots' | 'flexible';
  maxAppointmentsPerDay?: number;
  slotDuration?: number;
  maxAppointmentsPerSlot?: number;
  workingHours: {
    start: string;
    end: string;
  };
  breaks: Array<{
    reason: string;
    startTime: string;
    endTime: string;
  }>;
}

@Component({
    selector: 'app-schedule',
    imports: [
        CommonModule,
        MatTabsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatChipsModule,
        MatMenuModule,
        MatTooltipModule,
        MatBadgeModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ReactiveFormsModule,
        FormsModule,
        AppButtonComponent,
        AppInputComponent,
        DividerComponent,
        IconComponent,
        CalendarComponent,
        PageComponent,
        PageBodyDirective,
        AppCardComponent,
        AppCardActionsDirective,
        GridComponent,
        TabsComponent,
        TabComponent,
        EntityToolbarComponent,
        AdminStatsCardComponent,
        NgIf
    ],
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  activeSection: 'schedule' | 'timings' = 'schedule';
  /** Index for core app-tabs: 0 = Schedule, 1 = Timings */
  scheduleTabIndex = 0;
  timingsTab: TimingPriorityTab = 'p4';
  forecastDays = 15;
  /** Number of days from today the doctor has set for scheduling (today + next N-1 days). Patient/doctor can view and book within this window. */
  scheduleWindowDays = 15;
  readonly weekdays: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  timingsMode: TimingsMode = 'view';
  leaveFrom! :FormGroup;
  doctorCode = 'DR1';
  manageLeavesDay: any[] = [];
  // ✅ P4 – Daily Base Availability (singleton)
dailyBaseAvailability: {
  id: string;        // UUID
  startTime: string;
  endTime: string;
  notes?: string;
} | null = null;

  manageWeeklyRoutine:any[]=[];
  selectedTiming: any = null;

  

  /** Priority tooltips: what each level is and overall rule (higher overrides lower) */
  readonly priorityRuleSummary = 'Priority: higher overrides lower (P1 > P2 > P3 > P4).';
  readonly priorityTooltipP1 = 'Leave & absences — blocks availability for the date. Highest priority; overrides all others. ' + this.priorityRuleSummary;
  readonly priorityTooltipP2 = 'Specific date override — custom schedule for a single date. Overrides weekly and daily base. ' + this.priorityRuleSummary;
  readonly priorityTooltipP3 = 'Weekly routine — same schedule for a weekday every week. Overrides daily base. ' + this.priorityRuleSummary;
  readonly priorityTooltipP4 = 'Daily base availability — default schedule when no overrides apply. Lowest priority. ' + this.priorityRuleSummary;

  // Timings (P4 standard / P3 weekly / P2 overrides / P1 leave)
  timingsDaily = {
    start: '',
    end: '',
    slotDuration: 0
  };
  timingsBreaks: TimingBreak[] = [];
  // Weekly rules are meant to be optional (one schedule per weekday).
  // If a rule exists for a weekday, it overrides the daily timing for that weekday.
  timingsWeeklyRules: Record<Weekday, WeeklyRule | null> = {
    Monday: null,
    Tuesday: null,
    Wednesday: null,
    Thursday: null,
    Friday: null,
    Saturday: null,
    Sunday: null
  };
  timingsOverrides: TimingOverride[] = [];
  timingsLeaveDates: string[] = [];
  expandedWeekday: Weekday | null = null;
  overrideDraft: TimingOverride = { date: '', start: '', end: '', breaks: [] };
  isEditingOverride = false;
  selectedWeeklyDay: Weekday = 'Monday';
  selectedOverrideDate: string | null = null;
  thisWeekScheduleCards: ThisWeekScheduleCard[] = [];

  // Timings management (admin) - populated from API only
  manageLeaves: ManageLeaveItem[] = [];
  manageSpecificDays: ManageSpecificDayItem[] = [];
  manageWeeklyRoutines: ManageWeeklyRoutineItem[] = [];
  manageBaseAvailability: ManageBaseAvailabilityItem[] = [];

  // Grid config for Manage section (core app-grid)
  leaveColumns: ColDef[] = [
    { headerName: 'Label', field: 'label', sortable: true, filter: true, flex: 1, minWidth: 140 },
    { headerName: 'Date range', field: 'rangeLabel', sortable: true, filter: true, flex: 1, minWidth: 180 },
    { headerName: 'Duration', field: 'durationLabel', sortable: true, width: 100 }
  ];
  leaveGridOptions: ExtendedGridOptions = {
    rowHeight: 44,
    headerHeight: 36,
    pagination: false,
    suppressCellFocus: true,
    menuActions: [
      { title: 'Edit', icon: 'edit', click: () => {} },
      { title: 'Delete', icon: 'delete', click: () => {} }
    ]
  };

  specificDayColumns: ColDef[] = [
    { headerName: 'Label', field: 'label', sortable: true, filter: true, flex: 1, minWidth: 140 },
    { headerName: 'Date', field: 'dateLabel', sortable: true, width: 100 },
    { headerName: 'Range', field: 'rangeLabel', sortable: true, filter: true, flex: 1, minWidth: 160 }
  ];
  specificDayGridOptions: ExtendedGridOptions = {
    rowHeight: 44,
    headerHeight: 36,
    pagination: false,
    suppressCellFocus: true,
    menuActions: [
      { title: 'Edit', icon: 'edit', click: () => {} },
      { title: 'Delete', icon: 'delete', click: (p: { data?: ManageSpecificDayItem }) => {} }
    ]
  };

  weeklyColumns: ColDef[] = [
    { headerName: 'Label', field: 'label', sortable: true, filter: true, flex: 1, minWidth: 140 },
    { headerName: 'Time', field: 'timeLabel', sortable: true, width: 160 },
    { headerName: 'Days', field: 'days', sortable: true, filter: true, flex: 1, minWidth: 120, valueGetter: (params) => (params.data?.days ?? []).map((d: Weekday) => this.getWeekdayAbbr(d)).join(', ') }
  ];
  weeklyGridOptions: ExtendedGridOptions = {
    rowHeight: 44,
    headerHeight: 36,
    pagination: false,
    suppressCellFocus: true,
    menuActions: [
      { title: 'Edit', icon: 'edit', click: () => {} },
      { title: 'Delete', icon: 'delete', click: () => {} }
    ]
  };

  baseAvailabilityColumns: ColDef[] = [
    { headerName: 'Label', field: 'label', sortable: true, filter: true, flex: 1, minWidth: 140 },
    { headerName: 'Time', field: 'timeLabel', sortable: true, width: 160 },
    { headerName: 'Notes', field: 'note', sortable: true, filter: true, flex: 1, minWidth: 120 }
  ];
  baseAvailabilityGridOptions: ExtendedGridOptions = {
    rowHeight: 44,
    headerHeight: 36,
    pagination: false,
    suppressCellFocus: true,
    menuActions: [
      { title: 'Edit', icon: 'edit', click: (p: { data?: ManageBaseAvailabilityItem }) => this.openDailyBaseDialog(p?.data ?? null) },
      { title: 'Delete', icon: 'delete', click: (p: { data?: ManageBaseAvailabilityItem }) => p?.data && this.onDeleteTiming(p.data) }
    ]
  };

  timingsForecast: ForecastDay[] = [];
  filteredTimingsForecast: ForecastDay[] = [];
  timingsApiLoading = false;
  timingsApiError: string | null = null;
  private timingsLoaded = false;
  private timingsDoctorId: string = 'DR1';

  // View Management
  selectedDate: Date = new Date();
  calendarViews = ['month', 'week', 'day', 'agenda'];

  // Schedule (top bar UI)
  scheduleWeekStrip: ScheduleWeekDay[] = [];
  scheduleSearch = '';
  scheduleSummary: ScheduleSummaryStats = { totalSlots: 0, booked: 0, available: 0, break: 0 };
  scheduleAvailability: ScheduleAvailabilityInfo = { mode: 'slots', availableTimes: [] };
  private scheduleSlots: DoctorScheduleApiSlot[] = [];
  private scheduleSlotByStart: Record<string, DoctorScheduleApiSlot> = {};
  private scheduleSelectedDateIso: string | null = null;
  private scheduleRangeStartIso: string | null = null;
  private scheduleRangeEndIso: string | null = null;

  // Statistics
  scheduleStats: ScheduleStats = {
    todayAppointments: 12,
    pendingApprovals: 3,
    completedToday: 8,
    cancelledToday: 1,
    nextAppointment: '10:30 AM - John Doe',
    availableSlots: 5,
    totalPatients: 45,
    averageWaitTime: 15,
    flexibleAppointmentsRemaining: 8
  };

  // Doctor Information
  doctorInfo: DoctorInfo = {
    doctorId: 0,
    doctorName: '',
    specialization: '',
    avatar: '',
    totalAppointments: 0,
    completedAppointments: 0,
    availableSlots: 0,
    workingHours: {
      start: '',
      end: ''
    },
    breakTime: {
      start: '',
      end: ''
    },
    schedulingType: 'slots',
    slotDuration: 0,
    maxAppointmentsPerSlot: 0
  };

  // Doctor Schedule Configuration
  doctorSchedule: DoctorSchedule = {
    schedulingType: 'slots',
    slotDuration: 0,
    maxAppointmentsPerSlot: 0,
    workingHours: {
      start: '',
      end: ''
    },
    breaks: []
  };
  
  // Time slots for timeline view
  timeSlots: string[] = [];
  
  // Form for filters
  filterForm!: FormGroup;
  
  // UI State
  isLoading = false;
  showFilters = false;
  isDarkMode = false;
  showSettings = false;
  isPatientQueuePaused = false;
  scheduleApiLoading = false;
  scheduleApiError: string | null = null;
  
  // Schedule Settings
  scheduleSettings = {
    bufferTime: 15, // minutes between appointments
    maxAppointmentsPerDay: 20,
    allowOverbooking: false,
    autoConfirmAppointments: true,
    sendReminders: true,
    reminderTime: 24 // hours before appointment
  };
  
  // Schedule Templates
  scheduleTemplates: ScheduleTemplate[] = [
    { id: 'consultation', name: 'Consultation', description: 'Regular patient consultation', duration: 30, color: '#4CAF50', icon: 'today' },
    { id: 'followup', name: 'Follow-up', description: 'Follow-up appointment', duration: 20, color: '#2196F3', icon: 'update' },
    { id: 'emergency', name: 'Emergency', description: 'Emergency consultation', duration: 45, color: '#F44336', icon: 'priority_high' },
    { id: 'surgery', name: 'Surgery', description: 'Surgical procedure', duration: 120, color: '#9C27B0', icon: 'local_hospital' },
    { id: 'admin', name: 'Admin Time', description: 'Administrative work', duration: 60, color: '#FF9800', icon: 'settings' }
  ];
  
  // Schedule appointments (API)
  mockAppointments: Appointment[] = [];

  constructor(
    private readonly dialogService: DialogboxService,
    private readonly fb: FormBuilder,
    private dialog :Dialog,
    private readonly eventService: CoreEventService,
    private readonly router: Router,
    private readonly timingsService: TimingsService,
    private readonly authService: AuthService,
    private readonly appointmentService: AppointmentService,
    private timingManageService :TimingManageService,
  
  ) {
    this.eventService.setBreadcrumb({
      label: 'Schedule',
      icon: 'schedule'
    });
    
    this.initFilterForm();
  }
 createLeaveFrom(){
   this.leaveFrom = this.fb.group({
    specificDate:[null,Validators.required],
    notes:['']
   })
 }





  ngOnInit() {
    this.selectedDate = new Date();

    this.generateTimeSlots();
    this.loadDoctorSchedule();
    this.setupRealTimeUpdates();
    this.loadTimingsFromApi({ fallbackToDemo: false });
    this.loadScheduleFromApi(this.selectedDate);

    this.recomputeScheduleSummary();
    this.recomputeScheduleAvailability();
    this.loadLeaves();
    this.loadSpecificDays();
    this.loadBaseAvailability();
    this.loadWeeklyRoutine();
  
  }
  loadLeaves() {
    this.timingManageService
      .getAllTimings(this.doctorCode)
      .subscribe({
        next: (res: any[]) => {
          // Leave entries filter 
          this.manageLeaves = res.filter(
            t => t.isLeave === true
          );
        },
        error: err => {
          console.error('Load leaves failed', err);
        }
      });
  }
  openLeavePopup() {
    const dialogRef = this.dialog.open(LeaveDialogComponent, {
      width: '420px',
      hasBackdrop: true,
      disableClose: true,
      backdropClass: 'custom-backdrop'
    });
  
    dialogRef.closed.subscribe(result => {
      if (result === true) {
        this.loadLeaves();
      }
    });
  }
  openEditLeave(item: any) {
    const dialogRef = this.dialog.open(LeaveDialogComponent, {
      width: '400px',
      data: item   // 🔥 edit data pass
    });
  
    dialogRef.closed.subscribe(result => {
      if (result) {
        this.loadLeaves();
      }
    });
  }
  
  
  onAddLeave() {
    
      const dialogRef = this.dialog.open(LeaveDialogComponent, {
        width: '450px'
      });
    
      dialogRef.closed.subscribe((result) => {
        if (result === true) {
         
          this.loadLeaves(); // GET APIcall
        }
      });
    
    
  }
 
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  onAddSpecificDay() {
    const ref = this.dialog.open(SpecificdaydialogComponent, {
      width: '520px',
      data: { doctorCode: this.doctorCode }
    });
  
    ref.closed.subscribe(result => {
      if (result === true) {
        this.loadSpecificDays();
      }
    });
  }
  loadSpecificDays() {
    if (!this.doctorCode) {
      console.warn('DoctorCode missing - skipping loadSpecificDays');
      return;
    }
    this.timingManageService.getAllTimings(this.doctorCode).subscribe({
      next: (res: any[]) => {
        console.log("Total",res);
        
        this.manageSpecificDays = res
          .filter(x =>
            x.specificDate &&
            x.isLeave === false &&
            x.isRecurring === false
          )
          .map(x => ({
            label: x.notes || 'Specific Day',
            dateLabel: this.formatDate(x.specificDate),
            rangeLabel: x.startTime && x.endTime
              ? `${x.startTime} - ${x.endTime}`
              : 'Capacity mode (no slots)',
            raw: x
          }));
      },
      error: () => this.manageSpecificDays = []
    });
  }
  // loadDailyBase() {
  //   this.timingManageService.getAllTimings(this.doctorCode).subscribe(res => {
  //     this.manageBaseAvailability = res
  //       .filter((x:any) =>
  //         !x.day &&
  //         !x.specificDate &&
  //         x.isRecurring === false &&
  //         x.isLeave === false
  //       )
  //       .map((x:any) => ({
  //         label: 'Base Availability',
  //         timeLabel: `${x.startTime} – ${x.endTime}`,
  //         note: x.notes,
  //         raw: x   // 🔴 THIS IS MUST
  //       }));
  //   });
  // }
  onEditBaseAvailability(item: any) {
    this.dialog.open(DailyBaseDialogComponent, {
      width: '520px',
      data: {
        doctorCode: this.doctorCode,
        existing: item.raw   // 👈 RAW backend object
      }
    });
  }
  
  
  openDailyBaseDialog(existing ? :any) {
    const ref = this.dialog.open(DailyBaseDialogComponent, {
      width: '480px',
      data: { doctorCode: this.doctorCode ,existing

      }
    });
  
   
    ref.closed.subscribe(result => {
      if (result===true) {
        this.loadBaseAvailability();
      }
    });
  }
  loadBaseAvailability() {
    this.timingManageService.getAllTimings(this.doctorCode).subscribe(res => {
  
      console.log('RAW API DATA 👉', res);
  
      this.manageBaseAvailability = res
        .filter((x: any) =>
          !x.day &&
          !x.specificDate &&
          x.isRecurring === false &&
          x.isLeave === false &&
          x.startTime &&
          x.endTime
        )
        .map((x: any) => ({
          id: x.recordId ?? x.id,   // ✅ NUMERIC ID (e.g. 2)
          label: 'Base Availability',
          timeLabel: `${x.startTime} – ${x.endTime}`,
          note: x.notes,
          raw: x
        }));
    });
  }
  
  loadWeeklyRoutine() {
    this.timingManageService.getAllTimings(this.doctorCode).subscribe({
     
      next: (res: any[]) => {
        console.log('API response',res);
        this.manageWeeklyRoutine = res
          .filter(x => x.day && x.isRecurring === true && x.isLeave === false)
          .map((x:any) => ({
            label: x.notes || 'Weekly Routine',
            dayLabel: x.day.substring(0,3),
            timeLabel: `${x.startTime} - ${x.endTime}`,
            raw: x
          }));
      },
      error: () => this.manageWeeklyRoutine = []
    });
  }
  
  onAddWeeklyRoutine() {
    const ref = this.dialog.open(WeekroutinedialogComponent, {
      width: '520px',
      data: { doctorCode: this.doctorCode }
    });
  
    ref.closed.subscribe(result => {
      if (result === true) {
        // Result is type `true`, so can't access result.startTime etc.
        this.loadBaseAvailability();
        this.loadWeeklyRoutine();
      }
    });
  }
  
  
  
  onDeleteTiming(item: ManageBaseAvailabilityItem) {
    console.log('DELETE CLICK ID 👉', item.id, typeof item.id);
  
    if (item.id === undefined || item.id === null || isNaN(item.id)) {
      console.error('❌ ID INVALID / NaN', item);
      return;
    }
  
    this.timingManageService
      .deleteTiming(this.doctorCode, item.id)
      .subscribe({
        next: () => {
          console.log('✅ Deleted successfully');
          this.loadBaseAvailability(); // refresh list
        },
        error: err => {
          console.error('❌ Delete failed', err);
        }
      });
  }
  
  // onDeleteDailyBase() {
  //   if (!this.dailyBaseAvailability) {
  //     console.warn('No daily base to delete');
  //     return;
  //   }
  
  //   const baseId = this.dailyBaseAvailability.id; // UUID string
  //   console.log('Deleting Daily Base UUID 👉', baseId);
  
  //   this.timingManageService
  //     .deleteDailyBase(this.doctorCode, baseId)
  //     .subscribe({
  //       next: () => {
  //         console.log('✅ Daily Base deleted');
  //         this.dailyBaseAvailability = null;
  //         this.loadTimingsFromApi({ fallbackToDemo: false });
  //       },
  //       error: err => console.error('❌ Daily Base delete failed', err)
  //     });
  // }
  
  

  

  setSection(section: 'schedule' | 'timings'): void {
    this.activeSection = section;
    this.scheduleTabIndex = section === 'schedule' ? 0 : 1;
    if (section === 'timings' && !this.timingsLoaded && !this.timingsApiLoading) {
      this.loadTimingsFromApi({ fallbackToDemo: false });
    }
  }

  onScheduleTabChange(index: number): void {
    this.scheduleTabIndex = index;
    this.activeSection = index === 0 ? 'schedule' : 'timings';
    if (index === 1 && !this.timingsLoaded && !this.timingsApiLoading) {
      this.loadTimingsFromApi({ fallbackToDemo: false });
    }
  }

  setTimingsMode(mode: TimingsMode): void {
    this.timingsMode = mode;
  }

  setTimingsTab(tab: TimingPriorityTab): void {
    this.timingsTab = tab;
    this.filteredTimingsForecast = this.timingsForecast.filter(d => d.priority === this.timingsTab);
    if (tab === 'p3' || tab === 'p2') this.initTimingsSelections();
  }

  private initTimingsSelections(): void {
    // Weekly: default to first weekday that has a rule, otherwise Monday
    const firstWeekly = this.weekdays.find(d => !!this.timingsWeeklyRules[d]) ?? 'Monday';
    this.selectedWeeklyDay = firstWeekly;

    // Overrides: default to first override date (sorted), otherwise null
    this.selectedOverrideDate = this.timingsOverrides[0]?.date ?? null;
  }

  private resolveDoctorIdForTimings(): string {
    return this.authService.getDoctorRegistrationNumber() || 'DR1';
  }

  private resolveDoctorRegistrationNumberForSchedule(): string {
    return this.authService.getDoctorRegistrationNumber() || 'DR1';
  }

  private formatTimeFromIso(dateTime: string | undefined | null): string {
    if (!dateTime) return '';
    const d = new Date(dateTime);
    if (Number.isNaN(d.getTime())) return '';
    // Match formatTimeForDisplay("HH:mm") output (e.g. "9:00 AM")
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  private normalizeDoctorScheduleResponse(resp: any): Appointment[] {
    const raw =
      (Array.isArray(resp) ? resp : null) ||
      (Array.isArray(resp?.data) ? resp.data : null) ||
      (Array.isArray(resp?.appointments) ? resp.appointments : null) ||
      [];

    const nowIso = new Date().toISOString();

    return raw.map((a: any, idx: number) => {
      const dateOnly =
        a?.date ||
        a?.appointmentDate ||
        a?.appointment_date ||
        a?.appointment_day ||
        a?.day ||
        null;
      const timeOnly =
        a?.time ||
        a?.appointmentTime ||
        a?.appointment_time ||
        a?.slotTime ||
        null;
      const combined =
        dateOnly && timeOnly && /^\d{4}-\d{2}-\d{2}$/.test(String(dateOnly))
          ? `${String(dateOnly)}T${String(timeOnly).slice(0, 5)}:00`
          : null;

      const appointmentDateTime =
        combined ||
        a?.appointment_date_time ||
        a?.appointmentDateTime ||
        a?.appointment_dateTime ||
        a?.dateTime ||
        a?.date_time ||
        a?.appointment_date ||
        '';

      const statusRaw = (a?.status || a?.appointmentStatus || '').toString().toUpperCase();
      const status: Appointment['status'] =
        statusRaw === 'SCHEDULED' || statusRaw === 'CANCELED' || statusRaw === 'COMPLETED' || statusRaw === 'PENDING'
          ? statusRaw
          : 'SCHEDULED';

      const patientName =
        a?.patientName ||
        a?.patient_name ||
        a?.patient?.name ||
        a?.patient?.fullName ||
        a?.patientFullName ||
        '';

      const doctorName =
        a?.doctorName ||
        a?.doctor_name ||
        a?.doctor?.name ||
        a?.doctor?.fullName ||
        a?.doctorFullName ||
        '';

      return {
        appointment_id: Number(a?.appointment_id ?? a?.appointmentId ?? a?.id ?? idx + 1),
        patient_id: Number(a?.patient_id ?? a?.patientId ?? a?.patient?.id ?? 0),
        appointment_date_time: String(appointmentDateTime),
        notes: String(a?.notes ?? a?.note ?? ''),
        created_at: String(a?.created_at ?? a?.createdAt ?? nowIso),
        updated_at: String(a?.updated_at ?? a?.updatedAt ?? nowIso),
        doctor_id: Number(a?.doctor_id ?? a?.doctorId ?? a?.doctor?.id ?? 0),
        slot_id: Number(a?.slot_id ?? a?.slotId ?? a?.slot?.id ?? 0),
        status,
        patientName: String(patientName),
        doctorName: String(doctorName),
        slotTime: this.formatTimeFromIso(appointmentDateTime) || (typeof timeOnly === 'string' ? timeOnly : '')
      } as Appointment;
    });
  }

  private toHHmm(time: string | null | undefined): string {
    const t = (time || '').trim();
    if (!t) return '';
    // "09:00:00" -> "09:00"
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t.slice(0, 5);
    if (/^\d{2}:\d{2}$/.test(t)) return t;
    return t.slice(0, 5);
  }

  private normalizeDoctorScheduleSlotsResponse(resp: any): DoctorScheduleApiResponse | null {
    const data = resp?.data && resp?.slots == null ? resp.data : resp;
    if (!data || !Array.isArray(data.slots) || !data.overview) return null;
    return data as DoctorScheduleApiResponse;
  }

  private isBookedLikeSlot(slot: DoctorScheduleApiSlot): boolean {
    const status = String(slot.slotStatus || '').toUpperCase();
    const type = String(slot.type || '').toUpperCase();
    if (type !== 'SLOT') return false;
    if (status === 'AVAILABLE' || status === 'BREAK' || status === 'BLOCKED') return false;
    // Treat any non-available SLOT with a patient/appointment as booked-like (PENDING, BOOKED, CONFIRMED, etc.)
    return !!slot.patientName || !!slot.appointmentPublicId || !!slot.appointmentStatus;
  }

  getAvailableSlotCards(limit = 12): AvailableSlotCard[] {
    const slots = (this.scheduleSlots || [])
      .filter((s) => String(s.type).toUpperCase() === 'SLOT' && String(s.slotStatus).toUpperCase() === 'AVAILABLE')
      .slice(0, Math.max(0, limit));

    return slots
      .map((s) => {
        const start = this.toHHmm(s.startTime);
        const end = this.toHHmm(s.endTime);
        if (!start || !end) return null;
        return {
          slotId: s.slotId,
          start,
          end,
          startLabel: this.formatTimeForDisplay(start),
          endLabel: this.formatTimeForDisplay(end)
        } as AvailableSlotCard;
      })
      .filter(Boolean) as AvailableSlotCard[];
  }

  private loadScheduleFromApi(date: Date): void {
    const doctorRegNo = this.resolveDoctorRegistrationNumberForSchedule();
    const dateKey = this.toIsoDateOnly(date);

    this.scheduleApiLoading = true;
    this.scheduleApiError = null;

    this.appointmentService.getDoctorSchedule(doctorRegNo, dateKey).subscribe({
      next: (resp) => {
        const slotsResp = this.normalizeDoctorScheduleSlotsResponse(resp);
        if (slotsResp) {
          const todayIso = this.toIsoDateOnly(new Date());
          let rangeStartIso = (slotsResp.startDate || todayIso).trim();
          const rangeEndIso = (slotsResp.endDate || '').trim() || null;

          // Don't show past dates in the strip: clamp start to today.
          if (rangeStartIso && rangeStartIso < todayIso) rangeStartIso = todayIso;

          this.scheduleRangeStartIso = rangeStartIso || null;
          this.scheduleRangeEndIso = rangeEndIso;

          // Align UI selected date with backend selectedDate (but never before displayed range start)
          let selectedIso = (slotsResp.selectedDate || dateKey).trim();
          if (this.scheduleRangeStartIso && selectedIso < this.scheduleRangeStartIso) {
            selectedIso = this.scheduleRangeStartIso;
          }
          this.scheduleSelectedDateIso = selectedIso;
          this.selectedDate = this.parseIsoDateOnly(selectedIso);

          // Align "Next N days" window with backend range when present
          if (this.scheduleRangeStartIso && this.scheduleRangeEndIso) {
            const a = this.parseIsoDateOnly(this.scheduleRangeStartIso).getTime();
            const b = this.parseIsoDateOnly(this.scheduleRangeEndIso).getTime();
            const days = Math.floor((b - a) / (24 * 60 * 60 * 1000)) + 1;
            if (Number.isFinite(days) && days > 0) this.scheduleWindowDays = days;
          }

          this.scheduleSlots = slotsResp.slots || [];
          this.scheduleSlotByStart = {};
          for (const s of this.scheduleSlots) {
            const hhmm = this.toHHmm(s.startTime);
            if (hhmm) this.scheduleSlotByStart[hhmm] = s;
          }

          // Drive timeline + suggestions from API slots directly
          this.timeSlots = this.scheduleSlots
            .map((s) => this.toHHmm(s.startTime))
            .filter(Boolean);

          // Summary from API overview
          this.scheduleSummary = {
            totalSlots: Number(slotsResp.overview.totalSlots || 0),
            booked: Number(slotsResp.overview.bookedSlots || 0),
            available: Number(slotsResp.overview.availableSlots || 0),
            break: Number(slotsResp.overview.breaksCount || 0)
          };

          // Availability (slots mode)
          const availableTimes = this.scheduleSlots
            .filter((s) => String(s.slotStatus).toUpperCase() === 'AVAILABLE' && String(s.type).toUpperCase() === 'SLOT')
            .map((s) => this.toHHmm(s.startTime))
            .filter(Boolean);
          this.scheduleAvailability = { mode: 'slots', availableTimes };

          // Derive "Appointments" list from booked-like slots (PENDING/BOOKED/CONFIRMED/etc.)
          const bookedSlots = this.scheduleSlots.filter((s) => this.isBookedLikeSlot(s));
          this.mockAppointments = bookedSlots.map((s, idx) => {
            const start = this.toHHmm(s.startTime);
            const dateIso = this.scheduleSelectedDateIso || dateKey;
            const statusRaw = (s.appointmentStatus || 'SCHEDULED').toString().toUpperCase();
            const status: Appointment['status'] =
              statusRaw === 'SCHEDULED' || statusRaw === 'CANCELED' || statusRaw === 'COMPLETED' || statusRaw === 'PENDING'
                ? statusRaw
                : 'SCHEDULED';
            return {
              appointment_id: idx + 1,
              patient_id: 0,
              appointment_date_time: `${dateIso}T${this.toHHmm(s.startTime)}:00`,
              notes: (s.reason || s.breakReason || '') as string,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              doctor_id: 0,
              slot_id: 0,
              status,
              patientName: s.patientName || '',
              doctorName: doctorRegNo,
              slotTime: start ? this.formatTimeForDisplay(start) : ''
            };
          });

          // Build the day strip from API range
          this.rebuildScheduleWeekStrip();
        } else {
          // Fallback: backend may return plain appointment arrays in other environments
          this.scheduleSlots = [];
          this.scheduleSlotByStart = {};
          this.scheduleSelectedDateIso = null;
          this.scheduleRangeStartIso = null;
          this.scheduleRangeEndIso = null;
          this.mockAppointments = this.normalizeDoctorScheduleResponse(resp);
          this.rebuildScheduleWeekStrip();
        }
      },
      error: (err) => {
        this.mockAppointments = [];
        this.scheduleSlots = [];
        this.scheduleSlotByStart = {};
        this.scheduleSelectedDateIso = null;
        this.scheduleRangeStartIso = null;
        this.scheduleRangeEndIso = null;
        this.scheduleApiError = err?.error?.message || err?.message || 'Failed to load schedule.';
      },
      complete: () => {
        this.scheduleApiLoading = false;
        // Refresh derived UI from latest appointments
        if (!this.scheduleSlots.length) {
          this.recomputeScheduleSummary();
          this.recomputeScheduleAvailability();
        }
        this.loadDoctorSchedule();
      }
    });
  }

  private toIsoDateOnly(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private parseIsoDateOnly(date: string): Date {
    // Avoid timezone shifting by anchoring to local midnight.
    return new Date(`${date}T00:00:00`);
  }

  private loadTimingsFromApi(opts: { fallbackToDemo: boolean }): void {
    const doctorId = this.resolveDoctorIdForTimings();
    this.timingsDoctorId = doctorId;

    const todayKey = this.toIsoDateOnly(new Date());
    const weekStartKey = this.toIsoDateOnly(this.getWeekStartMonday(new Date()));

    this.timingsApiLoading = true;
    this.timingsApiError = null;

    forkJoin({
      raw: this.timingsService.getDoctorTimings(doctorId).pipe(
        catchError((err) => {
          this.timingsApiError =
            err?.error?.message || err?.message || 'Failed to load timings.';
          return of(null as DoctorTimingsResponse | null);
        })
      ),
      forecast: this.timingsService.getForecast(doctorId, todayKey, this.forecastDays).pipe(
        catchError(() => of(null as TimingsForecastDay[] | null))
      ),
      week: this.timingsService.getWeek(doctorId, weekStartKey).pipe(
        catchError(() => of(null as TimingsForecastDay[] | null))
      )
    }).subscribe(({ raw, forecast, week }) => {
      this.timingsApiLoading = false;

      if (!raw) {
        // Do not show any demo data; keep timings empty on error/no-config.
        this.timingsLoaded = false;
        this.timingsForecast = [];
        this.filteredTimingsForecast = [];
        this.thisWeekScheduleCards = [];
        return;
      }

      this.applyRawTimingsToUi(raw);

      if (forecast) this.applyForecastToUi(forecast);
      else {
        this.timingsForecast = [];
        this.filteredTimingsForecast = [];
      }

      if (week) this.applyWeekToUi(week);
      else this.thisWeekScheduleCards = [];

      this.initTimingsSelections();
      this.timingsLoaded = true;
    });
  }

  private applyRawTimingsToUi(raw: DoctorTimingsResponse): void {
    this.scheduleWindowDays = raw.scheduleWindowDays ?? this.scheduleWindowDays;

    // Base (P4)
    const base = raw.base;
    this.timingsDaily.start = base?.startTime || '';
    this.timingsDaily.end = base?.endTime || '';
    this.timingsDaily.slotDuration = typeof base?.slotDurationMinutes === 'number' ? base.slotDurationMinutes : 0;
    this.timingsBreaks = (base?.breaks ?? []).map((b) => ({
      label: (b.label || 'Break').toString(),
      start: b.startTime,
      end: b.endTime
    }));
    this.dailyBaseAvailability = base
    ? {
        id: base.id,               // UUID string
        startTime: base.startTime ?? '',
        endTime: base.endTime ?? '',
        notes: base.notes ?? ''
      }
    : null;
  
  console.log('STATE dailyBaseAvailability 👉', this.dailyBaseAvailability);
    // Weekly (P3) -> per weekday record
    const dayMap: Record<string, Weekday> = {
      MONDAY: 'Monday',
      TUESDAY: 'Tuesday',
      WEDNESDAY: 'Wednesday',
      THURSDAY: 'Thursday',
      FRIDAY: 'Friday',
      SATURDAY: 'Saturday',
      SUNDAY: 'Sunday'
    };
    // reset
    this.timingsWeeklyRules = {
      Monday: null,
      Tuesday: null,
      Wednesday: null,
      Thursday: null,
      Friday: null,
      Saturday: null,
      Sunday: null
    };
    for (const rule of raw.weeklyRules ?? []) {
      const weekdays = rule.weekdays ?? [];
      for (const wd of weekdays) {
        const day = dayMap[wd as string];
        if (!day) continue;
        if (!rule.startTime || !rule.endTime) continue;
        this.timingsWeeklyRules[day] = {
          start: rule.startTime,
          end: rule.endTime,
          breaks: (rule.breaks ?? []).map((b) => ({
            label: (b.label || 'Break').toString(),
            start: b.startTime,
            end: b.endTime
          }))
        };
      }
    }

    // Overrides (P2)
    this.timingsOverrides = (raw.dateOverrides ?? [])
      .filter((o) => !!o.date && !!o.startTime && !!o.endTime)
      .map((o) => ({
        date: o.date as string,
        start: o.startTime as string,
        end: o.endTime as string,
        breaks: (o.breaks ?? []).map((b) => ({
          label: (b.label || 'Break').toString(),
          start: b.startTime,
          end: b.endTime
        }))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Leaves (P1) -> expand to date list (for current view UI)
    const dates: string[] = [];
    const maxExpandDays = 400; // safety cap
    for (const leave of raw.leaves ?? []) {
      if (!leave.startDate || !leave.endDate) continue;
      const start = this.parseIsoDateOnly(leave.startDate);
      const end = this.parseIsoDateOnly(leave.endDate);
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      let expanded = 0;
      while (cursor <= end && expanded < maxExpandDays) {
        dates.push(this.toIsoDateOnly(cursor));
        cursor.setDate(cursor.getDate() + 1);
        expanded++;
      }
    }
    this.timingsLeaveDates = Array.from(new Set(dates)).sort((a, b) => a.localeCompare(b));

    // Apply timings to schedule slot configuration (remove hardcoded schedule grid)
    this.doctorSchedule = {
      schedulingType: (base?.schedulingType as any) || 'slots',
      slotDuration: this.timingsDaily.slotDuration || 0,
      maxAppointmentsPerSlot: typeof base?.maxAppointmentsPerSlot === 'number' ? base.maxAppointmentsPerSlot : 0,
      maxAppointmentsPerDay: typeof base?.maxAppointmentsPerDay === 'number' ? base.maxAppointmentsPerDay : undefined,
      workingHours: {
        start: this.timingsDaily.start || '',
        end: this.timingsDaily.end || ''
      },
      breaks: this.timingsBreaks.map(b => ({
        reason: b.label || 'Break',
        startTime: b.start,
        endTime: b.end
      }))
    };

    this.doctorInfo = {
      ...this.doctorInfo,
      workingHours: { start: this.timingsDaily.start || '', end: this.timingsDaily.end || '' },
      breakTime: {
        start: this.timingsBreaks[0]?.start || '',
        end: this.timingsBreaks[0]?.end || ''
      },
      schedulingType: (base?.schedulingType as any) || 'slots',
      slotDuration: this.timingsDaily.slotDuration || 0,
      maxAppointmentsPerSlot: typeof base?.maxAppointmentsPerSlot === 'number' ? base.maxAppointmentsPerSlot : 0,
      maxAppointmentsPerDay: typeof base?.maxAppointmentsPerDay === 'number' ? base.maxAppointmentsPerDay : undefined
    };

    // regenerate slots grid now that timings loaded
    this.generateTimeSlots();

    // ---- Manage mode lists (API-driven; read-only for now) ----
    const formatDateShort = (iso: string): string => {
      const d = this.parseIsoDateOnly(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
    };
    const formatDateLong = (iso: string): string => {
      const d = this.parseIsoDateOnly(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const diffDaysInclusive = (startIso: string, endIso: string): number => {
      const a = this.parseIsoDateOnly(startIso).getTime();
      const b = this.parseIsoDateOnly(endIso).getTime();
      const days = Math.floor((b - a) / (24 * 60 * 60 * 1000));
      return Math.max(0, days) + 1;
    };
    const dayMapBack: Record<string, Weekday> = {
      MONDAY: 'Monday',
      TUESDAY: 'Tuesday',
      WEDNESDAY: 'Wednesday',
      THURSDAY: 'Thursday',
      FRIDAY: 'Friday',
      SATURDAY: 'Saturday',
      SUNDAY: 'Sunday'
    };

    this.manageLeaves = (raw.leaves ?? [])
      .filter((l) => !!l.startDate && !!l.endDate)
      .map((l) => {
        const startDate = l.startDate as string;
        const endDate = l.endDate as string;
        const days = diffDaysInclusive(startDate, endDate);
        const rangeLabel = startDate === endDate
          ? formatDateLong(startDate)
          : `${formatDateLong(startDate)} – ${formatDateLong(endDate)}`;
        return {
          label: (l.reason || 'Leave').toString(),
          rangeLabel,
          durationLabel: days === 1 ? '1 Day' : `${days} Days`
        } as ManageLeaveItem;
      });

    this.manageSpecificDays = (raw.dateOverrides ?? [])
      .filter((o) => !!o.date)
      .map((o) => {
        const date = o.date as string;
        return {
          label: (o.notes || 'Override').toString(),
          dateLabel: formatDateShort(date),
          rangeLabel: formatDateLong(date)
        } as ManageSpecificDayItem;
      })
      .sort((a, b) => a.rangeLabel.localeCompare(b.rangeLabel));

    this.manageWeeklyRoutines = (raw.weeklyRules ?? [])
      .filter((w) => !!w.startTime && !!w.endTime && (w.weekdays?.length ?? 0) > 0)
      .map((w) => ({
        label: (w.notes || 'Weekly Routine').toString(),
        timeLabel: `${w.startTime} – ${w.endTime}`,
        days: (w.weekdays ?? [])
          .map((d) => dayMapBack[d as unknown as string])
          .filter(Boolean) as Weekday[]
      })) as ManageWeeklyRoutineItem[];

      this.manageBaseAvailability = base
        ? [
            {
              id: Number(base.id), // 👈 Fix: ensure id is a number
              label: 'Base Availability',
              timeLabel: `${base.startTime} – ${base.endTime}`,
              note: base.notes,
              raw: base// 👈 MUST
            } as ManageBaseAvailabilityItem
          ]
        : [];
  }
  private mapPriorityTypeToTab(priorityType: TimingsForecastDay['priorityType']): TimingPriorityTab {
    switch (priorityType) {
      case 'leave':
        return 'p1';
      case 'specific_day':
        return 'p2';
      case 'weekly':
        return 'p3';
      case 'daily':
      default:
        return 'p4';
    }
  }

  private mapPriorityTypeToLabel(priorityType: TimingsForecastDay['priorityType']): string {
    switch (priorityType) {
      case 'leave':
        return 'P1 LEAVE';
      case 'specific_day':
        return 'P2 OVERRIDE';
      case 'weekly':
        return 'P3 WEEKLY';
      case 'daily':
      default:
        return 'P4 STANDARD';
    }
  }

  private applyForecastToUi(forecast: TimingsForecastDay[]): void {
    this.timingsForecast = (forecast ?? []).map((f) => ({
      date: this.parseIsoDateOnly(f.date),
      priority: this.mapPriorityTypeToTab(f.priorityType),
      label: this.mapPriorityTypeToLabel(f.priorityType)
    }));
    this.filteredTimingsForecast = this.timingsForecast.filter((d) => d.priority === this.timingsTab);
  }

  private applyWeekToUi(week: TimingsForecastDay[]): void {
    const dayNames: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    this.thisWeekScheduleCards = (week ?? []).slice(0, 7).map((d, idx) => {
      const date = this.parseIsoDateOnly(d.date);
      const weekday = dayNames[idx] ?? date.toLocaleString(undefined, { weekday: 'long' }) as Weekday;
      const hasSchedule = !!d.hasSchedule;
      return {
        weekday,
        date,
        dateLabel: this.formatMonthDay(date),
        hasSchedule,
        start: d.startTime,
        end: d.endTime,
        patternLabel: this.mapPriorityTypeToLabel(d.priorityType),
        durationMin: d.slotDurationMinutes ?? this.timingsDaily.slotDuration,
        totalSlots: d.slotsSummary?.totalSlots ?? 0,
        isToday: this.isSameDay(date, new Date())
      } as ThisWeekScheduleCard;
    });
  }

  private getWeekStartMonday(base: Date): Date {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    // JS: Sunday=0 ... Saturday=6. Convert so Monday=0 ... Sunday=6.
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d;
  }

  private formatMonthDay(d: Date): string {
    const month = d.toLocaleString(undefined, { month: 'short' });
    return `${month} ${d.getDate()}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  buildThisWeekScheduleCards(): void {
    const today = new Date();
    const weekStart = this.getWeekStartMonday(today);

    const isWorkingDay = (day: Weekday) =>
      day === 'Monday' || day === 'Tuesday' || day === 'Wednesday' || day === 'Thursday' || day === 'Friday';

    const cards: ThisWeekScheduleCard[] = [];
    for (const [i, weekday] of this.weekdays.entries()) {
      const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      const dateKey = date.toISOString().slice(0, 10);

      // Priority selection for actual schedule block (P1 > P2 > P3 > P4)
      const isLeave = this.timingsLeaveDates.includes(dateKey);
      const override = this.timingsOverrides.find(o => o.date === dateKey) ?? null;
      const weekly = this.timingsWeeklyRules[weekday];

      if (isLeave) {
        cards.push({
          weekday,
          date,
          dateLabel: this.formatMonthDay(date),
          hasSchedule: false,
          isToday: this.isSameDay(date, today)
        });
        continue;
      }

      if (override) {
        const ov = this.getOverrideOverview(override);
        cards.push({
          weekday,
          date,
          dateLabel: this.formatMonthDay(date),
          hasSchedule: true,
          start: override.start,
          end: override.end,
          patternLabel: 'Date Override',
          durationMin: this.timingsDaily.slotDuration,
          totalSlots: ov.totalSlots,
          isToday: this.isSameDay(date, today)
        });
        continue;
      }

      if (weekly) {
        const wov = this.getWeeklyOverview(weekday);
        cards.push({
          weekday,
          date,
          dateLabel: this.formatMonthDay(date),
          hasSchedule: true,
          start: weekly.start,
          end: weekly.end,
          patternLabel: 'Weekly Pattern',
          durationMin: this.timingsDaily.slotDuration,
          totalSlots: wov?.totalSlots ?? 0,
          isToday: this.isSameDay(date, today)
        });
        continue;
      }

      if (isWorkingDay(weekday)) {
        const dov = this.getDailyOverview();
        cards.push({
          weekday,
          date,
          dateLabel: this.formatMonthDay(date),
          hasSchedule: true,
          start: this.timingsDaily.start,
          end: this.timingsDaily.end,
          patternLabel: 'Daily Timing',
          durationMin: this.timingsDaily.slotDuration,
          totalSlots: dov.totalSlots,
          isToday: this.isSameDay(date, today)
        });
        continue;
      }

      // Weekend without weekly rule
      cards.push({
        weekday,
        date,
        dateLabel: this.formatMonthDay(date),
        hasSchedule: false,
        isToday: this.isSameDay(date, today)
      });
    }

    this.thisWeekScheduleCards = cards;
  }

  selectWeeklyDay(day: Weekday): void {
    this.selectedWeeklyDay = day;
  }

  selectOverrideDate(date: string): void {
    this.selectedOverrideDate = date;
  }

  getSelectedWeeklyRule(): WeeklyRule | null {
    return this.timingsWeeklyRules[this.selectedWeeklyDay];
  }

  getSelectedOverride(): TimingOverride | null {
    if (!this.selectedOverrideDate) return null;
    return this.timingsOverrides.find(o => o.date === this.selectedOverrideDate) ?? null;
  }

  getWeeklyDaysWithRules(): Weekday[] {
    return this.weekdays.filter(d => !!this.timingsWeeklyRules[d]);
  }

  getWeekdayAbbr(day: Weekday): string {
    switch (day) {
      case 'Monday':
        return 'MON';
      case 'Tuesday':
        return 'TUE';
      case 'Wednesday':
        return 'WED';
      case 'Thursday':
        return 'THU';
      case 'Friday':
        return 'FRI';
      case 'Saturday':
        return 'SAT';
      case 'Sunday':
      default:
        return 'SUN';
    }
  }

  /** Format weekly days array for list display (e.g. "MON, WED, FRI") */
  getWeeklyDaysLabel(days: Weekday[] | undefined): string {
    if (!days?.length) return '—';
    return (days as Weekday[]).map(d => this.getWeekdayAbbr(d)).join(', ');
  }

  onEditLeave(_item: ManageLeaveItem): void {
    this.onAddLeave(); // Open same dialog; can pass _item for edit when backend supports it
  }

  onDeleteLeave(_item: ManageLeaveItem): void {
    // TODO: wire to delete API when available
  }

  onEditSpecificDay(item: ManageSpecificDayItem): void {
    this.onAddSpecificDay(); // TODO: open edit dialog with item.raw when supported
  }

  onDeleteSpecificDay(_item: ManageSpecificDayItem): void {
    // TODO: wire to delete API when available
  }

  onEditWeeklyRoutine(_item: ManageWeeklyRoutineItem): void {
    this.onAddWeeklyRoutine(); // TODO: open edit dialog with item when supported
  }

  onDeleteWeeklyRoutine(_item: ManageWeeklyRoutineItem): void {
    // TODO: wire to delete API when available
  }

  // ---- Manage UI actions (mock) ----
  addManageItem(scope: 'p1' | 'p2' | 'p3' | 'p4'): void {

    if (scope === 'p1') {
      this.openLeavePopup();
    }
  
    if (scope === 'p2') {
      this.onAddSpecificDay();
    }
  
    if (scope === 'p3') {
      this.onAddWeeklyRoutine();
    }
  
    if (scope === 'p4') {
      this.openDailyBaseDialog(); // 👈 फक्त dialog उघड
    }
  }

  openAvailabilitySetupWizard(): void {
    const doctorId = this.resolveDoctorIdForTimings();
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'back', text: 'Back', color: 'secondary', appearance: 'stroked' },
      { id: 'apply', text: 'Next', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(AvailabilitySetupDialogComponent, {
      title: 'Availability Setup',
      hideHeader: false,
      width: '980px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      footerActions,
      data: { doctorId }
    });

    ref.afterClosed().subscribe((result) => {
      if (result === true) {
        this.loadTimingsFromApi({ fallbackToDemo: false });
      }
    });
  }
  
  // addManageItem(scope: 'p1' | 'p2' | 'p3' | 'p4'): void {
  //   // Hook this to dialogs / backend later
  //   if (scope === 'p1') this.manageLeaves = [...this.manageLeaves, { label: 'New Leave', rangeLabel: 'Dec 22 – Dec 22, 2024', durationLabel: '1 Day' }];
  //   if (scope === 'p2') this.manageSpecificDays = [...this.manageSpecificDays, { label: 'New Override', dateLabel: 'Dec 26', rangeLabel: 'Dec 26, 2024' }];
  //   if (scope === 'p3') this.manageWeeklyRoutines = [...this.manageWeeklyRoutines, { label: 'New Weekly Routine', timeLabel: '09:00 AM – 10:00 AM', days: ['Tuesday'] }];
  //   if (scope === 'p4') this.manageBaseAvailability = [...this.manageBaseAvailability, { label: 'New Base Availability', timeLabel: '10:00 AM – 11:00 AM' ,raw : 'x'}];
  // }

  deleteManageItem(scope: 'p1' | 'p2' | 'p3' | 'p4', index: number): void {
    if (scope === 'p1') this.manageLeaves = this.manageLeaves.filter((_, i) => i !== index);
    if (scope === 'p2') this.manageSpecificDays = this.manageSpecificDays.filter((_, i) => i !== index);
    if (scope === 'p3') this.manageWeeklyRoutines = this.manageWeeklyRoutines.filter((_, i) => i !== index);
    if (scope === 'p4') this.manageBaseAvailability = this.manageBaseAvailability.filter((_, i) => i !== index);
  }

  // ----- P3 Weekly Rules -----
  toggleWeeklyRuleExpanded(day: Weekday): void {
    this.expandedWeekday = this.expandedWeekday === day ? null : day;
  }

  enableWeeklyRule(day: Weekday): void {
    if (this.timingsWeeklyRules[day]) return;
    this.timingsWeeklyRules[day] = { start: '10:00', end: '12:00', breaks: [] };
    this.recomputeTimingsForecast();
  }

  removeWeeklyRule(day: Weekday): void {
    this.timingsWeeklyRules[day] = null;
    if (this.expandedWeekday === day) this.expandedWeekday = null;
    this.recomputeTimingsForecast();
  }

  addWeeklyBreak(day: Weekday): void {
    const rule = this.timingsWeeklyRules[day];
    if (!rule) return;
    rule.breaks.push({ label: 'Break', start: '12:00', end: '12:15' });
    this.recomputeTimingsForecast();
  }

  removeWeeklyBreak(day: Weekday, idx: number): void {
    const rule = this.timingsWeeklyRules[day];
    if (!rule) return;
    rule.breaks.splice(idx, 1);
    this.recomputeTimingsForecast();
  }

  // ----- P2 Date Overrides -----
  startNewOverride(): void {
    this.isEditingOverride = false;
    this.overrideDraft = { date: '', start: '14:00', end: '19:00', breaks: [] };
  }

  editOverride(ov: TimingOverride): void {
    this.isEditingOverride = true;
    this.overrideDraft = {
      date: ov.date,
      start: ov.start,
      end: ov.end,
      breaks: ov.breaks.map(b => ({ ...b }))
    };
  }

  saveOverride(): void {
    const date = (this.overrideDraft.date || '').trim();
    if (!date) return;

    // Enforce one override per date: update existing if present, otherwise insert.
    const idx = this.timingsOverrides.findIndex(o => o.date === date);
    const next: TimingOverride = {
      date,
      start: this.overrideDraft.start,
      end: this.overrideDraft.end,
      breaks: this.overrideDraft.breaks.map(b => ({ ...b }))
    };
    if (idx >= 0) this.timingsOverrides[idx] = next;
    else this.timingsOverrides = [next, ...this.timingsOverrides].sort((a, b) => a.date.localeCompare(b.date));

    this.startNewOverride();
    this.recomputeTimingsForecast();
  }

  deleteOverride(date: string): void {
    this.timingsOverrides = this.timingsOverrides.filter(o => o.date !== date);
    if (this.overrideDraft.date === date) this.startNewOverride();
    this.recomputeTimingsForecast();
  }

  addOverrideBreak(): void {
    this.overrideDraft.breaks.push({ label: 'Break', start: '16:00', end: '16:15' });
  }

  removeOverrideBreak(idx: number): void {
    this.overrideDraft.breaks.splice(idx, 1);
  }

  // ----- P1 Leave Management -----
  addLeaveDate(date: string): void {
    const key = (date || '').trim();
    if (!key) return;
    if (this.timingsLeaveDates.includes(key)) return;
    this.timingsLeaveDates = [...this.timingsLeaveDates, key].sort((a, b) => a.localeCompare(b));
    this.recomputeTimingsForecast();
  }

  removeLeaveDate(date: string): void {
    this.timingsLeaveDates = this.timingsLeaveDates.filter(d => d !== date);
    this.recomputeTimingsForecast();
  }

  recomputeTimingsForecast(): void {
    const today = new Date();
    const days: ForecastDay[] = [];
    for (let i = 0; i < this.forecastDays; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const weekday = d.toLocaleString(undefined, { weekday: 'long' });
      let priority: TimingPriorityTab = 'p4';
      let label = 'P4 STANDARD';

      if (this.timingsLeaveDates.includes(key)) {
        priority = 'p1';
        label = 'P1 LEAVE';
      } else if (this.timingsOverrides.some(o => o.date === key)) {
        priority = 'p2';
        label = 'P2 OVERRIDE';
      } else if (this.timingsWeeklyRules[weekday as Weekday]) {
        priority = 'p3';
        label = 'P3 WEEKLY';
      }

      days.push({ date: d, priority, label });
    }
    this.timingsForecast = days;
    this.filteredTimingsForecast = this.timingsForecast.filter(d => d.priority === this.timingsTab);
    this.buildThisWeekScheduleCards();
  }

  getAppliedDaysCount(priority: TimingPriorityTab): number {
    return this.timingsForecast.filter(d => d.priority === priority).length;
  }

  getPriorityCode(priority: TimingPriorityTab): string {
    switch (priority) {
      case 'p1':
        return 'P1';
      case 'p2':
        return 'P2';
      case 'p3':
        return 'P3';
      case 'p4':
      default:
        return 'P4';
    }
  }

  getSelectedPriorityAppliedText(): string {
    const count = this.filteredTimingsForecast.length;
    const code = this.getPriorityCode(this.timingsTab);
    const dayLabel = count === 1 ? 'day' : 'days';
    return `${code} is applied for next ${count} ${dayLabel}`;
  }

  getForecastDateParts(d: Date): { month: string; day: string; weekday: string } {
    const month = d.toLocaleString(undefined, { month: 'short' });
    const day = d.getDate().toString();
    const weekday = d.toLocaleString(undefined, { weekday: 'long' });
    return { month, day, weekday };
  }

  private toMinutes(t: string): number {
    const parts = (t || '').split(':');
    const hh = Number.parseInt(parts[0] || '0', 10);
    const mm = Number.parseInt(parts[1] || '0', 10);
    return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
  }

  private minutesToTime(totalMinutes: number): string {
    const safe = Math.max(0, Math.floor(totalMinutes));
    const hh = Math.floor(safe / 60).toString().padStart(2, '0');
    const mm = (safe % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private computeTimingOverview(start: string, end: string, breaks: TimingBreak[]): { totalSlots: number; first: string; last: string } {
    // Simple calc for demo: duration / slotDuration (ignores breaks overlap edge-cases)
    const startMin = this.toMinutes(start);
    const endMin = this.toMinutes(end);
    const breakMinutes = (breaks || []).reduce(
      (sum, b) => sum + Math.max(0, this.toMinutes(b.end) - this.toMinutes(b.start)),
      0
    );
    const totalMinutes = Math.max(0, endMin - startMin - breakMinutes);
    const slot = this.timingsDaily.slotDuration;
    const totalSlots = slot > 0 ? Math.floor(totalMinutes / slot) : 0;
    const first = start;
    const lastMin = startMin + Math.max(0, (totalSlots - 1) * slot);
    const last = this.minutesToTime(lastMin);
    return { totalSlots, first, last };
  }

  getDailyOverview(): { totalSlots: number; first: string; last: string } {
    return this.computeTimingOverview(this.timingsDaily.start, this.timingsDaily.end, this.timingsBreaks);
  }

  getWeeklyOverview(day: Weekday): { totalSlots: number; first: string; last: string } | null {
    const rule = this.timingsWeeklyRules[day];
    if (!rule) return null;
    return this.computeTimingOverview(rule.start, rule.end, rule.breaks);
  }

  getOverrideOverview(o: TimingOverride): { totalSlots: number; first: string; last: string } {
    return this.computeTimingOverview(o.start, o.end, o.breaks);
  }

  private initFilterForm() {
    this.filterForm = this.fb.group({
      dateRange: [null],
      doctors: [[]],
      patients: [[]],
      status: ['all'],
      rooms: [[]],
      searchTerm: ['']
    });
  }

  private generateTimeSlots() {
    // Generate time slots from configured working hours (API-driven via timings).
    this.timeSlots = [];
    const start = this.doctorSchedule?.workingHours?.start || '';
    const end = this.doctorSchedule?.workingHours?.end || '';
    const step = this.doctorSchedule?.slotDuration || 0;
    if (!start || !end || step <= 0) return;

    const startMin = this.timeToMinutes(start);
    const endMin = this.timeToMinutes(end);
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) return;

    for (let m = startMin; m < endMin; m += step) {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      this.timeSlots.push(`${hh}:${mm}`);
    }
  }

  private loadDoctorSchedule() {
    // Update doctor info with current data
    this.doctorInfo.totalAppointments = this.mockAppointments.length;
    this.doctorInfo.completedAppointments = this.mockAppointments.filter(apt => apt.status === 'COMPLETED').length;
    
    if (this.doctorSchedule.schedulingType === 'slots') {
      this.doctorInfo.availableSlots = this.calculateAvailableSlots();
    } else {
      this.doctorInfo.availableSlots = this.calculateFlexibleAvailability();
    }
    
    // Update flexible appointments remaining
    if (this.doctorSchedule.schedulingType === 'flexible') {
      this.scheduleStats.flexibleAppointmentsRemaining = this.calculateFlexibleAppointmentsRemaining();
    }
  }

  private calculateAvailableSlots(): number {
    const workingMinutes = this.getWorkingMinutes();
    const breakMinutes = this.getBreakMinutes();
    const availableMinutes = workingMinutes - breakMinutes;
    const slotDuration = this.doctorSchedule.slotDuration || 30;
    
    return Math.floor(availableMinutes / slotDuration);
  }

  private calculateFlexibleAvailability(): number {
    const maxPerDay = this.doctorSchedule.maxAppointmentsPerDay || 20;
    const todayAppointments = this.getDoctorAppointmentsForSelectedDate().filter(apt => apt.status !== 'CANCELED').length;
    
    return Math.max(0, maxPerDay - todayAppointments);
  }

  private calculateFlexibleAppointmentsRemaining(): number {
    const maxPerDay = this.doctorSchedule.maxAppointmentsPerDay || 20;
    const todayAppointments = this.getDoctorAppointmentsForSelectedDate().filter(apt => apt.status !== 'CANCELED').length;
    
    return Math.max(0, maxPerDay - todayAppointments);
  }

  private getWorkingMinutes(): number {
    const startHour = parseInt(this.doctorSchedule.workingHours.start.split(':')[0]);
    const startMinute = parseInt(this.doctorSchedule.workingHours.start.split(':')[1]);
    const endHour = parseInt(this.doctorSchedule.workingHours.end.split(':')[0]);
    const endMinute = parseInt(this.doctorSchedule.workingHours.end.split(':')[1]);
    
    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  }

  private getBreakMinutes(): number {
    let totalBreakMinutes = 0;
    this.doctorSchedule.breaks.forEach(breakItem => {
      const startHour = parseInt(breakItem.startTime.split(':')[0]);
      const startMinute = parseInt(breakItem.startTime.split(':')[1]);
      const endHour = parseInt(breakItem.endTime.split(':')[0]);
      const endMinute = parseInt(breakItem.endTime.split(':')[1]);
      
      totalBreakMinutes += (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    });
    
    return totalBreakMinutes;
  }

  private generateTimeSlotsForDoctor(): TimeSlot[] {
    const todaysAppointments = this.getDoctorAppointmentsForSelectedDate();
    return this.timeSlots.map(time => {
      const appointmentsInSlot = todaysAppointments.filter(apt => apt.slotTime === this.formatTimeForDisplay(time));
      
      const conflicts = this.checkConflicts(time);
      const slotInfo = this.getSlotInfo(time);
      
      return {
        time,
        appointments: appointmentsInSlot,
        isAvailable: conflicts.length === 0 && slotInfo.isAvailable,
        isBreak: this.isBreakTime(time),
        isConflict: conflicts.length > 0,
        conflictReason: conflicts.length > 0 ? conflicts[0].message : undefined,
        slotType: this.doctorSchedule.schedulingType,
        maxCapacity: slotInfo.maxCapacity,
        currentCapacity: slotInfo.currentCapacity
      };
    });
  }

  private getSlotInfo(time: string): { isAvailable: boolean; maxCapacity?: number; currentCapacity?: number } {
    if (this.doctorSchedule.schedulingType === 'slots') {
      // For slot-based scheduling, check if time falls within a valid slot
      const slotDuration = this.doctorSchedule.slotDuration || 30;
      const timeMinutes = this.timeToMinutes(time);
      const startMinutes = this.timeToMinutes(this.doctorSchedule.workingHours.start);
      const endMinutes = this.timeToMinutes(this.doctorSchedule.workingHours.end);
      
      // Check if time is within working hours and not during breaks
      if (timeMinutes >= startMinutes && timeMinutes < endMinutes && !this.isBreakTime(time)) {
        const appointmentsInSlot = this.getDoctorAppointmentsForSelectedDate().filter(apt => apt.slotTime === this.formatTimeForDisplay(time)).length;
        
        const maxPerSlot = this.doctorSchedule.maxAppointmentsPerSlot || 1;
        
        return {
          isAvailable: appointmentsInSlot < maxPerSlot,
          maxCapacity: maxPerSlot,
          currentCapacity: appointmentsInSlot
        };
      }
      
      return { isAvailable: false };
    } else {
      // For flexible scheduling, check if we haven't reached daily limit
      const todayAppointments = this.getDoctorAppointmentsForSelectedDate().filter(apt => apt.status !== 'CANCELED').length;
      
      const maxPerDay = this.doctorSchedule.maxAppointmentsPerDay || 20;
      
      return {
        isAvailable: todayAppointments < maxPerDay,
        maxCapacity: maxPerDay,
        currentCapacity: todayAppointments
      };
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  }

  private checkConflicts(time: string): AppointmentConflict[] {
    const conflicts: AppointmentConflict[] = [];
    
    // Check if time is within working hours
    const timeHour = parseInt(time.split(':')[0]);
    const startHour = parseInt((this.doctorSchedule.workingHours.start || '0:0').split(':')[0]);
    const endHour = parseInt((this.doctorSchedule.workingHours.end || '0:0').split(':')[0]);
    
    if (timeHour < startHour || timeHour >= endHour) {
      conflicts.push({
        type: 'working_hours',
        message: 'Outside working hours',
        severity: 'error'
      });
    }
    
    // Check for overlapping appointments
    const existingAppointment = this.getDoctorAppointmentsForSelectedDate().find(apt => apt.slotTime === this.formatTimeForDisplay(time));
    
    if (existingAppointment) {
      conflicts.push({
        type: 'overlap',
        message: `Conflicts with ${existingAppointment.patientName}`,
        severity: 'error'
      });
    }
    
    // Check capacity limits
    const slotInfo = this.getSlotInfo(time);
    if (!slotInfo.isAvailable && slotInfo.currentCapacity && slotInfo.maxCapacity) {
      conflicts.push({
        type: 'capacity_full',
        message: `Slot at capacity (${slotInfo.currentCapacity}/${slotInfo.maxCapacity})`,
        severity: 'error'
      });
    }
    
    // Check buffer time conflicts
    const bufferTime = 15; // 15 minutes buffer
    const timeMinutes = parseInt(time.split(':')[1]);
    const timeTotalMinutes = timeHour * 60 + timeMinutes;
    
    for (const apt of this.getDoctorAppointmentsForSelectedDate()) {
      const aptTime = this.parseTimeToMinutes(apt.slotTime || '');
      const timeDiff = Math.abs(timeTotalMinutes - aptTime);
      if (timeDiff < bufferTime && timeDiff > 0) {
        conflicts.push({
          type: 'buffer',
          message: `Too close to ${apt.patientName}'s appointment`,
          severity: 'warning'
        });
      }
    }
    
    return conflicts;
  }

  private parseTimeToMinutes(timeString: string): number {
    const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const period = match[3];
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return hour * 60 + minute;
    }
    return 0;
  }

  formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  private isBreakTime(time: string): boolean {
    return this.doctorSchedule.breaks.some(breakItem => 
      time >= breakItem.startTime && time < breakItem.endTime
    );
  }

  private setupRealTimeUpdates() {
    // Intentionally left blank (no mock realtime updates).
  }

  private updateScheduleStats() {
    // No-op (stats should come from API data).
  }

  onDateChange(date: Date) {
    this.selectedDate = date;
    this.loadScheduleFromApi(date);
    this.loadDoctorSchedule(); // Reload derived data for new date
    this.rebuildScheduleWeekStrip();
    this.recomputeScheduleSummary();
    this.recomputeScheduleAvailability();
  }

  selectScheduleDate(date: Date): void {
    this.onDateChange(date);
  }

  /** Whether the given date is today (for week strip "Today" label and styling). */
  isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  getScheduleListAppointments(): Appointment[] {
    const q = this.scheduleSearch.trim().toLowerCase();
    const list = (this.mockAppointments || []).filter(a => {
      if (!q) return true;
      return (a.patientName ?? '').toLowerCase().includes(q);
    });

    return list.sort((a, b) => this.parseTimeToMinutes(a.slotTime ?? '') - this.parseTimeToMinutes(b.slotTime ?? ''));
  }

  getAvailabilityTimeChips(limit = 10): string[] {
    if (this.scheduleAvailability.mode !== 'slots') return [];
    const times = this.scheduleAvailability.availableTimes ?? [];
    return times.slice(0, limit);
  }

  getAvailabilityExtraCount(limit = 10): number {
    if (this.scheduleAvailability.mode !== 'slots') return 0;
    const total = (this.scheduleAvailability.availableTimes ?? []).length;
    return Math.max(0, total - limit);
  }

  openQuickAddAt(time24h: string): void {
    this.startQuickAddFlow(time24h);
  }

  openNextAvailableSlot(): void {
    const next = this.getSuggestedTimes()[0];
    if (next) this.startQuickAddFlow(next);
  }

  /** Builds the schedule strip from schedule API range when available (fallback: today + next N days). */
  private rebuildScheduleWeekStrip(): void {
    const fallbackStart = new Date();
    fallbackStart.setHours(0, 0, 0, 0);

    const rangeStart = this.scheduleRangeStartIso ? this.parseIsoDateOnly(this.scheduleRangeStartIso) : fallbackStart;
    const rangeEnd = this.scheduleRangeEndIso ? this.parseIsoDateOnly(this.scheduleRangeEndIso) : null;

    let daysToShow = this.scheduleWindowDays;
    if (rangeEnd) {
      const a = rangeStart.getTime();
      const b = rangeEnd.getTime();
      const diff = Math.floor((b - a) / (24 * 60 * 60 * 1000)) + 1;
      if (Number.isFinite(diff) && diff > 0) daysToShow = diff;
    }

    const selectedKey = this.selectedDate.toDateString();
    const strip: ScheduleWeekDay[] = [];

    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i);
      const weekdayShort = d.toLocaleString(undefined, { weekday: 'short' });
      const monthShort = d.toLocaleString(undefined, { month: 'short' });
      strip.push({
        date: d,
        weekdayShort,
        dayNumber: d.getDate(),
        monthShort,
        isSelected: d.toDateString() === selectedKey
      });
    }
    this.scheduleWeekStrip = strip;
  }

  private recomputeScheduleSummary(): void {
    // When schedule API provides overview, trust it.
    if (this.scheduleSlots.length) return;

    const slots = this.timeSlots;
    let totalSlots = 0;
    let booked = 0;
    let available = 0;
    let breakCount = 0;

    for (const t of slots) {
      const s = this.getTimeSlotForDoctor(t);
      totalSlots += 1;
      if (s.isBreak) {
        breakCount += 1;
        continue;
      }
      // For slot-based mode, "available" means the slot still has remaining capacity,
      // even if it already has some appointments.
      if (s.isAvailable) {
        available += 1;
        continue;
      }
      if ((s.appointments?.length ?? 0) > 0) booked += 1;
    }

    this.scheduleSummary = { totalSlots, booked, available, break: breakCount };
  }

  /** Blocked slot count (slots not available, booked, or break). */
  getBlockedCount(): number {
    const s = this.scheduleSummary;
    return Math.max(0, s.totalSlots - s.booked - s.available - s.break);
  }

  /** Overview stats for core admin-stats-card (same pattern as doctor dashboard). */
  get overviewStatsCards(): StatCard[] {
    const s = this.scheduleSummary;
    const fmt = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return [
      { label: 'Total Slots', value: s.totalSlots, icon: 'grid_view', type: 'info' },
      { label: 'Booked', value: fmt(s.booked), icon: 'event', type: 'success' },
      { label: 'Available', value: fmt(s.available), icon: 'event_available', type: 'info' },
      { label: 'Break', value: fmt(s.break), icon: 'free_breakfast', type: 'warning' }
    ];
  }

  private recomputeScheduleAvailability(): void {
    // When schedule API provides availability list, trust it.
    if (this.scheduleSlots.length) return;

    if (this.isSlotBasedScheduling()) {
      const times = this.timeSlots.filter(t => {
        const s = this.getTimeSlotForDoctor(t);
        return s.isAvailable && !s.isBreak;
      });

      this.scheduleAvailability = {
        mode: 'slots',
        availableTimes: times,
        maxPerSlot: this.doctorSchedule.maxAppointmentsPerSlot || 1
      };
      return;
    }

    const maxPerDay = this.doctorSchedule.maxAppointmentsPerDay || 20;
    const bookedToday = this.getDoctorAppointmentsForSelectedDate().filter(a => a.status !== 'CANCELED').length;
    const remainingToday = Math.max(0, maxPerDay - bookedToday);

    this.scheduleAvailability = {
      mode: 'flexible',
      maxPerDay,
      bookedToday,
      remainingToday
    };
  }

  private getDoctorAppointmentsForSelectedDate(): Appointment[] {
    // API already returns doctor-specific schedule; and we call it with ?date=YYYY-MM-DD.
    // Keep it simple: use current loaded list.
    return this.mockAppointments || [];
  }

  // Navigation
  goToPreviousDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    this.onDateChange(newDate);
  }

  goToNextDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    this.onDateChange(newDate);
  }

  goToToday() {
    this.onDateChange(new Date());
  }

  // Actions
  createAppointment() {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'submit',
        text: 'Create Appointment',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(AppointmentCreateComponent, {
      title: 'Create Appointment',
      data: { 
        mode: 'create',
        schedulingType: this.doctorSchedule.schedulingType,
        availableSlots: this.doctorInfo.availableSlots
      },
      width: '60%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      // If result has form data (not just action), it means form was submitted successfully
      if (result && (result.patient_id || result.appointment_date_time || (!result.action && result !== null))) {
        // Handle new appointment creation
        this.loadDoctorSchedule();
      }
    });
  }

  viewAppointment(appointment: Appointment) {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'reschedule',
        text: 'Reschedule',
        color: 'primary',
        appearance: 'stroked'
      },
      {
        id: 'viewProfile',
        text: 'View Profile',
        color: 'primary',
        appearance: 'flat',
        fontIcon: 'person'
      },
      {
        id: 'cancelAppointment',
        text: 'Cancel Appointment',
        color: 'warn',
        appearance: 'stroked'
      },
      {
        id: 'close',
        text: 'Close',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(AppointmentViewComponent, {
      title: 'View Appointment',
      data: { appointment },
      width: '50%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'reschedule') {
        this.editAppointment(appointment);
      } else if (result?.action === 'viewProfile') {
        // Navigate to patient profile
        if (appointment.patient_id) {
          this.router.navigate(['/patient', appointment.patient_id], {
            queryParams: {
              patientId: appointment.patient_id,
              patientName: appointment.patientName || 'Patient'
            }
          });
        }
      } else if (result?.action === 'cancelAppointment') {
        // Handle cancel appointment
        this.loadDoctorSchedule();
      }
    });
  }

  editAppointment(appointment: Appointment) {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      },
      {
        id: 'submit',
        text: 'Update Appointment',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(AppointmentCreateComponent, {
      title: 'Edit Appointment',
      data: { mode: 'edit', appointment },
      width: '60%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      // If result has form data (not just action), it means form was submitted successfully
      if (result && (result.patient_id || result.appointment_date_time || (!result.action && result !== null))) {
        // Handle appointment update
        this.loadDoctorSchedule();
      }
    });
  }

  deleteAppointment(appointment: Appointment) {
    if (confirm(`Are you sure you want to delete appointment for ${appointment.patientName}?`)) {
      // Handle deletion
      this.loadDoctorSchedule();
    }
  }

  viewNextAppointment() {
    // Find the next appointment from the schedule
    const nextAppointment = this.mockAppointments.find(apt => 
      apt.status === 'SCHEDULED' && 
      new Date(apt.appointment_date_time) > new Date()
    );
    
    if (nextAppointment) {
      this.viewAppointment(nextAppointment);
    }
  }

  callPatient() {
    // Find the next appointment to get patient phone
    const nextAppointment = this.mockAppointments.find(apt => 
      apt.status === 'SCHEDULED' && 
      new Date(apt.appointment_date_time) > new Date()
    );
    
    if (nextAppointment) {
      // In a real app, this would initiate a call
      // For now, we'll just show an alert
      alert(`Calling patient: ${nextAppointment.patientName}`);
    }
  }

  togglePatientQueue() {
    this.isPatientQueuePaused = !this.isPatientQueuePaused;
    
    if (this.isPatientQueuePaused) {
      // Show pause notification
      console.log('Patient queue paused - no new patients will be called');
      // In a real app, you might want to show a toast notification
    } else {
      // Show resume notification
      console.log('Patient queue resumed - new patients can be called');
      // In a real app, you might want to show a toast notification
    }
  }

  // UI Helpers
  getStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'var(--primary-color)';
      case 'COMPLETED': return 'var(--status-success-color)';
      case 'PENDING': return 'var(--status-warn-color)';
      case 'CANCELED': return 'var(--status-danger-color)';
      default: return 'var(--status-neutral-color)';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'schedule';
      case 'COMPLETED': return 'check_circle';
      case 'PENDING': return 'pending';
      case 'CANCELED': return 'cancel';
      default: return 'help';
    }
  }

  getProgressPercentage(completed: number, total: number): number {
    return total > 0 ? (completed / total) * 100 : 0;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  resetFilters() {
    this.filterForm.reset({
      dateRange: null,
      status: 'all',
      searchTerm: ''
    });
    
    // Restore original appointments if they were saved
    if (this.originalAppointments.length > 0) {
      this.mockAppointments = [...this.originalAppointments];
      this.loadDoctorSchedule();
    }
    
    this.showFilters = false;
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    // Store a copy of original appointments if not already stored
    if (!this.originalAppointments) {
      this.originalAppointments = [...this.mockAppointments];
    }
    
    // Start with all appointments
    let filteredAppointments = [...this.originalAppointments];

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Filter by search term
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredAppointments = filteredAppointments.filter(apt =>
        apt.patientName?.toLowerCase().includes(searchTerm) ||
        apt.doctorName?.toLowerCase().includes(searchTerm) ||
        apt.notes?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by date range
    if (filters.dateRange) {
      const selectedDate = new Date(filters.dateRange);
      filteredAppointments = filteredAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date_time);
        return aptDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Update the display with filtered results
    this.mockAppointments = filteredAppointments;
    
    // Reload the schedule to reflect filtered data
    this.loadDoctorSchedule();
    
    // Close the filter dialog
    this.showFilters = false;
  }
  
  private originalAppointments: Appointment[] = [];

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  // Export functions
  exportSchedule() {
    // Implement export functionality
    console.log('Exporting schedule...');
  }

  printSchedule() {
    window.print();
  }

  // Quick actions
  refreshSchedule() {
    this.isLoading = true;
    setTimeout(() => {
      this.loadDoctorSchedule();
      this.isLoading = false;
    }, 1000);
  }

  // Context menu actions
  onAppointmentRightClick(event: MouseEvent, appointment: Appointment) {
    event.preventDefault();
    // Implement context menu
  }

  // Drag and drop handlers
  onAppointmentDragStart(event: DragEvent, appointment: Appointment) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', appointment.appointment_id.toString());
    }
  }

  onTimeSlotDrop(event: DragEvent, timeSlot: TimeSlot) {
    event.preventDefault();
    // Handle appointment drop
  }

  onTimeSlotDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Helper methods for template
  getTimeSlotForDoctor(time: string): TimeSlot {
    const apiSlot = this.scheduleSlotByStart[time];
    if (apiSlot) {
      const isBreak = String(apiSlot.type).toUpperCase() === 'BREAK' || String(apiSlot.slotStatus).toUpperCase() === 'BREAK';
      const isAvailable = String(apiSlot.slotStatus).toUpperCase() === 'AVAILABLE' && !isBreak;
      const isBooked = this.isBookedLikeSlot(apiSlot);
      return {
        time,
        appointments: isBooked && apiSlot.patientName
          ? ([
              {
                appointment_id: 1,
                patient_id: 0,
                appointment_date_time: `${this.scheduleSelectedDateIso || this.toIsoDateOnly(this.selectedDate)}T${time}:00`,
                notes: (apiSlot.reason || '') as string,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                doctor_id: 0,
                slot_id: 0,
                status: ((apiSlot.appointmentStatus || 'SCHEDULED') as any),
                patientName: apiSlot.patientName,
                doctorName: this.resolveDoctorRegistrationNumberForSchedule(),
                slotTime: this.formatTimeForDisplay(time)
              } as Appointment
            ] as Appointment[])
          : [],
        isAvailable,
        isBreak,
        isConflict: false,
        slotType: 'slots',
        maxCapacity: 1,
        currentCapacity: isBooked ? 1 : 0
      };
    }

    const timeSlots = this.generateTimeSlotsForDoctor();
    return timeSlots.find(slot => slot.time === time) || {
      time,
      appointments: [],
      isAvailable: true,
      isBreak: false
    };
  }

  onTimeSlotClick(time: string) {
    const timeSlot = this.getTimeSlotForDoctor(time);
    if (timeSlot.isAvailable && !timeSlot.isBreak) {
      this.startQuickAddFlow(time);
    } else if (timeSlot.isConflict) {
      this.showConflictWarning(timeSlot.conflictReason || 'Time slot has conflicts');
    }
  }

  private startQuickAddFlow(time: string): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'select', text: 'Select Patient', color: 'primary', appearance: 'raised', fontIcon: 'person_add' }
    ];

    const pickPatientRef = this.dialogService.openDialog(PatientSearchDialogComponent, {
      title: 'Select Patient',
      data: {},
      width: '70%',
      footerActions
    });

    pickPatientRef.afterClosed().subscribe((result) => {
      const patient = result?.patient as PatientSearchResult | null | undefined;
      if (!patient) return;
      this.createAppointmentForSlot(time, patient);
    });
  }

  showConflictWarning(message: string) {
    // Show conflict warning
    alert(`Cannot schedule: ${message}`);
  }

  private patientIdToNumber(id: string): number {
    const digits = id.replace(/\D+/g, '');
    const n = Number.parseInt(digits || '0', 10);
    return Number.isFinite(n) ? n : 0;
  }

  private createAppointmentForSlot(time: string, patient: PatientSearchResult): void {
    if (time) {
      const newAppointment: Appointment = {
        appointment_id: this.mockAppointments.length + 1,
        patient_id: this.patientIdToNumber(patient.id),
        appointment_date_time: `${this.selectedDate.toISOString().split('T')[0]}T${time}:00`,
        notes: 'Appointment created from schedule',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        doctor_id: this.doctorInfo.doctorId,
        slot_id: 0,
        status: 'SCHEDULED',
        patientName: patient.fullName,
        doctorName: this.doctorInfo.doctorName,
        slotTime: this.formatTimeForDisplay(time)
      };
      
      this.mockAppointments.push(newAppointment);
      this.loadDoctorSchedule();
      this.recomputeScheduleSummary();
      this.recomputeScheduleAvailability();
    }
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  updateScheduleSettings() {
    // Update settings logic here
    this.loadDoctorSchedule();
    this.showSettings = false;
  }

  // Smart scheduling suggestions
  getSuggestedTimes(): string[] {
    const suggestions: string[] = [];
    const availableSlots = this.timeSlots.filter(time => {
      const timeSlot = this.getTimeSlotForDoctor(time);
      return timeSlot.isAvailable && !timeSlot.isBreak;
    });
    
    // Return first 3 available slots as suggestions
    return availableSlots.slice(0, 3);
  }

  // Emergency slot management
  reserveEmergencySlot() {
    const emergencyTime = this.getSuggestedTimes()[0];
    if (emergencyTime) {
      this.startQuickAddFlow(emergencyTime);
    }
  }

  getCalendarEvents() {
    // Convert appointments to calendar events
    return this.mockAppointments.map(appointment => ({
      id: appointment.appointment_id.toString(),
      title: `${appointment.patientName} - ${appointment.doctorName}`,
      start: new Date(appointment.appointment_date_time),
      end: new Date(new Date(appointment.appointment_date_time).getTime() + 30 * 60000), // 30 minutes
      color: {
        primary: this.getStatusColor(appointment.status),
        secondary: this.getStatusColor(appointment.status)
      },
      description: appointment.notes,
      type: 'appointment' as const
    }));
  }

  getAppointmentsByStatus(status: string): Appointment[] {
    return this.mockAppointments.filter(appointment => appointment.status === status);
  }

  // New methods for enhanced scheduling
  getSchedulingTypeLabel(): string {
    return this.doctorSchedule.schedulingType === 'slots' ? 'Fixed Time Slots' : 'Flexible Time';
  }

  getSchedulingTypeIcon(): string {
    return this.doctorSchedule.schedulingType === 'slots' ? 'schedule' : 'access_time';
  }

  getCapacityInfo(timeSlot: TimeSlot): string {
    if (timeSlot.slotType === 'slots' && timeSlot.maxCapacity && timeSlot.currentCapacity !== undefined) {
      return `${timeSlot.currentCapacity}/${timeSlot.maxCapacity}`;
    } else if (timeSlot.slotType === 'flexible' && timeSlot.maxCapacity && timeSlot.currentCapacity !== undefined) {
      return `${timeSlot.currentCapacity}/${timeSlot.maxCapacity} daily`;
    }
    return '';
  }

  isSlotBasedScheduling(): boolean {
    return this.doctorSchedule.schedulingType === 'slots';
  }

  isFlexibleScheduling(): boolean {
    return this.doctorSchedule.schedulingType === 'flexible';
  }
}
