import { Component, Inject, OnInit, inject } from '@angular/core';

import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, StatusCellRendererComponent } from "@lk/core";
import { filter } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppInputComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { GridComponent } from "@lk/core";
import { ColDef } from 'ag-grid-community';
import { PatientService } from '../../services/patient.service';
import { environment } from '../../../environments/environment';

export interface PatientSearchResult {
  id: string;
  /** UUID from API (publicId); use this for booking when present */
  publicId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  contact: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
  profileImageUrl?: string;
  imageError?: boolean;
}

export interface PatientSearchDialogData {
  /** Label for the in-dialog confirm button (e.g. 'Select Patient' from Create Appointment, 'Book appointment' from Schedule). */
  confirmButtonLabel?: string;
}

@Component({
    selector: 'app-patient-search-dialog',
    imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AppInputComponent,
    AppButtonComponent,
    AppSelectboxComponent,
    IconComponent,
    GridComponent
],
    templateUrl: './patient-search-dialog.component.html',
    styleUrls: ['./patient-search-dialog.component.scss']
})
export class PatientSearchDialogComponent implements OnInit {
  searchResults: PatientSearchResult[] = [];
  selectedPatient: PatientSearchResult | null = null;
  isLoading = false;
  loadError: string | null = null;
  
  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: any = {};
  gridApi: any = null;
  totalRows=0;
  displayedRows=0;
  totalCount:number = 0;

  private syncDisplyCounts():void{
    const grid = this.gridApi;
    if(grid){
      this.displayedRows = grid.displayedRows ?? 0;
      this.totalRows = grid.totalRows ?? 0 ;
    }
  }


  // Mock patient data - in real app, this would come from a service
  // private readonly mockPatients: PatientSearchResult[] = [
  //   {
  //     id: 'e7c9c8c3-3b0f-4d6a-bb3b-3b9e2a7a2f17',
  //     firstName: 'John',
  //     lastName: 'Doe',
  //     fullName: 'John Doe',
  //     dateOfBirth: '1985-03-15',
  //     gender: 'Male',
  //     contact: '+1 (555) 123-4567',
  //     email: 'john.doe@email.com',
  //     address: '123 Main St, New York, NY 10001',
  //     emergencyContact: '+1 (555) 987-6543',
  //     medicalHistory: ['Hypertension', 'Diabetes Type 2'],
  //     allergies: ['Penicillin', 'Shellfish'],
  //     profileImageUrl: 'assets/avatars/default-avatar.jpg'
  //   },
  //   {
  //     id: 'PAT002',
  //     firstName: 'Jane',
  //     lastName: 'Smith',
  //     fullName: 'Jane Smith',
  //     dateOfBirth: '1990-07-22',
  //     gender: 'Female',
  //     contact: '+1 (555) 234-5678',
  //     email: 'jane.smith@email.com',
  //     address: '456 Oak Ave, Los Angeles, CA 90210',
  //     emergencyContact: '+1 (555) 876-5432',
  //     medicalHistory: ['Asthma'],
  //     allergies: ['Latex'],
  //     profileImageUrl: 'assets/avatars/default-avatar.jpg'
  //   },
  //   {
  //     id: 'PAT003',
  //     firstName: 'Mike',
  //     lastName: 'Johnson',
  //     fullName: 'Mike Johnson',
  //     dateOfBirth: '1978-11-08',
  //     gender: 'Male',
  //     contact: '+1 (555) 345-6789',
  //     email: 'mike.johnson@email.com',
  //     address: '789 Pine St, Chicago, IL 60601',
  //     emergencyContact: '+1 (555) 765-4321',
  //     medicalHistory: ['High Cholesterol'],
  //     allergies: ['Peanuts'],
  //     profileImageUrl: 'assets/avatars/default-avatar.jpg'
  //   },
  //   {
  //     id: 'PAT004',
  //     firstName: 'Sarah',
  //     lastName: 'Wilson',
  //     fullName: 'Sarah Wilson',
  //     dateOfBirth: '1992-05-14',
  //     gender: 'Female',
  //     contact: '+1 (555) 456-7890',
  //     email: 'sarah.wilson@email.com',
  //     address: '321 Elm St, Houston, TX 77001',
  //     emergencyContact: '+1 (555) 654-3210',
  //     medicalHistory: ['Migraine'],
  //     allergies: ['Aspirin'],
  //     profileImageUrl: 'assets/avatars/default-avatar.jpg'
  //   },
  //   {
  //     id: 'PAT005',
  //     firstName: 'David',
  //     lastName: 'Brown',
  //     fullName: 'David Brown',
  //     dateOfBirth: '1988-09-30',
  //     gender: 'Male',
  //     contact: '+1 (555) 567-8901',
  //     email: 'david.brown@email.com',
  //     address: '654 Maple Dr, Phoenix, AZ 85001',
  //     emergencyContact: '+1 (555) 543-2109',
  //     medicalHistory: ['Arthritis'],
  //     allergies: ['Ibuprofen'],
  //     profileImageUrl: 'assets/avatars/default-avatar.jpg'
  //   },
  //   {
  //     id: 'PAT006',
  //     firstName: 'Lisa',
  //     lastName: 'Garcia',
  //     fullName: 'Lisa Garcia',
  //     dateOfBirth: '1983-12-05',
  //     gender: 'Female',
  //     contact: '+1 (555) 678-9012',
  //     email: 'lisa.garcia@email.com',
  //     address: '987 Cedar Ln, Philadelphia, PA 19101',
  //     emergencyContact: '+1 (555) 432-1098',
  //     medicalHistory: ['Depression', 'Anxiety'],
  //     allergies: ['Sulfa drugs'],
  //     profileImageUrl: 'assets/avatars/default-avatar.jpg'
  //   }
  // ];
  apiConfig:any = {
    dataConfig: {
      url: environment.apiUrl,
      rest: '/api/patients', // New format - API endpoint path
      params: "",
      context: "",
      fiqlKey: "", // Key name for FIQL filter parameter
      lLimitKey: 'llimit',
      uLimitKey: 'ulimit',
      requestType: 'GET',
      type: 'GET', // Alternative format
      queryParamsUrl: 'llimit=0&ulimit=100',
      suppressNullValues: true,
      suppressDefaultFiqlOnApply: false,
      dataKey: "content", // Key to extract data from response
      dataType: 'object'
    },
    countConfig: {
      rest: '/api/patients/doctor/DR1/connected/count',
      type: 'GET',
      queryParamsUrl: '',
      suppressNullValues: true
    },
     footerActions:[
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'flat'
      },
      {
        id:'create',
        text:'Reset Filters',
        color:'primary',
        appearance:'flat'
        
      }
     ]
  }
  getConnectedPatients(): void {
    this.isLoading = true;
    this.loadError = null;
    this.patientService.getPatients().subscribe({
      next: (res: any) => {
        const raw = this.normalizePatientResponse(res);
        this.searchResults = raw.map((p: any) => this.mapToSearchResult(p));
        this.isLoading = false;
        this.refreshGridData();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || err?.message || 'Failed to load patients';
        this.searchResults = [];
        this.refreshGridData();
      }
    });
  }

  /** Ensure API response is always an array (handles data/content/items wrappers) */
  private normalizePatientResponse(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    const data = res.data ?? res.content ?? res.items ?? res.patients ?? res;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.content)) return data.content;
    return [];
  }

  /** Map backend patient object to PatientSearchResult (id must be string) */
  private mapToSearchResult(p: any): PatientSearchResult {
    const rawId = p?.id ?? p?.patientId ?? p?.patient_id;
    const publicId = p?.publicId ? String(p.publicId).trim() : undefined;
    const id = String(publicId ?? rawId ?? '').trim() || `patient-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const firstName = p?.firstName ?? p?.first_name ?? '';
    const lastName = p?.lastName ?? p?.last_name ?? '';
    const fullName =
      p?.fullName?.trim() ||
      `${firstName} ${lastName}`.trim() ||
      p?.name?.trim() ||
      'Unknown';
    return {
      id,
      publicId: publicId || undefined,
      firstName,
      lastName,
      fullName,
      dateOfBirth: p?.dateOfBirth ?? p?.dob ?? p?.date_of_birth ?? '',
      gender: p?.gender ?? '',
      contact: p?.phone ?? p?.contact ?? p?.mobile ?? '',
      email: p?.email ?? '',
      address: p?.address ?? '',
      emergencyContact: p?.emergencyContact ?? p?.emergency_contact ?? '',
      medicalHistory: Array.isArray(p?.medicalHistory) ? p.medicalHistory : (Array.isArray(p?.medical_history) ? p.medical_history : []),
      allergies: Array.isArray(p?.allergies) ? p.allergies : []
    };
  }

  /** Push current searchResults into grid so UI shows data after async load */
  private refreshGridData(): void {
    if (this.gridApi && typeof this.gridApi.setRowData === 'function') {
      this.gridApi.setRowData(this.searchResults);
    }
  }

  dialogRef = inject(MatDialogRef<PatientSearchDialogComponent>);
  data = inject<PatientSearchDialogData>(DIALOG_DATA_TOKEN);
  /** In-dialog confirm button label (e.g. 'Select Patient' or 'Book appointment'). */
  get confirmButtonLabel(): string {
    return this.data?.confirmButtonLabel ?? 'Book appointment';
  }

  constructor(private patientService :PatientService) {}

  ngOnInit(): void {
    // Initialize with all patients
    this.getConnectedPatients();
    this.initializeGrid();
    
    // Listen for dialog close events to handle footer actions
    this.dialogRef.beforeClosed().pipe(
      filter(result => result?.action === 'select' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        return;
      }
      
      if (result?.action === 'select') {
        // Handle select action from footer
        if (this.selectedPatient) {
          // Use a small delay to ensure the action is processed
          setTimeout(() => {
            this.dialogRef.close({
              action: 'select',
              patient: this.selectedPatient
            });
          }, 10);
        } else {
          // Prevent close if no patient selected
          setTimeout(() => {
            this.dialogRef.close({ action: 'select', patient: null });
          }, 0);
        }
      }
    });
  }
  
  private initializeGrid(): void {
  
       this.columnDefs = [
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

    this.gridOptions = {
      
      enableSelection:true,
      rowHeight: 60,
      headerHeight: 50,
      suppressRowClickSelection: false,
      rowSelection: 'single',
      enableFilter: true,
      enableSorting: true,
      getRowId: (params: any) => params.data.id,
      onGridReady: (event: any) => {
        this.gridApi = event?.api ?? event;
        if (this.searchResults.length > 0 && this.gridApi && typeof this.gridApi.setRowData === 'function') {
          this.gridApi.setRowData(this.searchResults);
        }
      },
      onRowClicked: (event: any) => {
        const row = event?.data;
        if (!row) return;
        this.selectPatient(row);
      },
      onSelectionChanged: (event: any) => {
        const selectedRows = event.api?.getSelectedRows() ?? [];
        if (selectedRows.length === 1) {
          this.selectedPatient = selectedRows[0];
        } else if (selectedRows.length === 0) {
          this.selectedPatient = null;
        }
        // Enforce single selection: if multiple, keep only the first
        if (selectedRows.length > 1 && event.api) {
          event.api.deselectAll();
          const firstId = selectedRows[0]?.id;
          if (firstId) {
            const node = event.api.getRowNode(firstId);
            if (node?.setSelected) node.setSelected(true);
          }
          this.selectedPatient = selectedRows[0];
        }
      },
      rowClass: (params: any) => {
        if (params.node.isSelected()) {
          return 'ag-row-selected';
        }
        return '';
      },
      filterConfig: {
        fields: [
          { label: 'Gender', value: 'gender', inputType: 'select' },
          { label: 'Age Range', value: 'dateOfBirth', inputType: 'input' },
          { label: 'Contact', value: 'contact', inputType: 'input' }
        ],
        valuesMap: {
          gender: ['Male', 'Female']
        }
      }
    };
  }

  selectPatient(patientOrEvent: any): void {
    const row = patientOrEvent?.data ?? patientOrEvent;
    if (!row || !row.id) return;
    this.selectedPatient = row;
    if (!this.gridApi) return;
    if (typeof this.gridApi.deselectAll === 'function') this.gridApi.deselectAll();
    if (typeof this.gridApi.forEachNode === 'function') {
      this.gridApi.forEachNode((node: any) => {
        if (node?.data && node.data.id === row.id) {
          node.setSelected(true);
          if (typeof this.gridApi.ensureNodeVisible === 'function') {
            this.gridApi.ensureNodeVisible(node, 'middle');
          }
        }
      });
    }
    if (typeof this.gridApi.refreshCells === 'function') {
      setTimeout(() => this.gridApi.refreshCells({ force: true }), 0);
    }
  }

  onSelectPatient(): void {
    if (this.selectedPatient) {
      this.dialogRef.close({
        action: 'select',
        patient: this.selectedPatient
      });
    }
  }

  onImageError(patient: PatientSearchResult): void {
    patient.imageError = true;
  }

  onGridSearch(searchTerm: string): void {
    // Grid handles its own search, but we can add additional logic here if needed
    console.log('Grid search:', searchTerm);
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
