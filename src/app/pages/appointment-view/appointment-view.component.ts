import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { Appointment } from '../../interfaces/appointment.interface';
import { IconComponent } from "@lk/core";
import { ImageComponent } from "@lk/core";
import { DIALOG_DATA_TOKEN } from "@lk/core";
import { Subject } from 'rxjs';

@Component({
  selector: 'app-appointment-view',
  standalone: true,
  imports: [CommonModule, IconComponent, ImageComponent],
  templateUrl: './appointment-view.component.html',
  styleUrl: './appointment-view.component.scss'
})
export class AppointmentViewComponent implements OnInit, OnDestroy {
  appointment: Appointment | undefined;
  patient: any;
  patientImageSrc: string = 'assets/avatars/default-avatar.jpg'; // Stable image source
  
  // Cached computed values to prevent repeated method calls
  statusIcon: string = 'event';
  formattedAppointmentDateTime: string = 'N/A';
  formattedCreatedAt: string = 'N/A';
  formattedUpdatedAt: string = 'N/A';
  statusClass: string = '';
  
  dialogRef = inject(MatDialogRef<AppointmentViewComponent>);
  data = inject<{ appointment: Appointment }>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  constructor() {
    this.appointment = this.data.appointment;
  }

  ngOnInit() {
    this.loadPatientData();
    this.precomputeValues();
  }

  private precomputeValues() {
    // Pre-compute all values once to prevent repeated method calls in template
    this.statusIcon = this.getStatusIcon();
    this.formattedAppointmentDateTime = this.formatDateTime(this.appointment?.appointment_date_time);
    this.formattedCreatedAt = this.formatDateTime(this.appointment?.created_at);
    this.formattedUpdatedAt = this.formatDateTime(this.appointment?.updated_at);
    this.statusClass = this.appointment?.status?.toLowerCase() || '';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPatientData() {
    // Mock patient data - in real app, this would come from a service
    // Only set once to prevent repeated object creation
    if (!this.patient) {
      this.patient = {
        name: this.appointment?.patientName,
        age: 35,
        gender: 'Male',
        number: '+1 234 567 8900',
        email: 'patient@example.com',
        image: 'assets/avatars/default-avatar.jpg'
      };
      // Set stable image source
      this.patientImageSrc = this.patient.image || 'assets/avatars/default-avatar.jpg';
    }
  }

  getStatusIcon(): string {
    switch (this.appointment?.status) {
      case 'SCHEDULED':
        return 'schedule';
      case 'COMPLETED':
        return 'check_circle';
      case 'CANCELED':
        return 'cancel';
      case 'PENDING':
        return 'pending';
      default:
        return 'event';
    }
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

  onReschedule() {
    this.dialogRef.close({ action: 'reschedule', appointment: this.appointment });
  }

  onViewProfile() {
    this.dialogRef.close({ action: 'viewProfile', appointment: this.appointment });
  }

  onCancelAppointment() {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.dialogRef.close({ action: 'cancel', appointment: this.appointment });
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  private imageErrorHandled: boolean = false;

  onImageError(event: Event) {
    // Prevent infinite loop by only handling error once
    if (this.imageErrorHandled) {
      return;
    }
    
    const img = event.target as HTMLImageElement;
    const defaultAvatar = 'assets/avatars/default-avatar.jpg';
    
    // Only handle if not already set to default
    if (img.src && !img.src.includes('default-avatar.jpg') && this.patientImageSrc !== defaultAvatar) {
      this.imageErrorHandled = true;
      this.patientImageSrc = defaultAvatar;
    } else if (img.src.includes('default-avatar.jpg')) {
      // If default also fails, hide the image to stop the loop
      this.imageErrorHandled = true;
      img.style.display = 'none';
      img.src = ''; // Clear src to prevent further attempts
    }
  }
}
