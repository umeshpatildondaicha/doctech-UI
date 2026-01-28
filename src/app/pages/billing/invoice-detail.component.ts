import { Component, Inject, OnInit, Optional } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { Invoice, InvoiceItem, PaymentRecord } from '../../interfaces/billing.interface';
import { PaymentDialogComponent } from './payment-dialog.component';
import { InvoiceFormComponent } from './invoice-form.component';
import { InvoicePreviewDialogComponent } from './invoice-preview-dialog.component';
import { BillingStatusRendererComponent } from './billing-status-renderer.component';

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
        AppButtonComponent
    ],
    templateUrl: './invoice-detail.component.html',
    styleUrl: './invoice-detail.component.scss'
})
export class InvoiceDetailComponent implements OnInit {
  invoiceId: string = '';
  invoice: Invoice | null = null;
  loading = false;
  selectedTabIndex = 0;
  inDialog = false;
  
  payments: PaymentRecord[] = [];
  displayedPaymentColumns = ['date', 'amount', 'method', 'reference', 'notes'];

  constructor(
    private readonly route: ActivatedRoute,
    public router: Router,
    private readonly billingService: BillingService,
    private readonly dialog: MatDialog,
    private readonly dialogService: DialogboxService,
    private readonly snackBar: MatSnackBar,
    private readonly fb: FormBuilder,
    @Optional() private readonly dialogRef?: MatDialogRef<InvoiceDetailComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData?: { invoiceId?: string; invoice?: Invoice }
  ) {}

  ngOnInit(): void {
    this.inDialog = !!this.dialogRef;
    // If opened as a dialog, prefer rendering immediately using passed invoice data (if any),
    // then refresh via API using invoiceId.
    const dialogInvoice = this.dialogData?.invoice;
    const dialogInvoiceId = this.dialogData?.invoiceId || dialogInvoice?.id;
    if (dialogInvoice) {
      this.invoice = dialogInvoice;
    }
    if (dialogInvoiceId) {
      this.invoiceId = dialogInvoiceId;
      this.loadInvoice();
      return;
    }

    this.route.params.subscribe(params => {
      this.invoiceId = params['id'];
      this.loadInvoice();
    });
  }

  private loadInvoice(): void {
    this.loading = true;
    this.billingService.getInvoice(this.invoiceId).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.loadPayments();
        this.loading = false;
      },
      error: () => {
        // If dialog already provided invoice data, keep it (don't overwrite with demo).
        if (this.invoice) {
          this.loadPayments();
          this.loading = false;
          this.snackBar.open('Failed to refresh invoice from API (showing cached)', 'OK', { duration: 2500 });
          return;
        }

        // Fallback mock so UI still renders in dev
        this.invoice = {
          id: this.invoiceId,
          invoiceNo: this.invoiceId,
          patientId: 'PAT001',
          patientName: 'John Doe',
          date: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PARTIALLY_PAID',
          items: [
            { description: 'Initial Consultation', quantity: 1, unitPrice: 350, taxRate: 18, discount: 0 },
            { description: 'Standard Blood Panel', quantity: 1, unitPrice: 250, taxRate: 18, discount: 0 }
          ],
          subTotal: 600,
          taxTotal: 108,
          discountTotal: 0,
          total: 708,
          amountPaid: 400,
          balanceDue: 308,
          notes: ''
        };
        this.loadPayments();
        this.loading = false;
        this.snackBar.open('Failed to load invoice from API (showing demo)', 'OK', { duration: 2500 });
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
        // Minimal fallback
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

  onBack(): void {
    if (this.dialogRef) {
      this.dialogRef.close(true);
      return;
    }
    this.router.navigate(['/billing']);
  }

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
        const payment = result.payment as PaymentRecord;
        this.billingService.recordPayment(this.invoice!.id as string, payment).subscribe({
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
      data: { 
        invoiceId: this.invoice.id, 
        itemId: item.id,
        balanceDue: balance,
        itemDescription: item.description
      },
      width: '600px',
      maxWidth: '90vw',
      footerActions
    });

    ref.afterClosed().subscribe((result: any) => {
      if (result?.action === 'save' && result.payment) {
        // Update item payment
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
        const invoice = result.invoice as Invoice;
        this.billingService.updateInvoice(this.invoice.id, invoice).subscribe({
          next: () => {
            this.snackBar.open('Invoice updated', 'OK', { duration: 2000 });
            this.loadInvoice();
          },
          error: () => this.snackBar.open('Failed to update invoice', 'Dismiss', { duration: 3000 })
        });
      }
    });
  }

  getItemTotal(item: InvoiceItem): number {
    const subtotal = item.quantity * item.unitPrice - (item.discount || 0);
    return subtotal * (1 + (item.taxRate || 0) / 100);
  }

  getItemBalance(item: InvoiceItem): number {
    const total = this.getItemTotal(item);
    return total - (item.amountPaid || 0);
  }

  getPaymentProgress(): number {
    if (!this.invoice || this.invoice.total === 0) return 0;
    return ((this.invoice.amountPaid || 0) / this.invoice.total) * 100;
  }

  currencyFmt(val: any): string {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
  }

  isOverdue(): boolean {
    if (!this.invoice?.dueDate) return false;
    if (this.invoice.status === 'PAID') return false;
    return new Date(this.invoice.dueDate) < new Date();
  }

  getDaysOverdue(): number {
    if (!this.invoice?.dueDate) return 0;
    const today = new Date();
    const dueDate = new Date(this.invoice.dueDate);
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

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
      next: () => {
        this.snackBar.open('Invoice PDF downloaded', 'OK', { duration: 2000 });
      },
      error: () => {
        // Fallback to print if download fails
        this.printInvoice();
      }
    });
  }
  onCategoryClick(category:string):void{}
}
