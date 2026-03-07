import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { IconComponent, AppButtonComponent } from '@lk/core';
import { OverviewPatientStats, OverviewVitalSign } from '../overview/overview-tab.component';

export interface CareTimetableItem {
  id: number;
  type: string;
  title: string;
  description: string;
  assignee: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

@Component({
  selector: 'app-medical-record-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, IconComponent, AppButtonComponent],
  templateUrl: './medical-record-tab.component.html',
  styleUrl: './medical-record-tab.component.scss'
})
export class MedicalRecordTabComponent implements OnChanges {
  @Input() patientStats!: OverviewPatientStats;
  @Input() vitalSigns: OverviewVitalSign[] = [];
  @Input() careSchedule: CareTimetableItem[] = [];

  abnormalVitalsCount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vitalSigns']) {
      this.abnormalVitalsCount = (this.vitalSigns || []).filter(v => !v.isNormal).length;
    }
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = { completed: '#10b981', 'in-progress': '#3b82f6', scheduled: '#f59e0b', cancelled: '#6b7280' };
    return map[status] ?? '#6b7280';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = { completed: 'check_circle', 'in-progress': 'play_circle', scheduled: 'schedule', cancelled: 'cancel' };
    return map[status] ?? 'circle';
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = { urgent: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
    return map[priority] ?? '#6b7280';
  }
}
