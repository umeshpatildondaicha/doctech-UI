import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AppButtonComponent } from "@lk/core";
import { AppInputComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { IconComponent } from "@lk/core";
import { PageComponent, BreadcrumbItem } from "@lk/core";

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

@Component({
    selector: 'app-service-details',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatTabsModule,
        MatChipsModule,
        MatCardModule,
        MatButtonModule,
        MatDividerModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        MatListModule,
        MatBadgeModule,
        MatTooltipModule,
        AppButtonComponent,
        AppInputComponent,
        AppSelectboxComponent,
        IconComponent,
        PageComponent
    ],
    templateUrl: './service-details.component.html',
    styleUrls: ['./service-details.component.scss']
})
export class ServiceDetailsComponent implements OnInit, OnDestroy {
  service: Service | null = null;
  isEditMode = false;
  isLoading = true;
  isSaving = false;
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Services', route: '/admin/services', icon: 'medical_services' },
    { label: 'Service Details', icon: 'medical_services', isActive: true }
  ];
  
  // Form for editing
  serviceForm!: FormGroup;
  
  // Tab management
  selectedTab = 0;
  
  // Mock data for demonstration
  mockService: Service = {
    id: 1,
    name: 'General Consultation',
    category: 'consultation',
    department: 'Internal Medicine',
    price: 100,
    availability: 'Available',
    status: 'Active',
    description: 'Comprehensive general consultation with detailed health assessment including physical examination, medical history review, and personalized treatment recommendations. Our experienced physicians provide thorough evaluations to ensure optimal patient care.',
    duration: 30,
    rating: 4.5,
    consultationType: 'Consultation',
    icon: 'medical_services',
    backgroundColor: '#4ECDC4',
    tags: ['General', 'Primary Care', 'Health Check', 'Preventive'],
    metrics: {
      bookings: 156,
      revenue: 15600,
      capacity: 85,
      satisfaction: 4.5
    },
    dependencies: ['Blood Test', 'Medical History', 'Vital Signs'],
    insurance: {
      coverage: 80,
      codes: ['99213', '99214', '99215']
    },
    capacity: {
      maxBookings: 20,
      currentBookings: 17,
      timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
    },
    dynamicPricing: {
      seasonal: true,
      discounts: [
        {
          type: 'Senior Citizen',
          percentage: 15,
          validUntil: '2024-12-31'
        },
        {
          type: 'Student',
          percentage: 10,
          validUntil: '2024-06-30'
        }
      ]
    },
    paymentPlans: [
      {
        name: '3-Month Plan',
        installments: 3,
        interest: 0
      },
      {
        name: '6-Month Plan',
        installments: 6,
        interest: 2.5
      }
    ],
    images: [
      'assets/images/service-consultation-1.jpg',
      'assets/images/service-consultation-2.jpg'
    ],
    documents: [
      'assets/documents/consultation-consent-form.pdf',
      'assets/documents/medical-history-form.pdf'
    ]
  };

  categoryOptions = [
    { label: 'Consultation', value: 'consultation' },
    { label: 'Therapy', value: 'therapy' },
    { label: 'Diagnostic', value: 'diagnostic' },
    { label: 'Surgical', value: 'surgical' }
  ];

  availabilityOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Limited', value: 'Limited' },
    { label: 'Unavailable', value: 'Unavailable' }
  ];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  consultationTypeOptions = [
    { label: 'Consultation', value: 'Consultation' },
    { label: 'Therapy', value: 'Therapy' },
    { label: 'Diagnostic', value: 'Diagnostic' },
    { label: 'Surgical', value: 'Surgical' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadService();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadService(): void {
    // Get service ID from route params
    const serviceId = this.route.snapshot.paramMap.get('id');
    
    // Get service data from navigation state or load from service
    const navigation = this.router.getCurrentNavigation();
    const serviceData = navigation?.extras?.state?.['service'];
    
    if (serviceData) {
      // Use service data from navigation state
      this.service = serviceData;
      this.initializeForm();
      this.isLoading = false;
    } else if (serviceId) {
      // Load service by ID (simulate API call)
      setTimeout(() => {
        // In a real app, you would make an API call here
        // For now, we'll use mock data
        this.service = this.mockService;
        this.initializeForm();
        this.isLoading = false;
      }, 500);
    } else {
      // No service found
      this.isLoading = false;
      this.snackBar.open('Service not found', 'Close', { duration: 3000 });
      this.router.navigate(['/admin/services']);
    }
  }

  initializeForm(): void {
    if (!this.service) return;

    this.serviceForm = this.fb.group({
      name: [this.service.name, [Validators.required, Validators.minLength(3)]],
      category: [this.service.category, Validators.required],
      department: [this.service.department, Validators.required],
      price: [this.service.price, [Validators.required, Validators.min(0)]],
      availability: [this.service.availability, Validators.required],
      status: [this.service.status, Validators.required],
      description: [this.service.description, [Validators.required, Validators.minLength(10)]],
      duration: [this.service.duration, [Validators.required, Validators.min(1)]],
      consultationType: [this.service.consultationType, Validators.required],
      icon: [this.service.icon, Validators.required],
      backgroundColor: [this.service.backgroundColor, Validators.required],
      tags: [this.service.tags || []],
      dependencies: [this.service.dependencies || []],
      insuranceCoverage: [this.service.insurance?.coverage || 0, [Validators.min(0), Validators.max(100)]],
      insuranceCodes: [this.service.insurance?.codes || []],
      maxBookings: [this.service.capacity?.maxBookings || 0, [Validators.min(0)]],
      currentBookings: [this.service.capacity?.currentBookings || 0, [Validators.min(0)]],
      timeSlots: [this.service.capacity?.timeSlots || []],
      seasonalPricing: [this.service.dynamicPricing?.seasonal || false],
      discounts: [this.service.dynamicPricing?.discounts || []],
      paymentPlans: [this.service.paymentPlans || []]
    });
  }

  getStars(rating: number): string {
    const int = Math.max(0, Math.min(5, Math.floor(rating)));
    return '★'.repeat(int) + '☆'.repeat(5 - int);
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      consultation: 'Consultation',
      therapy: 'Therapy',
      diagnostic: 'Diagnostic',
      surgical: 'Surgical'
    };
    return map[category.toLowerCase()] || category;
  }

  getAvailabilityClass(availability: string): string {
    const a = availability.toLowerCase();
    if (a === 'available') return 'available';
    if (a === 'limited') return 'limited';
    if (a === 'unavailable') return 'unavailable';
    return 'neutral';
  }

  getCapacityPercentage(): number {
    if (!this.service?.capacity) return 0;
    return (this.service.capacity.currentBookings / this.service.capacity.maxBookings) * 100;
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.initializeForm();
    }
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    
    // Simulate API call
    setTimeout(() => {
      // Update service with form values
      if (this.service) {
        this.service = {
          ...this.service,
          ...this.serviceForm.value
        };
      }
      
      this.isSaving = false;
      this.isEditMode = false;
      this.snackBar.open('Service updated successfully!', 'Close', { duration: 3000 });
    }, 1000);
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.initializeForm();
  }

  deleteService(): void {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      this.snackBar.open('Service deleted successfully!', 'Close', { duration: 3000 });
      this.router.navigate(['/admin/services']);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/services']);
  }

  // Form getters for easy access
  get name() { return this.serviceForm.get('name'); }
  get category() { return this.serviceForm.get('category'); }
  get department() { return this.serviceForm.get('department'); }
  get price() { return this.serviceForm.get('price'); }
  get availability() { return this.serviceForm.get('availability'); }
  get status() { return this.serviceForm.get('status'); }
  get description() { return this.serviceForm.get('description'); }
  get duration() { return this.serviceForm.get('duration'); }
  get consultationType() { return this.serviceForm.get('consultationType'); }

  onBreadcrumbClick(item: any): void {
    if (item.path) {
      this.router.navigate([item.path]);
    }
  }
}
