import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ColDef } from 'ag-grid-community';
import { Router } from '@angular/router';

import { FilterComponent, GridComponent, SnackbarService } from "@lk/core";
import { IconComponent } from "@lk/core";
import { StatusCellRendererComponent } from "@lk/core";
import { DialogboxService } from "@lk/core";
import { PageComponent, CoreEventService, BreadcrumbItem } from "@lk/core";
import {
  AdminStatsCardComponent,
  type HeaderAction,
  type StatCard
} from '../../../components';
import { AdminDoctorCreateComponent } from './doctor-create/doctor-create.component';
import { DoctorViewDialogComponent } from './doctor-view-dialog/doctor-view-dialog.component';
import { DoctorScheduleDialogComponent } from './doctor-schedule-dialog/doctor-schedule-dialog.component';
import { DoctorService } from '../../../services/doctor.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { JsonPipe } from '@angular/common';



interface Doctor {
  id: string;
  name: string;
  profilePic: string;
  specialization: string;
  hospital: string;
  availability: 'Available' | 'On Leave' | 'Emergency Only' | 'Inactive';
  status: 'Active' | 'Inactive' | 'On Leave';
  phone: string;
  email: string;
  experience: string;
  qualifications: string;
  joinedDate: string;
  lastLogin?: string;
  hasUserAccount: boolean;
  tags: string[];
}

interface DoctorStats {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  specializations: { [key: string]: number };
}

@Component({
  selector: 'app-doctors',
  standalone:true,
  imports: [
    FormsModule,
    MatIconModule,
    GridComponent,
    IconComponent,
    AdminStatsCardComponent,
    PageComponent,
    FilterComponent,
    JsonPipe
    
  ],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.scss'
})
export class DoctorsComponent implements OnInit, OnDestroy {
  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: any = {};
  rowData: any[] = [];
  hospitalId = '';
  fiqlKey: string ='filter=true'
  showFilter = false;

  // Page header configuration
  headerActions: HeaderAction[] = [
    {
      text: 'Add New/Existing Doctor',
      color: 'primary',
      fontIcon: 'person_add',
      action: 'add-doctor'
    }
  ];



  // Stats configuration
  statsCards: StatCard[] = [];

  // Breadcrumb configuration
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Doctors', icon: 'local_hospital' }
  ];

  constructor(
    private dialogService: DialogboxService,
    private doctorService: DoctorService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private snackbarService :SnackbarService,
    private eventService: CoreEventService
  ) { }

  apiConfig:any = {
    dataConfig: {
      url: environment.apiUrl,
      rest: `/api/doctors?hospitalId=${this.hospitalId}`,
      params: "",
      context: "",
      dataKey: "doctorDetails",
      fiqlKey: "",
      lLimitKey: 'llimit',
      uLimitKey: 'ulimit',
      requestType: 'GET',
      type: 'GET',
      queryParamsUrl: 'llimit=$llimit&ulimit=$ulimit',
      suppressNullValues: true,
      suppressDefaultFiqlOnApply: false,
      dataType: 'array',
      
    },
    filterConfig: {
      filterConfig: [
        { key: 'registrationNumber', label: 'Doctor ID', type: 'input' },
        { key: 'firstName', label: 'First Name', type: 'input' },
        { key: 'lastName', label: 'Last Name', type: 'input' },
        { key: 'specialization', label: 'Specialization', type: 'input' },
        {
          key: 'doctorStatus',
          label: 'Status',
          type: 'select',
          optionList: [
            { name: 'Approved', value: 'APPROVED' },
            { name: 'Pending', value: 'PENDING' },
            { name: 'Rejected', value: 'REJECTED' },
            { name: 'Inactive', value: 'INACTIVE' }
          ]
        },
        { key: 'contactNumber', label: 'Contact Number', type: 'input' },
        { key: 'email', label: 'Email', type: 'input' }
      ]
    }
  }
 
  
  ngOnInit() {
    // Resolve the hospital public ID from the currently logged-in user
    this.hospitalId = this.authService.getHospitalPublicId();

    console.log('apiConfig',this.apiConfig);
    // Set breadcrumb in topbar using CoreEventService
    this.eventService.setBreadcrumb(this.breadcrumb);

    this.initializeGrid();
    this.loadDoctorData();
    this.updateStatsCards();
  }

  ngOnDestroy() {
    // Clear breadcrumb when component is destroyed
    this.eventService.clearBreadcrumb();
  }

  initializeGrid() {
    this.columnDefs = [
      {
        headerName: 'Doctor ID',
        field: 'registrationNumber',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'FirstName',
        field: 'firstName',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'LastName',
        field: 'lastName',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Specialization',
        field: 'specialization',
        width: 150,
        sortable: true,
        filter: true
      },
      
      {
        headerName: 'Status',
        field: 'doctorStatus',
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: StatusCellRendererComponent
      },
      {
        headerName: 'Contact Number',
        field: 'contactNumber',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Email',
        field: 'email',
        width: 200,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Qualifications',
        field: 'qualifications',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Joined Date',
        field: 'createdAt',
        width: 120,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return new Date(params.value).toLocaleDateString();
        }
      }
    ];

    this.gridOptions = {
      enableFilter: true,
      filterConfig: this.apiConfig.filterConfig,
      menuActions: [
        {
          title: 'View',
          icon: 'visibility',
          click: (param: any) => { this.viewDoctor(param.data); }
        },
        {
          title: 'Edit',
          icon: 'edit',
          click: (param: any) => { this.editDoctor(param.data); }
        },
        {
          title: 'Schedule',
          icon: 'schedule',
          click: (param: any) => { this.scheduleDoctor(param.data); }
        },
        {
          title: 'Delete',
          icon: 'delete',
          click: (param: any) => { this.deleteDoctor(param.data); }
        }
      ]
    };
  }
  loadDoctorData() {
    this.doctorService.getDoctorByHospital(this.hospitalId)
      .subscribe({
        next: (res: any) => {
          const list = res?.doctorDetails || res?.content || res || [];
          this.rowData = list.map((d: any) => ({
            id: d.registrationNumber,
            name: `${d.firstName} ${d.lastName}`,
            specialization: d.specialization,
            phone: d.contactNumber,
            email: d.email,
            qualifications: d.qualifications,
            status: d.doctorStatus === 'APPROVED' ? 'Active' : d.doctorStatus === 'REJECTED' ? 'Inactive' : 'Pending',
            availability: this.mapDoctorStatusToAvailability(d.doctorStatus),
            joinedDate: d.createdAt
          }));
          this.updateStatsCards();
          console.log(' Doctors loaded successfully, count:', this.rowData.length);
        },
        error: (err) => {
          console.error(' Failed to load doctors:', err);
          this.snackbarService.error('Failed to load doctor list: ' + (err?.message || 'Network error'));
        }
      });
  }


  // Action methods
  addNewDoctor() {
    const dialogRef = this.dialogService.openDialog(AdminDoctorCreateComponent, {
      title: 'Create New Doctor',
      width: '90%',
      height: '90%',
      data: {},
      footerActions: [
        {
          id: 'cancel',
          text: 'Cancel',
          color: 'secondary',
          appearance: 'flat'
        },
        {
          id: 'invite',
          text: 'Send Invitation',
          color: 'accent',
          appearance: 'raised',
          fontIcon: 'send'
        },
        {
          id: 'save',
          text: 'Create Doctor',
          color: 'primary',
          appearance: 'raised',
          fontIcon: 'save'
        }
      ]
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);

      if (result?.action === 'save' && result?.formData) {
        // The dialog passed us the validated form data — now make the actual POST API call
        console.log('📡 Calling POST createDoctor with:', result.formData);

        this.doctorService.createDoctor(this.hospitalId, result.formData).subscribe({
          next: (response) => {
            console.log(' Doctor created successfully:', response);
            this.snackbarService.success('Doctor created successfully!');
            this.loadDoctorData();  // refresh grid
          },
          error: (err) => {
            console.error(' Create doctor failed:', err);
            const msg = err?.error?.message || err?.message || 'Server error';
            this.snackbarService.error('Failed to create doctor: ' + msg);
          }
        });
      }

      if (result?.action === 'invite') {
        this.loadDoctorData();
        this.snackbarService.success('Invitation sent successfully');
      }
    });
  }

  viewDoctor(doctor: any) {
    const normalized = this.normalizeDoctorForView(doctor);
    const dialogRef = this.dialogService.openDialog(DoctorViewDialogComponent, {
      title: `Doctor Profile - ${normalized.name}`,
      width: '60%',
      height: '90%',
      data: {
        doctor: normalized
      },
      footerActions: [
        {
          id: 'close',
          text: 'Close',
          color: 'primary',
          appearance: 'raised'
        }
      ]
    });

    dialogRef.afterClosed().subscribe(() => {
      // Dialog closed
    });
  }

  editDoctor(doctor: any) {
    const d = this.normalizeDoctorForView(doctor);
    const nameParts = d.name?.split(' ') || [];
    const doctorData = {
      registrationNumber: d.id || '',
      firstName: nameParts[0] || d.firstName || '',
      lastName: nameParts.slice(1).join(' ') || d.lastName || '',
      specialization: d.specialization || '',
      password: '', // Password not required for edit, will be handled by form
      doctorStatus: this.mapStatusToDoctorStatus(d.status),
      contactNumber: d.phone || '',
      email: d.email || '',
      qualifications: d.qualifications || '',
      certifications: doctor.certifications || [],
      profileImageUrl: d.profilePic || '',
      workingDays: doctor.workingDays || [],
      appointmentTimings: doctor.appointmentTimings || []
    };

    const dialogRef = this.dialogService.openDialog(AdminDoctorCreateComponent, {
      title: `Edit Doctor - ${d.name}`,
      width: '90%',
      height: '90%',
      data: {
        doctor: doctorData
      },
      footerActions: [
        {
          id: 'cancel',
          text: 'Cancel',
          color: 'secondary',
          appearance: 'flat'
        },
        {
          id: 'save',
          text: 'Update Doctor',
          color: 'primary',
          appearance: 'raised',
          fontIcon: 'save'
        }
      ]
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save' && result.doctor) {
        // Refresh the doctor list after successful update
        this.loadDoctorData();
        this.updateStatsCards();
        this.snackbarService.info('Doctor updated successfully!');
      }
    });
  }

  scheduleDoctor(doctor: any) {
    const normalized = this.normalizeDoctorForView(doctor);
    const dialogRef = this.dialogService.openDialog(DoctorScheduleDialogComponent, {
      title: `Schedule - ${normalized.name}`,
      width: '65%',
      height: '90%',
      data: {
        doctor: normalized
      },
      footerActions: [
        {
          id: 'cancel',
          text: 'Cancel',
          color: 'primary',
          appearance: 'flat'
        },
        {
          id: 'save',
          text: 'Save Schedule',
          color: 'primary',
          appearance: 'raised',
          fontIcon: 'save'
        }
      ]
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save' && result.formData) {
        this.snackbarService.info(`Schedule saved for ${normalized.name}`);
      }
    });
  }

  deleteDoctor(doctor: any) {
    const d = this.normalizeDoctorForView(doctor);
    if (confirm(`Are you sure you want to delete ${d.name}?`)) {
      const idToRemove = d.id ?? doctor.registrationNumber ?? doctor.id;
      this.rowData = this.rowData.filter((row: any) => (row.id ?? row.registrationNumber) !== idToRemove);
      this.snackbarService.success(`Doctor ${d.name} deleted successfully`);
    }
  }

  getUniqueSpecializations(): number {
    const specializations = new Set(this.rowData.map(d => d.specialization));
    return specializations.size;
  }

  getActiveDoctorsCount(): number {
    return this.rowData.filter(d => d.status === 'Active').length;
  }

  getOnLeaveDoctorsCount(): number {
    return this.rowData.filter(d => d.status === 'On Leave').length;
  }

  updateStatsCards() {
    this.statsCards = [
      {
        label: 'Total Doctors',
        value: this.rowData.length,
        icon: 'local_hospital',
        type: 'info',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'Active Today',
        value: this.getActiveDoctorsCount(),
        icon: 'check_circle',
        type: 'success',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'On Leave',
        value: this.getOnLeaveDoctorsCount(),
        icon: 'pause_circle',
        type: 'warning',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'Specializations',
        value: this.getUniqueSpecializations(),
        icon: 'category',
        type: 'info',
        valueColor: 'var(--admin-text-primary)'
      }
    ];
  }

  onHeaderAction(action: string) {
    switch (action) {
      case 'add-doctor':
        this.addNewDoctor();
        break;
      case 'export':
        this.exportData();
        break;
    }
  }



  exportData() {
    this.showSnackBar('Export functionality will be implemented');
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private mapStatusToDoctorStatus(status: string): 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'ACTIVE';
      case 'INACTIVE':
        return 'INACTIVE';
      case 'ON LEAVE':
        return 'INACTIVE';
      default:
        return 'PENDING';
    }

  }
  private mapDoctorStatusToAvailability(
    status: string
  ): 'Available' | 'On Leave' | 'Emergency Only' | 'Inactive' {

    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'Available';

      case 'ON_LEAVE':
        return 'On Leave';

      case 'EMERGENCY':
        return 'Emergency Only';

      case 'INACTIVE':
      case 'SUSPENDED':
        return 'Inactive';

      default:
        return 'Inactive';
    }
  }

  /** Normalize doctor from either API shape (firstName, registrationNumber, etc.) or mapped shape (name, id) for view dialog. */
  private normalizeDoctorForView(d: any): any {
    if (!d) return {};
    const first = d.firstName ?? d.first_name ?? '';
    const last = d.lastName ?? d.last_name ?? '';
    const name = (d.name ?? d.fullName ?? [first, last].filter(Boolean).join(' ').trim()) || 'Unknown';
    const id = d.id ?? d.registrationNumber ?? '';
    const status = d.status ?? (d.doctorStatus === 'APPROVED' ? 'Active' : d.doctorStatus === 'REJECTED' ? 'Inactive' : 'Pending');
    const availability = d.availability ?? this.mapDoctorStatusToAvailability(d.doctorStatus);
    return {
      ...d,
      id,
      name,
      status,
      availability,
      phone: d.phone ?? d.contactNumber ?? '',
      hospital: d.hospital ?? '',
      experience: d.experience ?? '',
      joinedDate: d.joinedDate ?? d.createdAt ?? '',
      profilePic: d.profilePic ?? d.profileImageUrl ?? '',
      qualifications: d.qualifications ?? ''
    };
  }
} 