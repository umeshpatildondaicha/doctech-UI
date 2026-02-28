import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageComponent, BreadcrumbItem } from '@lk/core';
import { CatalogService, ServiceCatalogItem, FeatureCatalogItem } from '../../../services/catalog.service';
import { SubscriptionService, HospitalSubscription } from '../../../services/subscription.service';
import { AuthService } from '../../../services/auth.service';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';

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
  id: string;
  serviceCode: string;
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
  subscriptionId?: string;
}

/** Static UI config keyed by serviceCode — enriches raw API data with pricing & visuals */
const SERVICE_UI_CONFIG: Record<string, Partial<HospitalService>> = {
  core: {
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
  },
  physio_kit: {
    tagline: 'Physical rehabilitation suite',
    icon: 'self_improvement',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    category: 'Specialty',
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    currency: '₹',
    popular: false,
  },
  nutrition_kit: {
    tagline: 'Comprehensive nutrition management',
    icon: 'lunch_dining',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    category: 'Specialty',
    monthlyPrice: 3999,
    yearlyPrice: 39990,
    currency: '₹',
    popular: false,
  },
  mental_wellness: {
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
  },
};

const DEFAULT_SERVICE_UI: Partial<HospitalService> = {
  tagline: 'Hospital service',
  icon: 'medical_services',
  color: '#6b7280',
  gradient: 'linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)',
  category: 'Service',
  monthlyPrice: 0,
  yearlyPrice: 0,
  currency: '₹',
  popular: false,
};

@Component({
  selector: 'app-plans',
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, PageComponent],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss'
})
export class PlansComponent implements OnInit {
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Plans', route: '/admin/plans', icon: 'payments', isActive: true }
  ];

  billingCycle = signal<BillingCycle>('monthly');
  isLoading = signal(false);
  error = signal<string | null>(null);

  services: HospitalService[] = [];

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

  private hospitalPublicId: string | null = null;

  constructor(
    private catalogService: CatalogService,
    private subscriptionService: SubscriptionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser() as any;
    this.hospitalPublicId = user?.publicId ?? user?.userId ?? null;
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const subscriptions$ = this.hospitalPublicId
      ? this.subscriptionService.getHospitalSubscriptions(this.hospitalPublicId).pipe(catchError(() => of([])))
      : of([]);

    forkJoin({
      catalogServices: this.catalogService.getServices().pipe(catchError(() => of([]))),
      subscriptions: subscriptions$
    }).subscribe({
      next: ({ catalogServices, subscriptions }) => {
        const subscribedServiceIds = new Set((subscriptions as HospitalSubscription[])
          .filter(s => s.active)
          .map(s => s.service?.id));

        const subMap = new Map<string, HospitalSubscription>(
          (subscriptions as HospitalSubscription[]).map(s => [s.service?.id, s])
        );

        this.services = (catalogServices as ServiceCatalogItem[]).map(svc => {
          const uiConfig = SERVICE_UI_CONFIG[svc.serviceCode] ?? DEFAULT_SERVICE_UI;
          const isSubscribed = subscribedServiceIds.has(svc.id);
          const sub = subMap.get(svc.id);
          return {
            id: svc.id,
            serviceCode: svc.serviceCode,
            name: svc.name,
            description: svc.description ?? '',
            features: [],
            status: isSubscribed ? 'purchased' : 'available',
            totalDoctors: 0,
            purchasedOn: sub?.startsAt ? new Date(sub.startsAt).toISOString().split('T')[0] : undefined,
            subscriptionId: sub?.id,
            ...uiConfig,
          } as HospitalService;
        });

        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load services. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  getPrice(service: HospitalService): number {
    return this.billingCycle() === 'monthly' ? service.monthlyPrice : service.yearlyPrice;
  }

  getSavings(service: HospitalService): number {
    return (service.monthlyPrice * 12) - service.yearlyPrice;
  }

  subscribeToService(service: HospitalService): void {
    if (!this.hospitalPublicId) {
      this.error.set('Hospital ID not found. Please log in again.');
      return;
    }
    this.subscriptionService.subscribe(this.hospitalPublicId, service.id).subscribe({
      next: (res: any) => {
        service.status = 'purchased';
        service.purchasedOn = new Date().toISOString().split('T')[0];
        service.subscriptionId = res?.id;
        service.features.forEach(f => (f.isEnabled = true));
      },
      error: () => {
        this.error.set(`Failed to subscribe to ${service.name}. Please try again.`);
      }
    });
  }

  unsubscribeFromService(service: HospitalService): void {
    if (!this.hospitalPublicId) return;
    this.subscriptionService.unsubscribe(this.hospitalPublicId, service.id).subscribe({
      next: () => {
        service.status = 'available';
        service.purchasedOn = undefined;
        service.subscriptionId = undefined;
      },
      error: () => {
        this.error.set(`Failed to unsubscribe from ${service.name}. Please try again.`);
      }
    });
  }
}
