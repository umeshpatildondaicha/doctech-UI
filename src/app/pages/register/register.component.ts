import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit, OnDestroy {
  currentStep = 1;
  totalSteps = 4;
  isLoading = false;
  isSubmitted = false;
  errorMessage = '';

  step1Form!: FormGroup;
  step2Form!: FormGroup;
  step3Form!: FormGroup;

  readonly hospitalTypes = [
    'General Hospital', 'Specialty Hospital', 'Multi-Specialty Hospital',
    'Teaching Hospital', 'Clinic', 'Diagnostic Center', 'Rehabilitation Center'
  ];

  readonly specializationOptions = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology',
    'Gynecology', 'Dermatology', 'Ophthalmology', 'ENT', 'Psychiatry',
    'General Medicine', 'Emergency Medicine', 'Physiotherapy', 'Nutrition'
  ];

  selectedSpecializations: string[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.step1Form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      registrationNumber: ['', [Validators.required]],
      hospitalType: ['', Validators.required],
      hospitalDescription: ['']
    });

    this.step2Form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      contactNumber: ['', Validators.required],
      hospitalWebsite: [''],
      latitude: [''],
      longitude: ['']
    }, { validators: this.passwordMatchValidator });

    this.step3Form = this.fb.group({
      totalBeds: [0, [Validators.required, Validators.min(0)]],
      hasEmergencyServices: [false],
      supportsTelemedicine: [false],
      emergencyContactNumber: [''],
      emergencyEmail: ['']
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  toggleSpecialization(spec: string): void {
    const idx = this.selectedSpecializations.indexOf(spec);
    if (idx >= 0) {
      this.selectedSpecializations.splice(idx, 1);
    } else {
      this.selectedSpecializations.push(spec);
    }
  }

  isSpecializationSelected(spec: string): boolean {
    return this.selectedSpecializations.includes(spec);
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.step1Form.invalid) {
      this.step1Form.markAllAsTouched();
      return;
    }
    if (this.currentStep === 2 && this.step2Form.invalid) {
      this.step2Form.markAllAsTouched();
      return;
    }
    if (this.currentStep === 3 && this.step3Form.invalid) {
      this.step3Form.markAllAsTouched();
      return;
    }
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.cdr.markForCheck();
    } else if (this.currentStep === 3) {
      this.submitRegistration();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.markForCheck();
    }
  }

  submitRegistration(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const { confirmPassword, ...step2Data } = this.step2Form.value;

    const payload = {
      ...this.step1Form.value,
      ...step2Data,
      ...this.step3Form.value,
      specializations: this.selectedSpecializations,
      hospitalId: this.generateHospitalId(),
      active: true,
      approvedBySuperAdmin: false
    };

    this.http.post(`${environment.apiUrl}${environment.endpoints.hospitals.register}`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.isSubmitted = true;
          this.currentStep = 4;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  private generateHospitalId(): string {
    const name = this.step1Form.get('name')?.value || '';
    const reg = this.step1Form.get('registrationNumber')?.value || '';
    return `${name.replaceAll(' ', '').substring(0, 6).toUpperCase()}-${reg.replaceAll(' ', '').substring(0, 6).toUpperCase()}-${Date.now()}`;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  getStepLabel(step: number): string {
    const labels = ['Basic Info', 'Contact & Access', 'Facilities', 'Confirmation'];
    return labels[step - 1] ?? '';
  }

  hasError(form: FormGroup, field: string, error: string): boolean {
    const control = form.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }
}
