import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN } from "@lk/core";
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

export interface PatientSearchResult {
  id: string;
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
  // No specific data needed for patient search
}

@Component({
    selector: 'app-patient-search-dialog',
    imports: [
        CommonModule,
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
  
  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: any = {};
  gridApi: any = null;

  // Mock patient data - in real app, this would come from a service
  private readonly mockPatients: PatientSearchResult[] = [
    {
      id: 'PAT001',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      contact: '+1 (555) 123-4567',
      email: 'john.doe@email.com',
      address: '123 Main St, New York, NY 10001',
      emergencyContact: '+1 (555) 987-6543',
      medicalHistory: ['Hypertension', 'Diabetes Type 2'],
      allergies: ['Penicillin', 'Shellfish'],
      profileImageUrl: 'assets/avatars/default-avatar.jpg'
    },
    {
      id: 'PAT002',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      dateOfBirth: '1990-07-22',
      gender: 'Female',
      contact: '+1 (555) 234-5678',
      email: 'jane.smith@email.com',
      address: '456 Oak Ave, Los Angeles, CA 90210',
      emergencyContact: '+1 (555) 876-5432',
      medicalHistory: ['Asthma'],
      allergies: ['Latex'],
      profileImageUrl: 'assets/avatars/default-avatar.jpg'
    },
    {
      id: 'PAT003',
      firstName: 'Mike',
      lastName: 'Johnson',
      fullName: 'Mike Johnson',
      dateOfBirth: '1978-11-08',
      gender: 'Male',
      contact: '+1 (555) 345-6789',
      email: 'mike.johnson@email.com',
      address: '789 Pine St, Chicago, IL 60601',
      emergencyContact: '+1 (555) 765-4321',
      medicalHistory: ['High Cholesterol'],
      allergies: ['Peanuts'],
      profileImageUrl: 'assets/avatars/default-avatar.jpg'
    },
    {
      id: 'PAT004',
      firstName: 'Sarah',
      lastName: 'Wilson',
      fullName: 'Sarah Wilson',
      dateOfBirth: '1992-05-14',
      gender: 'Female',
      contact: '+1 (555) 456-7890',
      email: 'sarah.wilson@email.com',
      address: '321 Elm St, Houston, TX 77001',
      emergencyContact: '+1 (555) 654-3210',
      medicalHistory: ['Migraine'],
      allergies: ['Aspirin'],
      profileImageUrl: 'assets/avatars/default-avatar.jpg'
    },
    {
      id: 'PAT005',
      firstName: 'David',
      lastName: 'Brown',
      fullName: 'David Brown',
      dateOfBirth: '1988-09-30',
      gender: 'Male',
      contact: '+1 (555) 567-8901',
      email: 'david.brown@email.com',
      address: '654 Maple Dr, Phoenix, AZ 85001',
      emergencyContact: '+1 (555) 543-2109',
      medicalHistory: ['Arthritis'],
      allergies: ['Ibuprofen'],
      profileImageUrl: 'assets/avatars/default-avatar.jpg'
    },
    {
      id: 'PAT006',
      firstName: 'Lisa',
      lastName: 'Garcia',
      fullName: 'Lisa Garcia',
      dateOfBirth: '1983-12-05',
      gender: 'Female',
      contact: '+1 (555) 678-9012',
      email: 'lisa.garcia@email.com',
      address: '987 Cedar Ln, Philadelphia, PA 19101',
      emergencyContact: '+1 (555) 432-1098',
      medicalHistory: ['Depression', 'Anxiety'],
      allergies: ['Sulfa drugs'],
      profileImageUrl: 'assets/avatars/default-avatar.jpg'
    }
  ];

  dialogRef = inject(MatDialogRef<PatientSearchDialogComponent>);
  data = inject<PatientSearchDialogData>(DIALOG_DATA_TOKEN);

  constructor() {}

  ngOnInit(): void {
    // Initialize with all patients
    this.searchResults = [...this.mockPatients];
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
      {
        headerName: 'Patient',
        field: 'fullName',
        width: 200,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          const patient = params.data;
          return `
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #6b7280;">
                <i class="material-icons" style="font-size: 20px;">person</i>
              </div>
              <div>
                <div style="font-weight: 600; color: #1f2937;">${patient.fullName}</div>
                <div style="font-size: 12px; color: #6b7280;">${patient.id}</div>
              </div>
            </div>
          `;
        }
      },
      {
        headerName: 'Age',
        field: 'dateOfBirth',
        width: 80,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          const age = this.calculateAge(params.value);
          return `<span style="font-size: 12px;">${age} years</span>`;
        }
      },
      {
        headerName: 'Gender',
        field: 'gender',
        width: 80,
        sortable: true,
        filter: 'agSetColumnFilter',
        cellRenderer: (params: any) => {
          const gender = params.value;
          const color = gender === 'Male' ? '#3b82f6' : '#ec4899';
          return `<span style="background: ${color}20; color: ${color}; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${gender}</span>`;
        }
      },
      {
        headerName: 'Contact',
        field: 'contact',
        width: 150,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          return `
            <div style="font-size: 12px;">
              <div style="color: #1f2937;">${params.data.contact}</div>
              <div style="color: #6b7280;">${params.data.email || 'No email'}</div>
            </div>
          `;
        }
      },
      {
        headerName: 'Medical History',
        field: 'medicalHistory',
        width: 200,
        sortable: false,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          if (!params.value || params.value.length === 0) {
            return '<span style="color: #6b7280; font-size: 12px;">No history</span>';
          }
          const history = params.value.slice(0, 2).join(', ');
          const more = params.value.length > 2 ? ` +${params.value.length - 2} more` : '';
          return `<span style="font-size: 12px;">${history}${more}</span>`;
        }
      },
      {
        headerName: 'Allergies',
        field: 'allergies',
        width: 150,
        sortable: false,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          if (!params.value || params.value.length === 0) {
            return '<span style="color: #6b7280; font-size: 12px;">None</span>';
          }
          const allergies = params.value.slice(0, 2).join(', ');
          const more = params.value.length > 2 ? ` +${params.value.length - 2} more` : '';
          return `<span style="font-size: 12px; color: #dc2626;">${allergies}${more}</span>`;
        }
      }
    ];

    this.gridOptions = {
      rowHeight: 60,
      headerHeight: 50,
      suppressRowClickSelection: false,
      rowSelection: 'single',
      enableFilter: true,
      enableSorting: true,
      getRowId: (params: any) => params.data.id,
      onGridReady: (event: any) => {
        this.gridApi = event.api;
      },
      onRowClicked: (event: any) => {
        // Programmatically select the row
        if (this.gridApi && event.node) {
          this.gridApi.deselectAll();
          event.node.setSelected(true);
          // Force grid to refresh row styles
          this.gridApi.refreshCells({ force: true });
        }
        this.selectPatient(event.data);
      },
      onSelectionChanged: (event: any) => {
        const selectedRows = event.api.getSelectedRows();
        if (selectedRows.length > 0) {
          this.selectPatient(selectedRows[0]);
        } else {
          this.selectedPatient = null;
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

  selectPatient(patient: PatientSearchResult): void {
    this.selectedPatient = patient;
    // Programmatically select the row in the grid
    if (this.gridApi && patient) {
      this.gridApi.deselectAll();
      this.gridApi.forEachNode((node: any) => {
        if (node.data && node.data.id === patient.id) {
          node.setSelected(true);
          // Ensure the row is visible
          this.gridApi.ensureNodeVisible(node, 'middle');
        }
      });
      // Force grid to refresh row styles after selection
      setTimeout(() => {
        this.gridApi.refreshCells({ force: true });
      }, 0);
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
