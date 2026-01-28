import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, DialogboxService } from "@lk/core";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, filter } from 'rxjs';

import { AppInputComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { GridComponent } from "@lk/core";
import { ColDef } from 'ag-grid-community';

export interface DoctorSearchResult {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  experience: string;
  qualifications: string[];
  availability: 'Available' | 'On Leave' | 'Emergency Only' | 'Inactive';
  profileImageUrl?: string;
  phone: string;
  email: string;
  rating?: number;
  imageError?: boolean;
}

export interface DoctorSearchDialogData {
  patientId: string;
  patientName: string;
  currentDoctorId?: string;
}

@Component({
    selector: 'app-doctor-search-dialog',
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
    templateUrl: './doctor-search-dialog.component.html',
    styleUrls: ['./doctor-search-dialog.component.scss']
})
export class DoctorSearchDialogComponent implements OnInit, OnDestroy {
  searchResults: DoctorSearchResult[] = [];
  selectedDoctor: DoctorSearchResult | null = null;
  isLoading = false;
  
  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: any = {};
  
  private destroy$ = new Subject<void>();
  private dialogService = inject(DialogboxService);

  // Filter options
  specializations = [
    'Cardiology',
    'Orthopedics',
    'Neurology',
    'Dermatology',
    'Pediatrics',
    'Gynecology',
    'General Medicine',
    'Surgery',
    'Psychiatry',
    'Radiology',
    'Anesthesiology',
    'Emergency Medicine'
  ];

  hospitals = [
    'Shree Clinic',
    'Apollo Hospital',
    'Fortis Healthcare',
    'Max Hospital',
    'Manipal Hospital',
    'Columbia Asia',
    'Narayana Health',
    'Medanta Hospital'
  ];

  availabilityOptions = [
    'Available',
    'On Leave',
    'Emergency Only',
    'Inactive'
  ];


  // Mock doctor data - in real app, this would come from a service
  private readonly mockDoctors: DoctorSearchResult[] = [
    {
      id: 'DOC001',
      name: 'Dr. Michael Chen',
      specialization: 'Cardiology',
      hospital: 'Shree Clinic',
      experience: '15 years',
      qualifications: ['MBBS', 'MD - Cardiology', 'DM - Interventional Cardiology'],
      availability: 'Available',
      profileImageUrl: 'assets/avatars/default-avatar.jpg',
      phone: '+1 (555) 123-4567',
      email: 'michael.chen@shreeclinic.com',
      rating: 4.8
    },
    {
      id: 'DOC002',
      name: 'Dr. Sarah Smith',
      specialization: 'Orthopedics',
      hospital: 'Apollo Hospital',
      experience: '12 years',
      qualifications: ['MBBS', 'MS - Orthopedics', 'Fellowship in Sports Medicine'],
      availability: 'Available',
      profileImageUrl: 'assets/avatars/default-avatar.jpg',
      phone: '+1 (555) 234-5678',
      email: 'sarah.smith@apollo.com',
      rating: 4.6
    },
    {
      id: 'DOC003',
      name: 'Dr. Robert Johnson',
      specialization: 'Neurology',
      hospital: 'Fortis Healthcare',
      experience: '18 years',
      qualifications: ['MBBS', 'MD - Medicine', 'DM - Neurology'],
      availability: 'Available',
      profileImageUrl: 'assets/avatars/default-avatar.jpg',
      phone: '+1 (555) 345-6789',
      email: 'robert.johnson@fortis.com',
      rating: 4.9
    },
    {
      id: 'DOC004',
      name: 'Dr. Emily Wilson',
      specialization: 'Dermatology',
      hospital: 'Max Hospital',
      experience: '10 years',
      qualifications: ['MBBS', 'MD - Dermatology', 'Diploma in Cosmetology'],
      availability: 'On Leave',
      profileImageUrl: 'assets/avatars/default-avatar.jpg',
      phone: '+1 (555) 456-7890',
      email: 'emily.wilson@max.com',
      rating: 4.7
    },
    {
      id: 'DOC005',
      name: 'Dr. David Brown',
      specialization: 'Pediatrics',
      hospital: 'Manipal Hospital',
      experience: '14 years',
      qualifications: ['MBBS', 'MD - Pediatrics', 'Fellowship in Neonatology'],
      availability: 'Available',
      profileImageUrl: 'assets/avatars/default-avatar.jpg',
      phone: '+1 (555) 567-8901',
      email: 'david.brown@manipal.com',
      rating: 4.5
    },
    {
      id: 'DOC006',
      name: 'Dr. Lisa Garcia',
      specialization: 'Gynecology',
      hospital: 'Columbia Asia',
      experience: '16 years',
      qualifications: ['MBBS', 'MS - Obstetrics & Gynecology', 'Fellowship in Reproductive Medicine'],
      availability: 'Available',
      profileImageUrl: 'assets/avatars/default-avatar.jpg',
      phone: '+1 (555) 678-9012',
      email: 'lisa.garcia@columbia.com',
      rating: 4.8
    }
  ];

  dialogRef = inject(MatDialogRef<DoctorSearchDialogComponent>);
  data = inject<DoctorSearchDialogData>(DIALOG_DATA_TOKEN);

  constructor() {}

  ngOnInit(): void {
    // Initialize with all doctors
    this.searchResults = [...this.mockDoctors];
    this.initializeGrid();
    
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'refer' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        // Cancel action - dialog will close normally
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'refer') {
        // Refer action - validate and close with result
        if (this.selectedDoctor) {
          setTimeout(() => {
            this.dialogRef.close({
              action: 'refer',
              doctor: this.selectedDoctor,
              patientId: this.data.patientId,
              patientName: this.data.patientName
            });
          }, 0);
        } else {
          // Prevent close if no doctor selected - close with false to indicate cancellation
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
        }
      }
    });
    
    // Update footer button disabled state when selection changes
    // This will be handled by the DialogboxService through the footerActions array
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeGrid(): void {
    this.columnDefs = [
      {
        headerName: 'Doctor',
        field: 'name',
        width: 200,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          const doctor = params.data;
          return `
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #6b7280;">
                <i class="material-icons" style="font-size: 20px;">person</i>
              </div>
              <div>
                <div style="font-weight: 600; color: #1f2937;">${doctor.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${doctor.id}</div>
              </div>
            </div>
          `;
        }
      },
      {
        headerName: 'Specialization',
        field: 'specialization',
        width: 150,
        sortable: true,
        filter: 'agSetColumnFilter',
        cellRenderer: (params: any) => {
          return `<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${params.value}</span>`;
        }
      },
      {
        headerName: 'Hospital',
        field: 'hospital',
        width: 150,
        sortable: true,
        filter: 'agSetColumnFilter'
      },
      {
        headerName: 'Experience',
        field: 'experience',
        width: 120,
        sortable: true,
        filter: 'agTextColumnFilter'
      },
      {
        headerName: 'Availability',
        field: 'availability',
        width: 120,
        sortable: true,
        filter: 'agSetColumnFilter',
        cellRenderer: (params: any) => {
          const availability = params.value;
          let color = '#6b7280';
          let icon = 'schedule';
          
          switch (availability) {
            case 'Available':
              color = '#10b981';
              icon = 'check_circle';
              break;
            case 'On Leave':
              color = '#f59e0b';
              icon = 'event_busy';
              break;
            case 'Emergency Only':
              color = '#ef4444';
              icon = 'emergency';
              break;
            case 'Inactive':
              color = '#6b7280';
              icon = 'cancel';
              break;
          }
          
          return `
            <div style="display: flex; align-items: center; gap: 6px; color: ${color};">
              <i class="material-icons" style="font-size: 16px;">${icon}</i>
              <span style="font-size: 12px;">${availability}</span>
            </div>
          `;
        }
      },
      {
        headerName: 'Rating',
        field: 'rating',
        width: 100,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params: any) => {
          if (!params.value) return '-';
          return `
            <div style="display: flex; align-items: center; gap: 4px;">
              <i class="material-icons" style="font-size: 14px; color: #fbbf24;">star</i>
              <span style="font-size: 12px;">${params.value}</span>
            </div>
          `;
        }
      },
      {
        headerName: 'Contact',
        field: 'phone',
        width: 120,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          return `
            <div style="font-size: 12px;">
              <div style="color: #1f2937;">${params.data.phone}</div>
              <div style="color: #6b7280;">${params.data.email}</div>
            </div>
          `;
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
      onRowClicked: (event: any) => {
        this.selectDoctor(event.data);
      },
      onSelectionChanged: (event: any) => {
        const selectedRows = event.api.getSelectedRows();
        if (selectedRows.length > 0) {
          this.selectDoctor(selectedRows[0]);
        } else {
          this.selectedDoctor = null;
        }
      },
      getRowStyle: (params: any) => {
        if (params.data === this.selectedDoctor) {
          return { backgroundColor: '#eff6ff', border: '1px solid #3b82f6' };
        }
        return null;
      },
      filterConfig: {
        fields: [
          { label: 'Specialization', value: 'specialization', inputType: 'select' },
          { label: 'Hospital', value: 'hospital', inputType: 'select' },
          { label: 'Availability', value: 'availability', inputType: 'select' },
          { label: 'Experience', value: 'experience', inputType: 'input' },
          { label: 'Rating', value: 'rating', inputType: 'number' }
        ],
        valuesMap: {
          specialization: this.specializations,
          hospital: this.hospitals,
          availability: ['Available', 'On Leave', 'Emergency Only', 'Inactive']
        }
      }
    };
  }


  selectDoctor(doctor: DoctorSearchResult): void {
    this.selectedDoctor = doctor;
  }

  onReferPatient(): void {
    if (this.selectedDoctor) {
      this.dialogRef.close({
        action: 'refer',
        doctor: this.selectedDoctor,
        patientId: this.data.patientId,
        patientName: this.data.patientName
      });
    }
  }

  onImageError(doctor: DoctorSearchResult): void {
    doctor.imageError = true;
  }

  onGridSearch(searchTerm: string): void {
    // Grid handles its own search, but we can add additional logic here if needed
    console.log('Grid search:', searchTerm);
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  getAvailabilityColor(availability: string): string {
    switch (availability) {
      case 'Available': return '#10b981';
      case 'On Leave': return '#f59e0b';
      case 'Emergency Only': return '#ef4444';
      case 'Inactive': return '#6b7280';
      default: return '#6b7280';
    }
  }

  getAvailabilityIcon(availability: string): string {
    switch (availability) {
      case 'Available': return 'check_circle';
      case 'On Leave': return 'schedule';
      case 'Emergency Only': return 'emergency';
      case 'Inactive': return 'cancel';
      default: return 'help';
    }
  }
}
