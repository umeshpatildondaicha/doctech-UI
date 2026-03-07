import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { IconComponent } from '@lk/core';

interface ClinicalNote {
  id: string; date: Date; type: string; title: string;
  content: string; author: string; tags: string[]; isPrivate: boolean;
}

@Component({
  selector: 'app-clinical-notes-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, IconComponent],
  templateUrl: './clinical-notes-tab.component.html',
  styleUrl: './clinical-notes-tab.component.scss'
})
export class ClinicalNotesTabComponent {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  clinicalNotes: ClinicalNote[] = [
    { id: 'C001', date: new Date('2024-01-20'), type: 'Progress Note', title: 'Daily Progress Note', content: 'Patient showing improvement in blood pressure control. Blood glucose levels remain elevated. Continue current medication regimen.', author: 'Dr. Michael Chen', tags: ['progress', 'medication'], isPrivate: false },
    { id: 'C002', date: new Date('2024-01-19'), type: 'Assessment', title: 'Initial Assessment', content: 'Patient admitted for uncontrolled hypertension and diabetes. Started on appropriate medications. Monitoring vital signs closely.', author: 'Dr. Michael Chen', tags: ['assessment', 'admission'], isPrivate: false }
  ];
}
