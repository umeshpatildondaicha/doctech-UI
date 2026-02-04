import { Component, OnInit } from '@angular/core';

import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { Appointment } from '../../interfaces/appointment.interface';
import { GridComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { CalendarComponent } from "@lk/core";
import { AppointmentCreateComponent } from '../appointment-create/appointment-create.component';
import { ChipCellRendererComponent } from "@lk/core";
import { Mode } from '../../types/mode.type';
import { AppointmentRescheduleComponent } from '../appointment-reschedule/appointment-reschedule.component';
import { AppointmentViewComponent } from '../appointment-view/appointment-view.component';
import { CoreEventService, DialogboxService, DialogFooterAction, PageComponent, BreadcrumbItem } from "@lk/core";
import { AppointmentService } from '../../services/appointment.service';

@Component({
    selector: 'app-appointment',
    imports: [GridComponent, AppButtonComponent, IconComponent, MatTabsModule, CalendarComponent, PageComponent],
    templateUrl: './appointment.component.html',
    styleUrl: './appointment.component.scss'
})
export class AppointmentComponent implements OnInit {
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/appointment', icon: 'event', isActive: true }
  ];
  selectedTabIndex = 0;

  // All appointments data
  allAppointments: Appointment[] = [];
  isLoading =false;
  appointmentColumns: ColDef[] = [];
  appointmentGridOptions = {
    menuActions: [
      {
        title: 'View',
        icon: 'visibility',
        click: (param: any) => this.openViewDialog(param.data)
      },
      {
        title: 'Reschedule',
        icon: 'schedule',
        click: (param: any) => this.openRescheduleDialog(param.data)
      },
      {
        title: 'Delete',
        icon: 'delete',
        click: (param: any) => this.deleteAppointment(param.data)
      }
    ]
  };

  // Pending appointments data
  pendingAppointments: Appointment[] = [];
  pendingColumns: ColDef[] = [];
  pendingGridOptions = {
    menuActions: [
      {
        title: 'View',
        icon: 'visibility',
        click: (param: any) => this.openViewDialog(param.data)
      },
      {
        title: 'Approve',
        icon: 'check_circle',
        click: (param: any) => this.approveAppointment(param.data)
      },
      {
        title: 'Reject',
        icon: 'cancel',
        click: (param: any) => this.rejectAppointment(param.data)
      }
    ]
  };

  constructor(
    private dialogService: DialogboxService,
    private router: Router,
    private eventService: CoreEventService,
    private route: ActivatedRoute,
    private appointmentService :AppointmentService
  ) {
    this.eventService.setBreadcrumb({
      label: 'Appointments',
      icon: 'event'
    });
  }

  ngOnInit() {
    this.getQueryParams();
    this.initializeAppointmentGrid();
    this.initializePendingGrid();
    this.loadAppointmentData();
    this.loadPendingData();
  }

  getQueryParams() {
    this.route.queryParams.subscribe((params) => {
      if (params['page'] === 'book-appointment') {
        this.selectedTabIndex = 1;
        this.eventService.setBreadcrumb({
          label: 'Book Appointment',
          icon: 'event'
        });
      }
    });
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
  }



  // All appointments methods
  initializeAppointmentGrid() {
    this.appointmentColumns = [
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: ChipCellRendererComponent
      },
      {
        headerName: 'Patient Name',
        field: 'patientName',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Doctor Name',
        field: 'doctorName',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Appointment Date',
        field: 'appointment_date_time',
        width: 150,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return new Date(params.value).toLocaleDateString();
        }
      },
      {
        headerName: 'Slot Time',
        field: 'slotTime',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Referred By',
        field: 'referred_by_doctor_name',
        width: 150,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          if (params.data.is_referred && params.data.referred_by_doctor_name) {
            return `<span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
              <i class="material-icons" style="font-size: 14px; vertical-align: middle; margin-right: 4px;">person_add</i>
              ${params.data.referred_by_doctor_name}
            </span>`;
          }
          return '<span style="color: #6b7280; font-style: italic;">Direct appointment</span>';
        }
      },
      {
        headerName: 'Notes',
        field: 'notes',
        width: 200,
        sortable: true,
        filter: true
      }
    ];
  }

  loadAppointmentData():void {
    this.isLoading = true;

    this.appointmentService.getAppointments().subscribe({
      next: (res) => {
        console.log('My appointments response 👉', res);

        // 🔴 response structure safe handling
        this.allAppointments = res?.data || res || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading appointments ❌', err);
        this.isLoading = false;
      }
    });
  }

  onAppointmentRowClick(event: any) {
    console.log('Appointment row clicked:', event.data);
  }

  openDialog(mode: Mode, data?: Appointment) {
    const isViewMode = mode === 'view';
    const submitButtonText = mode === 'create' ? 'Create Appointment' : mode === 'edit' ? 'Update Appointment' : 'Close';
    
    const footerActions: DialogFooterAction[] = [];
    
    if (!isViewMode) {
      footerActions.push({
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'flat'
      });
    }
    
    footerActions.push({
      id: 'submit',
      text: submitButtonText,
      color: 'primary',
      appearance: 'raised'
    });

    const dialogRef = this.dialogService.openDialog(AppointmentCreateComponent, {
      title: mode === 'create' ? 'Create Appointment' : mode === 'edit' ? 'Edit Appointment' : 'View Appointment',
      data: { mode, appointment: data },
      width: '60%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      // If result has form data (not just action), it means form was submitted successfully
      if (result && (result.patient_id || result.appointment_date_time || (!result.action && result !== null))) {
        // Handle appointment creation/update
        this.loadAppointmentData();
      }
      // If result is just { action: 'submit' } without form data, form validation failed
      // The component will show validation errors
    });
  }

  openViewDialog(appointment: Appointment) {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'reschedule',
        text: 'Reschedule',
        color: 'primary',
        appearance: 'stroked'
      },
      {
        id: 'viewProfile',
        text: 'View Profile',
        color: 'primary',
        appearance: 'flat',
        fontIcon: 'person'
      },
      {
        id: 'cancelAppointment',
        text: 'Cancel Appointment',
        color: 'warn',
        appearance: 'stroked'
      },
      {
        id: 'close',
        text: 'Close',
        color: 'primary',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(AppointmentViewComponent, {
      title: 'View Appointment',
      data: { appointment },
      width: '50%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'viewProfile') {
        // Navigate to patient profile
        this.router.navigate(['/patient', appointment.patient_id]);
      } else if (result?.action === 'reschedule') {
        // Handle reschedule
        this.openRescheduleDialog(appointment);
      } else if (result?.action === 'cancelAppointment') {
        // Handle cancel appointment - show confirmation
        if (confirm('Are you sure you want to cancel this appointment?')) {
          // Handle cancellation logic
          this.loadAppointmentData();
        }
      }
    });
  }

  openRescheduleDialog(appointment: Appointment) {
    const dialogRef = this.dialogService.openDialog(AppointmentRescheduleComponent, {
      title: 'Reschedule Appointment',
      data: { appointment },
      width: '50%'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle rescheduling
        this.loadAppointmentData();
      }
    });
  }

  deleteAppointment(appointment: Appointment) {
    if (confirm(`Are you sure you want to delete appointment for ${appointment.patientName}?`)) {
      this.allAppointments = this.allAppointments.filter(item => item.appointment_id !== appointment.appointment_id);
    }
  }

  approveAppointment(appointment: Appointment) {
    // Handle appointment approval
    console.log('Approving appointment:', appointment);
  }

  rejectAppointment(appointment: Appointment) {
    // Handle appointment rejection
    console.log('Rejecting appointment:', appointment);
  }

  // Pending appointments methods
  initializePendingGrid() {
    this.pendingColumns = [
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: ChipCellRendererComponent
      },
      {
        headerName: 'Patient Name',
        field: 'patientName',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Doctor Name',
        field: 'doctorName',
        width: 150,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Appointment Date',
        field: 'appointment_date_time',
        width: 150,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return new Date(params.value).toLocaleDateString();
        }
      },
      {
        headerName: 'Slot Time',
        field: 'slotTime',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Referred By',
        field: 'referred_by_doctor_name',
        width: 150,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          if (params.data.is_referred && params.data.referred_by_doctor_name) {
            return `<span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
              <i class="material-icons" style="font-size: 14px; vertical-align: middle; margin-right: 4px;">person_add</i>
              ${params.data.referred_by_doctor_name}
            </span>`;
          }
          return '<span style="color: #6b7280; font-style: italic;">Direct appointment</span>';
        }
      },
      {
        headerName: 'Notes',
        field: 'notes',
        width: 200,
        sortable: true,
        filter: true
      }
    ];
  }

  loadPendingData() {
    this.pendingAppointments = this.allAppointments.filter(appointment => appointment.status === 'PENDING');
  }

  onPendingRowClick(event: any) {
    console.log('Pending appointment row clicked:', event.data);
  }



  // Add missing methods referenced in template
  createAppointment() {
    this.openDialog('create');
  }

  refreshPending() {
    console.log('Refreshing pending appointments');
    this.loadPendingData();
  }

  // Navigation method for My Schedule
  navigateToMySchedule() {
    this.router.navigate(['/my-schedule']);
  }
}
