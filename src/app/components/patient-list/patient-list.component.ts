import { Component } from '@angular/core';

import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { Patient } from '../../interfaces/patient.interface';
import { GridComponent } from "@lk/core";

@Component({
    selector: 'app-patient-list',
    imports: [GridComponent],
    templateUrl: './patient-list.component.html',
    styleUrl: './patient-list.component.scss'
})
export class PatientListComponent {
  columnDefs: ColDef<Patient>[] = [
    { headerName: 'ID', field: 'patientId', width: 80 },
    { headerName: 'First name', field: 'firstName', flex: 1 },
    { headerName: 'Last name', field: 'lastName', flex: 1 },
    { headerName: 'Date of Birth', field: 'dateOfBirth', flex: 1 },
    { headerName: 'Gender', field: 'gender', flex: 1 },
    { headerName: 'Contact', field: 'contact', flex: 1 },
    { headerName: 'Email', field: 'email', flex: 1 },
    { headerName: 'Address', field: 'address', flex: 1 },
    { headerName: 'Blood Group', field: 'bloodGroup', flex: 1 },
    { headerName: 'Created Date', field: 'createdDate', flex: 1 },
    { headerName: 'Updated Date', field: 'updatedDate', flex: 1 }
  ];

  rowData: Patient[] = [
    { patientId: 1, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01', gender: 'Male', contact: 1234567890, email: 'john.doe@email.com', address: '123 Main St, Anytown, USA', bloodGroup: 'A+', createdDate: '2024-01-15', updatedDate: '2024-01-15' },
    { patientId: 2, firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1995-05-10', gender: 'Female', contact: 1234567890, email: 'jane.smith@email.com', address: '456 Elm St, Anytown, USA', bloodGroup: 'B-', createdDate: '2024-01-20', updatedDate: '2024-01-20' },
    { patientId: 3, firstName: 'Mike', lastName: 'Johnson', dateOfBirth: '1988-12-15', gender: 'Male', contact: 1234567890, email: 'mike.johnson@email.com', address: '789 Oak St, Anytown, USA', bloodGroup: 'O+', createdDate: '2024-01-18', updatedDate: '2024-01-18' }
  ];
}
