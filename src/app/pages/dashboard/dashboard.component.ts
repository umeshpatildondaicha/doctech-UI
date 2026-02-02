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

interface DashboardStats {
  roomAvailability: number;
  totalRooms: number;
  bookAppointment: number;
  totalPatients: number;
  overallVisitors: number;
}

interface AppointmentRequest {
  id: number;
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
    // No quick filters now; just mirror the source list.
    this.requestRowData = [...this.appointmentRequests];
  }

  loadDashboardData() {
    // Load room availability
    this.roomsService.getRooms().subscribe((rooms: any[]) => {
      const availableRooms = rooms.filter((r: any) => r.status === 'Available').length;
      this.stats.roomAvailability = availableRooms;
      this.stats.totalRooms = rooms.length;

      // You can put any other logic that depends on rooms here, if needed
    });

    // Appointment requests (10–20 items)
    this.appointmentRequests = [
      {
        id: 1,
        patientName: 'Robert Chen',
        patientAvatar: 'https://randomuser.me/api/portraits/men/51.jpg',
        requestedDate: 'Today',
        requestedTime: '04:00 PM',
        reason: 'Emergency Consultation',
        priority: 'HIGH',
        paymentStatus: 'PAID'
      },
      {
        id: 2,
        patientName: 'Emily Davis',
        patientAvatar: 'https://randomuser.me/api/portraits/women/52.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '10:00 AM',
        reason: 'Follow-up Visit',
        priority: 'MEDIUM',
        paymentStatus: 'PENDING'
      },
      {
        id: 3,
        patientName: 'Michael Brown',
        patientAvatar: 'https://randomuser.me/api/portraits/men/53.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '02:00 PM',
        reason: 'General Consultation',
        priority: 'LOW',
        paymentStatus: 'UNPAID'
      },
      {
        id: 4,
        patientName: 'Sarah Johnson',
        patientAvatar: 'https://randomuser.me/api/portraits/women/54.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '03:00 PM',
        reason: 'Annual Checkup',
        priority: 'MEDIUM',
        paymentStatus: 'PAID'
      },
      {
        id: 5,
        patientName: 'James Wilson',
        patientAvatar: 'https://randomuser.me/api/portraits/men/55.jpg',
        requestedDate: 'Today',
        requestedTime: '11:00 AM',
        reason: 'Blood Pressure Check',
        priority: 'LOW',
        paymentStatus: 'PAID'
      },
      {
        id: 6,
        patientName: 'Lisa Anderson',
        patientAvatar: 'https://randomuser.me/api/portraits/women/56.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '09:00 AM',
        reason: 'Diabetes Follow-up',
        priority: 'MEDIUM',
        paymentStatus: 'PENDING'
      },
      {
        id: 7,
        patientName: 'David Martinez',
        patientAvatar: 'https://randomuser.me/api/portraits/men/57.jpg',
        requestedDate: 'Today',
        requestedTime: '01:30 PM',
        reason: 'Skin Allergy',
        priority: 'LOW',
        paymentStatus: 'UNPAID'
      },
      {
        id: 8,
        patientName: 'Jennifer Taylor',
        patientAvatar: 'https://randomuser.me/api/portraits/women/58.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '04:00 PM',
        reason: 'Vaccination',
        priority: 'LOW',
        paymentStatus: 'PAID'
      },
      {
        id: 9,
        patientName: 'Christopher Lee',
        patientAvatar: 'https://randomuser.me/api/portraits/men/59.jpg',
        requestedDate: 'Today',
        requestedTime: '03:00 PM',
        reason: 'Chest Pain Evaluation',
        priority: 'HIGH',
        paymentStatus: 'PENDING'
      },
      {
        id: 10,
        patientName: 'Amanda White',
        patientAvatar: 'https://randomuser.me/api/portraits/women/60.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '11:30 AM',
        reason: 'Prenatal Checkup',
        priority: 'MEDIUM',
        paymentStatus: 'PAID'
      },
      {
        id: 11,
        patientName: 'Daniel Harris',
        patientAvatar: 'https://randomuser.me/api/portraits/men/61.jpg',
        requestedDate: 'Today',
        requestedTime: '10:00 AM',
        reason: 'Knee Pain',
        priority: 'MEDIUM',
        paymentStatus: 'UNPAID'
      },
      {
        id: 12,
        patientName: 'Michelle Clark',
        patientAvatar: 'https://randomuser.me/api/portraits/women/62.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '02:00 PM',
        reason: 'Thyroid Review',
        priority: 'LOW',
        paymentStatus: 'PAID'
      },
      {
        id: 13,
        patientName: 'Kevin Robinson',
        patientAvatar: 'https://randomuser.me/api/portraits/men/63.jpg',
        requestedDate: 'Today',
        requestedTime: '05:00 PM',
        reason: 'Migraine',
        priority: 'MEDIUM',
        paymentStatus: 'PENDING'
      },
      {
        id: 14,
        patientName: 'Stephanie Lewis',
        patientAvatar: 'https://randomuser.me/api/portraits/women/64.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '08:30 AM',
        reason: 'Eye Checkup',
        priority: 'LOW',
        paymentStatus: 'PAID'
      },
      {
        id: 15,
        patientName: 'Ryan Walker',
        patientAvatar: 'https://randomuser.me/api/portraits/men/65.jpg',
        requestedDate: 'Today',
        requestedTime: '12:00 PM',
        reason: 'Sports Injury',
        priority: 'HIGH',
        paymentStatus: 'PAID'
      },
      {
        id: 16,
        patientName: 'Nicole Hall',
        patientAvatar: 'https://randomuser.me/api/portraits/women/66.jpg',
        requestedDate: 'Tomorrow',
        requestedTime: '01:00 PM',
        reason: 'Mental Health Follow-up',
        priority: 'MEDIUM',
        paymentStatus: 'PENDING'
      }
    ];

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
        { title: 'Approve', icon: 'check_circle', click: (param: any) => this.approveAppointmentRequest(param.data) },
        { title: 'Reschedule', icon: 'event_available', click: (param: any) => this.rescheduleAppointmentRequest(param.data) },
        { title: 'Reject', icon: 'cancel', click: (param: any) => this.rejectAppointmentRequest(param.data) }
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
    // Handle approval logic
    this.appointmentRequests = this.appointmentRequests.filter(r => r.id !== request.id);
    this.updateRequestRowData();
  }

  rejectAppointmentRequest(request: AppointmentRequest) {
    // Handle rejection logic
    this.appointmentRequests = this.appointmentRequests.filter(r => r.id !== request.id);
    this.updateRequestRowData();
  }

  rescheduleAppointmentRequest(request: AppointmentRequest) {
    // Handle reschedule logic - navigate to appointment reschedule page
    this.router.navigate(['/appointment'], { queryParams: { reschedule: request.id } });
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
