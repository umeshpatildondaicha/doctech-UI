import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AppButtonComponent, AppInputComponent, DividerComponent, IconComponent, CalendarComponent, CoreEventService, DialogboxService, DialogFooterAction, PageComponent, PageBodyDirective, ToggleButtonComponent, type ToggleButtonOption } from '@lk/core';
import { AppointmentCreateComponent } from '../appointment-create/appointment-create.component';
import { AppointmentViewComponent } from '../appointment-view/appointment-view.component';
import { PatientSearchDialogComponent, PatientSearchResult } from '../patient-search-dialog/patient-search-dialog.component';
import { Appointment } from '../../interfaces/appointment.interface';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { AppCardActionsDirective } from '../../core/components/app-card/app-card-actions.directive';

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
  label: string;
  timeLabel: string;
  note?: string;
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
        ToggleButtonComponent
    ],
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  activeSection: 'schedule' | 'timings' = 'schedule';
  timingsTab: TimingPriorityTab = 'p4';
  forecastDays = 15;
  /** Number of days from today the doctor has set for scheduling (today + next N-1 days). Patient/doctor can view and book within this window. */
  scheduleWindowDays = 15;
  readonly weekdays: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  timingsMode: TimingsMode = 'view';

  /** Options for View/Manage toggle (lk-core ToggleButtonComponent) */
  readonly timingsModeOptions: ToggleButtonOption[] = [
    { value: 'view', label: 'View' },
    { value: 'manage', label: 'Manage' }
  ];

  // Timings (P4 standard / P3 weekly / P2 overrides / P1 leave)
  timingsDaily = {
    start: '09:00',
    end: '17:00',
    slotDuration: 30
  };
  timingsBreaks: TimingBreak[] = [
    { label: 'Lunch Break', start: '13:30', end: '14:00' }
  ];
  // Weekly rules are meant to be optional (one schedule per weekday).
  // If a rule exists for a weekday, it overrides the daily timing for that weekday.
  timingsWeeklyRules: Record<Weekday, WeeklyRule | null> = {
    Monday: null,
    Tuesday: null,
    Wednesday: null,
    Thursday: null,
    Friday: null,
    // Example scenarios requested:
    // - Every Saturday: 4 hours, lunch + tea breaks
    Saturday: {
      start: '09:00',
      end: '13:00',
      breaks: [
        { label: 'Lunch Break', start: '11:00', end: '11:30' },
        { label: 'Tea Break', start: '12:15', end: '12:30' }
      ]
    },
    // - Every Sunday: 2 hours, 1 hour break
    Sunday: {
      start: '10:00',
      end: '12:00',
      breaks: [{ label: 'Break', start: '11:00', end: '12:00' }]
    }
  };
  timingsOverrides: TimingOverride[] = [];
  timingsLeaveDates: string[] = [];
  expandedWeekday: Weekday | null = null;
  overrideDraft: TimingOverride = { date: '', start: '14:00', end: '19:00', breaks: [] };
  isEditingOverride = false;
  selectedWeeklyDay: Weekday = 'Monday';
  selectedOverrideDate: string | null = null;
  thisWeekScheduleCards: ThisWeekScheduleCard[] = [];

  // Timings management (admin) mock data
  manageLeaves: ManageLeaveItem[] = [
    { label: 'Medical Conference', rangeLabel: 'Dec 15 – Dec 20, 2024', durationLabel: '6 Days' }
  ];
  manageSpecificDays: ManageSpecificDayItem[] = [
    { label: 'Evening Gala (Limited)', dateLabel: 'Nov 30', rangeLabel: 'Dec 15 – Dec 20, 2024' }
  ];
  manageWeeklyRoutines: ManageWeeklyRoutineItem[] = [
    { label: 'Main Consultation', timeLabel: '09:00 AM – 01:00 PM', days: ['Monday', 'Wednesday', 'Friday'], partiallyOverridden: true },
    { label: 'Weekend Telehealth', timeLabel: '10:00 AM – 12:00 PM', days: ['Saturday'] }
  ];
  manageBaseAvailability: ManageBaseAvailabilityItem[] = [
    { label: 'General Availability', timeLabel: '05:00 PM – 08:00 PM', note: 'Overridden by Higher Priority' }
  ];

  timingsForecast: ForecastDay[] = [];
  filteredTimingsForecast: ForecastDay[] = [];

  // View Management
  selectedDate: Date = new Date();
  calendarViews = ['month', 'week', 'day', 'agenda'];

  // Schedule (top bar UI)
  scheduleWeekStrip: ScheduleWeekDay[] = [];
  scheduleSearch = '';
  scheduleSummary: ScheduleSummaryStats = { totalSlots: 0, booked: 0, available: 0, break: 0 };
  scheduleAvailability: ScheduleAvailabilityInfo = { mode: 'slots', availableTimes: [] };

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
    doctorId: 1,
    doctorName: 'Dr. Chetan',
    specialization: 'Cardiology',
    avatar: 'assets/avatars/doctor1.jpg',
    totalAppointments: 8,
    completedAppointments: 5,
    availableSlots: 3,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    breakTime: {
      start: '12:00',
      end: '13:00'
    },
    schedulingType: 'slots',
    slotDuration: 30,
    maxAppointmentsPerSlot: 1
  };

  // Doctor Schedule Configuration
  doctorSchedule: DoctorSchedule = {
    schedulingType: 'slots',
    slotDuration: 30,
    maxAppointmentsPerSlot: 1,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    breaks: [
      {
        reason: 'Lunch Break',
        startTime: '12:00',
        endTime: '13:00'
      }
    ]
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
  
  // Mock data
  mockAppointments: Appointment[] = [
    {
      appointment_id: 1,
      patient_id: 1,
      appointment_date_time: '2024-01-15T09:00:00',
      notes: 'Regular checkup appointment',
      created_at: '2024-01-10T10:00:00',
      updated_at: '2024-01-10T10:00:00',
      doctor_id: 1,
      slot_id: 1,
      status: 'SCHEDULED',
      patientName: 'John Doe',
      doctorName: 'Dr. Chetan',
      slotTime: '09:00 AM'
    },
    {
      appointment_id: 2,
      patient_id: 2,
      appointment_date_time: '2024-01-15T10:00:00',
      notes: 'Follow-up consultation',
      created_at: '2024-01-11T11:00:00',
      updated_at: '2024-01-11T11:00:00',
      doctor_id: 2,
      slot_id: 2,
      status: 'COMPLETED',
      patientName: 'Jane Smith',
      doctorName: 'Dr. Sarah',
      slotTime: '10:00 AM'
    },
    {
      appointment_id: 3,
      patient_id: 3,
      appointment_date_time: '2024-01-15T11:00:00',
      notes: 'Emergency consultation',
      created_at: '2024-01-12T09:00:00',
      updated_at: '2024-01-12T09:00:00',
      doctor_id: 1,
      slot_id: 3,
      status: 'PENDING',
      patientName: 'Mike Johnson',
      doctorName: 'Dr. Chetan',
      slotTime: '11:00 AM'
    }
  ];

  constructor(
    private readonly dialogService: DialogboxService,
    private readonly fb: FormBuilder,
    private readonly eventService: CoreEventService,
    private readonly router: Router
  ) {
    this.eventService.setBreadcrumb({
      label: 'Schedule',
      icon: 'schedule'
    });
    
    this.initFilterForm();
  }

  ngOnInit() {
    // Default to first mocked appointment date if within schedule window, else today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + this.scheduleWindowDays - 1);
    const mockDate = this.mockAppointments[0]?.appointment_date_time ? new Date(this.mockAppointments[0].appointment_date_time) : null;
    if (mockDate) {
      mockDate.setHours(0, 0, 0, 0);
      if (mockDate >= today && mockDate <= windowEnd) {
        this.selectedDate = new Date(this.mockAppointments[0].appointment_date_time);
      } else {
        this.selectedDate = new Date();
      }
    } else {
      this.selectedDate = new Date();
    }

    this.generateTimeSlots();
    this.loadDoctorSchedule();
    this.setupRealTimeUpdates();
    this.seedTimingsDemoData();
    this.recomputeTimingsForecast();
    this.initTimingsSelections();
    this.buildThisWeekScheduleCards();

    this.rebuildScheduleWeekStrip();
    this.recomputeScheduleSummary();
    this.recomputeScheduleAvailability();
  }

  setSection(section: 'schedule' | 'timings'): void {
    this.activeSection = section;
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

  // ---- Manage UI actions (mock) ----
  addManageItem(scope: 'p1' | 'p2' | 'p3' | 'p4'): void {
    // Hook this to dialogs / backend later
    if (scope === 'p1') this.manageLeaves = [...this.manageLeaves, { label: 'New Leave', rangeLabel: 'Dec 22 – Dec 22, 2024', durationLabel: '1 Day' }];
    if (scope === 'p2') this.manageSpecificDays = [...this.manageSpecificDays, { label: 'New Override', dateLabel: 'Dec 26', rangeLabel: 'Dec 26, 2024' }];
    if (scope === 'p3') this.manageWeeklyRoutines = [...this.manageWeeklyRoutines, { label: 'New Weekly Routine', timeLabel: '09:00 AM – 10:00 AM', days: ['Tuesday'] }];
    if (scope === 'p4') this.manageBaseAvailability = [...this.manageBaseAvailability, { label: 'New Base Availability', timeLabel: '10:00 AM – 11:00 AM' }];
  }

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

  private seedTimingsDemoData(): void {
    // Demo-only: show some overrides/leaves in next 15 days
    const today = new Date();
    const toKey = (d: Date) => d.toISOString().slice(0, 10);
    const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

    this.timingsOverrides = [
      {
        date: toKey(addDays(today, 1)),
        start: '14:00',
        end: '19:00',
        breaks: [{ label: 'Tea Break', start: '16:30', end: '16:45' }]
      }
    ];
    this.timingsLeaveDates = [toKey(addDays(today, 5)), toKey(addDays(today, 6))];
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
    // Generate 30-minute time slots from 8 AM to 6 PM
    this.timeSlots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        this.timeSlots.push(time);
      }
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
    const startHour = parseInt(this.doctorInfo.workingHours.start.split(':')[0]);
    const endHour = parseInt(this.doctorInfo.workingHours.end.split(':')[0]);
    
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
    
    for (const apt of this.mockAppointments) {
      const aptDate = new Date(apt.appointment_date_time);
      if (apt.doctor_id === this.doctorInfo.doctorId && aptDate.toDateString() === this.selectedDate.toDateString()) {
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
    // Simulate real-time updates
    setInterval(() => {
      this.updateScheduleStats();
    }, 30000); // Update every 30 seconds
  }

  private updateScheduleStats() {
    // Update statistics in real-time
    this.scheduleStats = {
      ...this.scheduleStats,
      completedToday: Math.min(this.scheduleStats.completedToday + 1, this.scheduleStats.todayAppointments)
    };
  }

  onDateChange(date: Date) {
    this.selectedDate = date;
    this.loadDoctorSchedule(); // Reload data for new date
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
    const selectedKey = this.selectedDate.toDateString();

    const list = this.mockAppointments.filter(a => {
      const aptDate = new Date(a.appointment_date_time);
      if (aptDate.toDateString() !== selectedKey) return false;
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

  /** Builds the schedule strip as today + next (scheduleWindowDays - 1) days — the window the doctor has set for scheduling. Patient and doctor can view/book within this window. */
  private rebuildScheduleWeekStrip(): void {
    const calendarToday = new Date();
    calendarToday.setHours(0, 0, 0, 0);
    const selectedKey = this.selectedDate.toDateString();
    const strip: ScheduleWeekDay[] = [];

    for (let i = 0; i < this.scheduleWindowDays; i++) {
      const d = new Date(calendarToday.getFullYear(), calendarToday.getMonth(), calendarToday.getDate() + i);
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

  private recomputeScheduleAvailability(): void {
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
    const selectedKey = this.selectedDate.toDateString();
    return this.mockAppointments.filter(a => {
      if (a.doctor_id !== this.doctorInfo.doctorId) return false;
      const d = new Date(a.appointment_date_time);
      return d.toDateString() === selectedKey;
    });
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
