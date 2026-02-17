/**
 * Login Component for Shree Clinic Management System
 * Following enterprise-level standards with proper form validation, error handling, and UX
 */

import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService, LoginRequest, UserType } from "@lk/core";
import { environment } from '../../../environments/environment';

/**
 * Component responsible for user authentication
 */
@Component({
    selector: 'app-login',
    imports: [
    ReactiveFormsModule,
    MatIconModule,
],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  // Form and state management
  public loginForm!: FormGroup;
  public isLoading = false;
  public showPassword = false;
  public errorMessage = '';
  public successMessage = '';

  // Animated stat counters
  public statHospitals = '0';
  public statDoctors = '0';
  public statPatients = '0';
  public statStaff = '0';
  public currentTime = '';
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  // User type options
  public readonly userTypes = [
    { value: UserType.HOSPITAL, label: 'Hospital Admin', icon: 'business', description: 'Manage hospital operations and staff' },
    { value: UserType.DOCTOR, label: 'Doctor', icon: 'medical_services', description: 'Access patient records and manage appointments' }
  ];

  // Demo credentials for testing
  public readonly demoCredentials: Record<string, { email: string; password: string }> = {
    [UserType.HOSPITAL]: { email: 'u513107@gmail.com', password: 'Shree@123' },
    [UserType.DOCTOR]: { email: 'swapnil@gmail.com', password: 'Swapnil@123' }
  };

  // Environment for template access
  public readonly environment = environment;

  // Private properties
  private readonly destroy$ = new Subject<void>();
  private loginAttempts = 0;
  private readonly maxLoginAttempts = environment.security.maxLoginAttempts;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkExistingAuth();
    this.setupAuthStateSubscription();
  }

  ngAfterViewInit(): void {
    this.startCounterAnimation();
    this.startClock();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  /**
   * Initialize the login form with validation
   */
  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50)
      ]],
      rememberMe: [false]
    });
  }

  /**
   * Check if user is already authenticated
   */
  private checkExistingAuth(): void {
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.redirectToDashboard();
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Setup authentication state subscription
   */
  private setupAuthStateSubscription(): void {
    this.authService.authState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      console.log('Auth state changed:', state);
      this.isLoading = state.isLoading;
      this.errorMessage = state.error || '';
      
      if (state.isAuthenticated && state.currentUser) {
        console.log('User authenticated, redirecting...');
        this.showSuccessMessage(`Welcome back, ${state.currentUser.user.fullName}!`);
        this.redirectToDashboard();
      }
      this.cdr.markForCheck();
    });
  }

  /**
   * Handle form submission
   */
  public onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    if (this.loginAttempts >= this.maxLoginAttempts) {
      this.showErrorMessage('Too many login attempts. Please try again later.');
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const loginRequest: LoginRequest = {
      email: this.loginForm.get('email')?.value?.trim(),
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(loginRequest, this.loginForm.get('rememberMe')?.value).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        console.log('Login successful:', result);
        this.loginAttempts = 0;
        this.showSuccessMessage('Login successful! Redirecting...');
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        console.error('Login failed:', error);
        this.loginAttempts++;
        this.errorMessage = error.message;
        this.handleLoginError();
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Handle login errors
   */
  private handleLoginError(): void {
    if (this.loginAttempts >= this.maxLoginAttempts) {
      this.showErrorMessage('Account temporarily locked due to multiple failed attempts.');
      this.loginForm.disable();
      
      // Re-enable form after lockout duration
      setTimeout(() => {
        this.loginAttempts = 0;
        this.loginForm.enable();
        this.showSuccessMessage('Login form unlocked. Please try again.');
        this.cdr.markForCheck();
      }, environment.security.lockoutDurationMinutes * 60 * 1000);
    }
  }

  /**
   * Fill demo credentials for testing
   */
  public fillDemoCredentials(): void {
    const selectedUserType = this.loginForm.get('userType')?.value;
    const credentials = this.demoCredentials[selectedUserType as string];
    
    if (credentials) {
      this.loginForm.patchValue({
        email: credentials.email,
        password: credentials.password
      });
      this.showSuccessMessage(`Demo credentials filled for ${this.getUserTypeLabel(selectedUserType)}`);
    }
  }

  /**
   * Fill Doctor credentials
   */
  public fillDoctorCredentials(): void {
    const credentials = this.demoCredentials[UserType.DOCTOR];
    this.loginForm.patchValue({
      email: credentials.email,
      password: credentials.password
    });
  }

  /**
   * Fill Hospital Admin credentials
   */
  public fillHospitalCredentials(): void {
    const credentials = this.demoCredentials[UserType.HOSPITAL];
    this.loginForm.patchValue({
      email: credentials.email,
      password: credentials.password
    });
  }

  /**
   * Toggle password visibility
   */
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Get user type label
   */
  public getUserTypeLabel(userType: string): string {
    return this.userTypes.find(type => type.value === userType)?.label || userType;
  }

  /**
   * Get form control for validation
   */
  public getFormControl(controlName: string): AbstractControl | null {
    return this.loginForm.get(controlName);
  }

  /**
   * Check if form control is invalid and touched
   */
  public isFieldInvalid(controlName: string): boolean {
    const control = this.getFormControl(controlName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get error message for form control
   */
  public getErrorMessage(controlName: string): string {
    const control = this.getFormControl(controlName);
    
    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }
    
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    
    if (control.errors['minlength']) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    }
    
    if (control.errors['maxlength']) {
      return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
    }

    return 'Invalid input';
  }

  /**
   * Redirect to appropriate dashboard
   */
  private redirectToDashboard(): void {
    const userType = this.authService.getUserType();
    switch (userType) {
      case UserType.HOSPITAL:
        this.router.navigate(['/admin-dashboard']);
        break;
      case UserType.DOCTOR:
        this.router.navigate(['/dashboard']);
        break;
      case UserType.PATIENT:
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Reset form
   */
  public resetForm(): void {
    this.loginForm.reset({
      email: '',
      password: '',
      rememberMe: false
    });
    this.errorMessage = '';
    this.successMessage = '';
    this.loginForm.enable();
  }

  /**
   * Select user type
   */
  public selectUserType(userType: string): void {
    // Deprecated: user type selection no longer required by backend
    this.onUserTypeChange();
  }

  /**
   * Handle user type change
   */
  public onUserTypeChange(): void {
    // Clear form when user type changes
    this.loginForm.patchValue({
      email: '',
      password: ''
    });
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Handle keyboard events for user type selection
   */
  public onUserTypeKeydown(event: KeyboardEvent, userType: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectUserType(userType);
    }
  }

  /**
   * Animate stat counters from 0 to target with ease-out cubic
   */
  private startCounterAnimation(): void {
    const duration = 2200;
    const start = performance.now();
    const targets = { hospitals: 56, doctors: 1243, patients: 48720, staff: 3856 };

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      this.statHospitals = Math.floor(ease * targets.hospitals).toLocaleString();
      this.statDoctors = Math.floor(ease * targets.doctors).toLocaleString();
      this.statPatients = Math.floor(ease * targets.patients).toLocaleString();
      this.statStaff = Math.floor(ease * targets.staff).toLocaleString();
      this.cdr.markForCheck();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    setTimeout(() => requestAnimationFrame(step), 800);
  }

  /**
   * Live clock ticking every second
   */
  private startClock(): void {
    const update = () => {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('en-US', { hour12: false });
      this.cdr.markForCheck();
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  }
} 