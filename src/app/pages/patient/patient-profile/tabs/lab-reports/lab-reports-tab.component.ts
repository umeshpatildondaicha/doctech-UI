import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { IconComponent } from '@lk/core';

interface LabReport {
  id: string; testName: string; category: string; result: string;
  normalRange: string; unit: string; date: Date; status: 'pending' | 'completed' | 'abnormal';
  orderedBy: string; notes?: string;
}

@Component({
  selector: 'app-lab-reports-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, IconComponent],
  templateUrl: './lab-reports-tab.component.html',
  styleUrl: './lab-reports-tab.component.scss'
})
export class LabReportsTabComponent {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  labReports: LabReport[] = [
    { id: 'L001', testName: 'Complete Blood Count', category: 'Hematology', result: 'Normal', normalRange: '4.5-11.0', unit: 'K/µL', date: new Date('2024-01-19'), status: 'completed', orderedBy: 'Dr. Michael Chen' },
    { id: 'L002', testName: 'HbA1c', category: 'Diabetes', result: '8.2', normalRange: '4.0-5.6', unit: '%', date: new Date('2024-01-19'), status: 'abnormal', orderedBy: 'Dr. Michael Chen', notes: 'Poor glycemic control' },
    { id: 'L003', testName: 'Lipid Panel', category: 'Cardiovascular', result: 'Elevated', normalRange: '<200', unit: 'mg/dL', date: new Date('2024-01-19'), status: 'abnormal', orderedBy: 'Dr. Michael Chen', notes: 'Total cholesterol 240 mg/dL' }
  ];

  displayedColumns = ['testName', 'category', 'result', 'normalRange', 'status', 'date', 'orderedBy'];
}
