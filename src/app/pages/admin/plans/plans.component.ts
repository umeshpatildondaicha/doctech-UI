import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageComponent, BreadcrumbItem, DialogboxService } from '@lk/core';

interface PlanFeature {
  name: string;
  icon: string;
  included: boolean;
}

interface Plan {
  id: number;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  color: string;
  gradient: string;
  icon: string;
  popular: boolean;
  subscribers: number;
  features: PlanFeature[];
  status: 'active' | 'inactive';
  badge?: string;
}

interface Offer {
  id: number;
  title: string;
  description: string;
  discount: string;
  code: string;
  validUntil: string;
  daysLeft: number;
  color: string;
  icon: string;
  applicablePlans: string[];
}

@Component({
  selector: 'app-plans',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    PageComponent
  ],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss'
})
export class PlansComponent implements OnInit {
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Plans & Offers', route: '/admin/plans', icon: 'payments', isActive: true }
  ];

  billingCycle = signal<'monthly' | 'yearly'>('monthly');

  plans: Plan[] = [
    {
      id: 1,
      name: 'Basic',
      tagline: 'Perfect for individuals',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      currency: '₹',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      icon: 'person',
      popular: false,
      subscribers: 150,
      status: 'active',
      features: [
        { name: 'General Consultation', icon: 'medical_services', included: true },
        { name: 'Basic Lab Tests', icon: 'biotech', included: true },
        { name: 'Digital Prescriptions', icon: 'description', included: true },
        { name: 'Email Support', icon: 'email', included: true },
        { name: 'Specialist Access', icon: 'local_hospital', included: false },
        { name: 'Priority Booking', icon: 'event_available', included: false },
        { name: '24/7 Emergency', icon: 'emergency', included: false },
        { name: 'Family Coverage', icon: 'family_restroom', included: false }
      ]
    },
    {
      id: 2,
      name: 'Premium',
      tagline: 'Most popular for families',
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      currency: '₹',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      icon: 'workspace_premium',
      popular: true,
      subscribers: 320,
      status: 'active',
      badge: 'Most Popular',
      features: [
        { name: 'General Consultation', icon: 'medical_services', included: true },
        { name: 'All Lab Tests', icon: 'biotech', included: true },
        { name: 'Digital Prescriptions', icon: 'description', included: true },
        { name: 'Priority Support', icon: 'support_agent', included: true },
        { name: 'Specialist Access', icon: 'local_hospital', included: true },
        { name: 'Priority Booking', icon: 'event_available', included: true },
        { name: '24/7 Emergency', icon: 'emergency', included: false },
        { name: 'Family Coverage', icon: 'family_restroom', included: false }
      ]
    },
    {
      id: 3,
      name: 'Enterprise',
      tagline: 'Complete healthcare solution',
      monthlyPrice: 3999,
      yearlyPrice: 39990,
      currency: '₹',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      icon: 'diamond',
      popular: false,
      subscribers: 85,
      status: 'active',
      features: [
        { name: 'General Consultation', icon: 'medical_services', included: true },
        { name: 'All Lab Tests', icon: 'biotech', included: true },
        { name: 'Digital Prescriptions', icon: 'description', included: true },
        { name: 'Dedicated Manager', icon: 'person_pin', included: true },
        { name: 'Specialist Access', icon: 'local_hospital', included: true },
        { name: 'Priority Booking', icon: 'event_available', included: true },
        { name: '24/7 Emergency', icon: 'emergency', included: true },
        { name: 'Family Coverage', icon: 'family_restroom', included: true }
      ]
    },
    {
      id: 4,
      name: 'Student',
      tagline: 'Affordable student care',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      currency: '₹',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      icon: 'school',
      popular: false,
      subscribers: 210,
      status: 'active',
      badge: 'Best Value',
      features: [
        { name: 'General Consultation', icon: 'medical_services', included: true },
        { name: 'Basic Lab Tests', icon: 'biotech', included: true },
        { name: 'Digital Prescriptions', icon: 'description', included: true },
        { name: 'Email Support', icon: 'email', included: true },
        { name: 'Mental Wellness', icon: 'psychology', included: true },
        { name: 'Priority Booking', icon: 'event_available', included: false },
        { name: '24/7 Emergency', icon: 'emergency', included: false },
        { name: 'Family Coverage', icon: 'family_restroom', included: false }
      ]
    }
  ];

  offers: Offer[] = [
    {
      id: 1,
      title: 'New Year Health Boost',
      description: 'Start the year healthy! Get 30% off on Premium plan for the first 3 months.',
      discount: '30% OFF',
      code: 'HEALTH2026',
      validUntil: '2026-03-31',
      daysLeft: 42,
      color: '#8b5cf6',
      icon: 'celebration',
      applicablePlans: ['Premium']
    },
    {
      id: 2,
      title: 'Family Bundle Deal',
      description: 'Enroll your whole family and save big. Enterprise plan at a special rate.',
      discount: '₹5,000 OFF',
      code: 'FAMILY5K',
      validUntil: '2026-04-15',
      daysLeft: 57,
      color: '#f59e0b',
      icon: 'family_restroom',
      applicablePlans: ['Enterprise']
    },
    {
      id: 3,
      title: 'Student Welcome Offer',
      description: 'First 2 months free for new student sign-ups with valid student ID.',
      discount: '2 Months Free',
      code: 'STUDENT2M',
      validUntil: '2026-06-30',
      daysLeft: 133,
      color: '#10b981',
      icon: 'school',
      applicablePlans: ['Student']
    },
    {
      id: 4,
      title: 'Refer & Earn',
      description: 'Refer a friend and both get 1 month free on any active plan.',
      discount: '1 Month Free',
      code: 'REFER1M',
      validUntil: '2026-12-31',
      daysLeft: 317,
      color: '#3b82f6',
      icon: 'share',
      applicablePlans: ['Basic', 'Premium', 'Enterprise', 'Student']
    }
  ];

  totalSubscribers = computed(() => this.plans.reduce((s, p) => s + p.subscribers, 0));
  activePlans = computed(() => this.plans.filter(p => p.status === 'active').length);
  totalRevenue = computed(() => {
    const cycle = this.billingCycle();
    return this.plans.reduce((s, p) => s + (cycle === 'monthly' ? p.monthlyPrice : p.yearlyPrice) * p.subscribers, 0);
  });

  constructor(private readonly dialogService: DialogboxService) {}

  ngOnInit() {}

  toggleCycle() {
    this.billingCycle.set(this.billingCycle() === 'monthly' ? 'yearly' : 'monthly');
  }

  getPrice(plan: Plan): number {
    return this.billingCycle() === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  }

  getSavings(plan: Plan): number {
    return (plan.monthlyPrice * 12) - plan.yearlyPrice;
  }

  formatPrice(value: number): string {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    return value.toString();
  }

  getIncludedCount(plan: Plan): number {
    return plan.features.filter(f => f.included).length;
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  editPlan(plan: Plan) {
    console.log('Edit plan:', plan);
  }

  togglePlanStatus(plan: Plan) {
    plan.status = plan.status === 'active' ? 'inactive' : 'active';
  }

  deletePlan(plan: Plan) {
    const dialogRef = this.dialogService.openConfirmationDialog({
      title: 'Delete Plan',
      message: `Are you sure you want to delete "${plan.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete',
      showConfirm: true,
      showCancel: true
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === 'confirm' || result?.action === 'confirm' || result === true) {
        this.plans = this.plans.filter(p => p.id !== plan.id);
      }
    });
  }

  addNewPlan() {
    console.log('Add new plan');
  }

  editOffer(offer: Offer) {
    console.log('Edit offer:', offer);
  }

  deleteOffer(offer: Offer) {
    this.offers = this.offers.filter(o => o.id !== offer.id);
  }
}
