import { Component, Inject, OnInit, Optional, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppButtonComponent, DialogboxService, DialogFooterAction } from '@lk/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BillingService } from '../../services/billing.service';
import { Invoice, InvoiceItem, PaymentRecord } from '../../interfaces/billing.interface';
import { PaymentDialogComponent } from './payment-dialog.component';
import { InvoiceFormComponent } from './invoice-form.component';
import { InvoicePreviewDialogComponent } from './invoice-preview-dialog.component';
import { BillingStatusRendererComponent } from './billing-status-renderer.component';
import { BillingCurrencyPipe } from '../../pipes/billing-currency.pipe';

@Component({
  selector: 'app-invoice-detail',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    BillingStatusRendererComponent,
    AppButtonComponent,
    BillingCurrencyPipe
  ],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss'
})
export class InvoiceDetailComponent implements OnInit, OnDestroy {
  invoiceId: string = '';
  invoice: Invoice | null = null;
  loading = false;
  selectedTabIndex = 0;
  inDialog = false;

  payments: PaymentRecord[] = [];
  displayedPaymentColumns = ['date', 'amount', 'method', 'reference', 'notes'];

  /** Inline add-item form — displayed at the bottom of the Items tab. */
  addItemForm: FormGroup;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    public readonly router: Router,
    private readonly billingService: BillingService,
    private readonly dialog: MatDialog,
    private readonly dialogService: DialogboxService,
    private readonly snackBar: MatSnackBar,
    private readonly fb: FormBuilder,
    @Optional() private readonly dialogRef?: MatDialogRef<InvoiceDetailComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData?: { invoiceId?: string; invoice?: Invoice }
  ) {
    this.addItemForm = this.fb.group({
      description: new FormControl('', Validators.required),
      quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      unitPrice: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
    });
  }

  ngOnInit(): void {
    this.inDialog = !!this.dialogRef;

    const dialogInvoice = this.dialogData?.invoice;
    const dialogInvoiceId = this.dialogData?.invoiceId || dialogInvoice?.id;
    if (dialogInvoice) this.invoice = dialogInvoice;

    if (dialogInvoiceId) {
      this.invoiceId = dialogInvoiceId;
      this.loadInvoice();
      return;
    }

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.invoiceId = params['id'];
      this.loadInvoice();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private loadInvoice(): void {
    this.loading = true;
    this.billingService.getInvoice(this.invoiceId).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.loadPayments();
        this.loading = false;
      },
      error: () => {
        if (this.invoice) {
          this.loadPayments();
          this.loading = false;
          this.snackBar.open('Failed to refresh invoice (showing cached)', 'OK', { duration: 2500 });
          return;
        }
        // Minimal dev fallback
        this.invoice = {
          id: this.invoiceId,
          invoiceNo: this.invoiceId,
          patientId: 'PAT001',
          patientName: 'John Doe',
          date: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PARTIALLY_PAID',
          items: [
            { id: 'ITEM-1', description: 'Initial Consultation', quantity: 1, unitPrice: 350, taxRate: 18, discount: 0 },
            { id: 'ITEM-2', description: 'Standard Blood Panel', quantity: 1, unitPrice: 250, taxRate: 18, discount: 0 }
          ],
          subTotal: 600, taxTotal: 108, discountTotal: 0,
          total: 708, amountPaid: 400, balanceDue: 308, notes: ''
        };
        this.loadPayments();
        this.loading = false;
        this.snackBar.open('Failed to load invoice (showing demo)', 'OK', { duration: 2500 });
      }
    });
  }

  private loadPayments(): void {
    if (!this.invoice?.id) return;
    this.billingService.listPayments({ invoiceId: this.invoice.id }).subscribe({
      next: (payments) => {
        this.payments = payments || [];
      },
      error: () => {
        // Reconstruct from invoice.amountPaid as a single synthetic record
        this.payments = (this.invoice?.amountPaid || 0) > 0
          ? [{
              id: 'PAY-1',
              invoiceId: this.invoice!.id as string,
              amount: this.invoice!.amountPaid || 0,
              method: 'OTHER',
              reference: '',
              date: this.invoice!.date,
              notes: 'Payment'
            }]
          : [];
      }
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  onBack(): void {
    if (this.dialogRef) {
      this.dialogRef.close(true);
      return;
    }
    this.router.navigate(['/billing']);
  }

  // ── Item management ───────────────────────────────────────────────────────

  /** Adds a new line item to the invoice using the inline form. */
  addItem(): void {
    if (!this.invoice) return;
    if (this.addItemForm.invalid) {
      this.addItemForm.markAllAsTouched();
      return;
    }
    const v = this.addItemForm.getRawValue();
    const newItem: InvoiceItem = {
      description: v.description,
      quantity: v.quantity,
      unitPrice: v.unitPrice,
      taxRate: 0,
      discount: 0,
      amountPaid: 0
    };
    const updatedItems = [...(this.invoice.items || []), newItem];
    const updated = this.recalculate({ ...this.invoice, items: updatedItems });

    this.billingService.updateInvoice(this.invoice.id!, updated).subscribe({
      next: () => {
        this.snackBar.open('Item added', 'OK', { duration: 2000 });
        this.addItemForm.reset({ description: '', quantity: 1, unitPrice: 0 });
        this.loadInvoice();
      },
      error: () => this.snackBar.open('Failed to add item', 'Dismiss', { duration: 3000 })
    });
  }

  /** Removes a line item from the invoice by index. */
  removeItem(item: InvoiceItem, index: number): void {
    if (!this.invoice) return;
    const updatedItems = this.invoice.items.filter((_, i) => i !== index);
    const updated = this.recalculate({ ...this.invoice, items: updatedItems });

    this.billingService.updateInvoice(this.invoice.id!, updated).subscribe({
      next: () => {
        this.snackBar.open('Item removed', 'OK', { duration: 2000 });
        this.loadInvoice();
      },
      error: () => this.snackBar.open('Failed to remove item', 'Dismiss', { duration: 3000 })
    });
  }

  private recalculate(invoice: Invoice): Invoice {
    const subTotal = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discountTotal = invoice.items.reduce((s, i) => s + (i.discount || 0), 0);
    const taxTotal = invoice.items.reduce((s, i) => {
      const base = i.quantity * i.unitPrice - (i.discount || 0);
      return s + base * ((i.taxRate || 0) / 100);
    }, 0);
    const total = subTotal - discountTotal + taxTotal;
    return {
      ...invoice,
      subTotal,
      discountTotal,
      taxTotal,
      total,
      balanceDue: Math.max(total - (invoice.amountPaid || 0), 0)
    };
  }

  // ── Payment recording ─────────────────────────────────────────────────────

  recordPayment(): void {
    if (!this.invoice?.id) return;
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'stroked' },
      { id: 'save', text: 'Record Payment', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(PaymentDialogComponent, {
      title: 'Record Payment',
      data: { invoiceId: this.invoice.id, balanceDue: this.invoice.balanceDue },
      width: '600px',
      maxWidth: '90vw',
      footerActions
    });
    ref.afterClosed().subscribe((result: any) => {
      if (result?.action === 'save' && result.payment) {
        this.billingService.recordPayment(this.invoice!.id as string, result.payment as PaymentRecord).subscribe({
          next: () => {
            this.snackBar.open('Payment recorded', 'OK', { duration: 2000 });
            this.loadInvoice();
          },
          error: () => this.snackBar.open('Failed to record payment', 'Dismiss', { duration: 3000 })
        });
      }
    });
  }

  recordItemPayment(item: InvoiceItem): void {
    if (!this.invoice?.id || !item.id) return;
    const itemTotal = (item.quantity * item.unitPrice - (item.discount || 0)) * (1 + (item.taxRate || 0) / 100);
    const balance = itemTotal - (item.amountPaid || 0);
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'stroked' },
      { id: 'save', text: 'Record Payment', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(PaymentDialogComponent, {
      title: 'Record Payment',
      data: { invoiceId: this.invoice.id, itemId: item.id, balanceDue: balance, itemDescription: item.description },
      width: '600px',
      maxWidth: '90vw',
      footerActions
    });
    ref.afterClosed().subscribe((result: any) => {
      if (result?.action === 'save' && result.payment) {
        const payment = result.payment as PaymentRecord;
        payment.itemId = item.id;
        this.billingService.recordPayment(this.invoice!.id as string, payment).subscribe({
          next: () => {
            this.snackBar.open('Payment recorded for item', 'OK', { duration: 2000 });
            this.loadInvoice();
          },
          error: () => this.snackBar.open('Failed to record payment', 'Dismiss', { duration: 3000 })
        });
      }
    });
  }

  // ── Invoice editing ───────────────────────────────────────────────────────

  editInvoice(): void {
    if (!this.invoice) return;
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'stroked' },
      { id: 'save', text: 'Update Invoice', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(InvoiceFormComponent, {
      title: 'Edit Invoice',
      data: { invoice: this.invoice },
      width: '95%',
      maxWidth: '1400px',
      maxHeight: '95vh',
      footerActions
    });
    ref.afterClosed().subscribe((result: any) => {
      if (result?.action === 'save' && result.invoice && this.invoice?.id) {
        this.billingService.updateInvoice(this.invoice.id, result.invoice as Invoice).subscribe({
          next: () => {
            this.snackBar.open('Invoice updated', 'OK', { duration: 2000 });
            this.loadInvoice();
          },
          error: () => this.snackBar.open('Failed to update invoice', 'Dismiss', { duration: 3000 })
        });
      }
    });
  }

  // ── Calculation helpers ───────────────────────────────────────────────────

  getItemTotal(item: InvoiceItem): number {
    const subtotal = item.quantity * item.unitPrice - (item.discount || 0);
    return subtotal * (1 + (item.taxRate || 0) / 100);
  }

  getItemBalance(item: InvoiceItem): number {
    return this.getItemTotal(item) - (item.amountPaid || 0);
  }

  getPaymentProgress(): number {
    if (!this.invoice || this.invoice.total === 0) return 0;
    return ((this.invoice.amountPaid || 0) / this.invoice.total) * 100;
  }

  isOverdue(): boolean {
    if (!this.invoice?.dueDate || this.invoice.status === 'PAID') return false;
    return new Date(this.invoice.dueDate) < new Date();
  }

  getDaysOverdue(): number {
    if (!this.invoice?.dueDate) return 0;
    return Math.floor((Date.now() - new Date(this.invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
  }

  // ── Print / PDF ───────────────────────────────────────────────────────────

  printInvoice(): void {
    if (!this.invoice) return;
    this.dialog.open(InvoicePreviewDialogComponent, {
      width: '90%',
      maxWidth: '900px',
      maxHeight: '95vh',
      data: { invoice: this.invoice },
      panelClass: 'invoice-preview-dialog'
    });
  }

  downloadPdf(): void {
    if (!this.invoice?.id) return;
    this.billingService.downloadInvoicePdf(this.invoice.id).subscribe({
      next: () => this.snackBar.open('Invoice PDF downloaded', 'OK', { duration: 2000 }),
      error: () => this.printInvoice()
    });
  }
}
