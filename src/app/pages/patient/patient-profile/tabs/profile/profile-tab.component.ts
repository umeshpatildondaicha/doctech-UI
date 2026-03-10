import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { IconComponent } from '@lk/core';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';

@Component({
  selector: 'app-profile-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule,JsonPipe, IconComponent,TranslatePipe],
  templateUrl: './profile-tab.component.html',
  styleUrl: './profile-tab.component.scss'
})
export class ProfileTabComponent implements OnChanges {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  // Profile data — in production these would come from an API
  info = {
    name: '', id: '', age: 34, gender: 'Female', bloodGroup: 'O+',
    contactNumber: '+1 (555) 123-4567', email: 'patient@email.com',
    address: '123 Main Street, New York, NY 10001',
    emergencyContact: '+1 (555) 987-6543', emergencyContactRelation: 'Spouse',
    occupation: 'Software Engineer', maritalStatus: 'Married', nextOfKin: 'Spouse',
    primaryDoctor: 'Dr. Michael Chen', department: 'Cardiology',
    diagnosis: ['Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia'],
    allergies: ['Penicillin', 'Sulfa drugs', 'Latex'],
    insuranceProvider: 'Blue Cross Blue Shield',
    admissionStatus: 'OPD'
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientName'] || changes['patientId']) {
      this.info.name = this.patientName || this.info.name;
      this.info.id = this.patientId || this.info.id;
    }
  }
}
