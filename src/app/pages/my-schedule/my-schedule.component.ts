import { Component, Input, OnInit } from '@angular/core';

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
import { ColDef } from 'ag-grid-community';
import { GridComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { CalendarComponent } from "@lk/core";
import { TimingDialogComponent } from '../timing-dialog/timing-dialog.component';
import { ChipCellRendererComponent } from "@lk/core";
import { Mode } from '../../types/mode.type';
import { CoreEventService, DialogboxService, DialogFooterAction } from "@lk/core";
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

interface TimingSlot {
  id: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  dayOfWeek: string;
  appointmentDuration: number;
  breakTime: number;
  created_at: string;
  schedulingType: 'slots' | 'flexible';
  slotDuration?: number;
  maxAppointmentsPerSlot?: number;
  maxAppointmentsPerDay?: number;
  availableSlots?: number;
  flexibleAppointmentsRemaining?: number;
  priority: 1 | 2 | 3 | 4; // 1=Leave, 2=Specific Day, 3=Weekly, 4=Daily
  priorityType?: 'leave' | 'specific' | 'weekly' | 'daily';
  specificDate?: string; // For priority 2 (specific day)
  selectedDays?: string[]; // For priority 3 (weekly)
}

interface ScheduleStats {
  totalSlots: number;
  activeSlots: number;
  inactiveSlots: number;
  totalAppointments: number;
  averageDuration: number;
  mostPopularDay: string;
  schedulingTypes: {
    slots: number;
    flexible: number;
  };
}

@Component({
    selector: 'app-my-schedule',
    imports: [
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
    GridComponent,
    AppButtonComponent,
    IconComponent,
    CalendarComponent,
    BreadcrumbComponent
],
    templateUrl: './my-schedule.component.html',
    styleUrls: ['./my-schedule.component.scss']
})
export class MyScheduleComponent implements OnInit {
  /**
   * When embedded inside another page (e.g. Schedule),
   * avoid overriding the global breadcrumb/title.
   */
  @Input() embedded = false;

  selectedTabIndex = 0;
  
  // Schedule configuration
  scheduleDays: number = 7; // Default 7 days, can be changed by doctor
  availableDayOptions: number[] = [7, 8, 10, 15, 30]; // Doctor can choose from these options
  
  // Custom breadcrumbs for navigation
  customBreadcrumbs = [
    { label: 'Appointments', path: '/appointments', icon: 'event' },
    { label: 'My Schedule', icon: 'schedule', isActive: true }
  ];
  
  // Timing slots data
  timingSlots: TimingSlot[] = [];
  timingColumns: ColDef[] = [];
  timingGridOptions = {
    menuActions: [
      {
        title: 'View',
        icon: 'visibility',
        click: (param: any) => this.onAddTiming('view', param.data)
      },
      {
        title: 'Edit',
        icon: 'edit',
        click: (param: any) => this.onAddTiming('edit', param.data)
      },
      {
        title: 'Delete',
        icon: 'delete',
        click: (param: any) => this.deleteTiming(param.data)
      }
    ]
  };

  // Schedule statistics
  scheduleStats: ScheduleStats = {
    totalSlots: 0,
    activeSlots: 0,
    inactiveSlots: 0,
    totalAppointments: 0,
    averageDuration: 0,
    mostPopularDay: '',
    schedulingTypes: {
      slots: 0,
      flexible: 0
    }
  };

  // Form for filters
  filterForm!: FormGroup;
  
  // UI State
  isLoading = false;
  showFilters = false;
  selectedView: 'weekly' | 'grid' = 'weekly';

  constructor(
    private dialogService: DialogboxService,
    private fb: FormBuilder,
    private eventService: CoreEventService,
    private router: Router
  ) {
    this.initFilterForm();
  }

  ngOnInit() {
    if (!this.embedded) {
      this.eventService.setBreadcrumb({
        label: 'My Schedule',
        icon: 'schedule'
      });
    }
    this.initializeTimingGrid();
    this.loadTimingData();
    this.calculateStats();
  }

  private initFilterForm() {
    this.filterForm = this.fb.group({
      dayOfWeek: [''],
      schedulingType: [''],
      isActive: [''],
      searchTerm: ['']
    });
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
  }

  // Timing slots methods
  initializeTimingGrid() {
    this.timingColumns = [
      {
        headerName: 'Status',
        field: 'isActive',
        width: 100,
        sortable: true,
        filter: true,
        cellRenderer: ChipCellRendererComponent
      },
      {
        headerName: 'Scheduling Type',
        field: 'schedulingType',
        width: 150,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return params.value === 'slots' ? 'Fixed Time Slots' : 'Flexible Time';
        }
      },
      {
        headerName: 'Day',
        field: 'dayOfWeek',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Start Time',
        field: 'startTime',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'End Time',
        field: 'endTime',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Appointment Duration',
        field: 'appointmentDuration',
        width: 200,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Break Time',
        field: 'breakTime',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Capacity',
        field: 'capacity',
        width: 120,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          const data = params.data;
          if (data.schedulingType === 'slots') {
            return `${data.availableSlots || 0} slots`;
          } else {
            return `${data.flexibleAppointmentsRemaining || 0} remaining`;
          }
        }
      },
      {
        headerName: 'Created',
        field: 'created_at',
        width: 150,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return new Date(params.value).toLocaleDateString();
        }
      }
    ];
  }

  loadTimingData() {
    this.timingSlots = [
      {
        id: 1,
        dayOfWeek: 'Monday',
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        isActive: true,
        appointmentDuration: 30,
        breakTime: 10,
        created_at: '2024-01-01T00:00:00',
        schedulingType: 'slots',
        slotDuration: 30,
        maxAppointmentsPerSlot: 1,
        availableSlots: 16,
        priority: 3,
        priorityType: 'weekly'
      },
      {
        id: 2,
        dayOfWeek: 'Tuesday',
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        isActive: true,
        appointmentDuration: 30,
        breakTime: 10,
        created_at: '2024-01-01T00:00:00',
        schedulingType: 'flexible',
        maxAppointmentsPerDay: 20,
        flexibleAppointmentsRemaining: 15,
        priority: 3,
        priorityType: 'weekly'
      },
      {
        id: 3,
        dayOfWeek: 'Wednesday',
        startTime: '10:00 AM',
        endTime: '06:00 PM',
        isActive: false,
        appointmentDuration: 30,
        breakTime: 10,
        created_at: '2024-01-01T00:00:00',
        schedulingType: 'slots',
        slotDuration: 45,
        maxAppointmentsPerSlot: 2,
        availableSlots: 10,
        priority: 1,
        priorityType: 'leave',
        specificDate: new Date().toISOString().split('T')[0] // Today's date
      },
      {
        id: 4,
        dayOfWeek: 'Thursday',
        startTime: '08:00 AM',
        endTime: '04:00 PM',
        isActive: true,
        appointmentDuration: 45,
        breakTime: 15,
        created_at: '2024-01-01T00:00:00',
        schedulingType: 'slots',
        slotDuration: 45,
        maxAppointmentsPerSlot: 1,
        availableSlots: 10,
        priority: 2,
        priorityType: 'specific',
        specificDate: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
        })() // Tomorrow's date
      },
      {
        id: 5,
        dayOfWeek: 'Friday',
        startTime: '09:00 AM',
        endTime: '03:00 PM',
        isActive: true,
        appointmentDuration: 30,
        breakTime: 10,
        created_at: '2024-01-01T00:00:00',
        schedulingType: 'flexible',
        maxAppointmentsPerDay: 15,
        flexibleAppointmentsRemaining: 12,
        priority: 4,
        priorityType: 'daily'
      }
    ];
  }

  calculateStats() {
    this.scheduleStats = {
      totalSlots: this.timingSlots.length,
      activeSlots: this.timingSlots.filter(slot => slot.isActive).length,
      inactiveSlots: this.timingSlots.filter(slot => !slot.isActive).length,
      totalAppointments: this.timingSlots.reduce((sum, slot) => {
        if (slot.schedulingType === 'slots') {
          return sum + (slot.availableSlots || 0);
        } else {
          return sum + (slot.flexibleAppointmentsRemaining || 0);
        }
      }, 0),
      averageDuration: this.timingSlots.reduce((sum, slot) => sum + slot.appointmentDuration, 0) / this.timingSlots.length,
      mostPopularDay: this.getMostPopularDay(),
      schedulingTypes: {
        slots: this.timingSlots.filter(slot => slot.schedulingType === 'slots').length,
        flexible: this.timingSlots.filter(slot => slot.schedulingType === 'flexible').length
      }
    };
  }

  private getMostPopularDay(): string {
    const dayCounts: { [key: string]: number } = {};
    this.timingSlots.forEach(slot => {
      dayCounts[slot.dayOfWeek] = (dayCounts[slot.dayOfWeek] || 0) + 1;
    });
    
    return Object.keys(dayCounts).reduce((a, b) => 
      dayCounts[a] > dayCounts[b] ? a : b
    );
  }

  onTimingRowClick(event: any) {
    console.log('Timing row clicked:', event.data);
  }

  onAddTiming(mode: Mode, data?: TimingSlot, priority?: number) {
    const isViewMode = mode === 'view';
    const footerActions: DialogFooterAction[] = [];
    
    if (!isViewMode) {
      footerActions.push({
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'basic'
      });
    }
    
    footerActions.push({
      id: 'submit',
      text: isViewMode ? 'Close' : mode === 'create' ? 'Add Timing' : 'Save Changes',
      color: 'primary',
      appearance: isViewMode ? 'basic' : 'raised'
    });

    const dialogRef = this.dialogService.openDialog(TimingDialogComponent, {
      title: mode === 'create' ? 'Add Timing' : mode === 'edit' ? 'Edit Timing' : 'View Timing',
      data: { mode, timing: data, priority },
      width: '60%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Skip if result is false (validation failed) or action is cancel
      if (result === false || result?.action === 'cancel') {
        return;
      }
      
      if (result) {
        // Add new timing slot
        const newTiming: TimingSlot = {
          ...result,
          id: this.timingSlots.length + 1,
          dayOfWeek: this.getDayFromTiming(result),
          startTime: this.formatTime(result.startTime),
          endTime: this.formatTime(result.endTime),
          isActive: true,
          created_at: new Date().toISOString(),
          schedulingType: result.schedulingType || 'slots',
          slotDuration: result.slotDuration,
          maxAppointmentsPerSlot: result.maxAppointmentsPerSlot,
          maxAppointmentsPerDay: result.maxAppointmentsPerDay,
          availableSlots: result.availableSlots,
          flexibleAppointmentsRemaining: result.maxAppointmentsPerDay
        };
        this.timingSlots = [...this.timingSlots, newTiming];
        this.calculateStats();
      }
    });
  }

  private getDayFromTiming(timing: any): string {
    if (timing.timeFor === 'specific_day' && timing.selectedDate) {
      return new Date(timing.selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    } else if (timing.timeFor === 'weekly' && timing.selectedDays && timing.selectedDays.length > 0) {
      return timing.selectedDays.map((day: string) => 
        day.charAt(0).toUpperCase() + day.slice(1)
      ).join(', ');
    }
    return 'Daily';
  }

  private formatTime(time: string): string {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  editTiming(timing: TimingSlot) {
    console.log('Edit timing:', timing);
    this.onAddTiming('edit', timing);
  }

  deleteTiming(timing: TimingSlot) {
    if (confirm(`Are you sure you want to delete timing slot for ${timing.dayOfWeek}?`)) {
      this.timingSlots = this.timingSlots.filter(item => item.id !== timing.id);
      this.calculateStats();
    }
  }

  // View management
  onViewChange(view: 'weekly' | 'grid') {
    this.selectedView = view;
  }

  // Filter methods
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  applyFilters() {
    // Apply filter logic here
    console.log('Applying filters:', this.filterForm.value);
  }

  clearFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  // Helper methods
  getSchedulingTypeLabel(schedulingType: string): string {
    return schedulingType === 'slots' ? 'Fixed Time Slots' : 'Flexible Time';
  }

  getSchedulingTypeIcon(schedulingType: string): string {
    return schedulingType === 'slots' ? 'schedule' : 'access_time';
  }

  getCapacityInfo(timingSlot: TimingSlot): string {
    if (timingSlot.schedulingType === 'slots') {
      return `${timingSlot.availableSlots || 0} available slots`;
    } else {
      return `${timingSlot.flexibleAppointmentsRemaining || 0} appointments remaining`;
    }
  }

  // Add missing methods referenced in template
  createTimingSlot(priority?: number) {
    this.onAddTiming('create', undefined, priority);
  }

  getPriorityLabel(priority: number): string {
    switch (priority) {
      case 1: return 'Leave';
      case 2: return 'Specific Day';
      case 3: return 'Weekly';
      case 4: return 'Daily';
      default: return 'Unknown';
    }
  }

  getLeaveDaysCount(): number {
    return this.timingSlots.filter(slot => slot.priority === 1).length;
  }

  getPriorityCount(priority: number): number {
    return this.timingSlots.filter(slot => slot.priority === priority).length;
  }

  getSlotsByPriority(priority: number): TimingSlot[] {
    return this.timingSlots.filter(slot => slot.priority === priority);
  }

  getTotalSlotsByPriority(priority: number): number {
    // For leave days (priority 1), don't count slots
    if (priority === 1) {
      return 0;
    }
    
    const slots = this.getSlotsByPriority(priority);
    return slots.reduce((total, slot) => {
      if (slot.schedulingType === 'slots') {
        return total + (slot.availableSlots || 0);
      } else {
        return total + (slot.flexibleAppointmentsRemaining || 0);
      }
    }, 0);
  }

  getPriorityDisplayText(priority: number): string {
    switch (priority) {
      case 1: return 'Leave Days';
      case 2: return 'Specific Days';
      case 3: return 'Weekly Pattern';
      case 4: return 'All Days'; // Daily applies to all days
      default: return 'Unknown';
    }
  }

  getPriorityDescription(priority: number): string {
    switch (priority) {
      case 1: return 'Days off from work';
      case 2: return 'One-time schedules';
      case 3: return 'Recurring weekly';
      case 4: return 'Default daily schedule'; // Applies to all days when no other priority
      default: return 'Unknown';
    }
  }

  // Helper method to format date
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Format as "Jan 17, 2024"
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Helper method to get display text for priority items
  getPriorityItemDisplay(slot: TimingSlot): string {
    switch (slot.priority) {
      case 1: // Leave
        return slot.specificDate ? this.formatDate(slot.specificDate) : slot.dayOfWeek;
      case 2: // Specific Day
        return slot.specificDate ? this.formatDate(slot.specificDate) : slot.dayOfWeek;
      case 3: // Weekly
        return slot.dayOfWeek;
      case 4: // Daily
        return 'All Days';
      default:
        return slot.dayOfWeek;
    }
  }

  // Helper method to get time range display
  getTimeRangeDisplay(slot: TimingSlot): string {
    switch (slot.priority) {
      case 1: // Leave
        return 'Leave Day';
      case 2: // Specific Day
      case 3: // Weekly
      case 4: // Daily
        return `${slot.startTime} - ${slot.endTime}`;
      default:
        return `${slot.startTime} - ${slot.endTime}`;
    }
  }

  // Helper method to get day display for weekly view
  getDayDisplay(day: string, slot?: TimingSlot): string {
    if (slot) {
      // If we have a slot, use the priority-specific display
      return this.getPriorityItemDisplay(slot);
    }
    
    // For empty days, just show the day name
    return day;
  }

  // Helper method to get date for a specific day of the week
  getDateForDay(day: string): string {
    const today = new Date();
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
    const currentDayIndex = today.getDay();
    
    // Calculate days to add to get to the target day (this week)
    let daysToAdd = dayIndex - currentDayIndex;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    return this.formatDate(targetDate.toISOString().split('T')[0]);
  }

  // Helper method to get the actual date for a slot if it's a specific day
  getSlotDate(slot: TimingSlot): string {
    if (slot.specificDate) {
      return this.formatDate(slot.specificDate);
    }
    return '';
  }

  // Helper method to get schedule days based on doctor's selection
  getScheduleDays(): string[] {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scheduleDays: string[] = [];
    
    // Start from today and get the selected number of days
    for (let i = 0; i < this.scheduleDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      scheduleDays.push(days[date.getDay()]);
    }
    
    return scheduleDays;
  }

  // Helper method to get current week days starting from today (for backward compatibility)
  getCurrentWeekDays(): string[] {
    return this.getScheduleDays();
  }

  refreshSchedule() {
    this.isLoading = true;
    setTimeout(() => {
      this.loadTimingData();
      this.calculateStats();
      this.isLoading = false;
    }, 1000);
  }

  exportSchedule() {
    // Implement export functionality
    console.log('Exporting schedule...');
  }

  printSchedule() {
    window.print();
  }

  // Helper methods for template
  getSlotsForDay(day: string): TimingSlot[] {
    return this.timingSlots.filter(slot => slot.dayOfWeek === day);
  }

  getCalendarEvents() {
    // Convert timing slots to calendar events for display
    return this.timingSlots.map(slot => ({
      id: slot.id.toString(),
      title: `${slot.dayOfWeek} - ${slot.startTime} to ${slot.endTime}`,
      start: new Date(), // This would need proper date calculation
      end: new Date(), // This would need proper date calculation
      color: {
        primary: slot.isActive ? '#4CAF50' : '#FF9800',
        secondary: slot.isActive ? '#4CAF50' : '#FF9800'
      },
      description: `${this.getSchedulingTypeLabel(slot.schedulingType)} - ${slot.appointmentDuration} min duration`,
      type: 'appointment' as const
    }));
  }

  // Navigation methods for breadcrumb
  onBreadcrumbClick(item: any) {
    if (item.path && !item.isActive) {
      this.router.navigate([item.path]);
    }
  }

  // Method to handle schedule days change
  onScheduleDaysChange(days: number) {
    this.scheduleDays = days;
    // You can add logic here to save this preference to backend
    console.log(`Schedule days changed to: ${days}`);
  }

  // Method to handle select change event
  onDaysSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const days = parseInt(target.value, 10);
    this.onScheduleDaysChange(days);
  }

  // Method to get grid template columns based on number of days
  getGridTemplateColumns(): string {
    if (this.scheduleDays <= 7) {
      return `repeat(${this.scheduleDays}, 1fr)`;
    } else if (this.scheduleDays <= 15) {
      return `repeat(auto-fit, minmax(180px, 1fr))`;
    } else {
      return `repeat(auto-fit, minmax(160px, 1fr))`;
    }
  }

  // Method to get available slots for patients
  getAvailableSlotsForPatients(): TimingSlot[] {
    return this.timingSlots.filter(slot => 
      slot.isActive && 
      slot.priority !== 1 && // Exclude leave days
      this.isSlotInScheduleRange(slot)
    );
  }

  // Method to check if slot is within the selected schedule range
  isSlotInScheduleRange(slot: TimingSlot): boolean {
    const today = new Date();
    const scheduleEndDate = new Date();
    scheduleEndDate.setDate(today.getDate() + this.scheduleDays - 1);
    
    if (slot.specificDate) {
      const slotDate = new Date(slot.specificDate);
      return slotDate >= today && slotDate <= scheduleEndDate;
    }
    
    // For weekly patterns, check if any day falls within the range
    return true; // Weekly patterns are always available
  }

  // Method to get total available slots count
  getTotalAvailableSlots(): number {
    const availableSlots = this.getAvailableSlotsForPatients();
    return availableSlots.reduce((total, slot) => {
      if (slot.schedulingType === 'slots') {
        return total + (slot.availableSlots || 0);
      } else {
        return total + (slot.flexibleAppointmentsRemaining || 0);
      }
    }, 0);
  }

  // Helper method to get active slots count
  getActiveSlotsCount(): number {
    return this.timingSlots.filter(slot => slot.isActive).length;
  }



  navigateToAppointments() {
    this.router.navigate(['/appointments']);
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
