import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { IconComponent } from '@lk/core';

interface CareTimetableItem {
  id: number; type: string; title: string; description: string; assignee: string;
  startTime: Date; endTime: Date; status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent'; column?: number;
}

@Component({
  selector: 'app-care-plan-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, IconComponent],
  templateUrl: './care-plan-tab.component.html',
  styleUrl: './care-plan-tab.component.scss'
})
export class CarePlanTabComponent {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  careSchedule: CareTimetableItem[] = [
    { id: 1, type: 'medication', title: 'Morning Medication', description: 'Metformin 500mg, Lisinopril 10mg', assignee: 'Nurse Sarah', startTime: new Date('2024-01-20T08:00:00'), endTime: new Date('2024-01-20T08:30:00'), status: 'completed', priority: 'high' },
    { id: 2, type: 'vitals', title: 'Vital Signs Check', description: 'Blood pressure, heart rate, temperature, blood glucose', assignee: 'Nurse Mike', startTime: new Date('2024-01-20T09:00:00'), endTime: new Date('2024-01-20T09:15:00'), status: 'completed', priority: 'medium' },
    { id: 3, type: 'consultation', title: 'Doctor Consultation', description: 'Review treatment progress and adjust medications', assignee: 'Dr. Michael Chen', startTime: new Date('2024-01-20T10:00:00'), endTime: new Date('2024-01-20T10:30:00'), status: 'scheduled', priority: 'high' },
    { id: 4, type: 'lab', title: 'Blood Test', description: 'Fasting blood glucose and HbA1c', assignee: 'Lab Technician', startTime: new Date('2024-01-20T11:00:00'), endTime: new Date('2024-01-20T11:30:00'), status: 'scheduled', priority: 'medium' }
  ];

  getStatusColor(status: string): string {
    const map: Record<string, string> = { completed: '#10b981', 'in-progress': '#f59e0b', scheduled: '#3b82f6', cancelled: '#ef4444' };
    return map[status] ?? '#6b7280';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = { completed: 'check_circle', 'in-progress': 'pending', scheduled: 'schedule', cancelled: 'cancel' };
    return map[status] ?? 'help';
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = { urgent: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
    return map[priority] ?? '#6b7280';
  }
}
