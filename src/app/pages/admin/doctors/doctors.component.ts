import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ColDef } from 'ag-grid-community';
import { Router } from '@angular/router';

import { GridComponent } from "@lk/core";
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
    imports: [
    FormsModule,
    MatIconModule,
    GridComponent,
    IconComponent,
    AdminStatsCardComponent,
    PageComponent
],
    templateUrl: './doctors.component.html',
    styleUrl: './doctors.component.scss'
})
export class DoctorsComponent implements OnInit, OnDestroy {
  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: any = {};
  rowData: any[] = [];

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
    private snackBar: MatSnackBar,
    private router: Router,
    private eventService: CoreEventService
  ) {}

  ngOnInit() {
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
        field: 'id',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Name',
        field: 'name',
        width: 200,
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
        headerName: 'Hospital',
        field: 'hospital',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Availability',
        field: 'availability',
        width: 140,
        sortable: true,
        filter: true,
        cellRenderer: StatusCellRendererComponent
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: StatusCellRendererComponent
      },
      {
        headerName: 'Phone',
        field: 'phone',
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
        headerName: 'Experience',
        field: 'experience',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Joined Date',
        field: 'joinedDate',
        width: 120,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return new Date(params.value).toLocaleDateString();
        }
      }
    ];

    this.gridOptions = {
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
          title: 'Permissions',
          icon: 'tune',
          click: (param: any) => { this.openPermissions(param.data); }
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
    // Sample data
    this.rowData = [
      {
        id: 'DOC001',
        name: 'Dr. Amit Sharma',
        specialization: 'Cardiology',
        hospital: 'Main Hospital',
        availability: 'Available',
        status: 'Active',
        phone: '+91 98765 43210',
        email: 'amit.sharma@hospital.com',
        experience: '8 years',
        joinedDate: '2020-03-15',
        hospitalAssociations: [
          { hospitalName: 'City Branch' },
          { hospitalName: 'North Medical Center' }
        ]
      },
      {
        id: 'DOC002',
        name: 'Dr. Priya Verma',
        specialization: 'Neurology',
        hospital: 'City Branch',
        availability: 'On Leave',
        status: 'On Leave',
        phone: '+91 98765 43211',
        email: 'priya.verma@hospital.com',
        experience: '12 years',
        joinedDate: '2018-07-22'
      },
      {
        id: 'DOC003',
        name: 'Dr. Rajesh Kumar',
        specialization: 'Orthopedics',
        hospital: 'Main Hospital',
        availability: 'Emergency Only',
        status: 'Active',
        phone: '+91 98765 43212',
        email: 'rajesh.kumar@hospital.com',
        experience: '15 years',
        joinedDate: '2015-11-08',
        hospitalAssociations: [
          'City Branch',
          'South Clinic',
          'Emergency Care Unit'
        ]
      },
      {
        id: 'DOC004',
        name: 'Dr. Sneha Patel',
        specialization: 'Pediatrics',
        hospital: 'City Branch',
        availability: 'Available',
        status: 'Active',
        phone: '+91 98765 43213',
        email: 'sneha.patel@hospital.com',
        experience: '6 years',
        joinedDate: '2021-09-12'
      },
      {
        id: 'DOC005',
        name: 'Dr. Vikram Singh',
        specialization: 'Dermatology',
        hospital: 'Main Hospital',
        availability: 'Available',
        status: 'Inactive',
        phone: '+91 98765 43214',
        email: 'vikram.singh@hospital.com',
        experience: '10 years',
        joinedDate: '2019-05-20'
      }
    ];
  }

  openPermissions(doctor: any) {
    const doctorPublicId = doctor?.id;
    if (doctorPublicId) {
      this.router.navigate(['/admin/doctor-permissions'], { queryParams: { doctorPublicId: doctorPublicId, from:'doctors' } });
    } else {
      this.showSnackBar('Doctor ID not available');
    }
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
      if (result && result.action === 'save' && result.doctor) {
        // Refresh the doctor list after successful creation
        this.loadDoctorData();
        this.updateStatsCards();
        this.showSnackBar('Doctor created successfully!');
      } else if (result && result.action === 'invite' && result.invited) {
        // Refresh the doctor list after successful invitation
        this.loadDoctorData();
        this.updateStatsCards();
        this.showSnackBar('Invitation sent successfully!');
      }
    });
  }

  viewDoctor(doctor: any) {
    const dialogRef = this.dialogService.openDialog(DoctorViewDialogComponent, {
      title: `Doctor Profile - ${doctor.name}`,
      width: '60%',
      height: '90%',
      data: {
        doctor: doctor
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
    // Convert doctor data to the format expected by AdminDoctorCreateComponent (Doctor interface)
    const nameParts = doctor.name?.split(' ') || [];
    const doctorData = {
      registrationNumber: doctor.id || '',
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      specialization: doctor.specialization || '',
      password: '', // Password not required for edit, will be handled by form
      doctorStatus: this.mapStatusToDoctorStatus(doctor.status),
      contactNumber: doctor.phone || '',
      email: doctor.email || '',
      qualifications: doctor.qualifications || '',
      certifications: doctor.certifications || [],
      profileImageUrl: doctor.profilePic || '',
      workingDays: doctor.workingDays || [],
      appointmentTimings: doctor.appointmentTimings || []
    };

    const dialogRef = this.dialogService.openDialog(AdminDoctorCreateComponent, {
      title: `Edit Doctor - ${doctor.name}`,
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
        this.showSnackBar('Doctor updated successfully!');
      }
    });
  }

  scheduleDoctor(doctor: any) {
    const dialogRef = this.dialogService.openDialog(DoctorScheduleDialogComponent, {
      title: `Schedule - ${doctor.name}`,
      width: '65%',
      height:'90%',
      data: {
        doctor: doctor
      },
      footerActions: [
        {
          id: 'cancel',
          text: 'Cancel',
          color: 'secondary',
          appearance: 'stroked'
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
        // Handle schedule save
        this.showSnackBar(`Schedule saved for ${doctor.name}`);
        // You can add API call here to save the schedule
      }
    });
  }

  deleteDoctor(doctor: any) {
    if (confirm(`Are you sure you want to delete ${doctor.name}?`)) {
      this.rowData = this.rowData.filter(d => d.id !== doctor.id);
      this.showSnackBar(`Doctor ${doctor.name} deleted successfully`);
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
} 