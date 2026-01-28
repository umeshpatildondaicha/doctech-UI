import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, filter } from 'rxjs';

import { AppInputComponent, DIALOG_DATA_TOKEN, IconComponent } from "@lk/core";

export interface AppointmentBookingData {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorHospital: string;
  doctorLocation: string;
  doctorImage?: string;
  isReferral?: boolean;
  referringDoctor?: string;
}

type SlotStatus = 'available' | 'booked' | 'selected';

export interface TimeSlot {
  id: string;
  time: string;
  status: SlotStatus;
  isEmergency?: boolean;
}

type AppointmentPriority = 'normal' | 'urgent' | 'emergency';

export interface AppointmentRequest {
  patientId: string;
  doctorId: string;
  selectedDate: Date;
  selectedTimeSlot: TimeSlot;
  priority: AppointmentPriority;
  isEmergency: boolean;
  message?: string;
  sharedData: {
    medications: boolean;
    labReports: boolean;
    medicalHistory: boolean;
    vitalSigns: boolean;
    clinicalNotes: boolean;
  };
  referralNotes?: string;
}

@Component({
    selector: 'app-appointment-booking',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatCheckboxModule,
        MatRadioModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        AppInputComponent,
        IconComponent
    ],
    templateUrl: './appointment-booking.component.html',
    styleUrls: ['./appointment-booking.component.scss']
})
export class AppointmentBookingComponent implements OnInit, OnDestroy {
  appointmentForm: FormGroup;
  selectedDate: Date = new Date();
  selectedTimeSlot: TimeSlot | null = null;
  selectedPriority: AppointmentPriority = 'normal';
  doctorImageError = false;
  isEmergency: boolean = false;
  showMessageSection: boolean = false;
  showDataSharingSection: boolean = false;
  isLoading: boolean = false;

  // Available dates (next 7 days)
  availableDates: Date[] = [];
  
  // All time slots for the whole day
  allTimeSlots: TimeSlot[] = [
    { id: '1', time: '09:00 AM', status: 'available' },
    { id: '2', time: '09:15 AM', status: 'available' },
    { id: '3', time: '09:30 AM', status: 'booked' },
    { id: '4', time: '09:45 AM', status: 'available' },
    { id: '5', time: '10:00 AM', status: 'booked' },
    { id: '6', time: '10:15 AM', status: 'booked' },
    { id: '7', time: '10:30 AM', status: 'available' },
    { id: '8', time: '10:45 AM', status: 'available' },
    { id: '9', time: '11:00 AM', status: 'available' },
    { id: '10', time: '11:15 AM', status: 'available' },
    { id: '11', time: '11:30 AM', status: 'available' },
    { id: '12', time: '11:45 AM', status: 'available' },
    { id: '13', time: '12:00 PM', status: 'available' },
    { id: '14', time: '12:15 PM', status: 'available' },
    { id: '15', time: '12:30 PM', status: 'booked' },
    { id: '16', time: '12:45 PM', status: 'available' },
    { id: '17', time: '01:00 PM', status: 'available' },
    { id: '18', time: '01:15 PM', status: 'available' },
    { id: '19', time: '01:30 PM', status: 'available' },
    { id: '20', time: '01:45 PM', status: 'available' },
    { id: '21', time: '02:00 PM', status: 'available' },
    { id: '22', time: '02:15 PM', status: 'available' },
    { id: '23', time: '02:30 PM', status: 'available' },
    { id: '24', time: '02:45 PM', status: 'available' },
    { id: '25', time: '03:00 PM', status: 'available' },
    { id: '26', time: '03:15 PM', status: 'available' },
    { id: '27', time: '03:30 PM', status: 'available' },
    { id: '28', time: '03:45 PM', status: 'available' },
    { id: '29', time: '04:00 PM', status: 'available' },
    { id: '30', time: '04:15 PM', status: 'available' },
    { id: '31', time: '04:30 PM', status: 'available' },
    { id: '32', time: '04:45 PM', status: 'available' },
    { id: '33', time: '05:00 PM', status: 'available' },
    { id: '34', time: '05:15 PM', status: 'available' },
    { id: '35', time: '05:30 PM', status: 'available' },
    { id: '36', time: '05:45 PM', status: 'available' }
  ];

  currentTimeSlots: TimeSlot[] = this.allTimeSlots;

  // Data sharing options
  dataSharingOptions = [
    { key: 'medications', label: 'Current Medications', description: 'Share active medication list' },
    { key: 'labReports', label: 'Lab Reports', description: 'Share recent lab test results' },
    { key: 'medicalHistory', label: 'Medical History', description: 'Share patient medical history' },
    { key: 'vitalSigns', label: 'Vital Signs', description: 'Share recent vital signs data' },
    { key: 'clinicalNotes', label: 'Clinical Notes', description: 'Share clinical notes and observations' }
  ];

  dialogRef = inject(MatDialogRef<AppointmentBookingComponent>);
  data = inject<AppointmentBookingData>(DIALOG_DATA_TOKEN);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  constructor() {
    this.appointmentForm = this.fb.group({
      priority: ['normal', Validators.required],
      isEmergency: [false],
      message: [''],
      sharedData: this.fb.group({
        medications: [false],
        labReports: [false],
        medicalHistory: [false],
        vitalSigns: [false],
        clinicalNotes: [false]
      }),
      referralNotes: ['']
    });

    this.initializeAvailableDates();
  }

  ngOnInit(): void {
    // Set default values based on data
    if (this.data.isReferral) {
      this.appointmentForm.patchValue({
        referralNotes: `Patient referred by ${this.data.referringDoctor}`
      });
    }

    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'continue' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'continue') {
        this.onContinue();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAvailableDates(): void {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      this.availableDates.push(date);
    }
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    this.selectedTimeSlot = null;
  }

  onTimeSlotSelect(slot: TimeSlot): void {
    if (slot.status === 'available') {
      // Clear previous selection
      this.currentTimeSlots.forEach(s => {
        if (s.status === 'selected') {
          s.status = 'available';
        }
      });
      
      // Select new slot
      slot.status = 'selected';
      this.selectedTimeSlot = slot;
      
      // Check if slots are available, if not show message section
      this.checkSlotAvailability();
    }
  }

  onPriorityChange(priority: AppointmentPriority): void {
    this.selectedPriority = priority;
    this.isEmergency = priority === 'emergency';
    this.appointmentForm.patchValue({
      priority: priority,
      isEmergency: this.isEmergency
    });
  }


  private checkSlotAvailability(): void {
    const availableSlots = this.currentTimeSlots.filter(slot => slot.status === 'available');
    if (availableSlots.length === 0) {
      this.showMessageSection = true;
    } else {
      this.showMessageSection = false;
    }
  }

  onDataSharingToggle(): void {
    this.showDataSharingSection = !this.showDataSharingSection;
  }

  onDataOptionChange(option: string, checked: boolean): void {
    const sharedData = this.appointmentForm.get('sharedData') as FormGroup;
    sharedData.patchValue({ [option]: checked });
  }

  onContinue(): void {
    if (!this.selectedTimeSlot) {
      this.snackBar.open('Please select a time slot', 'Close', { duration: 3000 });
      setTimeout(() => {
        this.dialogRef.close(false);
      }, 0);
      return;
    }

    if (this.appointmentForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      setTimeout(() => {
        this.dialogRef.close(false);
      }, 0);
      return;
    }

    this.isLoading = true;

    const appointmentRequest: AppointmentRequest = {
      patientId: this.data.patientId,
      doctorId: this.data.doctorId,
      selectedDate: this.selectedDate,
      selectedTimeSlot: this.selectedTimeSlot,
      priority: this.selectedPriority,
      isEmergency: this.isEmergency,
      message: this.appointmentForm.get('message')?.value,
      sharedData: this.appointmentForm.get('sharedData')?.value,
      referralNotes: this.appointmentForm.get('referralNotes')?.value
    };

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.dialogRef.close({
        action: 'book',
        appointment: appointmentRequest
      });
      
      this.snackBar.open(
        this.isEmergency 
          ? 'Emergency appointment request sent successfully!' 
          : 'Appointment request sent successfully!', 
        'Close', 
        { duration: 3000 }
      );
    }, 2000);
  }

  onCancel(): void {
    // This method is no longer needed as dialog handles cancellation via footer
  }

  canContinue(): boolean {
    return !!this.selectedTimeSlot && !this.isLoading;
  }

  onDoctorImageError(): void {
    this.doctorImageError = true;
  }

  getSlotStatusClass(slot: TimeSlot): string {
    switch (slot.status) {
      case 'available': return 'slot-available';
      case 'booked': return 'slot-booked';
      case 'selected': return 'slot-selected';
      default: return '';
    }
  }

  getSlotStatusIcon(slot: TimeSlot): string {
    switch (slot.status) {
      case 'available': return 'schedule';
      case 'booked': return 'block';
      case 'selected': return 'check_circle';
      default: return 'schedule';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'normal': return '#6b7280';
      case 'urgent': return '#f59e0b';
      case 'emergency': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'normal': return 'schedule';
      case 'urgent': return 'warning';
      case 'emergency': return 'emergency';
      default: return 'schedule';
    }
  }

  formatDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  }

  getAvailableSlotsCount(): number {
    return this.currentTimeSlots.filter(slot => slot.status === 'available').length;
  }

  getBookedSlotsCount(): number {
    return this.currentTimeSlots.filter(slot => slot.status === 'booked').length;
  }
}
