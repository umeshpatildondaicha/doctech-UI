import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
import { GridComponent, AppButtonComponent, IconComponent, CalendarComponent, CoreEventService, DialogboxService, DialogFooterAction } from '@lk/core';
import { AppointmentCreateComponent } from '../appointment-create/appointment-create.component';
import { AppointmentViewComponent } from '../appointment-view/appointment-view.component';
import { QuickAddDialogComponent } from '../quick-add-dialog/quick-add-dialog.component';
import { Appointment } from '../../interfaces/appointment.interface';

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
  standalone: true,
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
    IconComponent,
    CalendarComponent
  ],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  // View Management
  selectedView: string = 'timeline';
  selectedDate: Date = new Date();
  calendarViews = ['month', 'week', 'day', 'agenda'];
  
  // Schedule Views
  scheduleViews: ScheduleView[] = [
    { id: 'timeline', name: 'Timeline', icon: 'schedule', description: 'Horizontal timeline view' },
    { id: 'calendar', name: 'Calendar', icon: 'calendar_month', description: 'Calendar grid view' },
    { id: 'list', name: 'List', icon: 'list', description: 'List view' },
    { id: 'board', name: 'Board', icon: 'dashboard', description: 'Kanban board view' }
  ];

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
    private dialogService: DialogboxService,
    private fb: FormBuilder,
    private eventService: CoreEventService,
    private router: Router
  ) {
    this.eventService.setBreadcrumb({
      label: 'Schedule',
      icon: 'schedule'
    });
    
    this.initFilterForm();
  }

  ngOnInit() {
    this.generateTimeSlots();
    this.loadDoctorSchedule();
    this.setupRealTimeUpdates();
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
    const todayAppointments = this.mockAppointments.filter(apt => 
      apt.doctor_id === this.doctorInfo.doctorId && 
      apt.status !== 'CANCELED'
    ).length;
    
    return Math.max(0, maxPerDay - todayAppointments);
  }

  private calculateFlexibleAppointmentsRemaining(): number {
    const maxPerDay = this.doctorSchedule.maxAppointmentsPerDay || 20;
    const todayAppointments = this.mockAppointments.filter(apt => 
      apt.doctor_id === this.doctorInfo.doctorId && 
      apt.status !== 'CANCELED'
    ).length;
    
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
    return this.timeSlots.map(time => {
      const appointment = this.mockAppointments.find(apt => 
        apt.doctor_id === this.doctorInfo.doctorId && 
        apt.slotTime === this.formatTimeForDisplay(time)
      );
      
      const conflicts = this.checkConflicts(time);
      const slotInfo = this.getSlotInfo(time);
      
      return {
        time,
        appointments: appointment ? [appointment] : [],
        isAvailable: !appointment && conflicts.length === 0 && slotInfo.isAvailable,
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
        const appointmentsInSlot = this.mockAppointments.filter(apt => 
          apt.doctor_id === this.doctorInfo.doctorId && 
          apt.slotTime === this.formatTimeForDisplay(time)
        ).length;
        
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
      const todayAppointments = this.mockAppointments.filter(apt => 
        apt.doctor_id === this.doctorInfo.doctorId && 
        apt.status !== 'CANCELED'
      ).length;
      
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
    const existingAppointment = this.mockAppointments.find(apt => 
      apt.doctor_id === this.doctorInfo.doctorId && 
      apt.slotTime === this.formatTimeForDisplay(time)
    );
    
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
      if (apt.doctor_id === this.doctorInfo.doctorId) {
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

  // View Management
  onViewChange(view: string) {
    this.selectedView = view;
  }

  onDateChange(date: Date) {
    this.selectedDate = date;
    this.loadDoctorSchedule(); // Reload data for new date
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
      case 'SCHEDULED': return '#4CAF50';
      case 'COMPLETED': return '#2196F3';
      case 'PENDING': return '#FF9800';
      case 'CANCELED': return '#F44336';
      default: return '#757575';
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
      this.showQuickAddDialog(time);
    } else if (timeSlot.isConflict) {
      this.showConflictWarning(timeSlot.conflictReason || 'Time slot has conflicts');
    }
  }

  showQuickAddDialog(time: string) {
    const dialogRef = this.dialogService.openDialog(QuickAddDialogComponent, {
      title: 'Quick Add Appointment',
      data: {
        selectedTime: time,
        templates: this.scheduleTemplates,
        formatTimeForDisplay: (t: string) => this.formatTimeForDisplay(t)
      },
      width: '70%',
      height: '70%'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.template) {
        this.quickAddAppointment(result.template, result.selectedTime);
      }
    });
  }

  showConflictWarning(message: string) {
    // Show conflict warning
    alert(`Cannot schedule: ${message}`);
  }

  quickAddAppointment(template: ScheduleTemplate, time: string) {
    if (time) {
      // Create appointment with template
      const newAppointment: Appointment = {
        appointment_id: this.mockAppointments.length + 1,
        patient_id: 0,
        appointment_date_time: `${this.selectedDate.toISOString().split('T')[0]}T${time}:00`,
        notes: `Quick ${template.name.toLowerCase()} appointment`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        doctor_id: this.doctorInfo.doctorId,
        slot_id: 0,
        status: 'SCHEDULED',
        patientName: 'New Patient',
        doctorName: this.doctorInfo.doctorName,
        slotTime: this.formatTimeForDisplay(time)
      };
      
      this.mockAppointments.push(newAppointment);
      this.loadDoctorSchedule();
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
      this.showQuickAddDialog(emergencyTime);
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
