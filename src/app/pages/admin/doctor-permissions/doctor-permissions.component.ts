import { Component, OnInit } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { CatalogService, ServiceCatalogItem, FeatureCatalogItem } from '../../../services/catalog.service';
import { DoctorFeatureService } from '../../../services/doctor-feature.service';
import { AuthService, PageComponent, BreadcrumbItem } from "@lk/core";

@Component({
    selector: 'app-doctor-permissions',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSelectModule,
    MatChipsModule,
    PageComponent
],
    templateUrl: './doctor-permissions.component.html',
    styleUrl: './doctor-permissions.component.scss'
})
export class DoctorPermissionsComponent implements OnInit {
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Doctors', route: '/admin/doctors', icon: 'local_hospital' },
    { label: 'Doctor Permissions', icon: 'security', isActive: true }
  ];
  hospitalPublicId: string = '';

  // Doctor selection
  doctors: Array<{ id: string; name: string; specialty?: string }> = [];
  selectedDoctorId: string | null = null;
  doctorSelectControl = new FormControl<string | null>(null);

  // Right pane: services and features
  services: ServiceCatalogItem[] = [];
  featuresByServiceId = new Map<string, FeatureCatalogItem[]>();
  servicesFilterControl = new FormControl<string>('');
  expandedServiceIds = new Set<string>();

  // UI state
  isLoadingServices = false;
  updatingFeatureIds = new Set<string>();
  loadingFeatureServiceIds = new Set<string>();

  // Local tracking (best-effort) for grants
  grantedFeatureIds = new Set<string>();

  constructor(
    private readonly catalogService: CatalogService,
    private readonly doctorFeatureService: DoctorFeatureService,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Try to resolve hospitalPublicId from multiple possible properties
      this.hospitalPublicId =
        (currentUser as any).hospitalPublicId ||
        (currentUser as any).publicId ||
        (currentUser as any).public_id ||
        currentUser.id ||
        '';
    }

    this.seedDoctors();
    const qpDoctorId = this.route.snapshot.queryParamMap.get('doctorPublicId');
    const fromRoute = this.route.snapshot.queryParamMap.get('form');
    if (fromRoute === 'doctors') {
      // Align breadcrumb with Doctors list when navigated from doctors page
      this.breadcrumb = [
        { label: 'Doctors', route: '/admin/doctors', icon: 'local_hospital', isActive: false },
        { label: 'Doctor Permissions', icon: 'security', isActive: true }
      ];
    }
    if (qpDoctorId) {
      this.selectDoctor(qpDoctorId);
      this.doctorSelectControl.setValue(qpDoctorId);
    }
    this.doctorSelectControl.valueChanges.subscribe(id => {
      if (id) this.selectDoctor(id);
    });
    this.loadServices();
    this.servicesFilterControl.valueChanges.subscribe(() => {
      // No-op; filter applied in template via getter
    });
  }

  // Mock doctor list for now (replace with API when available)
  private seedDoctors(): void {
    this.doctors = [
      { id: 'DOC001', name: 'Umesh Patil', specialty: 'Physiotherapist' },
      { id: 'DOC002', name: 'Swapnil Sonar', specialty: 'Diet Consultant' },
      { id: 'DOC003', name: 'Pramod Kolt', specialty: 'Dentist' },
      { id: 'DOC004', name: 'Lokesh Kees', specialty: 'Surgeon' }
    ];
  }


  selectDoctor(doctorId: string): void {
    this.selectedDoctorId = doctorId;
    // Clear local grants when switching doctor (each doctor has its own permissions)
    this.grantedFeatureIds.clear();
    // TODO: When API is available, load existing grants for this doctor here
  }

  loadServices(): void {
    this.isLoadingServices = true;
    this.catalogService.getServices().subscribe({
      next: (services: ServiceCatalogItem[]) => {
        this.services = services || [];
      },
      error: () => {
        this.showMessage('Failed to load services');
      },
      complete: () => {
        this.isLoadingServices = false;
      }
    });
  }

  onToggleServicePanel(serviceId: string, expanded: boolean): void {
    if (expanded) {
      this.expandedServiceIds.add(serviceId);
      if (!this.featuresByServiceId.has(serviceId)) {
        this.loadingFeatureServiceIds.add(serviceId);
        this.catalogService.getFeatures(serviceId).subscribe({
          next: (features: FeatureCatalogItem[]) => {
            this.featuresByServiceId.set(serviceId, features || []);
          },
          error: () => {
            this.showMessage('Failed to load features');
          },
          complete: () => {
            this.loadingFeatureServiceIds.delete(serviceId);
          }
        });
      }
    } else {
      this.expandedServiceIds.delete(serviceId);
    }
  }


  isFeatureGranted(featureId: string): boolean {
    return this.grantedFeatureIds.has(featureId);
  }

  toggleFeature(event: MatCheckboxChange | MatSlideToggleChange, feature: FeatureCatalogItem): void {
    const doctorPublicId = this.selectedDoctorId;
    if (!doctorPublicId) {
      this.showMessage('Enter a doctorPublicId first');
      event.source.checked = false;
      return;
    }
    if (!this.hospitalPublicId) {
      this.showMessage('Missing hospital context');
      event.source.checked = false;
      return;
    }
    this.updatingFeatureIds.add(feature.id);
    const obs = event.checked
      ? this.doctorFeatureService.grantFeature(doctorPublicId, feature.id, this.hospitalPublicId)
      : this.doctorFeatureService.revokeFeature(doctorPublicId, feature.id, this.hospitalPublicId);
    obs.subscribe({
      next: () => {
        if (event.checked) {
          this.grantedFeatureIds.add(feature.id);
          this.showMessage(`Granted ${feature.name}`);
        } else {
          this.grantedFeatureIds.delete(feature.id);
          this.showMessage(`Revoked ${feature.name}`);
        }
      },
      error: () => {
        // Revert on error
        event.source.checked = !event.checked;
        this.showMessage('Operation failed');
      },
      complete: () => {
        this.updatingFeatureIds.delete(feature.id);
      }
    });
  }

  grantAllInService(serviceId: string): void {
    const doctorPublicId = this.selectedDoctorId;
    if (!doctorPublicId || !this.hospitalPublicId) {
      this.showMessage('Doctor or hospital context missing');
      return;
    }
    const features = this.featuresByServiceId.get(serviceId) || [];
    features.forEach(f => {
      if (this.grantedFeatureIds.has(f.id)) return;
      this.updatingFeatureIds.add(f.id);
      this.doctorFeatureService.grantFeature(doctorPublicId, f.id, this.hospitalPublicId).subscribe({
        next: () => this.grantedFeatureIds.add(f.id),
        error: () => this.showMessage(`Failed granting ${f.name}`),
        complete: () => this.updatingFeatureIds.delete(f.id)
      });
    });
  }

  revokeAllInService(serviceId: string): void {
    const doctorPublicId = this.selectedDoctorId;
    if (!doctorPublicId || !this.hospitalPublicId) {
      this.showMessage('Doctor or hospital context missing');
      return;
    }
    const features = this.featuresByServiceId.get(serviceId) || [];
    features.forEach(f => {
      if (!this.grantedFeatureIds.has(f.id)) return;
      this.updatingFeatureIds.add(f.id);
      this.doctorFeatureService.revokeFeature(doctorPublicId, f.id, this.hospitalPublicId).subscribe({
        next: () => this.grantedFeatureIds.delete(f.id),
        error: () => this.showMessage(`Failed revoking ${f.name}`),
        complete: () => this.updatingFeatureIds.delete(f.id)
      });
    });
  }

  get filteredServices(): ServiceCatalogItem[] {
    const q = (this.servicesFilterControl.value || '').toLowerCase().trim();
    if (!q) return this.services;
    return this.services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.serviceCode.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
  }

  expandAllServices(): void {
    this.filteredServices.forEach(s => {
      if (!this.expandedServiceIds.has(s.id)) {
        this.onToggleServicePanel(s.id, true);
      }
    });
  }

  collapseAllServices(): void {
    this.expandedServiceIds.clear();
  }

  get selectedDoctorName(): string {
    if (!this.selectedDoctorId) return '';
    const doctor = this.doctors.find(d => d.id === this.selectedDoctorId);
    return doctor?.name || this.selectedDoctorId;
  }

  get selectedDoctorSpecialty(): string {
    if (!this.selectedDoctorId) return '';
    const doctor = this.doctors.find(d => d.id === this.selectedDoctorId);
    return doctor?.specialty || '';
  }

  getEnabledFeatureCount(serviceId: string): number {
    const features = this.featuresByServiceId.get(serviceId) || [];
    return features.filter(f => this.grantedFeatureIds.has(f.id)).length;
  }

  isFeatureLocked(featureId: string): boolean {
    // TODO: Implement subscription lock check when API is available
    // For now, return false - can be enhanced with subscription status
    return false;
  }

  saveChanges(): void {
    // TODO: Implement save functionality when API is available
    this.showMessage('Changes saved successfully');
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 2500 });
  }
}


