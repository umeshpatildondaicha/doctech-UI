import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { IconComponent} from '@lk/core';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';

interface Appointment {
  id: string; date: Date; time: Date; type: string;
  doctor: string; department: string; status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'; notes?: string;
}

@Component({
  selector: 'app-appointments-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, IconComponent,TranslatePipe],
  templateUrl: './appointments-tab.component.html',
  styleUrl: './appointments-tab.component.scss'
})
export class AppointmentsTabComponent {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  appointments: Appointment[] = [
    { id: 'A001', date: new Date('2024-01-22'), time: new Date('2024-01-22T10:00:00'), type: 'Follow-up', doctor: 'Dr. Michael Chen', department: 'Cardiology', status: 'scheduled', notes: 'Review medication effectiveness' },
    { id: 'A002', date: new Date('2024-01-25'), time: new Date('2024-01-25T14:00:00'), type: 'Consultation', doctor: 'Dr. Emily Rodriguez', department: 'Endocrinology', status: 'scheduled', notes: 'Diabetes management consultation' }
  ];

  displayedColumns = ['date', 'time', 'type', 'doctor', 'department', 'status'];
}
