import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GridComponent } from "@lk/core";
import { Patient } from '../../interfaces/patient.interface';
import { ColDef, GridOptions } from 'ag-grid-community';
import { IconComponent } from "@lk/core";
import { PatientCreateComponent } from '../patient-create/patient-create.component';
import { StatusCellRendererComponent } from "@lk/core";
import { CoreEventService, DialogboxService, DialogFooterAction } from "@lk/core";

@Component({
    selector: 'app-patient',
    imports: [GridComponent, IconComponent],
    templateUrl: './patient.component.html',
    styleUrl: './patient.component.scss'
})
export class PatientComponent {
  patientData: Patient[] = [
    { patientId: 1, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01', gender: 'Male', contact: 1234567890, email: 'john.doe@email.com', address: '123 Main St, Anytown, USA', bloodGroup: 'A_POSITIVE', createdDate: '2024-01-15', updatedDate: '2024-01-15' },
    { patientId: 2, firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1995-05-10', gender: 'Female', contact: 1234567890, email: 'jane.smith@email.com', address: '456 Elm St, Anytown, USA', bloodGroup: 'B_NEGATIVE', createdDate: '2024-01-20', updatedDate: '2024-01-20' },
    { patientId: 3, firstName: 'Mike', lastName: 'Johnson', dateOfBirth: '1988-12-15', gender: 'Male', contact: 1234567890, email: 'mike.johnson@email.com', address: '789 Oak St, Anytown, USA', bloodGroup: 'O_POSITIVE', createdDate: '2024-01-18', updatedDate: '2024-01-18' },
    { patientId: 4, firstName: 'Sarah', lastName: 'Wilson', dateOfBirth: '1992-03-20', gender: 'Female', contact: 1234567890, email: 'sarah.wilson@email.com', address: '101 Pine St, Anytown, USA', bloodGroup: 'AB_NEGATIVE', createdDate: '2024-01-16', updatedDate: '2024-01-16' },
    { patientId: 5, firstName: 'David', lastName: 'Brown', dateOfBirth: '1985-07-15', gender: 'Male', contact: 1234567890, email: 'david.brown@email.com', address: '555 Maple Ave, Anytown, USA', bloodGroup: 'O_NEGATIVE', createdDate: '2024-01-05', updatedDate: '2024-01-05' },
    { patientId: 6, firstName: 'Lisa', lastName: 'Davis', dateOfBirth: '1993-11-25', gender: 'Female', contact: 1234567890, email: 'lisa.davis@email.com', address: '777 Pine St, Anytown, USA', bloodGroup: 'A_POSITIVE', createdDate: '2024-01-14', updatedDate: '2024-01-14' },
    { patientId: 7, firstName: 'Robert', lastName: 'Miller', dateOfBirth: '1980-06-10', gender: 'Male', contact: 1234567890, email: 'robert.miller@email.com', address: '999 Oak St, Anytown, USA', bloodGroup: 'B_POSITIVE', createdDate: '2024-01-03', updatedDate: '2024-01-03' },
    { patientId: 8, firstName: 'Emily', lastName: 'Garcia', dateOfBirth: '1991-09-18', gender: 'Female', contact: 1234567890, email: 'emily.garcia@email.com', address: '111 Pine St, Anytown, USA', bloodGroup: 'AB_POSITIVE', createdDate: '2024-01-11', updatedDate: '2024-01-11' }
  ];

  columnDefs: ColDef[] = [
    { field: 'bloodGroup', headerName: 'Blood Group', width: 140, sortable: true, filter: true, cellRenderer: StatusCellRendererComponent },
    { field: 'firstName', headerName: 'First Name', width: 150, sortable: true, filter: true },
    { field: 'lastName', headerName: 'Last Name', width: 80, sortable: true, filter: true },
    { field: 'dateOfBirth', headerName: 'Date of Birth', width: 140, sortable: true, filter: true },
    { field: 'gender', headerName: 'Gender', width: 140, sortable: true, filter: true },
    { field: 'contact', headerName: 'Contact', width: 120, sortable: true, filter: true },
    { field: 'email', headerName: 'Email', width: 200, sortable: true, filter: true },
    { field: 'address', headerName: 'Address', width: 150, sortable: true, filter: true },
    { field: 'createdDate', headerName: 'Created Date', width: 120, sortable: true, filter: true },
    { field: 'updatedDate', headerName: 'Updated Date', width: 120, sortable: true, filter: true }
  ];

  gridOptions: any = {};

  constructor(private dialogService: DialogboxService, private router: Router, private eventService: CoreEventService) {
    this.initializeGridOptions();
    this.eventService.setBreadcrumb({
      label: 'Patients',
      icon: 'groups'
    });
  }

  initializeGridOptions() {
    this.gridOptions = {
      menuActions: [
        {
          "title":"View",
          "icon":"remove_red_eye",
          "click": (param:any)=> {this.onViewPatient(param)}
        },
        {
          "title":"Edit",
          "icon":"edit",
          "click": (param:any)=> {this.onEditPatient(param)}
        },
        {
          "title":"Delete",
          "icon":"delete",
          "click": (param:any)=> {this.onDeletePatient(param)}
        },
      ]
    };
  }

  onViewPatient(param: any) {
    console.log('View patient:', param);
    // Navigate to patient profile page
    this.router.navigate(['/patient-profile'], { 
      queryParams: { 
        patientId: param?.data?.patientId,
        patientName: `${param?.data?.firstName} ${param?.data?.lastName}`
      }
    });
  }
  onEditPatient(param: any) {
    console.log('Edit patient:', param);
    this.onCreatePatient('edit',param?.data);
  }
  onDeletePatient(param: any) {
    console.log('Delete patient:', param);
  }


  onCreatePatient(mode: string = 'create', param?: Patient) {
    const isViewMode = mode === 'view';
    const footerActions: DialogFooterAction[] = [];
    
    if (!isViewMode) {
      footerActions.push({
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'basic'
      });
    }
    
    footerActions.push({
      id: 'submit',
      text: isViewMode ? 'Close' : mode === 'create' ? 'Create Patient' : 'Save Changes',
      color: 'primary',
      appearance: isViewMode ? 'basic' : 'raised'
    });

    const dialogRef = this.dialogService.openDialog(PatientCreateComponent, {
      title: mode === 'create' ? 'Create Patient' : mode === 'edit' ? 'Edit Patient' : 'View Patient',
      width: '70%',
      data: { 
        mode: mode,
        patient: param
      },
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      // Skip if result is false (validation failed) or action is cancel
      if (result === false || result?.action === 'cancel') {
        return;
      }
      
      if (result) {
        console.log('New patient created:', result);
        this.patientData.push(result as Patient);
        this.patientData = [...this.patientData];
      }
    });
  }
}
