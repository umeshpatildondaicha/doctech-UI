import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN } from '@lk/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { PaymentRecord } from '../../interfaces/billing.interface';
import { Subject, filter, takeUntil } from 'rxjs';

export interface PaymentDialogData {
  invoiceId: string;
  itemId?: string; // Optional: if payment is for specific item
  balanceDue?: number;
  itemDescription?: string; // Optional: item description for display
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.scss'
})
export class PaymentDialogComponent implements OnDestroy {
  form: FormGroup;
  balanceDueValue = 0;
  private readonly destroy$ = new Subject<void>();

  methods = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'OTHER'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(DIALOG_DATA_TOKEN) public data: PaymentDialogData | null
  ) {
    const validators = [Validators.required, Validators.min(0.01)];
    const bd = data?.balanceDue ?? 0;
    this.balanceDueValue = bd;
    if (bd != null) {
      validators.push(Validators.max(bd));
    }
    this.form = this.fb.group({
      amount: new FormControl(bd, { nonNullable: true, validators }),
      method: new FormControl('CASH', Validators.required),
      reference: new FormControl(''),
      date: new FormControl(new Date(), Validators.required),
      notes: new FormControl('')
    });

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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => this.dialogRef.close(false), 0);
      return;
    }
    const raw = this.form.getRawValue();
    const payment: PaymentRecord = {
      invoiceId: this.data?.invoiceId || '',
      itemId: this.data?.itemId,
      amount: raw.amount,
      method: raw.method,
      reference: raw.reference,
      date: (raw.date as Date).toISOString(),
      notes: raw.notes
    };
    this.dialogRef.close({ action: 'save', payment });
  }

  cancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  getMethodIcon(method: string): string {
    const icons: { [key: string]: string } = {
      'CASH': 'money',
      'CARD': 'credit_card',
      'UPI': 'account_balance_wallet',
      'NET_BANKING': 'account_balance',
      'OTHER': 'more_horiz'
    };
    return icons[method] || 'payment';
  }

  getMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'CASH': 'Cash',
      'CARD': 'Card',
      'UPI': 'UPI',
      'NET_BANKING': 'Net Banking',
      'OTHER': 'Other'
    };
    return labels[method] || method;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


