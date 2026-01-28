import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogContainer } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil, filter, combineLatest } from 'rxjs';

import { Doctor } from '../../../../interfaces/doctor.interface';
import { HttpService } from '../../../../services/http.service';
import { AppButtonComponent, DIALOG_DATA_TOKEN } from '@lk/core';

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
  private destroy$ = new Subject<void>();
  
  // Reference to dialogbox content component for updating footer actions
  private dialogboxContentComponent: any;
  // Store original footer actions array
  private originalFooterActions: any[] = [];

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
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' }
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

    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel' || result?.action === 'invite')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'invite') {
        // Only allow invite action if on the invite tab
        if (this.selectedTabIndex !== 0) {
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
          return;
        }

        // Validate invite form
        if (!this.inviteMobileNumber?.trim()) {
          this.inviteMobileNumberError = 'Mobile number is required';
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
          return;
        }

        // Validate mobile number format
        const mobileRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
        if (!mobileRegex.test(this.inviteMobileNumber.trim())) {
          this.inviteMobileNumberError = 'Please enter a valid mobile number';
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
          return;
        }

        // If validation passes, send invitation
        this.inviteExistingDoctor();
        return;
      }
      
      if (result?.action === 'save') {
        // Only allow save action if on the create doctor tab
        if (this.selectedTabIndex !== 1) {
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
          return;
        }
        
        this.onSubmit();
        return;
      }
      
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFooterActions() {
    // Wait for the dialog to be fully initialized
    setTimeout(() => {
      // Update footer actions based on initial tab
      // DialogboxContentComponent now handles storing original actions internally
      this.updateFooterActions();
    }, 100);
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
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
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
    if (this.doctorForm.valid) {
      this.isLoading = true;
      this.updateFooterActions();
      const formData = this.doctorForm.value;
      
      // Add timestamps
      const now = new Date().toISOString();
      const payload = {
        ...formData,
        createdAt: now,
        updatedAt: now
      };

      console.log('🚀 Sending doctor creation request to:', 'https://doctech.solutions/api/doctors');
      console.log('📦 Payload:', payload);
      console.log('🌐 CORS Origin:', window.location.origin);

      this.httpService.sendPOSTRequest('https://doctech.solutions/api/doctors', payload)
        .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.updateFooterActions();
            console.log('✅ Doctor created successfully:', response);
            console.log('🎯 Response status:', response);
            this.snackBar.open('Doctor created successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
            setTimeout(() => {
              this.dialogRef.close({ action: 'save', doctor: response });
            }, 0);
          },
        error: (error) => {
          this.isLoading = false;
          this.updateFooterActions();
            console.error('❌ Error creating doctor:', error);
            console.error('🔍 Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              url: error.url
            });
            
            let errorMessage = 'Error creating doctor. Please try again.';
            
            if (error.status === 400) {
              errorMessage = 'Invalid data provided. Please check all fields.';
            } else if (error.status === 409) {
              errorMessage = 'Doctor with this registration number already exists.';
            } else if (error.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            } else if (error.status === 0) {
              errorMessage = 'Cannot connect to server. Please check if Spring backend is running on doctech.solutions.';
            } else if (error.status === 403) {
              errorMessage = 'Access forbidden. CORS issue detected.';
            }
            
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
            // Prevent dialog from closing on error
            setTimeout(() => {
              this.dialogRef.close(false);
            }, 0);
          }
        });
    } else {
      this.markFormGroupTouched();
      // Prevent dialog from closing if form is invalid
      setTimeout(() => {
        this.dialogRef.close(false);
      }, 0);
    }
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
    this.isInviting = true;
    this.updateFooterActions();
    this.inviteMobileNumberError = '';

    const invitePayload = {
      mobileNumber: this.inviteMobileNumber.trim(),
      role: this.inviteRole,
      message: this.inviteMessage?.trim() || '',
      hospitalId: 1, // You can make this dynamic based on current hospital
      invitedBy: 'ADMIN', // You can make this dynamic based on current user
      invitedAt: new Date().toISOString()
    };

    console.log('📱 Sending doctor invitation:', invitePayload);

    this.httpService.sendPOSTRequest('https://doctech.solutions/api/doctors/invite', JSON.stringify(invitePayload))
      .subscribe({
        next: (response) => {
          this.isInviting = false;
          this.updateFooterActions();
          console.log('✅ Doctor invitation sent successfully:', response);
          
          this.snackBar.open('Invitation sent successfully! Doctor will be notified.', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });

          // Reset form
          this.inviteMobileNumber = '';
          this.inviteMessage = '';
          this.inviteRole = 'DOCTOR';
          
          // Close dialog with success result
          setTimeout(() => {
            this.dialogRef.close({ action: 'invite', invited: true });
          }, 0);
        },
        error: (error) => {
          this.isInviting = false;
          this.updateFooterActions();
          console.error('❌ Error sending invitation:', error);
          
          let errorMessage = 'Failed to send invitation. Please try again.';
          
          if (error.status === 404) {
            errorMessage = 'Doctor not found with this mobile number.';
          } else if (error.status === 409) {
            errorMessage = 'Doctor is already associated with this hospital.';
          } else if (error.status === 400) {
            errorMessage = 'Invalid invitation data. Please check the details.';
          } else if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check backend connection.';
          }
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
          
          // Prevent dialog from closing on error
          setTimeout(() => {
            this.dialogRef.close(false);
          }, 0);
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
    console.log('🔍 Testing backend connection...');
    this.httpService.sendGETRequest('https://doctech.solutions/api/ping')
      .subscribe({
        next: (response) => {
          console.log('✅ Backend connection successful:', response);
          this.backendConnected = true;
        },
        error: (error) => {
          console.warn('⚠️ Backend connection test failed:', error);
          console.warn('💡 This is normal if your Spring app doesn\'t have a /ping endpoint');
          this.backendConnected = false;
        }
      });
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
