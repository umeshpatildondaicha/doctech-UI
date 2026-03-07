import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { IconComponent, AppButtonComponent, DialogboxService, DialogFooterAction } from '@lk/core';
import { AddRoundDialogComponent } from '../../../add-round-dialog/add-round-dialog.component';
import { ScheduleRoundsDialogComponent } from '../../../schedule-rounds-dialog/schedule-rounds-dialog.component';
import { PatientRound, RoundSchedule } from '../../../../../interfaces/patient-rounds.interface';

@Component({
  selector: 'app-rounds-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, IconComponent, AppButtonComponent],
  templateUrl: './rounds-tab.component.html',
  styleUrl: './rounds-tab.component.scss'
})
export class RoundsTabComponent implements OnInit {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  patientRounds: PatientRound[] = [];
  roundSchedules: RoundSchedule[] = [];

  constructor(private readonly dialogService: DialogboxService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.patientRounds = [
      {
        id: 'R001', patientId: this.patientId, roundType: 'DOCTOR_ROUND', performedBy: 'Dr. Sarah Johnson',
        performedById: 'DOC001', performedByRole: 'DOCTOR', roundDate: new Date(), roundTime: new Date(Date.now() - 7200000),
        status: 'COMPLETED', priority: 'HIGH', notes: 'Patient showing improvement. Vital signs stable.',
        observations: ['Patient alert and responsive', 'No signs of respiratory distress'],
        vitalSigns: { bloodPressure: '120/80', heartRate: 75, temperature: 36.8, respiratoryRate: 18, oxygenSaturation: 98, painLevel: 3 },
        medications: [], careInstructions: ['Continue current medication', 'Monitor vital signs every 4 hours'],
        isCritical: false, requiresFollowUp: true, followUpNotes: 'Schedule follow-up in 1 week'
      }
    ];
    this.roundSchedules = [
      {
        id: 'RS001', patientId: this.patientId, roundType: 'DOCTOR_ROUND', scheduledTime: new Date(Date.now() + 14400000),
        frequency: 'DAILY', assignedTo: 'Dr. Sarah Johnson', assignedToId: 'DOC001', assignedToRole: 'DOCTOR',
        priority: 'HIGH', isActive: true, createdBy: 'Dr. Sarah Johnson', createdDate: new Date(),
        nextScheduled: new Date(Date.now() + 14400000)
      }
    ];
  }

  addNewRound(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'save', text: 'Save Round', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(AddRoundDialogComponent, {
      title: 'Add Patient Round', width: '60%',
      data: { patientId: this.patientId, patientName: this.patientName },
      footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result && (result.formData || (!result.action && result !== null))) {
        const d = result.formData || result;
        this.patientRounds.unshift({
          id: `R${Date.now()}`, patientId: this.patientId, roundType: d.roundType, performedBy: d.performedBy,
          performedById: 'DOC001', performedByRole: d.performedByRole,
          roundDate: d.roundDate ? new Date(d.roundDate) : new Date(),
          roundTime: d.roundTime ? new Date(d.roundTime) : new Date(),
          status: d.status || 'COMPLETED', priority: d.priority || 'MEDIUM', notes: d.notes || '',
          observations: d.observations || [], medications: [], careInstructions: d.careInstructions || [],
          isCritical: d.isCritical || false, requiresFollowUp: d.requiresFollowUp || false
        });
      }
    });
  }

  scheduleRounds(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'schedule', text: 'Schedule Rounds', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(ScheduleRoundsDialogComponent, {
      title: 'Schedule Patient Rounds', width: '60%',
      data: { patientId: this.patientId, patientName: this.patientName },
      footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result && (result.formData || (!result.action && result !== null))) {
        const d = result.formData || result;
        this.roundSchedules.push({
          id: `SCH${Date.now()}`, patientId: this.patientId, roundType: d.roundType,
          scheduledTime: d.scheduledTime ? new Date(d.scheduledTime) : new Date(),
          frequency: d.frequency, assignedTo: d.assignedTo, assignedToId: 'STAFF001',
          assignedToRole: d.assignedToRole, priority: d.priority || 'MEDIUM',
          isActive: d.isActive !== false, createdBy: 'Current User', createdDate: new Date()
        });
      }
    });
  }

  getRoundTypeIcon(roundType: string): string {
    const map: Record<string, string> = { DOCTOR_ROUND: 'person', NURSE_ROUND: 'medical_services', CLEANING_ROUND: 'cleaning_services', DIET_ROUND: 'restaurant', PHYSIOTHERAPY_ROUND: 'fitness_center' };
    return map[roundType] ?? 'assessment';
  }

  getRoundTypeColor(roundType: string): string {
    const map: Record<string, string> = { DOCTOR_ROUND: '#3b82f6', NURSE_ROUND: '#10b981', CLEANING_ROUND: '#6b7280', DIET_ROUND: '#f59e0b', PHYSIOTHERAPY_ROUND: '#8b5cf6' };
    return map[roundType] ?? '#6b7280';
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = { urgent: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#3b82f6', LOW: '#10b981' };
    return map[priority] ?? '#6b7280';
  }

  formatTimeAgo(date: Date): string {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
