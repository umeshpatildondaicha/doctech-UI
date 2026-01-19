import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Appointment } from '../../interfaces/appointment.interface';
import { AppInputComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CalendarComponent, ImageComponent, DIALOG_DATA_TOKEN } from "@lk/core";
import { filter } from 'rxjs';

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
  standalone: true,
  imports: [
    AppInputComponent,
    AppButtonComponent,
    ImageComponent,
    IconComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    CalendarComponent
  ]
})
export class AppointmentRescheduleComponent implements OnInit {
  rescheduleForm: FormGroup;
  submitButtonText: string = 'Reschedule Appointment';
  appointment: Appointment | undefined;
  
  selectedDate: Date | null = null;
  selectedTimeSlot: TimeSlot | null = null;
  availableTimeSlots: TimeSlot[] = [];
  hasConflict: boolean = false;
  
  calendarEvents: any[] = [];

  dialogRef = inject(MatDialogRef<AppointmentRescheduleComponent>);
  data = inject<{ appointment?: Appointment }>(DIALOG_DATA_TOKEN);

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
    this.loadCalendarEvents();
    
    // Listen for dialog close events to handle footer actions
    this.dialogRef.beforeClosed().pipe(
      filter(result => result?.action === 'submit' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        return;
      }
      
      if (result?.action === 'submit') {
        // Handle submit action from footer
        if (this.canSubmit()) {
          // Use a small delay to ensure form validation completes
          setTimeout(() => {
            const submitResult = {
              originalAppointment: this.appointment,
              newDateTime: this.rescheduleForm.get('newDateTime')?.value,
              rescheduleReason: this.rescheduleForm.get('rescheduleReason')?.value,
              hasConflict: this.hasConflict
            };
            // Close with form data - this will override the action-only close
            this.dialogRef.close(submitResult);
          }, 10);
        }
        // If invalid, dialog closes with action='submit' and validation errors are shown
      }
    });
  }

  loadCalendarEvents() {
    // Mock calendar events - in real app, this would come from a service
    this.calendarEvents = [
      {
        date: new Date(2024, 0, 15),
        title: 'Appointment',
        color: '#667eea'
      },
      {
        date: new Date(2024, 0, 16),
        title: 'Appointment',
        color: '#667eea'
      }
    ];
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
    this.selectedTimeSlot = null;
    this.loadTimeSlotsForDate(date);
  }

  onEventClicked(event: any) {
    console.log('Calendar event clicked:', event);
  }

  loadTimeSlotsForDate(date: Date) {
    // Mock time slots - in real app, this would come from a service
    const baseSlots: TimeSlot[] = [
      { id: 1, time: '09:00 AM', available: true, hasConflict: false },
      { id: 2, time: '10:00 AM', available: true, hasConflict: false },
      { id: 3, time: '11:00 AM', available: true, hasConflict: false },
      { id: 4, time: '02:00 PM', available: true, hasConflict: false },
      { id: 5, time: '03:00 PM', available: true, hasConflict: false },
      { id: 6, time: '04:00 PM', available: true, hasConflict: false }
    ];

    // Simulate conflicts for demonstration
    if (date.getDate() === 15) {
      baseSlots[1].hasConflict = true;
      baseSlots[3].hasConflict = true;
    }

    this.availableTimeSlots = baseSlots;
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