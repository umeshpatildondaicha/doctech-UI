import { Component, Input } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { IconComponent } from '@lk/core';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';

interface VitalSign {
  id: string; type: string; value: number; unit: string;
  date: Date; time: Date; recordedBy: string; notes?: string; isNormal: boolean;
}

@Component({
  selector: 'app-vitals-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, IconComponent,JsonPipe,TranslatePipe],
  templateUrl: './vitals-tab.component.html',
  styleUrl: './vitals-tab.component.scss'
})
export class VitalsTabComponent {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  vitalSigns: VitalSign[] = [
    { id: 'V001', type: 'Blood Pressure', value: 140, unit: 'mmHg', date: new Date('2024-01-20'), time: new Date('2024-01-20T08:00:00'), recordedBy: 'Nurse Sarah', notes: 'Systolic elevated', isNormal: false },
    { id: 'V002', type: 'Heart Rate', value: 72, unit: 'bpm', date: new Date('2024-01-20'), time: new Date('2024-01-20T08:00:00'), recordedBy: 'Nurse Sarah', isNormal: true },
    { id: 'V003', type: 'Temperature', value: 98.6, unit: '°F', date: new Date('2024-01-20'), time: new Date('2024-01-20T08:00:00'), recordedBy: 'Nurse Sarah', isNormal: true },
    { id: 'V004', type: 'Blood Glucose', value: 180, unit: 'mg/dL', date: new Date('2024-01-20'), time: new Date('2024-01-20T08:00:00'), recordedBy: 'Nurse Sarah', notes: 'Fasting glucose elevated', isNormal: false }
  ];

  displayedColumns = ['type', 'value', 'status', 'date', 'time', 'recordedBy'];
}
