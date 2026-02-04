import { Component, OnInit, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AppButtonComponent, DividerComponent, GridComponent, IconComponent, ImageComponent, PageBodyDirective, PageComponent, StatusCellRendererComponent } from '@lk/core';
import { ColDef } from 'ag-grid-community';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';

import { DashboardDetailsComponent } from '../dashboard-details/dashboard-details.component';
import { RoomsService } from '../../services/rooms.service';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';

interface DashboardStats {
  roomAvailability: number;
  totalRooms: number;
  bookAppointment: number;
  totalPatients: number;
  overallVisitors: number;
}

/** API response shape for GET /api/appointments/doctor/:doctorCode/requests */
interface AppointmentRequestApi {
  appointmentPublicId: string;
  doctorName?: string;
  patientPublicId?: string;
  patientName: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string | null;
  tokenNumber?: number | null;
  reason: string;
  priority: string;
  paymentStatus: string;
  slotId?: string | null;
  bookingMode?: string;
}

/** Row model for the appointment requests grid (mapped from API + used for Approve) */
interface AppointmentRequest {
  id: string;
  appointmentPublicId: string;
  patientName: string;
  patientAvatar?: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  paymentStatus: 'PAID' | 'PENDING' | 'UNPAID';
}

@Component({
    selector: 'app-dashboard',
    imports: [
        CommonModule,
        DashboardDetailsComponent,
        HighchartsChartModule,
        AppButtonComponent,
        DividerComponent,
        GridComponent,
        IconComponent,
        PageComponent,
        PageBodyDirective,
        ImageComponent
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  Highcharts: typeof Highcharts = Highcharts;
  isBrowser = false;

  // Recent activity for right column
  recentActivity: { id: number; type: string; icon: string; text: string; time: string }[] = [
    { id: 1, type: 'success', icon: 'check_circle', text: 'Appointment confirmed — Robert Chen', time: '2m ago' },
    { id: 2, type: 'info', icon: 'person_add', text: 'New patient registered — Emily Davis', time: '15m ago' },
    { id: 3, type: 'warning', icon: 'schedule', text: 'Appointment rescheduled — Michael Brown', time: '1h ago' },
    { id: 4, type: 'success', icon: 'payment', text: 'Payment received — Sarah Johnson', time: '2h ago' },
    { id: 5, type: 'info', icon: 'event_available', text: 'Room 3 now available', time: '3h ago' }
  ];

  // Stats
  stats: DashboardStats = {
    roomAvailability: 50,
    totalRooms: 100,
    bookAppointment: 291,
    totalPatients: 871,
    overallVisitors: 1210
  };

  // Appointment Requests
  appointmentRequests: AppointmentRequest[] = [];
  requestColumns: ColDef[] = [];
  requestGridOptions: any = {};
  requestRowData: AppointmentRequest[] = [];

  // Chart Options
  patientVisitChartOptions: Highcharts.Options = {};
  revenueChartOptions: Highcharts.Options = {};
  patientDemographicsChartOptions: Highcharts.Options = {};
  appointmentStatusChartOptions: Highcharts.Options = {};

  constructor(
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly roomsService: RoomsService,
    private readonly appointmentService: AppointmentService,
    private readonly authService: AuthService,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.loadDashboardData();
    if (this.isBrowser) {
      this.initializeCharts();
    }
  }

  ngAfterViewInit() {
    if (this.isBrowser && !this.patientVisitChartOptions.chart) {
      setTimeout(() => {
        this.initializeCharts();
      }, 0);
    }
  }

  private updateRequestRowData() {
    // Keep a stable rowData reference for ag-grid to avoid re-render thrash.
    this.requestRowData = [...this.appointmentRequests];
  }

  /** Map API request item to grid row; id and appointmentPublicId are set for Approve API. */
  private mapRequestApiToRow(item: AppointmentRequestApi): AppointmentRequest {
    const priority = (item.priority === 'NORMAL' ? 'MEDIUM' : item.priority ?? 'MEDIUM').toUpperCase() as AppointmentRequest['priority'];
    const paymentStatus = (item.paymentStatus ?? 'PENDING').toUpperCase() as AppointmentRequest['paymentStatus'];
    return {
      id: item.appointmentPublicId,
      appointmentPublicId: item.appointmentPublicId,
      patientName: item.patientName ?? '—',
      requestedDate: item.appointmentDate ?? '—',
      requestedTime: item.startTime ?? '—',
      reason: item.reason ?? '—',
      priority,
      paymentStatus
    };
  }

  /** First and last day of current month for status-counts API (YYYY-MM-DD). */
  private getDefaultStatusCountDateRange(): { from: string; to: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return {
      from: `${y}-${m}-01`,
      to: `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    };
  }

  /** Map status-counts API response to chart order: [Confirmed, Pending, Cancelled, Completed]. */
  private mapStatusCountsToChartData(res: any): number[] {
    const counts = res?.counts ?? res?.data ?? res?.content ?? {};
    const n = (key: string): number => {
      const v = counts[key] ?? counts[key?.toLowerCase()];
      return typeof v === 'number' ? v : 0;
    };
    return [
      n('SCHEDULED') || n('CONFIRMED'),
      n('PENDING'),
      n('CANCELLED'),
      n('COMPLETED')
    ];
  }

  /** Map age-groups API response to pie chart data [{ name, y }, ...]. */
  private mapAgeGroupDemographicsToChartData(res: any): { name: string; y: number }[] {
    const raw = res?.data ?? res?.ageGroups ?? res?.content ?? res;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item: any) => ({
        name: item.name ?? item.ageGroup ?? item.label ?? String(item.key ?? '—'),
        y: typeof item.count === 'number' ? item.count : Number(item.value ?? item.y ?? 0) || 0
      })).filter((d: { name: string; y: number }) => d.name && d.y >= 0);
    }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return Object.entries(raw).map(([name, value]) => ({
        name: name.includes('Age') ? name : `Age ${name}`,
        y: typeof value === 'number' ? value : Number(value) || 0
      })).filter((d: { name: string; y: number }) => d.y > 0 || d.name);
    }
    return [];
  }

  loadDashboardData() {
    // Load room availability
    this.roomsService.getRooms().subscribe((rooms: any[]) => {
      const availableRooms = rooms.filter((r: any) => r.status === 'Available').length;
      this.stats.roomAvailability = availableRooms;
      this.stats.totalRooms = rooms.length;

      // You can put any other logic that depends on rooms here, if needed
    });

    // Appointment requests from API (GET .../requests)
    const doctorCode = this.authService.getCurrentUser()?.id ?? 'DR2';
    this.appointmentService.getAppointmentRequests('DR1').subscribe({
      next: (res: any) => {
        const list: AppointmentRequestApi[] = Array.isArray(res) ? res : res?.data ?? res?.content ?? [];
        this.appointmentRequests = list.map((item: AppointmentRequestApi) => this.mapRequestApiToRow(item));
        this.updateRequestRowData();
      },
      error: () => {
        this.appointmentRequests = [];
        this.updateRequestRowData();
      }
    });

    // Appointment Status chart data (GET .../status-counts)
    const statusDoctorCode = this.authService.getCurrentUser()?.id ?? 'DR1';
    const { from, to } = this.getDefaultStatusCountDateRange();
    this.appointmentService.getAppointmentStatusCounts('DR1', from, to).subscribe({
      next: (res: any) => {
        const data = this.mapStatusCountsToChartData(res);
        if (this.appointmentStatusChartOptions.series?.[0]) {
          this.appointmentStatusChartOptions = {
            ...this.appointmentStatusChartOptions,
            series: [{ ...this.appointmentStatusChartOptions.series[0], data }]
          };
        }
      },
      error: () => {
        // Keep chart default/fallback data
      }
    });

    // Patient Demographics (age-groups) chart data
    const demographicsDoctorCode = this.authService.getCurrentUser()?.id ?? 'DR1';
    this.appointmentService.getAgeGroupDemographics('DR1').subscribe({
      next: (res: any) => {
        const data = this.mapAgeGroupDemographicsToChartData(res);
        if (this.patientDemographicsChartOptions.series?.[0]) {
          this.patientDemographicsChartOptions = {
            ...this.patientDemographicsChartOptions,
            series: [{ ...this.patientDemographicsChartOptions.series[0], data }]
          };
        }
      },
      error: () => {
        // Keep chart default/fallback data
      }
    });

    // Appointment Requests grid config (core app-grid)
    this.requestColumns = [
      { headerName: 'Patient', field: 'patientName', sortable: true, filter: true, flex: 1.4, minWidth: 160 },
      { headerName: 'Date', field: 'requestedDate', sortable: true, filter: true, width: 120 },
      { headerName: 'Time', field: 'requestedTime', sortable: true, filter: true, width: 110 },
      { headerName: 'Reason', field: 'reason', sortable: true, filter: true, flex: 2, minWidth: 220 },
      {
        headerName: 'Priority',
        field: 'priority',
        sortable: true,
        filter: true,
        width: 120,
        cellRenderer: StatusCellRendererComponent,
        cellRendererParams: {
          statusMapping: { high: 'status-danger', medium: 'status-warning', low: 'status-success' }
        }
      },
      {
        headerName: 'Payment',
        field: 'paymentStatus',
        sortable: true,
        filter: true,
        width: 140,
        cellRenderer: StatusCellRendererComponent,
        cellRendererParams: {
          statusMapping: { paid: 'status-success', pending: 'status-warning', unpaid: 'status-danger' }
        }
      }
    ];

    this.requestGridOptions = {
      rowHeight: 44,
      headerHeight: 36,
      // NOTE: @lk/core GridComponent currently defaults pagination=true internally.
      // We set this to false for intent, and hide any remaining pagination UI via scoped CSS on this page.
      pagination: false,
      suppressCellFocus: true,
      menuActions: [
        { title: 'Approve', icon: 'check_circle', click: (param: any) => this.approveAppointmentRequest(param?.data ?? param) },
        { title: 'Reschedule', icon: 'event_available', click: (param: any) => this.rescheduleAppointmentRequest(param?.data ?? param) },
        { title: 'Reject', icon: 'cancel', click: (param: any) => this.rejectAppointmentRequest(param?.data ?? param) }
      ]
    };

    // Initialize filtered rowData once.
    this.updateRequestRowData();

  }

  initializeCharts() {
    // Patient Visit Chart
    this.patientVisitChartOptions = {
      chart: {
        type: 'spline',
        backgroundColor: 'transparent',
        height: 250,
        spacing: [6, 6, 6, 6]
      },
      title: {
        text: ''
      },
      xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: { style: { fontSize: '11px', color: '#64748b' } },
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0'
      },
      yAxis: {
        title: { text: 'Visits' },
        labels: { style: { fontSize: '11px', color: '#64748b' } },
        gridLineColor: '#f1f5f9',
        gridLineWidth: 1
      },
      legend: { enabled: true },
      credits: { enabled: false },
      plotOptions: {
        spline: {
          lineWidth: 3,
          marker: { enabled: false },
          states: { hover: { lineWidth: 4 } }
        }
      },
      series: [
        {
          name: 'This Year',
          type: 'spline',
          data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330],
          color: '#0d9488'
        },
        {
          name: 'Last Year',
          type: 'spline',
          data: [80, 100, 90, 110, 70, 150, 140, 130, 140, 160, 180, 200],
          color: '#94a3b8'
        }
      ],
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
        style: { fontSize: '12px' }
      }
    };

    // Revenue Chart
    this.revenueChartOptions = {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        height: 240
      },
      title: {
        text: ''
      },
      xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        labels: { style: { fontSize: '11px', color: '#64748b' } },
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0'
      },
      yAxis: {
        title: { text: 'Revenue (₹)' },
        labels: { style: { fontSize: '11px', color: '#64748b' } },
        gridLineColor: '#f1f5f9',
        gridLineWidth: 1
      },
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        column: {
          borderRadius: 6,
          color: '#0d9488',
          dataLabels: {
            enabled: true,
            style: { fontSize: '11px', fontWeight: '600', color: '#64748b' }
          }
        }
      },
      series: [{
        name: 'Revenue',
        type: 'column',
        data: [45000, 52000, 48000, 61000, 55000, 67000]
      }],
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
        formatter: function() {
          return `<b>${this.x}</b><br/>Revenue: <b>₹${this.y?.toLocaleString()}</b>`;
        }
      }
    };

    // Patient Demographics Chart
    this.patientDemographicsChartOptions = {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        height: 240
      },
      title: {
        text: ''
      },
      credits: { enabled: false },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            style: { fontSize: '11px', color: '#64748b' }
          },
          colors: ['#0d9488', '#3b82f6', '#6366f1', '#94a3b8', '#f59e0b']
        }
      },
      series: [{
        name: 'Patients',
        type: 'pie',
        data: [
          { name: 'Age 0-18', y: 15 },
          { name: 'Age 19-35', y: 35 },
          { name: 'Age 36-50', y: 28 },
          { name: 'Age 51-65', y: 15 },
          { name: 'Age 65+', y: 7 }
        ]
      }],
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
        formatter: function() {
          const point = this as any;
          if (point?.point?.name) {
            return `<b>${point.point.name}</b><br/>Patients: <b>${this.y}%</b>`;
          }
          return '';
        }
      }
    };

    // Appointment Status Chart
    this.appointmentStatusChartOptions = {
      chart: {
        type: 'bar',
        backgroundColor: 'transparent',
        height: 220
      },
      title: {
        text: ''
      },
      xAxis: {
        categories: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
        labels: { style: { fontSize: '11px', color: '#64748b' } },
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0'
      },
      yAxis: {
        title: { text: 'Count' },
        labels: { style: { fontSize: '11px', color: '#64748b' } },
        gridLineColor: '#f1f5f9',
        gridLineWidth: 1
      },
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        bar: {
          borderRadius: 6,
          colorByPoint: true,
          colors: ['#0d9488', '#f59e0b', '#ef4444', '#16a34a'],
          dataLabels: {
            enabled: true,
            style: { fontSize: '11px', fontWeight: '600', color: '#ffffff' }
          }
        }
      },
      series: [{
        name: 'Appointments',
        type: 'bar',
        data: [180, 65, 20, 145]
      }],
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
        formatter: function() {
          return `<b>${this.x}</b><br/>Count: <b>${this.y}</b>`;
        }
      }
    };
  }

  openDetails(cardType: 'patients' | 'appointments' | 'billing', event?: Event) {
    if (event && event.target instanceof HTMLElement) {
      event.target.blur();
    }
    this.dialog.open(DashboardDetailsComponent, {
      data: { cardType },
      width: '900px',
      autoFocus: false
    });
  }

  navigateToAppointments() {
    this.router.navigate(['/appointment']);
  }

  approveAppointmentRequest(request: AppointmentRequest) {
    if (!request) return;
    const appointmentPublicId = request.appointmentPublicId ?? request.id;
    if (!appointmentPublicId || typeof appointmentPublicId !== 'string') return;
    const doctorCode = this.authService.getCurrentUser()?.id ?? 'DR2';
    this.appointmentService.approveAppointmentRequest("DR1", appointmentPublicId).subscribe({
      next: () => {
        this.appointmentRequests = this.appointmentRequests.filter(r => r.appointmentPublicId !== appointmentPublicId);
        this.updateRequestRowData();
      },
      error: () => {
        // Optionally show error toast; list stays unchanged
      }
    });
  }

  rejectAppointmentRequest(request: AppointmentRequest) {
    const appointmentPublicId = request.appointmentPublicId ?? request.id;
    this.appointmentRequests = this.appointmentRequests.filter(r => r.appointmentPublicId !== appointmentPublicId);
    this.updateRequestRowData();
  }

  rescheduleAppointmentRequest(request: AppointmentRequest) {
    const appointmentPublicId = request.appointmentPublicId ?? request.id;
    this.router.navigate(['/appointment'], { queryParams: { reschedule: appointmentPublicId } });
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'CONFIRMED': 'status-confirmed',
      'CANCELLED': 'status-cancelled',
      'HIGH': 'priority-high',
      'MEDIUM': 'priority-medium',
      'LOW': 'priority-low',
      'PAID': 'payment-paid',
      'UNPAID': 'payment-unpaid'
    };
    
    // Handle PENDING status separately for different contexts
    if (status === 'PENDING') {
      // This will be handled in the template with specific class
      return 'status-pending';
    }
    
    return statusMap[status] || '';
  }

  getPaymentStatusClass(status: string): string {
    const paymentMap: { [key: string]: string } = {
      'PAID': 'payment-paid',
      'PENDING': 'payment-pending',
      'UNPAID': 'payment-unpaid'
    };
    return paymentMap[status] || '';
  }

  formatTime(dateTime: string): string {
    // Format time helper
    return dateTime;
  }
}
