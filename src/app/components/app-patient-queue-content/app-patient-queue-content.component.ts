import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientQueueService } from '@lk/template';
import { IconComponent, DialogboxService, DialogFooterAction } from '@lk/core';
import type { NextUpPatient, QueuePatient } from '@lk/template';
import { AppointmentRescheduleComponent } from '../../pages/appointment-reschedule/appointment-reschedule.component';
import {
  AddEmergencyPatientDialogComponent,
  type AddEmergencyDialogResult,
} from '../add-emergency-patient-dialog/add-emergency-patient-dialog.component';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';

/** API queue item shape */
interface QueueApiItem {
  queuePosition: number;
  appointmentPublicId: string;
  patientPublicId: string;
  patientName: string;
  patientProfileImageUrl: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentStatus: string;
  reason: string;
}

@Component({
  selector: 'app-app-patient-queue-content',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './app-patient-queue-content.component.html',
  styleUrl: './app-patient-queue-content.component.scss',
})
export class AppPatientQueueContentComponent implements OnInit {
  private queueService = inject(PatientQueueService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogboxService);
  private snackBar = inject(MatSnackBar);

  @Output() startClick = new EventEmitter<{ id: string; name: string }>();
  @Output() patientClick = new EventEmitter<{ id: string; name: string }>();

  displayNextUp = this.queueService.nextUp;
  displayQueue = this.queueService.queue;
  displayWaitingCount = this.queueService.waitingCount;

  ngOnInit(): void {
    // Queue API requires doctor authentication; skip request if user is not logged in as doctor
    if (!this.authService.isDoctor()) {
      this.applyQueueData([]);
      return;
    }
    const doctorCode = this.authService.getDoctorRegistrationNumber();
    if (!doctorCode) {
      this.applyQueueData([]);
      return;
    }
    this.appointmentService.getDoctorQueue(doctorCode).subscribe({
      next: (data: unknown) => {
        const items = this.normalizeQueueResponse(data);
        this.applyQueueData(items);
      },
      error: (err: unknown) => {
        const status = (err as any)?.status;
        const message = (err as any)?.error?.message ?? (err as any)?.message;
        if (status === 403 || message === 'Doctor authentication required') {
          // Backend requires doctor role; show empty queue without spamming console
          this.applyQueueData([]);
          return;
        }
        console.error('[AppPatientQueueContent] Doctor queue API error:', err);
        this.applyQueueData([]);
      },
    });
  }

  private normalizeQueueResponse(data: unknown): QueueApiItem[] {
    const raw = Array.isArray(data) ? data : (data as any)?.content ?? (data as any)?.queue ?? [];
    return Array.isArray(raw) ? raw : [];
  }

  private formatTime24To12(timeStr: string): string {
    const [h, m] = (timeStr || '00:00:00').split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const min = (m ?? 0).toString().padStart(2, '0');
    return `${hour12}:${min} ${period}`;
  }

  private computeWaitingTime(appointmentDate: string, startTime: string): string {
    try {
      const [h, m] = (startTime || '0:0').split(':').map(Number);
      const d = new Date(appointmentDate);
      d.setHours(h ?? 0, m ?? 0, 0, 0);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 0) return 'Scheduled';
      if (diffMins < 60) return `${diffMins} minutes`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (mins > 0) return `${hours}h ${mins}m`;
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } catch {
      return '—';
    }
  }

  private mapToNextUp(item: QueueApiItem): NextUpPatient & { appointmentPublicId: string; appointmentDate: string; startTime: string } {
    return {
      id: item.patientPublicId,
      name: item.patientName,
      reason: item.reason || '—',
      waitingTime: this.computeWaitingTime(item.appointmentDate, item.startTime),
      avatar: item.patientProfileImageUrl ?? undefined,
      appointmentPublicId: item.appointmentPublicId,
      appointmentDate: item.appointmentDate,
      startTime: item.startTime,
    };
  }

  private mapToQueuePatient(item: QueueApiItem, index: number): QueuePatient & { appointmentPublicId: string; patientPublicId: string } {
    return {
      id: item.appointmentPublicId,
      name: item.patientName,
      scheduledTime: this.formatTime24To12(item.startTime),
      isActive: index === 0,
      avatar: item.patientProfileImageUrl ?? undefined,
      reason: item.reason,
      appointmentPublicId: item.appointmentPublicId,
      patientPublicId: item.patientPublicId,
    };
  }

  private applyQueueData(items: QueueApiItem[]): void {
    if (items.length === 0) {
      this.queueService.setNextUp(null);
      this.queueService.setQueue([]);
      return;
    }
    const [first, ...rest] = items;
    this.queueService.setNextUp(this.mapToNextUp(first));
    this.queueService.setQueue(rest.map((item, i) => this.mapToQueuePatient(item, i)));
  }

  onStartClick(patient: NextUpPatient) {
    this.queueService.startPatient(patient);
    this.startClick.emit({ id: patient.id, name: patient.name });
    this.router.navigate(['/patient', patient.id]);
  }

  onPatientClick(patient: QueuePatient) {
    this.queueService.setActivePatient(patient.id);
    this.patientClick.emit({ id: patient.id, name: patient.name });
  }

  onRescheduleClick(patient: NextUpPatient & { appointmentPublicId?: string; appointmentDate?: string; startTime?: string }) {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'apply', text: 'Reschedule Appointment', color: 'primary', appearance: 'raised' },
    ];

    const appointmentPublicId = patient.appointmentPublicId ?? '';
    const appointmentDateTime = patient.appointmentDate && patient.startTime
      ? `${patient.appointmentDate}T${patient.startTime}`
      : new Date().toISOString();

    const dialogRef = this.dialogService.openDialog(AppointmentRescheduleComponent, {
      title: 'Reschedule Appointment',
      width: '70%',
      height: '90%',
      data: {
        appointment: {
          appointment_id: 0,
          patient_id: 0,
          patientName: patient.name,
          appointment_date_time: appointmentDateTime,
          notes: patient.reason,
          status: 'SCHEDULED',
          doctor_id: 0,
          slot_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          appointmentPublicId,
        },
      },
      footerActions,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && (result.newDateTime || (!result.action && result !== null))) {
        this.snackBar.open(`Appointment rescheduled for ${patient.name}`, 'Close', {
          duration: 3000,
        });
      }
    });
  }

  onCompleteClick(patient: NextUpPatient) {
    this.queueService.startPatient(patient);
    this.snackBar.open(`${patient.name} marked as completed`, 'Close', {
      duration: 2000,
    });
  }

  onAddEmergencyClick() {
    const count = this.queueService.queue().length;
    const ref = this.dialog.open(AddEmergencyPatientDialogComponent, {
      width: '420px',
      data: { queueCount: count },
    });
    ref.afterClosed().subscribe((result: AddEmergencyDialogResult | undefined) => {
      if (result) {
        this.addEmergencyPatient(result);
      }
    });
  }

  private addEmergencyPatient(data: AddEmergencyDialogResult) {
    const id = `emergency-${Date.now()}`;
    const newPatient: QueuePatient = {
      id,
      name: data.name,
      reason: data.reason,
      scheduledTime: data.scheduledTime,
      isActive: false,
    };
    const currentQueue = [...this.queueService.queue()];
    const pos = Math.min(data.insertAt, currentQueue.length);
    currentQueue.splice(pos, 0, newPatient);
    // Update active state - first item active if any
    const updated = currentQueue.map((p, i) => ({
      ...p,
      isActive: i === 0,
    }));
    this.queueService.setQueue(updated);
    this.snackBar.open(`${data.name} added to queue`, 'Close', {
      duration: 2000,
    });
  }
}
