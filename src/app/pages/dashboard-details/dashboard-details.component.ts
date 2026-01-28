import { Component, Input, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

import { Patient } from '../../interfaces/patient.interface';
import { Appointment } from '../../interfaces/appointment.interface';
import { Billing } from '../../interfaces/billing.interface';
import { IconComponent } from "@lk/core";
import { GridComponent } from "@lk/core";

@Component({
    selector: 'app-dashboard-details',
    imports: [AgGridModule, IconComponent, MatDialogModule, GridComponent],
    templateUrl: './dashboard-details.component.html',
    styleUrl: './dashboard-details.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardDetailsComponent {
  @Input() cardType: 'patients' | 'appointments' | 'billing' = 'patients';

  columnDefs: ColDef[] = [];
  rowData: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DashboardDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.cardType) {
      this.cardType = data.cardType;
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.setGridData();
  }

  ngOnChanges() {
    this.setGridData();
  }

  setGridData() {
    if (this.cardType === 'patients') {
      this.columnDefs = [
        { headerName: 'ID', field: 'id', width: 80 },
        { headerName: 'Name', field: 'name', flex: 1 },
        { headerName: 'Age', field: 'age', width: 80 },
        { headerName: 'Phone', field: 'phone', flex: 1 },
        { headerName: 'Email', field: 'email', flex: 1 },
        { headerName: 'Diagnosis', field: 'diagnosis', flex: 1 },
        { headerName: 'Last Visit', field: 'lastVisit', width: 120 }
      ];
      this.rowData = [
        { id: 1, name: 'John Doe', age: 35, phone: '+1-555-0123', email: 'john.doe@email.com', diagnosis: 'Hypertension', lastVisit: '2024-01-15' },
        { id: 2, name: 'Jane Smith', age: 28, phone: '+1-555-0124', email: 'jane.smith@email.com', diagnosis: 'Diabetes Type 2', lastVisit: '2024-01-20' },
        { id: 3, name: 'Jim Beam', age: 45, phone: '+1-555-0125', email: 'jim.beam@email.com', diagnosis: 'Asthma', lastVisit: '2024-01-25' },
        { id: 4, name: 'Jill Johnson', age: 32, phone: '+1-555-0126', email: 'jill.johnson@email.com', diagnosis: 'Migraine', lastVisit: '2024-01-30' },
        { id: 5, name: 'Jack Daniels', age: 50, phone: '+1-555-0127', email: 'jack.daniels@email.com', diagnosis: 'Gastroenteritis', lastVisit: '2024-02-05' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 6, name: 'Jill Smith', age: 25, phone: '+1-555-0128', email: 'jill.smith@email.com', diagnosis: 'Arthritis', lastVisit: '2024-02-10' },
        { id: 7, name: 'Jane Smith', age: 28, phone: '+1-555-0124', email: 'jane.smith@email.com', diagnosis: 'Diabetes Type 2', lastVisit: '2024-01-20' }
      ];
    } else if (this.cardType === 'appointments') {
      this.columnDefs = [
        { headerName: 'ID', field: 'id', width: 80 },
        { headerName: 'Patient', field: 'patientName', flex: 1 },
        { headerName: 'Doctor', field: 'doctorName', flex: 1 },
        { headerName: 'Date', field: 'date', width: 120 },
        { headerName: 'Time', field: 'time', width: 100 },
        { headerName: 'Status', field: 'status', width: 120 }
      ];
      this.rowData = [
        { id: 1, patientName: 'John Doe', doctorName: 'Dr. Smith', date: '2024-02-01', time: '10:00', status: 'Confirmed' },
        { id: 2, patientName: 'Jane Smith', doctorName: 'Dr. Brown', date: '2024-02-02', time: '11:30', status: 'Pending' }
      ];
    } else if (this.cardType === 'billing') {
      this.columnDefs = [
        { headerName: 'Invoice', field: 'invoiceNo', width: 120 },
        { headerName: 'Patient', field: 'patientName', flex: 1 },
        { headerName: 'Amount', field: 'amount', width: 120 },
        { headerName: 'Date', field: 'date', width: 120 },
        { headerName: 'Status', field: 'status', width: 120 }
      ];
      this.rowData = [
        { invoiceNo: 'INV-001', patientName: 'John Doe', amount: 120.5, date: '2024-02-01', status: 'Paid' },
        { invoiceNo: 'INV-002', patientName: 'Jane Smith', amount: 80, date: '2024-02-02', status: 'Unpaid' }
      ];
    }
  }
}
