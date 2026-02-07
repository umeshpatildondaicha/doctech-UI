import { Component, Output, EventEmitter, inject } from '@angular/core';
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

@Component({
  selector: 'app-app-patient-queue-content',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './app-patient-queue-content.component.html',
  styleUrl: './app-patient-queue-content.component.scss',
})
export class AppPatientQueueContentComponent {
  private queueService = inject(PatientQueueService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogboxService);
  private snackBar = inject(MatSnackBar);

  @Output() startClick = new EventEmitter<{ id: string; name: string }>();
  @Output() patientClick = new EventEmitter<{ id: string; name: string }>();

  displayNextUp = this.queueService.nextUp;
  displayQueue = this.queueService.queue;
  displayWaitingCount = this.queueService.waitingCount;

  onStartClick(patient: NextUpPatient) {
    this.queueService.startPatient(patient);
    this.startClick.emit({ id: patient.id, name: patient.name });
    this.router.navigate(['/patient', patient.id]);
  }

  onPatientClick(patient: QueuePatient) {
    this.queueService.setActivePatient(patient.id);
    this.patientClick.emit({ id: patient.id, name: patient.name });
  }

  onRescheduleClick(patient: NextUpPatient) {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'apply', text: 'Reschedule Appointment', color: 'primary', appearance: 'raised' },
    ];

    const dialogRef = this.dialogService.openDialog(AppointmentRescheduleComponent, {
      title: 'Reschedule Appointment',
      width: '70%',
      height: '90%',
      data: {
        appointment: {
          appointment_id: 0,
          patient_id: 0,
          patientName: patient.name,
          appointment_date_time: new Date().toISOString(),
          notes: patient.reason,
          status: 'SCHEDULED',
          doctor_id: 0,
          slot_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
