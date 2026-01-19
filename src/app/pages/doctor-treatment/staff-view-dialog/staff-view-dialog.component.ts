import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA_TOKEN, IconComponent, AppButtonComponent } from "@lk/core";

export interface StaffViewDialogData {
  staff: {
    id: string;
    name: string;
    role: string;
    department: string;
    status: string;
    currentPatients: number;
    maxPatients: number;
    workload: number;
    shift: string;
    nextShift?: string;
    email?: string;
    phone?: string;
    workAddress?: string;
    reportsTo?: string;
    performance: {
      roundsCompleted: number;
      tasksCompleted: number;
      patientSatisfaction: number;
      efficiency: number;
    };
  };
}

@Component({
  selector: 'app-staff-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    AppButtonComponent
  ],
  templateUrl: './staff-view-dialog.component.html',
  styleUrls: ['./staff-view-dialog.component.scss']
})
export class StaffViewDialogComponent {
  data = inject<StaffViewDialogData>(DIALOG_DATA_TOKEN);

  get staff() {
    return this.data?.staff;
  }

  getStaffInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  getWorkloadColor(workload: number): string {
    if (workload >= 80) return '#ef4444'; // Red for high
    if (workload >= 60) return '#f59e0b'; // Orange for medium
    return '#10b981'; // Green for low
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'on vacation':
      case 'vacation':
        return '#f59e0b';
      case 'off':
        return '#6b7280';
      default:
        return '#10b981';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Active';
      case 'on vacation':
      case 'vacation':
        return 'On Vacation';
      case 'off':
        return 'Off Duty';
      default:
        return status;
    }
  }

  viewStaffProfile(staffId: string): void {
    console.log('View clicked', staffId);
  }

  viewStaffNotes(staffId: string): void {
    console.log('Notes clicked', staffId);
  }

  editProfile(): void {
    console.log('Edit profile clicked');
  }
}

