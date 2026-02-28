import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageComponent, BreadcrumbItem } from '@lk/core';

export type BillingCycle = 'monthly' | 'yearly';

export interface ServiceFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
  assignedDoctors: number;
  isEnabled: boolean;
}

export interface HospitalService {
  id: number;
  name: string;
  description: string;
  tagline: string;
  icon: string;
  color: string;
  gradient: string;
  category: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: ServiceFeature[];
  status: 'available' | 'purchased';
  popular: boolean;
  badge?: string;
  purchasedOn?: string;
  totalDoctors: number;
}

@Component({
  selector: 'app-plans',
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, PageComponent],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss'
})
export class PlansComponent {
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Plans', route: '/admin/plans', icon: 'payments', isActive: true }
  ];

  billingCycle = signal<BillingCycle>('monthly');

  services: HospitalService[] = [
    {
      id: 1,
      name: 'Basic Service',
      description: 'Core digital infrastructure to run your hospital efficiently — from appointments to patient records.',
      tagline: 'Essential hospital operations',
      icon: 'local_hospital',
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      category: 'Foundation',
      monthlyPrice: 7999,
      yearlyPrice: 79990,
      currency: '₹',
      popular: true,
      badge: 'Most Popular',
      status: 'purchased',
      purchasedOn: '2025-11-01',
      totalDoctors: 18,
      features: [
        {
          id: 'appointments',
          name: 'Appointment Scheduling',
          icon: 'event',
          description: 'Book, reschedule & manage patient appointments seamlessly',
          assignedDoctors: 18,
          isEnabled: true
        },
        {
          id: 'chat',
          name: 'Doctor–Patient Chat',
          icon: 'chat',
          description: 'End-to-end encrypted real-time messaging',
          assignedDoctors: 12,
          isEnabled: true
        },
        {
          id: 'prescriptions',
          name: 'Digital Prescriptions',
          icon: 'description',
          description: 'Create, sign and share e-prescriptions digitally',
          assignedDoctors: 18,
          isEnabled: true
        },
        {
          id: 'patient-mgmt',
          name: 'Patient Management',
          icon: 'people',
          description: 'Complete patient records, history and profiles',
          assignedDoctors: 18,
          isEnabled: true
        },
        {
          id: 'reports',
          name: 'Analytics & Reports',
          icon: 'bar_chart',
          description: 'Performance dashboards and insights',
          assignedDoctors: 5,
          isEnabled: true
        },
        {
          id: 'notifications',
          name: 'Smart Notifications',
          icon: 'notifications',
          description: 'Automated reminders and alerts for patients',
          assignedDoctors: 0,
          isEnabled: false
        }
      ]
    },
    {
      id: 2,
      name: 'Physiotherapy',
      description: 'Comprehensive rehabilitation tools to help physio doctors deliver better patient recovery outcomes.',
      tagline: 'Physical rehabilitation suite',
      icon: 'self_improvement',
      color: '#059669',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      category: 'Specialty',
      monthlyPrice: 4999,
      yearlyPrice: 49990,
      currency: '₹',
      popular: false,
      status: 'purchased',
      purchasedOn: '2025-12-15',
      totalDoctors: 6,
      features: [
        {
          id: 'exercise-plans',
          name: 'Exercise Plan Creator',
          icon: 'fitness_center',
          description: 'Build custom exercise programs for each patient',
          assignedDoctors: 6,
          isEnabled: true
        },
        {
          id: 'diet-basic',
          name: 'Basic Diet Guidance',
          icon: 'restaurant',
          description: 'Simple dietary recommendations for rehabilitation',
          assignedDoctors: 4,
          isEnabled: true
        },
        {
          id: 'progress-tracking',
          name: 'Progress Tracking',
          icon: 'trending_up',
          description: 'Monitor and chart patient recovery milestones',
          assignedDoctors: 6,
          isEnabled: true
        },
        {
          id: 'assessment',
          name: 'Patient Assessment Forms',
          icon: 'assignment',
          description: 'Standardized physiotherapy evaluation forms',
          assignedDoctors: 6,
          isEnabled: true
        },
        {
          id: 'video-library',
          name: 'Exercise Video Library',
          icon: 'play_circle',
          description: '500+ guided exercise demonstration videos',
          assignedDoctors: 0,
          isEnabled: false
        }
      ]
    },
    {
      id: 3,
      name: 'Nutrition Service',
      description: 'Advanced diet management platform for expert dieticians and nutritionists to deliver personalized care.',
      tagline: 'Comprehensive nutrition management',
      icon: 'lunch_dining',
      color: '#d97706',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      category: 'Specialty',
      monthlyPrice: 3999,
      yearlyPrice: 39990,
      currency: '₹',
      popular: false,
      status: 'available',
      totalDoctors: 0,
      features: [
        {
          id: 'diet-planning',
          name: 'Advanced Diet Planning',
          icon: 'menu_book',
          description: 'Personalized and goal-based meal plan creation',
          assignedDoctors: 0,
          isEnabled: false
        },
        {
          id: 'custom-forms',
          name: 'Custom Assessment Forms',
          icon: 'dynamic_form',
          description: 'Design your own dietary intake and evaluation forms',
          assignedDoctors: 0,
          isEnabled: false
        },
        {
          id: 'meal-builder',
          name: 'Meal Plan Builder',
          icon: 'kitchen',
          description: 'Intuitive drag-and-drop weekly meal planner',
          assignedDoctors: 0,
          isEnabled: false
        },
        {
          id: 'nutrition-analysis',
          name: 'Nutritional Analysis',
          icon: 'analytics',
          description: 'Detailed macro & micronutrient breakdown reports',
          assignedDoctors: 0,
          isEnabled: false
        },
        {
          id: 'food-database',
          name: 'Food Database Access',
          icon: 'library_books',
          description: '10,000+ food items with nutritional data',
          assignedDoctors: 0,
          isEnabled: false
        }
      ]
    },
    {
      id: 4,
      name: 'Mental Wellness',
      description: 'Purpose-built tools for mental health professionals to track, assess and improve patient wellbeing.',
      tagline: 'Mental health & counseling',
      icon: 'psychology',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      category: 'Specialty',
      monthlyPrice: 2999,
      yearlyPrice: 29990,
      currency: '₹',
      popular: false,
      badge: 'New',
      status: 'available',
      totalDoctors: 0,
      features: [
        {
          id: 'mental-assessment',
          name: 'Mental Health Assessments',
          icon: 'psychology_alt',
          description: 'Standardized psychological screening tools (PHQ-9, GAD-7)',
          assignedDoctors: 0,
          isEnabled: false
        },
        {
          id: 'therapy-schedule',
          name: 'Therapy Session Scheduling',
          icon: 'calendar_today',
          description: 'Specialized therapy appointment management',
          assignedDoctors: 0,
          isEnabled: false
        },
        {
          id: 'mood-tracking',
          name: 'Mood & Emotion Tracking',
          icon: 'sentiment_satisfied',
          description: 'Daily patient mood logging and trend visualization',
          assignedDoctors: 0,
          isEnabled: false
        },
        {
          id: 'custom-questionnaires',
          name: 'Custom Questionnaires',
          icon: 'quiz',
          description: 'Build and deploy tailored patient surveys',
          assignedDoctors: 0,
          isEnabled: false
        }
      ]
    }
  ];

  purchasedServices = computed(() => this.services.filter(s => s.status === 'purchased'));

  totalActiveFeatures = computed(() =>
    this.purchasedServices().reduce((sum, s) => sum + s.features.filter(f => f.isEnabled).length, 0)
  );

  totalDoctorsEquipped = computed(() =>
    this.purchasedServices().reduce((sum, s) => sum + s.totalDoctors, 0)
  );

  monthlySpend = computed(() =>
    this.purchasedServices().reduce((sum, s) => sum + s.monthlyPrice, 0)
  );

  constructor() {}

  getPrice(service: HospitalService): number {
    return this.billingCycle() === 'monthly' ? service.monthlyPrice : service.yearlyPrice;
  }

  getSavings(service: HospitalService): number {
    return (service.monthlyPrice * 12) - service.yearlyPrice;
  }

  subscribeToService(service: HospitalService): void {
    service.status = 'purchased';
    service.purchasedOn = new Date().toISOString().split('T')[0];
    service.features.forEach(f => (f.isEnabled = true));
  }
}
