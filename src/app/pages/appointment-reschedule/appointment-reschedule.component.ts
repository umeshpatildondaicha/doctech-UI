import { Component, OnInit, AfterViewInit, inject, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Appointment } from '../../interfaces/appointment.interface';
import { AppInputComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { IconComponent } from "@lk/core";

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CalendarComponent, ImageComponent, DIALOG_DATA_TOKEN } from "@lk/core";
import { filter } from 'rxjs';

import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';

interface TimeSlot {
  id: number;
  time: string;
  available: boolean;
  hasConflict: boolean;
}

@Component({
    selector: 'app-appointment-reschedule',
    templateUrl: './appointment-reschedule.component.html',
    styleUrl: './appointment-reschedule.component.scss',
    imports: [
    AppInputComponent,
    AppButtonComponent,
    ImageComponent,
    IconComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    CalendarComponent
]
})
export class AppointmentRescheduleComponent implements OnInit, AfterViewInit {
  rescheduleForm: FormGroup;
  submitButtonText: string = 'Reschedule Appointment';
  appointment: Appointment | undefined;
  
  selectedDate: Date | null = null;
  selectedTimeSlot: TimeSlot | null = null;
  availableTimeSlots: TimeSlot[] = [];
  hasConflict: boolean = false;
  isLoadingSlots = false;
  isSubmitting = false;
  availableDates = new Set<string>();
  noSlotsDates = new Set<string>();
  calendarEvents: any[] = [];
  currentCalendarMonth = new Date().getMonth();
  currentCalendarYear = new Date().getFullYear();
  /** Cache of slots by date (YYYY-MM-DD) - populated on date click */
  private slotsByDate = new Map<string, TimeSlot[]>();

  @ViewChild('calendarWrapper', { read: ElementRef }) calendarWrapper?: ElementRef<HTMLElement>;

  dialogRef = inject(MatDialogRef<AppointmentRescheduleComponent>);
  data = inject<{ appointment?: Appointment }>(DIALOG_DATA_TOKEN);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  constructor(
    private fb: FormBuilder
  ) {
    this.appointment = this.data?.appointment;
    this.rescheduleForm = this.fb.group({
      rescheduleReason: [''],
      newDateTime: [null, Validators.required]
    });
  }

  ngOnInit() {
    (this.data as Record<string, unknown>)['componentInstance'] = this;
    const today = new Date();
    this.selectedDate = today;
    this.loadTimeSlotsForDate(today);

    this.dialogRef.beforeClosed().pipe(
      filter(result => result?.action === 'submit' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') return;
      if (result?.action === 'submit' && this.canSubmit()) {
        this.performReschedule();
      }
    });
  }

  /** Called by footer when action id is 'apply' - prevents default close, runs async reschedule */
  apply(): void {
    if (this.canSubmit()) this.performReschedule();
  }

  private performReschedule(): void {
    const appointmentPublicId =
      (this.appointment as Appointment & { appointmentPublicId?: string })?.appointmentPublicId ??
      (this.appointment?.appointment_id ? String(this.appointment.appointment_id) : '');
    if (!appointmentPublicId) {
      this.snackBar.open('Appointment ID is missing. Cannot reschedule.', 'Close', { duration: 4000 });
      return;
    }
    const payload = this.buildReschedulePayload();
    if (!payload) return;

    this.isSubmitting = true;
    this.appointmentService.rescheduleAppointment(appointmentPublicId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.dialogRef.close({
          originalAppointment: this.appointment,
          newDateTime: this.rescheduleForm.get('newDateTime')?.value,
          rescheduleReason: this.rescheduleForm.get('rescheduleReason')?.value,
          hasConflict: this.hasConflict
        });
      },
      error: (err: unknown) => {
        this.isSubmitting = false;
        const msg = (err as { error?: { message?: string }; message?: string })?.error?.message
          ?? (err as { message?: string })?.message
          ?? 'Failed to reschedule appointment.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  private buildReschedulePayload(): { newDate: string; newStartTime: string; newEndTime: string } | null {
    if (!this.selectedDate || !this.selectedTimeSlot) return null;
    const newDate = this.formatDateForApi(this.selectedDate);
    const { startTime, endTime } = this.parseSlotTimeTo24h(this.selectedTimeSlot.time, 30);
    return { newDate, newStartTime: startTime, newEndTime: endTime };
  }

  private parseSlotTimeTo24h(timeStr: string, slotMinutes: number): { startTime: string; endTime: string } {
    const [time, period] = (timeStr || '09:00').trim().split(/\s+/);
    const parts = (time || '09:00').split(':');
    const hours = Number(parts[0]) || 9;
    const minutes = Number(parts[1]) || 0;
    let h24 = hours;
    if (period === 'PM' && hours !== 12) h24 += 12;
    else if (period === 'AM' && hours === 12) h24 = 0;
    const startDate = new Date(2000, 0, 1, h24, minutes, 0);
    const endDate = new Date(startDate.getTime() + slotMinutes * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      startTime: `${pad(h24)}:${pad(minutes)}:00`,
      endTime: `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`
    };
  }

  onDateSelected(date: Date) {
    const dateStr = this.formatDateForApi(date);
    if (this.noSlotsDates.has(dateStr)) {
      this.snackBar.open('No slots available for this date.', 'Close', { duration: 3000 });
      return;
    }
    this.selectedDate = date;
    this.selectedTimeSlot = null;
    const cached = this.slotsByDate.get(dateStr);
    if (cached) {
      this.availableTimeSlots = cached;
    } else {
      this.loadTimeSlotsForDate(date);
    }
  }

  onMonthChanged(event: { year: number; month: number }) {
    this.currentCalendarMonth = event.month;
    this.currentCalendarYear = event.year;
    this.applyDisabledDates();
  }

  onEventClicked(event: any) {
    console.log('Calendar event clicked:', event);
  }

  ngAfterViewInit() {
    setTimeout(() => this.applyDisabledDates(), 0);
  }

  /** Add disabled styling to calendar date cells that have no slots */
  private applyDisabledDates(): void {
    const wrapper = this.calendarWrapper?.nativeElement;
    if (!wrapper || this.noSlotsDates.size === 0) return;

    const cells = wrapper.querySelectorAll<HTMLElement>('.calendar-day');
    const dates = this.buildCalendarDateGrid();

    cells.forEach((cell, i) => {
      const date = dates[i];
      if (!date) return;
      const dateStr = this.formatDateForApi(date);
      const isDisabled = this.noSlotsDates.has(dateStr);
      cell.classList.toggle('date-disabled', isDisabled);
    });
  }

  /** Build the same date grid as @lk/core CalendarComponent for DOM mapping */
  private buildCalendarDateGrid(): Date[] {
    const firstDay = new Date(this.currentCalendarYear, this.currentCalendarMonth, 1);
    const lastDay = new Date(this.currentCalendarYear, this.currentCalendarMonth + 1, 0);
    const dayOfWeek = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - dayOfWeek);
    const weeks = Math.ceil((lastDay.getDate() + dayOfWeek) / 7);
    const dates: Date[] = [];
    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < 7; day++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + week * 7 + day);
        dates.push(d);
      }
    }
    return dates;
  }

  loadTimeSlotsForDate(date: Date) {
    const doctorRegNo =
      (this.appointment as Appointment & { doctorRegistrationNumber?: string })?.doctorRegistrationNumber ??
      this.authService.getDoctorRegistrationNumber() ??
      'DR1';
    const dateStr = this.formatDateForApi(date);

    this.isLoadingSlots = true;
    this.availableTimeSlots = [];

    this.appointmentService.getAppointmentSlotsForDate(doctorRegNo, dateStr, 30).subscribe({
      next: (res: unknown) => {
        const slots = this.mapApiSlotsToTimeSlots(res);
        this.slotsByDate.set(dateStr, slots);
        this.availableTimeSlots = slots;
        this.isLoadingSlots = false;
        const hasAvailable = slots.some((s) => s.available);
        if (hasAvailable && slots.length > 0) {
          this.availableDates.add(dateStr);
          this.noSlotsDates.delete(dateStr);
        } else {
          this.noSlotsDates.add(dateStr);
          this.availableDates.delete(dateStr);
        }
        this.buildCalendarEvents();
        this.applyDisabledDates();
      },
      error: () => {
        this.availableTimeSlots = [];
        this.isLoadingSlots = false;
        this.noSlotsDates.add(dateStr);
        this.availableDates.delete(dateStr);
        this.buildCalendarEvents();
        this.applyDisabledDates();
      }
    });
  }

  private buildCalendarEvents() {
    this.calendarEvents = Array.from(this.availableDates).map((dateStr, i) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return {
        id: `slot-${i}`,
        title: 'Available',
        start: new Date(y, m - 1, d),
        type: 'available' as const
      };
    });
  }

  private formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Map API response to TimeSlot[]. Handles various response shapes. */
  private mapApiSlotsToTimeSlots(res: any): TimeSlot[] {
    const raw = Array.isArray(res) ? res : res?.slots ?? res?.data ?? res?.content ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return [];

    return raw.map((s: any, idx: number) => {
      const timeStr = this.extractTimeString(s);
      const available = s?.available ?? s?.isAvailable ?? s?.free ?? true;
      const hasConflict = s?.hasConflict ?? s?.conflict ?? s?.booked ?? !available;
      return {
        id: s?.id ?? idx + 1,
        time: timeStr,
        available: !!available,
        hasConflict: !!hasConflict
      };
    });
  }

  private extractTimeString(s: any): string {
    const val = s?.startTime ?? s?.time ?? s?.s ?? s?.start;
    if (!val) return '09:00 AM';
    if (typeof val === 'string') {
      if (val.includes('T')) {
        const d = new Date(val);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return val;
    }
    return '09:00 AM';
  }

  selectTimeSlot(slot: TimeSlot) {
    this.selectedTimeSlot = slot;
    this.hasConflict = slot.hasConflict;
    
    if (this.selectedDate && slot) {
      const newDateTime = this.combineDateAndTime(this.selectedDate, slot.time);
      this.rescheduleForm.patchValue({
        newDateTime: newDateTime
      });
    }
  }

  combineDateAndTime(date: Date, timeString: string): Date {
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    const newDate = new Date(date);
    newDate.setHours(hour, parseInt(minutes), 0, 0);
    return newDate;
  }

  formatDateTime(dateTime: string | undefined): string {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatNewDateTime(): string {
    if (!this.selectedDate || !this.selectedTimeSlot) return 'N/A';
    const newDateTime = this.combineDateAndTime(this.selectedDate, this.selectedTimeSlot.time);
    return newDateTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canSubmit(): boolean {
    return this.selectedDate !== null && 
           this.selectedTimeSlot !== null && 
           this.rescheduleForm.valid;
  }

  onSubmit() {
    if (this.canSubmit()) {
      const result = {
        originalAppointment: this.appointment,
        newDateTime: this.rescheduleForm.get('newDateTime')?.value,
        rescheduleReason: this.rescheduleForm.get('rescheduleReason')?.value,
        hasConflict: this.hasConflict
      };
      
      this.dialogRef.close(result);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 