import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';


import { Doctor } from '../../../../interfaces/doctor.interface';
import { HttpService } from '../../../../services/http.service';
import { AppButtonComponent, DIALOG_DATA_TOKEN } from '@lk/core';
import { DoctorService } from '../../../../services/doctor.service';
import { AuthService } from '../../../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-doctor-create',
  templateUrl: './doctor-create.component.html',
  styleUrl: './doctor-create.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    AppButtonComponent
  ]
})
export class AdminDoctorCreateComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<AdminDoctorCreateComponent>);
  data = inject<{ doctor?: Doctor }>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private httpService = inject(HttpService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);

  // Hidden submit button reference — used to trigger form submission from footer button
  @ViewChild('hiddenSubmitBtn') hiddenSubmitBtn!: ElementRef<HTMLButtonElement>;

  doctorForm!: FormGroup;
  isLoading = false;
  customCertification: string = '';
  backendConnected: boolean = false;

  // Tab management
  selectedTabIndex: number = 0;

  // Invite existing doctor properties
  inviteMobileNumber: string = '';
  inviteRole: string = 'DOCTOR';
  inviteMessage: string = '';
  inviteMobileNumberError: string = '';
  isInviting: boolean = false;
  specializations: string[] = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
    'Oncology', 'Psychiatry', 'General Surgery', 'Internal Medicine',
    'Emergency Medicine', 'Radiology', 'Pathology', 'Anesthesiology',
    'Obstetrics & Gynecology', 'Ophthalmology', 'ENT', 'Urology',
    'Gastroenterology', 'Endocrinology', 'Rheumatology'
  ];

  doctorStatusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  certificationOptions = [
    'BLS', 'ACLS', 'PALS', 'ATLS', 'FCCS', 'NALS', 'PHTLS',
    'ACLS-EP', 'BLS Instructor', 'ACLS Instructor'
  ];

  constructor() {
    this.initializeForm();
  }

  ngOnInit() {
    if (this.data?.doctor) {
      this.populateForm(this.data.doctor);
    }

    // Test backend connection
    this.testBackendConnection();

    // Access dialogbox content component to update footer actions
    this.initializeFooterActions();

    // Subscribe to form changes and tab changes to update footer button states
    this.setupFormValidation();

    // Intercept footer button clicks
    this.interceptFooterActions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFooterActions() {
    // Wait for the dialog to be fully initialized
    setTimeout(() => {
      this.updateFooterActions();
    }, 100);
  }

  /**
   * Intercept footer button clicks so we can handle async API calls
   * without the dialog closing prematurely.
   *
   * Strategy: try the onFooterAction override first (works if the @lk/core DialogboxContentComponent
   * exposes that hook).  If it doesn't exist we fall back to beforeClosed().
   * We ALSO attach a direct click listener on the rendered footer button as an extra safety net.
   */
  private interceptFooterActions() {
    setTimeout(() => {
      try {
        const container = (this.dialogRef as any)._containerInstance;
        const overlayRef = container?._overlayRef;
        const componentRef = overlayRef?._componentRef;
        const dialogboxContent = componentRef?.instance;

        if (dialogboxContent && typeof dialogboxContent.onFooterAction === 'function') {
          // ✅ Preferred path: override the hook exposed by the dialog wrapper
          const original = dialogboxContent.onFooterAction.bind(dialogboxContent);
          dialogboxContent.onFooterAction = (action: any) => {
            const actionId = action?.id || action;
            const actionText: string = (action?.text ?? actionId ?? '').toString().trim();
            const normalized = actionText.toLowerCase();

            if (actionId === 'save' || normalized.includes('create') || normalized.includes('save')) {
              if (this.selectedTabIndex === 1) { this.onSubmit(); }
              return;  // never auto-close
            }
            if (actionId === 'invite' || normalized.includes('invite') || normalized.includes('invitation')) {
              if (this.selectedTabIndex === 0) {
                const mobileRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
                if (!this.inviteMobileNumber?.trim() || !mobileRegex.test(this.inviteMobileNumber.trim())) {
                  this.inviteMobileNumberError = 'Please enter a valid mobile number';
                  return;
                }
                this.inviteExistingDoctor();
              }
              return;
            }
            original(action);
          };
        } else {
          // ⚠️ Fallback: patch DOM click on the footer button directly
          console.warn('onFooterAction hook not found — attaching DOM click fallback');
          const overlayPane = (overlayRef as any)?._pane as HTMLElement | undefined;
          if (overlayPane) {
            const handler = (e: Event) => {
              const btn = (e.target as HTMLElement).closest('button');
              if (!btn) return;
              const text = btn.textContent?.trim().toLowerCase() ?? '';
              // Only handle invite from the fallback — the in-form submit button handles 'save/create'
              if (text.includes('invitation') || text.includes('invite')) {
                e.stopPropagation();
                if (this.selectedTabIndex === 0) { this.inviteExistingDoctor(); }
              }
            };
            overlayPane.addEventListener('click', handler, true);
            this.destroy$.subscribe(() => overlayPane.removeEventListener('click', handler, true));
          }
        }
      } catch (err) {
        console.warn('interceptFooterActions failed:', err);
      }
    }, 300);
  }

  private setupFormValidation() {
    // Subscribe to doctor form changes
    if (this.doctorForm) {
      this.doctorForm.statusChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.updateFooterActions();
      });

      this.doctorForm.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.updateFooterActions();
      });
    }

    // Subscribe to invite mobile number changes (using a Subject for ngModel)
    // Since we're using ngModel, we'll need to check on tab change and input events
    // We'll update footer actions when tab changes
  }

  updateFooterActions() {
    try {
      // Access the dialog container using the private _containerInstance property
      const container = (this.dialogRef as any)._containerInstance;
      if (!container) return;

      // Access the overlay ref
      const overlayRef = (container as any)._overlayRef;
      if (!overlayRef) return;

      // Get the component ref - this should be the DialogboxContentComponent
      const componentRef = (overlayRef as any)._componentRef;
      if (!componentRef || !componentRef.instance) return;

      const dialogboxContent = componentRef.instance;

      // Use the new public method to update footer actions
      if (dialogboxContent && typeof dialogboxContent.updateFooterActions === 'function') {
        // Filter actions based on selected tab and update disabled state
        dialogboxContent.updateFooterActions((allActions: any[]) => {
          // Filter actions based on selected tab
          // Tab 0 (Invite Existing Doctor): Show Cancel and Send Invitation
          // Tab 1 (Add New Doctor): Show Cancel and Create Doctor
          const visibleActions = allActions
            .filter((action: any) => {
              if (action.id === 'cancel') {
                return true; // Cancel button always visible
              } else if (action.id === 'invite') {
                return this.selectedTabIndex === 0; // Only show on invite tab
              } else if (action.id === 'save') {
                return this.selectedTabIndex === 1; // Only show on create doctor tab
              }
              return false;
            })
            .map((action: any) => ({ ...action })); // Create new object references

          // Update disabled state based on current tab and form validation
          visibleActions.forEach((action: any) => {
            if (action.id === 'invite') {
              // Disable invite button if mobile number is invalid
              const mobileRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
              const isValidMobile = this.inviteMobileNumber?.trim() &&
                mobileRegex.test(this.inviteMobileNumber.trim());
              action.disabled = !isValidMobile || this.isInviting;
            } else if (action.id === 'save') {
              // Disable save button if form is invalid
              action.disabled = !this.doctorForm.valid || this.isLoading;
            }
          });

          return visibleActions;
        });
      } else {
        // Fallback to old method if new method is not available
        console.warn('DialogboxContentComponent.updateFooterActions method not available');
      }
    } catch (error) {
      // Silently fail if we can't access the dialogbox component
      console.warn('Could not update footer actions:', error);
    }
  }

  private initializeForm() {
    this.doctorForm = this.fb.group({
      // Mandatory fields
      registrationNumber: ['', [Validators.required, Validators.pattern(/^DOC-\d{5}$/)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      specialization: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      doctorStatus: ['PENDING', Validators.required],

      // Optional fields
      contactNumber: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      email: ['', [Validators.email]],
      qualifications: [''],
      certifications: [[]],
      workingDays: [[]],
      appointmentTimings: [[]]
    });
  }

  private populateForm(doctor: Doctor) {
    this.doctorForm.patchValue({
      registrationNumber: doctor.registrationNumber,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization,
      password: doctor.password,
      doctorStatus: doctor.doctorStatus,
      contactNumber: doctor.contactNumber,
      email: doctor.email,
      qualifications: doctor.qualifications,
      certifications: doctor.certifications || [],
      workingDays: doctor.workingDays || [],
      appointmentTimings: doctor.appointmentTimings || []
    });
  }
  onSubmit() {
    console.log('🚀 onSubmit() called — form valid:', this.doctorForm.valid);

    if (!this.doctorForm.valid) {
      this.markFormGroupTouched();
      Object.keys(this.doctorForm.controls).forEach(key => {
        const control = this.doctorForm.get(key);
        if (control?.invalid) {
          console.warn(`❌ Invalid field: ${key}`, control.errors);
        }
      });
      this.snackBar.open('Please fix validation errors before submitting', 'Close', { duration: 3000 });
      return;
    }

    if (this.isLoading) { return; }

    // Capture form data and close dialog — the POST is made in doctors.component.ts afterClosed()
    const formData = { ...this.doctorForm.value };
    console.log('📋 Form data captured, closing dialog:', formData);
    this.dialogRef.close({ action: 'save', formData });
  }


  onCancel() {
    this.dialogRef.close({ action: 'cancel' });
  }

  toggleCertification(certification: string) {
    const currentCerts = this.doctorForm.get('certifications')?.value || [];
    if (currentCerts.includes(certification)) {
      // Remove certification
      const updatedCerts = currentCerts.filter((cert: string) => cert !== certification);
      this.doctorForm.patchValue({ certifications: updatedCerts });
    } else {
      // Add certification
      this.doctorForm.patchValue({
        certifications: [...currentCerts, certification]
      });
    }
  }

  addCustomCertification() {
    if (this.customCertification?.trim()) {
      const certName = this.customCertification.trim();
      const currentCerts = this.doctorForm.get('certifications')?.value || [];

      // Check if certification already exists
      if (!currentCerts.includes(certName)) {
        this.doctorForm.patchValue({
          certifications: [...currentCerts, certName]
        });

        // Add to available certifications if not already there
        if (!this.certificationOptions.includes(certName)) {
          this.certificationOptions.push(certName);
        }

        // Show success message
        this.snackBar.open(`Certification "${certName}" added successfully!`, 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      } else {
        // Show warning if certification already exists
        this.snackBar.open(`Certification "${certName}" already exists!`, 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }

      // Clear the input
      this.customCertification = '';
    }
  }

  removeCertification(certification: string) {
    const currentCerts = this.doctorForm.get('certifications')?.value || [];
    const updatedCerts = currentCerts.filter((cert: string) => cert !== certification);
    this.doctorForm.patchValue({ certifications: updatedCerts });

    // Show removal message
    this.snackBar.open(`Certification "${certification}" removed!`, 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  // Invite existing doctor methods
  inviteExistingDoctor() {
    console.log('📨 inviteExistingDoctor() called with:', {
      inviteMobileNumber: this.inviteMobileNumber,
      inviteRole: this.inviteRole
    });
    this.isInviting = true;
    this.updateFooterActions();
    this.inviteMobileNumberError = '';

    const mobileNumber = this.inviteMobileNumber.trim();
    const inviteMessage =
      this.inviteMessage || 'We would like to invite you to join our hospital network.';
    const expiresAt = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();

    /**
     * Backend contract note:
     * - This UI collects a doctor's *mobile number* + *role* + *message*.
     * - Previously, mobile was incorrectly sent as `doctorRegistrationNumber` and role was ignored.
     * - To be compatible with different backend field names, we send both the corrected keys
     *   and the older key (some environments may still expect it).
     */
    const invitePayload = {
      mobileNumber,
      role: this.inviteRole,
      inviteMessage,
      expiresAt,

      // Backward/alternate keys (safe redundancy)
      doctorMobileNumber: mobileNumber,
      doctorRegistrationNumber: mobileNumber
    };

    const hospitalId = this.authService.getHospitalPublicId();

    this.doctorService.inviteDoctor(hospitalId, invitePayload)
      .subscribe({
        next: (res: any) => {
          this.isInviting = false;
          this.updateFooterActions();
          this.snackBar.open('Invitation sent successfully!', 'Close', { duration: 3000 });
          console.log('✅ Invitation sent successfully:', res);

          this.inviteMobileNumber = '';
          this.inviteMessage = '';

          setTimeout(() => {
            this.dialogRef.close({ action: 'invite', invited: true });
          }, 0);
        },
        error: (err) => {
          this.isInviting = false;
          this.updateFooterActions();
          const apiMsg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Failed to send invitation. Please try again.';
          this.snackBar.open(apiMsg, 'Close', { duration: 4000 });
          console.error('Invite doctor failed:', err);
        }
      });
  }


  clearInviteError() {
    this.inviteMobileNumberError = '';
  }

  // Tab management methods
  onTabChange(index: number) {
    this.selectedTabIndex = index;
    console.log('📑 Tab changed to:', index === 0 ? 'Invite Existing' : 'Add New');

    // Clear any errors when switching tabs
    this.inviteMobileNumberError = '';

    // Reset form validation when switching to create tab
    if (index === 1) {
      this.doctorForm.markAsUntouched();
    }

    // Update footer actions when tab changes
    this.updateFooterActions();
  }

  testBackendConnection() {
    console.log(' Testing backend connection...');
    // this.http.get('https://doctech.solutions/api/ping')
    //   .subscribe({
    //     next: (response) => {
    //       console.log('Backend connection successful:', response);
    //       this.backendConnected = true;
    //     },
    //     error: (error) => {
    //       console.warn(' Backend connection test failed:', error);
    //       console.warn(' This is normal if your Spring app doesn\'t have a /ping endpoint');
    //       this.backendConnected = false;
    //     }
    //   });
    this.backendConnected = true;
  }

  private markFormGroupTouched() {
    Object.keys(this.doctorForm.controls).forEach(key => {
      const control = this.doctorForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.doctorForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(controlName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(controlName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['pattern']) {
        if (controlName === 'registrationNumber') {
          return 'Registration number must be in format DOC-12345';
        }
        if (controlName === 'password') {
          return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
        }
        if (controlName === 'contactNumber') {
          return 'Please enter a valid contact number';
        }
      }
    }
    return '';
  }

  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      registrationNumber: 'Registration Number',
      firstName: 'First Name',
      lastName: 'Last Name',
      specialization: 'Specialization',
      password: 'Password',
      doctorStatus: 'Doctor Status',
      contactNumber: 'Contact Number',
      email: 'Email',
      qualifications: 'Qualifications'
    };
    return labels[controlName] || controlName;
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.doctorForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }
}
