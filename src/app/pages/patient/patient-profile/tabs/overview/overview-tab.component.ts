import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IconComponent, AppButtonComponent } from '@lk/core';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';

export interface OverviewPatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  contactNumber: string;
  primaryDoctor: string;
  department: string;
  diagnosis: string[];
  allergies: string[];
  admissionStatus: 'IPD' | 'OPD' | 'DISCHARGED';
  emergencyContact: string;
}

export interface OverviewPatientStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  activeMedications: number;
  labReports: number;
  abnormalLabReports: number;
  clinicalNotes: number;
  readmissionCount: number;
}

export interface OverviewVitalSign {
  type: string;
  value: number;
  unit: string;
  isNormal: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-overview-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatMenuModule, MatButtonModule, MatIconModule, IconComponent, AppButtonComponent,TranslatePipe,JsonPipe],
  templateUrl: './overview-tab.component.html',
  styleUrl: './overview-tab.component.scss'
})
export class OverviewTabComponent implements OnChanges {
  @Input() patientInfo!: OverviewPatientInfo;
  @Input() patientStats!: OverviewPatientStats;
  @Input() vitalSigns: OverviewVitalSign[] = [];
  @Input() quickActions: QuickAction[] = [];

  @Output() quickActionTriggered = new EventEmitter<string>();

  abnormalVitals: OverviewVitalSign[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vitalSigns']) {
      this.abnormalVitals = (this.vitalSigns || []).filter(v => !v.isNormal);
    }
  }

  onQuickAction(actionId: string): void {
    this.quickActionTriggered.emit(actionId);
  }
}
