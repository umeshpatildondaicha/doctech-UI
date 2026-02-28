import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { Appointment } from '../../interfaces/appointment.interface';
import { ExtendedGridOptions, GridComponent, SnackbarService } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { CalendarComponent } from "@lk/core";
import { AppointmentCreateComponent } from '../appointment-create/appointment-create.component';
import { ChipCellRendererComponent } from "@lk/core";
import { Mode } from '../../types/mode.type';
import { AppointmentRescheduleComponent } from '../appointment-reschedule/appointment-reschedule.component';
import { AppointmentViewComponent } from '../appointment-view/appointment-view.component';
import { CoreEventService, DialogboxService, DialogFooterAction, PageComponent, BreadcrumbItem, UserType } from "@lk/core";
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';

@Component({
  selector: 'app-appointment',
  imports: [GridComponent, AppButtonComponent, IconComponent, CalendarComponent, PageComponent, EntityToolbarComponent],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss'
})
export class AppointmentComponent implements OnInit, AfterViewInit {
  @ViewChild('appointmentGrid') appointmentGridRef?: GridComponent;

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/appointment', icon: 'event', isActive: true }
  ];
  // All appointments data
  //apiConfig :any = null;
  isLoading = false;

  /** For entity-toolbar counts (synced from grid when available) */
  displayedRows = 0;
  totalRows = 0;

  /** Grid API config (built in ngOnInit with dynamic doctor code). */
  apiConfig!: {
    dataConfig: Record<string, unknown>;
    countConfig: Record<string, unknown>;
  };

  appointmentSearchHints = [
    'Search by patient name...',
    'Search by doctor name...',
    'Search by status or reason...'
  ];

  appointmentColumns: ColDef[] = [];
  appointmentGridOptions: ExtendedGridOptions = {
    paginationMode : 'infinite',
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

  constructor(
    private dialogService: DialogboxService,
    private router: Router,
    private eventService: CoreEventService,
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private snackbarservice :SnackbarService
  ) {
    this.eventService.setBreadcrumb({
      label: 'Appointments',
      icon: 'event'
    });

  }
 

  ngOnInit() {
    this.getQueryParams();
    this.buildApiConfig();
    this.initializeAppointmentGrid();
  }

  /** Build apiConfig with logged-in doctor code (matches backend and appointment.service). */
  private buildApiConfig(): void {
    const doctorCode = this.authService.getDoctorRegistrationNumber()?.trim() || 'DR1';
    const basePath = `/api/appointments/doctor/${encodeURIComponent(doctorCode)}/appointments`;
    this.apiConfig = {
      dataConfig: {
        url: environment.apiUrl,
        rest: basePath,
        params: '',
        context: '',
        fiqlKey: '',
        lLimitKey: 'llimit',
        uLimitKey: 'ulimit',
        requestType: 'GET',
        type: 'GET',
        queryParamsUrl: 'llimit=$llimit&ulimit=$ulimit',
        suppressNullValues: true,
        suppressDefaultFiqlOnApply: false,
        dataKey: 'content',
        dataType: 'array'
      },
      countConfig: {
        rest: `${basePath}/count`,
        type: 'GET',
        queryParamsUrl: '',
        suppressNullValues: true
      }
    };
  }

  ngAfterViewInit(): void {
    // Sync display counts after grid has loaded data (grid uses apiConfig so data loads async)
    setTimeout(() => this.syncDisplayCounts(), 800);
  }

  getQueryParams() {
    this.route.queryParams.subscribe((params) => {
      if (params['page'] === 'book-appointment') {
        this.eventService.setBreadcrumb({
          label: 'Book Appointment',
          icon: 'event'
        });
      }
    });
  }



  // All appointments methods
  initializeAppointmentGrid() { this.appointmentColumns = [
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
            headerName: 'Reason',
            field: 'reason',
            width: 150,
            sortable: true,
            filter: true
          },
          {
            headerName: 'Start Time',
            field: 'startTime',
            width: 120,
            sortable: true,
            filter: true
          },
          {
            headerName: 'Date',
            field: 'date',
            width: 150,
            sortable: true,
            filter: true,
            valueFormatter: (params: { value?: string | null }) =>
              params.value ? new Date(params.value).toLocaleDateString() : '—'
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
  //  loadAppointmentData(): void {
  //   this.isLoading = true;

  //   const userType = this.authService.getUserType();
  //   const user = this.authService.getCurrentUser() as { role?: string } | null;
  //   const isDoctor =
  //     this.authService.isUserType(UserType.DOCTOR) ||
  //     userType === 'DOCTOR' ||
  //     user?.role === 'DOCTOR';
  //   const doctorCode = this.authService.getDoctorRegistrationNumber() || 'DR1';

  //   if (isDoctor) {
  //     this.appointmentService.getDoctorAppointments(doctorCode).subscribe({
  //       next: (res) => {
  //         this.apiConfig = res?.data ?? res ?? [];
  //         this.isLoading = false;
  //       },
  //       error: (err) => {
  //         console.error('Error loading doctor appointments', err);
  //         this.isLoading = false;
  //       }
  //     });
  //   } else {
  //     this.appointmentService.getAppointments().subscribe({
  //       next: (res) => {
  //         this.apiConfig = res?.data ?? res ?? [];
  //         this.isLoading = false;
  //       },
  //       error: (err) => {
  //         console.error('Error loading appointments', err);
  //         this.isLoading = false;
  //       }
  //     });
  //   }
  // }

  onAppointmentRowClick(event: any) {
    console.log('Appointment row clicked:', event.data);
  }

  onAppointmentSearch(value: string): void {
    const grid = this.appointmentGridRef;
    if (grid?.gridApi) {
      grid.gridApi.setGridOption('quickFilterText', value ?? '');
    }
    this.syncDisplayCounts();
  }

  refreshAppointmentGrid(): void {
    const grid = this.appointmentGridRef;
    if (grid?.gridApi) {
      grid.gridApi.refreshInfiniteCache();
    }
    this.syncDisplayCounts();
  }

  onAppointmentFilterClick(): void {
    // Grid column filters are available via column menu; or open a filter dialog here
  }

  private syncDisplayCounts(): void {
    const grid = this.appointmentGridRef;
    if (grid) {
      this.displayedRows = grid.displayedRows ?? 0;
      this.totalRows = grid.totalRows ?? 0;
    }
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
      // If result has form data (not just action), form was submitted – call API and refresh list
      const hasFormData = result && (result['patient_id'] != null || result['publicId'] != null) && result['appointment_date_time'];
      if (!hasFormData) return;

      const doctorCode = this.authService.getDoctorRegistrationNumber()?.trim() || 'DR1';
      const payload = this.buildBookPayload(result, doctorCode);

      this.appointmentService.bookAppointment(payload).subscribe({
        next: () => {
          this.snackbarservice.success('Appointment Created Successfully');
          this.refreshAppointmentGrid();
        },
        error: (err) => {
          console.error('Create appointment failed', err);
          this.snackbarservice.error(err?.error?.message ?? 'Failed to create appointment.');
        }
      });
    });
  }

  /** Build payload for book appointment API from dialog result. */
  private buildBookPayload(result: Record<string, unknown>, doctorCode: string): Record<string, unknown> {
    const patientId = result['publicId'] ?? result['patient_id'];
    const dateTime = String(result['appointment_date_time'] ?? '');
    const [datePart, timePart] = dateTime.includes('T') ? dateTime.split('T') : [dateTime, '09:00:00'];
    const startTime = (timePart as string)?.slice(0, 8) ?? '09:00:00'; // HH:mm:ss
    const endTime = this.addMinutesToTime(startTime, 30); // 30 min slot

    return {
      doctorRegistrationNumber: doctorCode,
      patientPublicId: patientId,
      date: (datePart as string)?.slice(0, 10),
      startTime: startTime.slice(0, 5), // HH:mm
      endTime: endTime.slice(0, 5),
      notes: result['notes'] ?? ''
    };
  }

  private addMinutesToTime(timeStr: string, minutes: number): string {
    const [h = 0, m = 0] = (timeStr || '09:00').split(':').map(Number);
    const totalM = h * 60 + m + minutes;
    const nh = Math.floor(totalM / 60) % 24;
    const nm = totalM % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}:00`;
  }

  openViewDialog(appointment: Appointment) {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'reschedule',
        text: 'Reschedule',
        color: 'primary',
        appearance: 'flat'
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
        color: 'primary',
        appearance: 'flat'
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

      }
    });
  }

  deleteAppointment(appointment: Appointment) {
    if (confirm(`Are you sure you want to delete appointment for ${appointment.patientName ?? 'this patient'}?`)) {
      // Refresh grid so data stays in sync (backend delete would be called here if API exists)
      this.refreshAppointmentGrid();
      this.snackbarservice.success('Appointment list refreshed.');
    }
  }

  createAppointment() {
    this.openDialog('create');
  }

  navigateToMySchedule() {
    this.router.navigate(['/my-schedule']);
  }
}
