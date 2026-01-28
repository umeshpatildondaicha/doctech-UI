import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { DIALOG_DATA_TOKEN, IconComponent } from '@lk/core';

export interface DoctorViewDialogData {
  doctor: any;
}

@Component({
    selector: 'app-doctor-view-dialog',
    imports: [
        CommonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        IconComponent
    ],
    templateUrl: './doctor-view-dialog.component.html',
    styleUrls: ['./doctor-view-dialog.component.scss']
})
export class DoctorViewDialogComponent {
  dialogRef = inject(MatDialogRef<DoctorViewDialogComponent>);
  data = inject<DoctorViewDialogData>(DIALOG_DATA_TOKEN);

  get doctor() {
    return this.data?.doctor || {};
  }

  close(): void {
    this.dialogRef.close();
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4caf50';
      case 'inactive':
        return '#9e9e9e';
      case 'on leave':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  }

  getAvailabilityColor(availability: string): string {
    switch (availability?.toLowerCase()) {
      case 'available':
        return '#4caf50';
      case 'on leave':
        return '#ff9800';
      case 'emergency only':
        return '#ff5722';
      case 'inactive':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  }

  getAssociatedHospitals(): any[] {
    const primaryHospital = this.doctor.hospital;
    const hospitalAssociations = this.doctor.hospitalAssociations || [];
    
    // If hospitalAssociations is an array of objects, extract hospital names
    if (hospitalAssociations.length > 0) {
      return hospitalAssociations.map((assoc: any) => {
        // Handle different data structures
        if (typeof assoc === 'string') {
          return assoc;
        } else if (assoc.hospitalName) {
          return assoc.hospitalName;
        } else if (assoc.name) {
          return assoc.name;
        } else if (assoc.hospital) {
          return assoc.hospital;
        }
        return assoc;
      }).filter((hospital: string) => {
        // Filter out the primary hospital if it's in the associations
        return hospital && hospital !== primaryHospital;
      });
    }
    
    return [];
  }

  hasAssociatedHospitals(): boolean {
    return this.getAssociatedHospitals().length > 0;
  }
}

