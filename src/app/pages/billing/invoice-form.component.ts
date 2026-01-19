import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN } from '@lk/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { Invoice, InvoiceItem } from '../../interfaces/billing.interface';
import { PatientSearchDialogComponent, PatientSearchResult } from '../patient-search-dialog/patient-search-dialog.component';
import { Subject, filter, takeUntil } from 'rxjs';

export interface InvoiceFormData {
  invoice?: Invoice;
  patient?: PatientSearchResult;
  hidePatientInfo?: boolean; // Hide patient info section when opened from patient profile
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  items: InvoiceItem[];
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatTooltipModule,
    MatRadioModule
  ],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss'
})
export class InvoiceFormComponent implements OnDestroy {
  form: FormGroup;
  readonlyMode = false;
  selectedPatient: PatientSearchResult | null = null;
  templates: InvoiceTemplate[] = [];
  gstRate: number = 9; // CGST rate
  sgstRate: number = 9; // SGST rate
  igstRate: number = 18; // IGST rate (for inter-state)
  taxMode: 'INTRA' | 'INTER' = 'INTRA';
  newItemForm: FormGroup;
  hidePatientInfo: boolean = false;
  private readonly destroy$ = new Subject<void>();

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<InvoiceFormComponent>,
    private readonly dialog: MatDialog,
    @Inject(DIALOG_DATA_TOKEN) public data: InvoiceFormData
  ) {
    // Normalize dialog data for template safety
    if (!data) {
      this.data = {} as InvoiceFormData;
    }

    // Check if we should hide patient info (when opened from patient profile)
    this.hidePatientInfo = data?.hidePatientInfo ?? false;

    // Initialize patient from data or invoice
    if (data?.patient) {
      this.selectedPatient = data.patient;
    } else if (data?.invoice?.patientId && data?.invoice?.patientName) {
      this.selectedPatient = {
        id: data.invoice.patientId,
        firstName: data.invoice.patientName.split(' ')[0] || '',
        lastName: data.invoice.patientName.split(' ').slice(1).join(' ') || '',
        fullName: data.invoice.patientName,
        dateOfBirth: '',
        gender: '',
        contact: ''
      };
    }

    this.form = this.fb.group({
      invoiceNo: new FormControl(data?.invoice?.invoiceNo ?? ''),
      doctorId: new FormControl(data?.invoice?.doctorId ?? ''),
      patientId: new FormControl(
        data?.patient?.id || data?.invoice?.patientId || '', 
        Validators.required
      ),
      patientName: new FormControl(
        data?.patient?.fullName || data?.patient?.firstName + ' ' + data?.patient?.lastName || data?.invoice?.patientName || '', 
        Validators.required
      ),
      date: new FormControl(data?.invoice?.date ? new Date(data.invoice.date) : new Date(), Validators.required),
      dueDate: new FormControl(data?.invoice?.dueDate ? new Date(data.invoice.dueDate) : null),
      notes: new FormControl(data?.invoice?.notes ?? ''),
      items: this.fb.array([])
    });

    // Quick add item form
    this.newItemForm = this.fb.group({
      description: new FormControl('', Validators.required),
      quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      unitPrice: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      discount: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      taxRate: new FormControl(this.taxMode === 'INTRA' ? this.gstRate + this.sgstRate : this.igstRate, { nonNullable: true, validators: [Validators.min(0), Validators.max(100)] })
    });

    if (data?.invoice?.items?.length) {
      for (const item of data.invoice.items) {
        this.items.push(this.createItemGroup(item));
      }
    }

    if (data?.invoice?.status === 'PAID') {
      this.readonlyMode = true;
      this.form.disable({ emitEvent: false });
    }

    // Initialize templates
    this.initTemplates();

    this.dialogRef.beforeClosed()
      .pipe(
        takeUntil(this.destroy$),
        filter(result => result?.action === 'save' || result?.action === 'cancel')
      )
      .subscribe(result => {
        if (result?.action === 'cancel') {
          setTimeout(() => this.dialogRef.close({ action: 'cancel' }), 0);
          return;
        }
        if (result?.action === 'save') {
          this.save();
        }
      });
  }

  private initTemplates(): void {
    // Predefined templates for common invoice items
    this.templates = [
      {
        id: 'consultation',
        name: 'Consultation',
        description: 'Doctor consultation fee',
        items: [{
          description: 'Consultation Fee',
          quantity: 1,
          unitPrice: 500,
          taxRate: this.gstRate + this.sgstRate,
          discount: 0
        }]
      },
      {
        id: 'lab-test',
        name: 'Lab Test',
        description: 'Laboratory test package',
        items: [{
          description: 'Laboratory Test',
          quantity: 1,
          unitPrice: 1000,
          taxRate: this.gstRate + this.sgstRate,
          discount: 0
        }]
      },
      {
        id: 'medicine',
        name: 'Medicine',
        description: 'Prescribed medicines',
        items: [{
          description: 'Medicine',
          quantity: 1,
          unitPrice: 300,
          taxRate: this.gstRate + this.sgstRate,
          discount: 0
        }]
      },
      {
        id: 'procedure',
        name: 'Procedure',
        description: 'Medical procedure',
        items: [{
          description: 'Medical Procedure',
          quantity: 1,
          unitPrice: 2000,
          taxRate: this.gstRate + this.sgstRate,
          discount: 0
        }]
      }
    ];
  }

  addTemplate(template: InvoiceTemplate): void {
    // Fill the quick-add form with first item of template for doctor to adjust
    if (template.items?.length) {
      const t = template.items[0];
      this.newItemForm.patchValue({
        description: t.description,
        quantity: t.quantity,
        unitPrice: t.unitPrice,
        discount: t.discount || 0,
        taxRate: t.taxRate
      });
    }
  }

  createItemGroup(item?: InvoiceItem): FormGroup {
    return this.fb.group({
      description: new FormControl(item?.description ?? '', Validators.required),
      quantity: new FormControl(item?.quantity ?? 1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      unitPrice: new FormControl(item?.unitPrice ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      taxRate: new FormControl(item?.taxRate ?? 0),
      discount: new FormControl(item?.discount ?? 0)
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  private calculateTotals(items: InvoiceItem[]) {
    const subTotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const discountTotal = items.reduce((sum, i) => sum + (i.discount || 0), 0);
    const taxableAmount = subTotal - discountTotal;
    const taxTotal = items.reduce((sum, i) => {
      const itemSubtotal = i.quantity * i.unitPrice - (i.discount || 0);
      return sum + (itemSubtotal * ((i.taxRate || 0) / 100));
    }, 0);
    // Split tax depending on mode
    const cgst = this.taxMode === 'INTRA' ? taxTotal / 2 : 0;
    const sgst = this.taxMode === 'INTRA' ? taxTotal / 2 : 0;
    const igst = this.taxMode === 'INTER' ? taxTotal : 0;
    const total = taxableAmount + taxTotal;
    return { subTotal, discountTotal, taxableAmount, taxTotal, cgst, sgst, igst, total };
  }

  updateTaxMode(mode: 'INTRA' | 'INTER'): void {
    this.taxMode = mode;
    // update default tax for quick add form
    this.newItemForm.get('taxRate')?.setValue(this.taxMode === 'INTRA' ? this.gstRate + this.sgstRate : this.igstRate);
  }

  addNewItem(): void {
    if (this.readonlyMode) return;
    if (this.newItemForm.invalid) {
      this.newItemForm.markAllAsTouched();
      return;
    }
    const v = this.newItemForm.getRawValue();
    this.items.push(this.createItemGroup({
      description: v.description,
      quantity: v.quantity,
      unitPrice: v.unitPrice,
      discount: v.discount,
      taxRate: v.taxRate
    } as InvoiceItem));
    // reset with sensible defaults
    this.newItemForm.reset({
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: this.taxMode === 'INTRA' ? this.gstRate + this.sgstRate : this.igstRate
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => this.dialogRef.close(false), 0);
      return;
    }
    const raw = this.form.getRawValue();
    const items: InvoiceItem[] = raw.items as InvoiceItem[];
    const totals = this.calculateTotals(items);
    const dateIso = raw.date instanceof Date ? raw.date.toISOString() : new Date(raw.date).toISOString();
    let dueIso: string | undefined;
    if (raw.dueDate) {
      dueIso = raw.dueDate instanceof Date ? raw.dueDate.toISOString() : new Date(raw.dueDate).toISOString();
    } else {
      dueIso = undefined;
    }
    const invoice: Invoice = {
      id: this.data?.invoice?.id,
      invoiceNo: raw.invoiceNo,
      doctorId: raw.doctorId,
      patientId: raw.patientId,
      patientName: raw.patientName,
      date: dateIso,
      dueDate: dueIso,
      status: this.data?.invoice?.status ?? 'ISSUED',
      items,
      notes: raw.notes,
      subTotal: totals.subTotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      amountPaid: this.data?.invoice?.amountPaid ?? 0,
      balanceDue: (this.data?.invoice?.total ?? totals.total) - (this.data?.invoice?.amountPaid ?? 0)
    };
    this.dialogRef.close({ action: 'save', invoice });
  }

  cancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openPatientSearch(): void {
    const patientSearchDialogRef = this.dialog.open(PatientSearchDialogComponent, {
      width: '90%',
      maxWidth: '1000px',
      height: '90%',
      maxHeight: '90vh',
      autoFocus: false,
      disableClose: false
    });

    patientSearchDialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'select' && result?.patient) {
        const patient: PatientSearchResult = result.patient;
        this.selectedPatient = patient;
        this.form.patchValue({
          patientId: patient.id,
          patientName: patient.fullName || `${patient.firstName} ${patient.lastName}`.trim()
        });
      }
    });
  }

  getPatientDisplayName(): string {
    if (this.selectedPatient) {
      return this.selectedPatient.fullName || `${this.selectedPatient.firstName} ${this.selectedPatient.lastName}`.trim();
    }
    return this.form.get('patientName')?.value || 'Select Patient';
  }

  getTotals() {
    const items: InvoiceItem[] = this.items.controls.map((g: FormGroup) => ({
      description: g.get('description')?.value,
      quantity: Number(g.get('quantity')?.value) || 0,
      unitPrice: Number(g.get('unitPrice')?.value) || 0,
      taxRate: Number(g.get('taxRate')?.value) || 0,
      discount: Number(g.get('discount')?.value) || 0,
    }));
    return this.calculateTotals(items);
  }

  getTemplateIcon(templateId: string): string {
    const icons: { [key: string]: string } = {
      'consultation': 'medical_services',
      'lab-test': 'science',
      'medicine': 'medication',
      'procedure': 'healing'
    };
    return icons[templateId] || 'add_circle';
  }
}


