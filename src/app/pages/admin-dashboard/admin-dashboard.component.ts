import { Component, OnInit, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { AuthService, AppButtonComponent, AppInputComponent, IconComponent } from '@lk/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  trend: number;
  trendLabel: string;
  color: string;
  description: string;
}

interface Department {
  id: number;
  name: string;
  head: string;
  staff: number;
  patients: number;
  occupancy: number;
  revenue: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface RecentActivity {
  id: number;
  type: 'admission' | 'discharge' | 'appointment' | 'emergency' | 'surgery' | 'billing';
  title: string;
  description: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

interface FinancialMetric {
  label: string;
  value: number;
  currency: string;
  trend: number;
  color: string;
}

type TabType = 'overview' | 'staff' | 'patients' | 'billing' | 'analytics';

@Component({
    selector: 'app-admin-dashboard',
    imports: [CommonModule, HighchartsChartModule, AppButtonComponent, AppInputComponent, IconComponent],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  Highcharts: typeof Highcharts = Highcharts;
  isBrowser = false;
  activeTab: TabType = 'overview';

  // Chart configurations
  revenueChartOptions: Highcharts.Options = {};
  patientFlowChartOptions: Highcharts.Options = {};
  departmentChartOptions: Highcharts.Options = {};

  // Current user info
  currentUser = {
    name: 'Dr. Sarah Administrator',
    role: 'Hospital Administrator',
    avatar: 'assets/avatars/admin.jpg',
    lastLogin: '2024-01-15 08:30 AM'
  };

  // Dashboard statistics
  statsCards: StatCard[] = [
    {
      title: 'Total Revenue',
      value: '₹2.8M',
      icon: 'account_balance',
      trend: 12.5,
      trendLabel: 'vs last month',
      color: 'var(--admin-gradient-success)',
      description: 'Monthly hospital revenue'
    },
    {
      title: 'Active Patients',
      value: '1,847',
      icon: 'people',
      trend: 8.2,
      trendLabel: 'vs last month',
      color: 'var(--admin-gradient-info)',
      description: 'Currently admitted patients'
    },
    {
      title: 'Staff Members',
      value: '324',
      icon: 'badge',
      trend: 3.1,
      trendLabel: 'vs last month',
      color: 'var(--admin-gradient-warning)',
      description: 'Total hospital staff'
    },
    {
      title: 'Bed Occupancy',
      value: '87%',
      icon: 'hotel',
      trend: -2.3,
      trendLabel: 'vs last month',
      color: 'var(--admin-gradient-danger)',
      description: 'Current bed utilization'
    },
    {
      title: 'Today\'s Appointments',
      value: '156',
      icon: 'event',
      trend: 15.7,
      trendLabel: 'vs yesterday',
      color: 'var(--admin-gradient-neutral)',
      description: 'Scheduled for today'
    },
    {
      title: 'Emergency Cases',
      value: '23',
      icon: 'local_hospital',
      trend: -8.4,
      trendLabel: 'vs yesterday',
      color: 'var(--admin-gradient-danger)',
      description: 'Active emergency cases'
    }
  ];

  // Department overview
  departments: Department[] = [
    {
      id: 1,
      name: 'Cardiology',
      head: 'Dr. Robert Johnson',
      staff: 28,
      patients: 45,
      occupancy: 89,
      revenue: 450000,
      status: 'excellent'
    },
    {
      id: 2,
      name: 'Neurology',
      head: 'Dr. Sarah Wilson',
      staff: 22,
      patients: 32,
      occupancy: 76,
      revenue: 380000,
      status: 'good'
    },
    {
      id: 3,
      name: 'Pediatrics',
      head: 'Dr. Michael Brown',
      staff: 35,
      patients: 67,
      occupancy: 92,
      revenue: 320000,
      status: 'excellent'
    },
    {
      id: 4,
      name: 'Orthopedics',
      head: 'Dr. Lisa Davis',
      staff: 19,
      patients: 28,
      occupancy: 65,
      revenue: 280000,
      status: 'average'
    },
    {
      id: 5,
      name: 'Emergency',
      head: 'Dr. James Miller',
      staff: 42,
      patients: 23,
      occupancy: 45,
      revenue: 520000,
      status: 'good'
    }
  ];

  // Recent activities
  recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: 'emergency',
      title: 'Critical Patient Admitted',
      description: 'Patient transferred to ICU - Cardiac arrest case',
      time: '2 minutes ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'surgery',
      title: 'Surgery Completed',
      description: 'Dr. Johnson completed cardiac bypass surgery',
      time: '15 minutes ago',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'admission',
      title: 'New Admission',
      description: 'Patient admitted to Pediatrics ward',
      time: '32 minutes ago',
      priority: 'low'
    },
    {
      id: 4,
      type: 'billing',
      title: 'Payment Received',
      description: 'Insurance claim processed - ₹85,000',
      time: '1 hour ago',
      priority: 'medium'
    },
    {
      id: 5,
      type: 'discharge',
      title: 'Patient Discharged',
      description: 'Orthopedics patient discharged successfully',
      time: '2 hours ago',
      priority: 'low'
    }
  ];

  // Financial metrics
  financialMetrics: FinancialMetric[] = [
    {
      label: 'Monthly Revenue',
      value: 2800000,
      currency: '₹',
      trend: 12.5,
      color: 'var(--status-success-color)'
    },
    {
      label: 'Operating Expenses',
      value: 1950000,
      currency: '₹',
      trend: -3.2,
      color: 'var(--status-warning-color)'
    },
    {
      label: 'Net Profit',
      value: 850000,
      currency: '₹',
      trend: 18.7,
      color: 'var(--status-success-color)'
    },
    {
      label: 'Outstanding Bills',
      value: 325000,
      currency: '₹',
      trend: -5.4,
      color: 'var(--status-danger-color)'
    }
  ];

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.initializeCharts();
    }
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
  }

  initializeCharts() {
    this.initializeRevenueChart();
    this.initializePatientFlowChart();
    this.initializeDepartmentChart();
  }

  initializeRevenueChart() {
    this.revenueChartOptions = {
      chart: {
        type: 'areaspline',
        backgroundColor: 'transparent',
        height: 300,
        spacing: [10, 10, 10, 10]
      },
      title: {
        text: ''
      },
      xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
          style: {
            fontSize: '11px',
            color: 'var(--admin-text-muted)'
          }
        },
        lineColor: 'var(--admin-border)',
        tickColor: 'var(--admin-border)'
      },
      yAxis: {
        title: { text: '' },
        labels: {
          style: {
            fontSize: '11px',
            color: 'var(--admin-text-muted)'
          }
        },
        gridLineColor: 'var(--admin-border)',
        gridLineWidth: 1
      },
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        areaspline: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(16, 185, 129, 0.3)'],
              [1, 'rgba(16, 185, 129, 0.05)']
            ]
          },
          lineWidth: 3,
          color: '#10b981',
          marker: { enabled: false }
        }
      },
      series: [{
        name: 'Revenue (₹ Lakhs)',
        type: 'areaspline',
        data: [180, 220, 190, 280, 250, 320, 290, 380, 350, 420, 380, 450]
      }],
      tooltip: {
        backgroundColor: 'var(--admin-card-bg)',
        borderColor: 'var(--admin-border)',
        borderRadius: 8,
        style: { fontSize: '12px' },
        formatter: function(this: any) {
          return `<b>${this.x}</b><br/>Revenue: <b>₹${this.y} Lakhs</b>`;
        }
      }
    };
  }

  initializePatientFlowChart() {
    this.patientFlowChartOptions = {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        height: 300
      },
      title: { text: '' },
      xAxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        labels: {
          style: {
            fontSize: '11px',
            color: 'var(--admin-text-muted)'
          }
        }
      },
      yAxis: {
        title: { text: '' },
        labels: {
          style: {
            fontSize: '11px',
            color: 'var(--admin-text-muted)'
          }
        }
      },
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        column: {
          borderRadius: 4,
          pointPadding: 0.3,
          groupPadding: 0.2,
          color: '#3b82f6'
        }
      },
      series: [{
        name: 'Patients',
        type: 'column',
        data: [45, 52, 48, 61, 58, 43, 39]
      }],
      tooltip: {
        backgroundColor: 'var(--admin-card-bg)',
        borderColor: 'var(--admin-border)',
        borderRadius: 8,
        formatter: function(this: any) {
          return `<b>${this.x}</b><br/>Patients: <b>${this.y}</b>`;
        }
      }
    };
  }

  initializeDepartmentChart() {
    this.departmentChartOptions = {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        height: 300
      },
      title: { text: '' },
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        pie: {
          innerSize: '60%',
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.percentage:.1f}%',
            style: {
              fontSize: '10px',
              color: 'var(--admin-text-secondary)'
            }
          }
        }
      },
      series: [{
        name: 'Patients',
        type: 'pie',
        data: [
          { name: 'Cardiology', y: 45, color: '#ef4444' },
          { name: 'Neurology', y: 32, color: '#3b82f6' },
          { name: 'Pediatrics', y: 67, color: '#10b981' },
          { name: 'Orthopedics', y: 28, color: '#f59e0b' },
          { name: 'Emergency', y: 23, color: '#8b5cf6' }
        ]
      }],
      tooltip: {
        backgroundColor: 'var(--admin-card-bg)',
        borderColor: 'var(--admin-border)',
        borderRadius: 8,
        formatter: function(this: any) {
          return `<b>${this.point?.name || 'Department'}</b><br/>Patients: <b>${this.y}</b> (${this.percentage?.toFixed(1) || 0}%)`;
        }
      }
    };
  }

  // Utility methods
  getActivityIcon(type: string): string {
    const icons = {
      admission: 'person_add',
      discharge: 'person_remove',
      appointment: 'event',
      emergency: 'local_hospital',
      surgery: 'healing',
      billing: 'receipt'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getActivityColor(priority: string): string {
    const colors = {
      high: 'var(--status-danger-color)',
      medium: 'var(--status-warning-color)',
      low: 'var(--status-success-color)'
    };
    return colors[priority as keyof typeof colors] || 'var(--admin-text-muted)';
  }

  getDepartmentStatusColor(status: string): string {
    const colors = {
      excellent: 'var(--status-success-color)',
      good: 'var(--status-info-color)',
      average: 'var(--status-warning-color)',
      poor: 'var(--status-danger-color)'
    };
    return colors[status as keyof typeof colors] || 'var(--admin-text-muted)';
  }

  formatCurrency(value: number): string {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  }

  // Tab Management
  setActiveTab(tab: TabType) {
    this.activeTab = tab;
  }

  // Helper methods for template comparisons
  isOverviewTab(): boolean {
    return this.activeTab === 'overview';
  }

  isStaffTab(): boolean {
    return this.activeTab === 'staff';
  }

  isPatientsTab(): boolean {
    return this.activeTab === 'patients';
  }

  isBillingTab(): boolean {
    return this.activeTab === 'billing';
  }

  isAnalyticsTab(): boolean {
    return this.activeTab === 'analytics';
  }

  // Action methods
  logout() {
    this.authService.logout();
  }

  navigateToStaffManagement() {
    console.log('Navigate to staff management');
  }

  navigateToPatients() {
    console.log('Navigate to patients');
  }

  navigateToBilling() {
    console.log('Navigate to billing');
  }

  navigateToReports() {
    console.log('Navigate to reports');
  }

  navigateToSettings() {
    console.log('Navigate to settings');
  }

  viewDepartmentDetails(department: Department) {
    console.log('View department details:', department);
  }

  viewAllActivities() {
    console.log('View all activities');
  }

  refreshDashboard() {
    console.log('Refresh dashboard data');
    if (this.isBrowser) {
      this.initializeCharts();
    }
  }
} 