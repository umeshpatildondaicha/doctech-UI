import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AppInputComponent, AppSelectboxComponent, AppButtonComponent, IconComponent, DIALOG_DATA_TOKEN } from '@lk/core';
import { Subject, takeUntil, filter } from 'rxjs';

interface ServiceFormModel {
  id?: number;
  name: string;
  description: string;
  department: string;
  category: 'consultation' | 'therapy' | 'diagnostic' | 'surgical' | '';
  price: number | null;
  duration: number | null; // minutes
  consultationType: 'Consultation' | 'Therapy' | 'Diagnostic' | '';
  availability: 'Available' | 'Limited' | 'Unavailable' | '';
  tags?: string[];
  dependencies?: string[];
  maxBookings?: number | null;
  currentBookings?: number | null;
  timeSlots?: string;
  insuranceCoverage?: number | null;
  insuranceCodes?: string[];
  seasonalPricing?: boolean;
  discounts?: Array<{
    type: string;
    percentage: number;
    validUntil: string;
  }>;
  paymentPlans?: Array<{
    name: string;
    installments: number;
    interest: number;
  }>;
}

interface UploadedImage {
  file: File;
  previewUrl: string;
  name: string;
}

interface UploadedDocument {
  file: File;
  name: string;
  type: string;
}

@Component({
    selector: 'app-service-form',
    imports: [CommonModule, ReactiveFormsModule, FormsModule, AppInputComponent, AppSelectboxComponent, AppButtonComponent, IconComponent],
    templateUrl: './service-form.component.html',
    styleUrls: ['./service-form.component.scss']
})
export class ServiceFormComponent implements OnDestroy {
  dialogRef = inject(MatDialogRef<ServiceFormComponent>);
  data = inject<{ service?: ServiceFormModel; isEditMode?: boolean }>(DIALOG_DATA_TOKEN);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  form: FormGroup;
  isEditMode = false;
  title = 'Add New Service';
  
  // Drag state
  isImagesDragOver = false;
  isDocsDragOver = false;
  
  // Uploaded media collections
  images: UploadedImage[] = [];
  documents: UploadedDocument[] = [];

  // New fields for enhanced features
  tags: string[] = [];
  dependencies: string[] = [];
  insuranceCodes: string[] = [];
  discounts: Array<{type: string; percentage: number; validUntil: string}> = [];
  paymentPlans: Array<{name: string; installments: number; interest: number}> = [];

  // Input values for new items
  newTag = '';
  newDependency = '';
  newInsuranceCode = '';

  departmentOptions = [
    { label: 'Select department', value: '' },
    { label: 'Internal Medicine', value: 'Internal Medicine' },
    { label: 'Cardiology', value: 'Cardiology' },
    { label: 'Dermatology', value: 'Dermatology' },
    { label: 'Neurology', value: 'Neurology' },
    { label: 'Orthopedics', value: 'Orthopedics' },
    { label: 'Pediatrics', value: 'Pediatrics' },
    { label: 'Radiology', value: 'Radiology' },
    { label: 'Urology', value: 'Urology' },
    { label: 'Rehabilitation', value: 'Rehabilitation' }
  ];

  categoryOptions = [
    { label: 'Select category', value: '' },
    { label: 'Consultation', value: 'consultation' },
    { label: 'Therapy', value: 'therapy' },
    { label: 'Diagnostic', value: 'diagnostic' },
    { label: 'Surgical', value: 'surgical' }
  ];

  typeOptions = [
    { label: 'Select service type', value: '' },
    { label: 'Consultation', value: 'Consultation' },
    { label: 'Therapy', value: 'Therapy' },
    { label: 'Diagnostic', value: 'Diagnostic' }
  ];

  availabilityOptions = [
    { label: 'Select availability', value: '' },
    { label: 'Available', value: 'Available' },
    { label: 'Limited', value: 'Limited' },
    { label: 'Unavailable', value: 'Unavailable' }
  ];

  constructor() {
    const service = this.data?.service;
    this.isEditMode = this.data?.isEditMode || !!service;
    this.title = this.isEditMode ? 'Edit Service' : 'Add New Service';

    this.form = this.fb.group({
      id: this.fb.control<number | undefined>(service?.id),
      name: this.fb.control<string>(service?.name || '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
      description: this.fb.control<string>(service?.description || '', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
      department: this.fb.control<string>(service?.department || '', { nonNullable: true, validators: [Validators.required] }),
      category: this.fb.control<string>(service?.category || '', { nonNullable: true, validators: [Validators.required] }),
      price: this.fb.control<number | null>(service?.price ?? null, { validators: [Validators.required, Validators.min(0)] }),
      duration: this.fb.control<number | null>(service?.duration ?? null, { validators: [Validators.required, Validators.min(1)] }),
      consultationType: this.fb.control<string>(service?.consultationType || '', { nonNullable: true, validators: [Validators.required] }),
      availability: this.fb.control<string>(service?.availability || '', { nonNullable: true, validators: [Validators.required] }),
      maxBookings: this.fb.control<number | null>(service?.maxBookings ?? null, { validators: [Validators.min(0)] }),
      currentBookings: this.fb.control<number | null>(service?.currentBookings ?? null, { validators: [Validators.min(0)] }),
      timeSlots: this.fb.control<string>(service?.timeSlots || ''),
      insuranceCoverage: this.fb.control<number | null>(service?.insuranceCoverage ?? null, { validators: [Validators.min(0), Validators.max(100)] }),
      seasonalPricing: this.fb.control<boolean>(service?.seasonalPricing || false)
    });

    // Initialize arrays from service data if editing
    if (service) {
      this.tags = service.tags || [];
      this.dependencies = service.dependencies || [];
      this.insuranceCodes = service.insuranceCodes || [];
      this.discounts = service.discounts || [];
      this.paymentPlans = service.paymentPlans || [];
    }

    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'save') {
        this.onSubmit();
      }
    });
  }

  // Tag management methods
  addTag() {
    if (this.newTag.trim() && !this.tags.includes(this.newTag.trim())) {
      this.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  // Dependency management methods
  addDependency() {
    if (this.newDependency.trim() && !this.dependencies.includes(this.newDependency.trim())) {
      this.dependencies.push(this.newDependency.trim());
      this.newDependency = '';
    }
  }

  removeDependency(index: number) {
    this.dependencies.splice(index, 1);
  }

  // Insurance code management methods
  addInsuranceCode() {
    if (this.newInsuranceCode.trim() && !this.insuranceCodes.includes(this.newInsuranceCode.trim())) {
      this.insuranceCodes.push(this.newInsuranceCode.trim());
      this.newInsuranceCode = '';
    }
  }

  removeInsuranceCode(index: number) {
    this.insuranceCodes.splice(index, 1);
  }

  // Discount management methods
  addDiscount() {
    this.discounts.push({
      type: '',
      percentage: 0,
      validUntil: ''
    });
  }

  removeDiscount(index: number) {
    this.discounts.splice(index, 1);
  }

  updateDiscount(index: number, field: 'type' | 'percentage' | 'validUntil', value: string | number) {
    if (this.discounts[index]) {
      (this.discounts[index] as any)[field] = value;
    }
  }

  // Payment plan management methods
  addPaymentPlan() {
    this.paymentPlans.push({
      name: '',
      installments: 1,
      interest: 0
    });
  }

  removePaymentPlan(index: number) {
    this.paymentPlans.splice(index, 1);
  }

  updatePaymentPlan(index: number, field: 'name' | 'installments' | 'interest', value: string | number) {
    if (this.paymentPlans[index]) {
      (this.paymentPlans[index] as any)[field] = value;
    }
  }

  // Image upload methods
  onImagesDragOver(event: DragEvent) {
    event.preventDefault();
    this.isImagesDragOver = true;
  }

  onImagesDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isImagesDragOver = false;
  }

  onImagesDrop(event: DragEvent) {
    event.preventDefault();
    this.isImagesDragOver = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.processImageFiles(Array.from(files));
    }
  }

  onImagesSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      this.processImageFiles(Array.from(files));
    }
  }

  processImageFiles(files: File[]) {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.images.push({
            file,
            previewUrl: e.target?.result as string,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
  }

  // Document upload methods
  onDocumentsDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDocsDragOver = true;
  }

  onDocumentsDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDocsDragOver = false;
  }

  onDocumentsDrop(event: DragEvent) {
    event.preventDefault();
    this.isDocsDragOver = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.processDocumentFiles(Array.from(files));
    }
  }

  onDocumentsSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      this.processDocumentFiles(Array.from(files));
    }
  }

  processDocumentFiles(files: File[]) {
    files.forEach(file => {
      this.documents.push({
        file,
        name: file.name,
        type: file.type
      });
    });
  }

  removeDocument(index: number) {
    this.documents.splice(index, 1);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // Prevent dialog from closing if form is invalid
      setTimeout(() => {
        this.dialogRef.close(false);
      }, 0);
      return;
    }

    const formData = this.form.value;
    const serviceData = {
      ...formData,
      tags: this.tags,
      dependencies: this.dependencies,
      insuranceCodes: this.insuranceCodes,
      discounts: this.discounts,
      paymentPlans: this.paymentPlans,
      images: this.images.map(img => img.name),
      documents: this.documents.map(doc => doc.name)
    };

    // Close dialog with service data
    setTimeout(() => {
      this.dialogRef.close({
        action: 'save',
        service: serviceData
      });
    }, 0);
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  onBack(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


