import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { 
  AppInputComponent,
  AppSelectboxComponent,
  AppButtonComponent,
  IconComponent,

  DialogFooterAction,
  GridComponent,
  StatusCellRendererComponent,
  ExtendedGridOptions,
  DialogboxService
} from "@lk/core";
import { Router } from '@angular/router';
import { ServiceFormComponent } from './service-form/service-form.component';
import { ColDef } from 'ag-grid-community';
import { 
  AdminPageHeaderComponent
} from '../../../components';

interface Service {
  id: number;
  name: string;
  category: string;
  department: string;
  price: number;
  availability: 'Available' | 'Unavailable' | 'Limited';
  status: 'Active' | 'Inactive';
  description: string;
  duration: number;
  rating: number;
  consultationType: string;
  icon: string;
  backgroundColor: string;
  images?: string[];
  documents?: string[];
  tags?: string[];
  metrics?: {
    bookings: number;
    revenue: number;
    capacity: number;
    satisfaction: number;
  };
  dependencies?: string[];
  insurance?: {
    coverage: number;
    codes: string[];
  };
  capacity?: {
    maxBookings: number;
    currentBookings: number;
    timeSlots: string[];
  };
  dynamicPricing?: {
    seasonal: boolean;
    discounts: Array<{
      type: string;
      percentage: number;
      validUntil: string;
    }>;
  };
  paymentPlans?: Array<{
    name: string;
    installments: number;
    interest: number;
  }>;
}

interface ServiceStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend: number;
}

interface ServicePackage {
  id: number;
  name: string;
  description: string;
  services: Service[];
  totalPrice: number;
  savings: number;
  discount: number;
}

interface ServiceTemplate {
  id: number;
  name: string;
  category: string;
  description: string;
  fieldCount: number;
  type: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
  }>;
}

interface ServiceRecommendation {
  id: number;
  name: string;
  icon: string;
  reason: string;
  matchScore: number;
  popularity: number;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    MatSelectModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    AppInputComponent,
    AppSelectboxComponent,
    AppButtonComponent,
    IconComponent,
    GridComponent,
    AdminPageHeaderComponent
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit, AfterViewInit {
  
  @ViewChild('revenueChart') revenueChartRef!: ElementRef;
  @ViewChild('popularityChart') popularityChartRef!: ElementRef;
  @ViewChild('satisfactionChart') satisfactionChartRef!: ElementRef;
  @ViewChild('capacityChart') capacityChartRef!: ElementRef;

  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: ExtendedGridOptions = {};


  showAnalytics = false;
  showPackages = false;
  showTemplates = false;
  showComparison = false;
  showRecommendations = false;

  // Time range for analytics
  selectedTimeRange = '30d';

  // Comparison services
  comparisonServices: Service[] = [];

  // Analytics data
  serviceStats: ServiceStat[] = [];
  serviceRecommendations: ServiceRecommendation[] = [];

  // Packages and templates
  servicePackages: ServicePackage[] = [];
  serviceTemplates: ServiceTemplate[] = [];

  // Time range options for analytics
  timeRangeOptions = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'Last year', value: '1y' }
  ];



  services: Service[] = [
    {
      id: 1,
      name: 'General Consultation',
      category: 'consultation',
      department: 'Internal Medicine',
      price: 100,
      availability: 'Available',
      status: 'Active',
      description: 'Comprehensive general consultation with detailed health assessment',
      duration: 30,
      rating: 4.5,
      consultationType: 'Consultation',
      icon: 'medical_services',
      backgroundColor: '#4ECDC4',
      tags: ['General', 'Primary Care', 'Health Check'],
      metrics: {
        bookings: 156,
        revenue: 15600,
        capacity: 85,
        satisfaction: 4.5
      },
      dependencies: ['Blood Test', 'Medical History'],
      insurance: {
        coverage: 80,
        codes: ['99213', '99214']
      },
      capacity: {
        maxBookings: 20,
        currentBookings: 17,
        timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00']
      },
      dynamicPricing: {
        seasonal: true,
        discounts: [
          {
            type: 'Senior Citizen',
            percentage: 15,
            validUntil: '2024-12-31'
          }
        ]
      },
      paymentPlans: [
        {
          name: '3-Month Plan',
          installments: 3,
          interest: 0
        }
      ]
    },
    {
      id: 2,
      name: 'Cardiology Consultation',
      category: 'consultation',
      department: 'Cardiology',
      price: 150,
      availability: 'Available',
      status: 'Active',
      description: 'Specialized cardiac consultation with ECG and stress test',
      duration: 45,
      rating: 4.7,
      consultationType: 'Consultation',
      icon: 'favorite',
      backgroundColor: '#FFB5B5',
      tags: ['Cardiology', 'Heart', 'ECG'],
      metrics: {
        bookings: 89,
        revenue: 13350,
        capacity: 92,
        satisfaction: 4.7
      },
      dependencies: ['ECG Report', 'Blood Pressure Reading'],
      insurance: {
        coverage: 90,
        codes: ['99215', '93010']
      }
    },
    {
      id: 3,
      name: 'Dermatology Consultation',
      category: 'consultation',
      department: 'Dermatology',
      price: 120,
      availability: 'Available',
      status: 'Active',
      description: 'Skin condition assessment and treatment planning',
      duration: 30,
      rating: 4.6,
      consultationType: 'Consultation',
      icon: 'face',
      backgroundColor: '#FFCBB5',
      tags: ['Dermatology', 'Skin', 'Treatment'],
      metrics: {
        bookings: 134,
        revenue: 16080,
        capacity: 78,
        satisfaction: 4.6
      }
    },
    {
      id: 4,
      name: 'Physical Therapy',
      category: 'therapy',
      department: 'Rehabilitation',
      price: 80,
      availability: 'Available',
      status: 'Active',
      description: 'Comprehensive physical therapy session with exercise program',
      duration: 60,
      rating: 4.5,
      consultationType: 'Therapy',
      icon: 'fitness_center',
      backgroundColor: '#B0E0E6',
      tags: ['Therapy', 'Rehabilitation', 'Exercise'],
      metrics: {
        bookings: 203,
        revenue: 16240,
        capacity: 88,
        satisfaction: 4.5
      }
    },
    {
      id: 5,
      name: 'MRI Scan',
      category: 'diagnostic',
      department: 'Radiology',
      price: 300,
      availability: 'Limited',
      status: 'Active',
      description: 'Magnetic Resonance Imaging for detailed body scans',
      duration: 45,
      rating: 4.8,
      consultationType: 'Diagnostic',
      icon: 'radio',
      backgroundColor: '#5C7B7B',
      tags: ['Diagnostic', 'MRI', 'Imaging'],
      metrics: {
        bookings: 67,
        revenue: 20100,
        capacity: 65,
        satisfaction: 4.8
      }
    }
  ];

  constructor(private readonly dialogService: DialogboxService, private readonly router: Router) {}

  ngOnInit() {
    this.setupGrid();
    this.initializeAnalytics();
    this.initializePackages();
    this.initializeTemplates();
    this.initializeRecommendations();
  }

  ngAfterViewInit() {
    this.initializeCharts();
  }

  setupGrid() {
    // Column definitions for list view
    this.columnDefs = [
      {
        headerName: 'Service Name',
        field: 'name',
        flex: 2,
        minWidth: 200,
        cellRenderer: (params: any) => {
          return `
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 8px; background-color: ${params.data.backgroundColor}; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="color: white; font-size: 20px;">${params.data.icon}</span>
              </div>
              <div>
                <div style="font-weight: 600; color: var(--primary-font-color);">${params.value}</div>
                <div style="font-size: 12px; color: var(--secondary-font-color);">${params.data.consultationType}</div>
              </div>
            </div>
          `;
        }
      },
      {
        headerName: 'Department',
        field: 'department',
        flex: 1,
        minWidth: 150
      },
      {
        headerName: 'Category',
        field: 'category',
        flex: 1,
        minWidth: 120,
        cellRenderer: (params: any) => {
          const categoryMap: any = {
            'consultation': 'Consultation',
            'therapy': 'Therapy',
            'diagnostic': 'Diagnostic',
            'surgical': 'Surgical'
          };
          return categoryMap[params.value] || params.value;
        }
      },
      {
        headerName: 'Price',
        field: 'price',
        flex: 1,
        minWidth: 100,
        cellRenderer: (params: any) => `$${params.value}`
      },
      {
        headerName: 'Availability',
        field: 'availability',
        flex: 1,
        minWidth: 120,
        cellRenderer: StatusCellRendererComponent
      },
      {
        headerName: 'Rating',
        field: 'rating',
        flex: 1,
        minWidth: 100,
        cellRenderer: (params: any) => {
          const stars = '★'.repeat(Math.floor(params.value)) + '☆'.repeat(5 - Math.floor(params.value));
          return `<span style="color: #fbbf24;">${stars}</span> ${params.value}`;
        }
      },
      {
        headerName: 'Duration',
        field: 'duration',
        flex: 1,
        minWidth: 100,
        cellRenderer: (params: any) => `${params.value} min`
      },
      {
        headerName: 'Bookings',
        field: 'metrics.bookings',
        flex: 1,
        minWidth: 100,
        cellRenderer: (params: any) => params.data.metrics?.bookings || 0
      },
      {
        headerName: 'Revenue',
        field: 'metrics.revenue',
        flex: 1,
        minWidth: 120,
        cellRenderer: (params: any) => `$${params.data.metrics?.revenue || 0}`
      }
    ];

    // Grid options with filtering configuration
    this.gridOptions = {
      menuActions: [
        {
          title: 'View Details',
          icon: 'visibility',
          click: (param) => this.viewServiceDetails(param.data)
        },
        {
          title: 'Edit Service',
          icon: 'edit',
          click: (param) => this.editService(param.data)
        },
        {
          title: 'Add to Comparison',
          icon: 'compare',
          click: (param) => this.addToComparison(param.data)
        },
        {
          title: 'Deactivate',
          icon: 'power_settings_new',
          click: (param) => this.deactivateService(param.data)
        }
      ],
      filterConfig: {
        filterConfig: [
          { label: 'Service Name', key: 'name', type: 'input' },
          { 
            label: 'Department', 
            key: 'department', 
            type: 'select',
            optionList: [
              { name: 'Internal Medicine', value: 'Internal Medicine' },
              { name: 'Cardiology', value: 'Cardiology' },
              { name: 'Dermatology', value: 'Dermatology' },
              { name: 'Neurology', value: 'Neurology' },
              { name: 'Orthopedics', value: 'Orthopedics' },
              { name: 'Pediatrics', value: 'Pediatrics' },
              { name: 'Radiology', value: 'Radiology' },
              { name: 'Urology', value: 'Urology' },
              { name: 'Rehabilitation', value: 'Rehabilitation' }
            ]
          },
          { 
            label: 'Category', 
            key: 'category', 
            type: 'select',
            optionList: [
              { name: 'Consultation', value: 'consultation' },
              { name: 'Therapy', value: 'therapy' },
              { name: 'Diagnostic', value: 'diagnostic' },
              { name: 'Surgical', value: 'surgical' }
            ]
          },
          { label: 'Price', key: 'price', type: 'input' },
          { 
            label: 'Availability', 
            key: 'availability', 
            type: 'select',
            optionList: [
              { name: 'Available', value: 'Available' },
              { name: 'Limited', value: 'Limited' },
              { name: 'Unavailable', value: 'Unavailable' }
            ]
          },
          { label: 'Rating', key: 'rating', type: 'input' },
          { label: 'Duration', key: 'duration', type: 'input' },
          { 
            label: 'Consultation Type', 
            key: 'consultationType', 
            type: 'select',
            optionList: [
              { name: 'Consultation', value: 'Consultation' },
              { name: 'Therapy', value: 'Therapy' },
              { name: 'Diagnostic', value: 'Diagnostic' }
            ]
          }
        ]
      }
    };
  }

  initializeAnalytics() {
    this.serviceStats = [
      {
        label: 'Total Services',
        value: this.services.length,
        icon: 'medical_services',
        color: 'var(--admin-gradient-primary)',
        trend: 12.5
      },
      {
        label: 'Active Services',
        value: this.services.filter(s => s.status === 'Active').length,
        icon: 'check_circle',
        color: 'var(--admin-gradient-success)',
        trend: 8.2
      },
      {
        label: 'Total Revenue',
        value: '$' + this.services.reduce((sum, s) => sum + (s.metrics?.revenue || 0), 0).toLocaleString(),
        icon: 'account_balance',
        color: 'var(--admin-gradient-info)',
        trend: 15.7
      },
      {
        label: 'Total Bookings',
        value: this.services.reduce((sum, s) => sum + (s.metrics?.bookings || 0), 0),
        icon: 'event',
        color: 'var(--admin-gradient-warning)',
        trend: 23.1
      },
      {
        label: 'Avg. Rating',
        value: (this.services.reduce((sum, s) => sum + s.rating, 0) / this.services.length).toFixed(1),
        icon: 'star',
        color: 'var(--admin-gradient-danger)',
        trend: 5.3
      },
      {
        label: 'Capacity Utilization',
        value: Math.round(this.services.reduce((sum, s) => sum + (s.metrics?.capacity || 0), 0) / this.services.length) + '%',
        icon: 'analytics',
        color: 'var(--admin-gradient-neutral)',
        trend: -2.1
      }
    ];
  }

  initializePackages() {
    this.servicePackages = [
      {
        id: 1,
        name: 'Complete Health Checkup',
        description: 'Comprehensive health assessment package',
        services: [this.services[0], this.services[1], this.services[4]],
        totalPrice: 550,
        savings: 120,
        discount: 18
      },
      {
        id: 2,
        name: 'Rehabilitation Package',
        description: 'Physical therapy and recovery program',
        services: [this.services[3]],
        totalPrice: 400,
        savings: 80,
        discount: 17
      }
    ];
  }

  initializeTemplates() {
    this.serviceTemplates = [
      {
        id: 1,
        name: 'Standard Consultation',
        category: 'Consultation',
        description: 'Basic consultation template with common fields',
        fieldCount: 8,
        type: 'Basic',
        fields: [
          { name: 'Service Name', type: 'text', required: true },
          { name: 'Department', type: 'select', required: true },
          { name: 'Price', type: 'number', required: true },
          { name: 'Duration', type: 'number', required: true },
          { name: 'Description', type: 'textarea', required: false },
          { name: 'Icon', type: 'select', required: true },
          { name: 'Availability', type: 'select', required: true },
          { name: 'Category', type: 'select', required: true }
        ]
      },
      {
        id: 2,
        name: 'Diagnostic Service',
        category: 'Diagnostic',
        description: 'Template for diagnostic services with special requirements',
        fieldCount: 12,
        type: 'Advanced',
        fields: [
          { name: 'Service Name', type: 'text', required: true },
          { name: 'Department', type: 'select', required: true },
          { name: 'Price', type: 'number', required: true },
          { name: 'Duration', type: 'number', required: true },
          { name: 'Description', type: 'textarea', required: false },
          { name: 'Prerequisites', type: 'multiselect', required: false },
          { name: 'Insurance Codes', type: 'multiselect', required: true },
          { name: 'Capacity Limits', type: 'number', required: true },
          { name: 'Equipment Required', type: 'multiselect', required: true },
          { name: 'Room Type', type: 'select', required: true },
          { name: 'Specialist Required', type: 'select', required: true },
          { name: 'Follow-up Required', type: 'boolean', required: false }
        ]
      }
    ];
  }

  initializeRecommendations() {
    this.serviceRecommendations = [
      {
        id: 1,
        name: 'Neurology Consultation',
        icon: 'psychology',
        reason: 'Based on your search for "headache" symptoms',
        matchScore: 95,
        popularity: 87
      },
      {
        id: 2,
        name: 'Cardiology Consultation',
        icon: 'favorite',
        reason: 'Popular service with high patient satisfaction',
        matchScore: 82,
        popularity: 92
      },
      {
        id: 3,
        name: 'Physical Therapy',
        icon: 'fitness_center',
        reason: 'Recommended for rehabilitation needs',
        matchScore: 78,
        popularity: 85
      }
    ];
  }

  initializeCharts() {
    // Initialize Chart.js charts here
    // This would require Chart.js library to be added
    console.log('Charts initialized');
  }



  // Analytics methods
  onTimeRangeChange(range: string) {
    this.selectedTimeRange = range;
    this.updateAnalytics();
  }

  updateAnalytics() {
    // Update analytics based on selected time range
    console.log('Updating analytics for range:', this.selectedTimeRange);
  }

  exportAnalytics() {
    // Export analytics data
    console.log('Exporting analytics');
  }

  // Toggle recommendations
  toggleRecommendations() {
    this.showRecommendations = !this.showRecommendations;
  }



  // Comparison methods
  addToComparison(service: Service) {
    if (!this.comparisonServices.some(s => s.id === service.id)) {
      this.comparisonServices.push(service);
      this.showComparison = true;
    }
  }

  removeFromComparison(service: Service) {
    this.comparisonServices = this.comparisonServices.filter(s => s.id !== service.id);
    if (this.comparisonServices.length === 0) {
      this.showComparison = false;
    }
  }



  clearComparison() {
    this.comparisonServices = [];
    this.showComparison = false;
  }

  // Package methods
  createServicePackage() {
    console.log('Creating service package');
  }

  editPackage(servicePackage: ServicePackage) {
    console.log('Editing package:', servicePackage);
  }

  viewPackage(servicePackage: ServicePackage) {
    console.log('Viewing package:', servicePackage);
  }

  // Template methods
  createServiceTemplate() {
    console.log('Creating service template');
  }

  useTemplate(template: ServiceTemplate) {
    console.log('Using template:', template);
    this.router.navigate(['/admin/services/add'], { 
      state: { template } 
    });
  }

  editTemplate(template: ServiceTemplate) {
    console.log('Editing template:', template);
  }

  // Service methods
  addNewService() {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'stroked'
      },
      {
        id: 'save',
        text: 'Add Service',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    const dialogRef = this.dialogService.openDialog(ServiceFormComponent, {
      title: 'Add New Service',
      width: '65%',
      height: '90%',
      maxWidth: '1400px',
      data: {
        service: undefined,
        isEditMode: false
      },
      footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save' && result.service) {
        // Handle service creation
        console.log('Service created:', result.service);
        // Refresh services list if needed
        // this.loadServices();
      }
    });
  }

  editService(service: Service) {
    // Convert Service to ServiceFormModel format
    const serviceData = {
      id: service.id,
      name: service.name,
      description: service.description,
      department: service.department,
      category: service.category as any,
      price: service.price,
      duration: service.duration,
      consultationType: service.consultationType as any,
      availability: service.availability as any,
      tags: service.tags || [],
      dependencies: service.dependencies || [],
      maxBookings: service.capacity?.maxBookings || null,
      currentBookings: service.capacity?.currentBookings || null,
      timeSlots: service.capacity?.timeSlots?.join(',') || '',
      insuranceCoverage: service.insurance?.coverage || null,
      insuranceCodes: service.insurance?.codes || [],
      seasonalPricing: service.dynamicPricing?.seasonal || false,
      discounts: service.dynamicPricing?.discounts || [],
      paymentPlans: service.paymentPlans || []
    };

    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'stroked'
      },
      {
        id: 'save',
        text: 'Update Service',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    const dialogRef = this.dialogService.openDialog(ServiceFormComponent, {
      title: `Edit Service - ${service.name}`,
      width: '65%',
      height: '90%',
      maxWidth: '1400px',
      data: {
        service: serviceData,
        isEditMode: true
      },
      footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save' && result.service) {
        // Handle service update
        console.log('Service updated:', result.service);
        // Update the service in the list
        const index = this.services.findIndex(s => s.id === service.id);
        if (index > -1) {
          // Update service data
          Object.assign(this.services[index], result.service);
        }
      }
    });
  }

  viewServiceDetails(service: Service) {
    this.router.navigate(['/admin/services', service.id], { 
      state: { service } 
    });
  }

  viewService(service: Service | ServiceRecommendation) {
    if ('id' in service && 'category' in service) {
      this.viewServiceDetails(service as Service);
    } else {
      // Handle recommendation click - could navigate to service details or search
      console.log('Viewing recommendation:', service);
    }
  }

  deactivateService(service: Service) {
    console.log('Deactivate service', service);
  }



  getStars(rating: number): string {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  }



} 