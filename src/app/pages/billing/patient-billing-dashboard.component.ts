import { Component, OnChanges, OnInit, Input, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { GridComponent, ExtendedGridOptions, DialogboxService, DialogFooterAction } from "@lk/core";
import { ColDef } from 'ag-grid-community';
import { BillingService } from '../../services/billing.service';
import { Invoice, PaymentRecord, InvoiceItem } from '../../interfaces/billing.interface';
import { InvoiceFormComponent } from './invoice-form.component';
import { PaymentDialogComponent } from './payment-dialog.component';
import { InvoicePreviewDialogComponent } from './invoice-preview-dialog.component';
import { BillingStatusRendererComponent } from './billing-status-renderer.component';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { InvoiceDetailComponent } from './invoice-detail.component';

// Filter type for status chips
type StatusFilter = 'ALL' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
const FORCE_DEMO_PATIENT_BILLING = false;

@Component({
  selector: 'app-patient-billing-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatTableModule,
    GridComponent,
    BillingStatusRendererComponent,
    AppCardComponent
  ],
  templateUrl: './patient-billing-dashboard.component.html',
  styleUrl: './patient-billing-dashboard.component.scss'
})
export class PatientBillingDashboardComponent implements OnInit, OnChanges {
  @Input() patientId: string = '';
  @Input() patientName: string = '';
  @Input() embedded: boolean = false; // True when embedded in patient profile
  @Input() openInvoiceId: string = ''; // when provided, auto-open invoice detail
  private pendingOpenInvoiceId: string | null = null;
  
  patientInfo: any = null;
  loading = false;
  
  invoices: Invoice[] = [];
  visibleInvoices: Invoice[] = [];
  columnDefs: ColDef[] = [];
  gridOptions: ExtendedGridOptions = {};
  
  // Tab data
  allItems: (InvoiceItem & { invoiceNo: string; invoiceDate: string; invoiceId: string })[] = [];
  allPayments: PaymentRecord[] = [];
  
  // Grid column definitions
  itemsColumnDefs: ColDef[] = [];
  paymentsColumnDefs: ColDef[] = [];
  itemsGridOptions: ExtendedGridOptions = {};
  paymentsGridOptions: ExtendedGridOptions = {};
  
  summary = {
    totalBilled: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdue: 0,
    invoicesCount: 0
  };

  // UI State
  activeStatus: StatusFilter = 'ALL';
  selectedTabIndex = 0;
  statusChips: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'UNPAID', label: 'Unpaid' },
    { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { key: 'PAID', label: 'Paid' },
    { key: 'OVERDUE', label: 'Overdue' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    public router: Router,
    private readonly billingService: BillingService,
    private readonly dialog: MatDialog,
    private readonly dialogService: DialogboxService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // If patientId is provided as input, load immediately; otherwise derive from route
    if (this.patientId) {
      this.loadPatientBilling();
    } else {
      this.route.params.subscribe(params => {
        this.patientId = params['patientId'];
        this.route.queryParams.subscribe(queryParams => {
          if (queryParams['patientName']) {
            this.patientName = decodeURIComponent(queryParams['patientName']);
          }
        });
        if (this.patientId) {
          this.loadPatientBilling();
        }
      });
    }
    
    this.initGrid();
    this.initItemsGrid();
    this.initPaymentsGrid();

    if (this.openInvoiceId) {
      this.pendingOpenInvoiceId = this.openInvoiceId;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['openInvoiceId'] && this.openInvoiceId) {
      this.pendingOpenInvoiceId = this.openInvoiceId;
      this.tryOpenPendingInvoice();
    }
  }

  private initItemsGrid(): void {
    this.itemsColumnDefs = [
      { 
        headerName: 'Invoice #', 
        field: 'invoiceNo', 
        filter: 'agTextColumnFilter', 
        sortable: true, 
        minWidth: 120 
      },
      { 
        headerName: 'Description', 
        field: 'description', 
        filter: 'agTextColumnFilter', 
        sortable: true, 
        flex: 1,
        minWidth: 200
      },
      { 
        headerName: 'Qty', 
        field: 'quantity', 
        filter: 'agNumberColumnFilter', 
        sortable: true, 
        minWidth: 80,
        maxWidth: 100
      },
      { 
        headerName: 'Unit Price', 
        field: 'unitPrice', 
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value),
        minWidth: 120
      },
      { 
        headerName: 'Discount', 
        field: 'discount', 
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value || 0),
        minWidth: 120
      },
      { 
        headerName: 'Tax %', 
        field: 'taxRate', 
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => `${p.value || 0}%`,
        minWidth: 100,
        maxWidth: 120
      },
      { 
        headerName: 'Total', 
        valueGetter: p => this.getItemTotal(p.data),
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value),
        minWidth: 120
      },
      { 
        headerName: 'Paid', 
        valueGetter: p => this.getItemPaid(p.data),
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value),
        minWidth: 120,
        cellRenderer: (params: any) => {
          const paid = params.value || 0;
          const total = this.getItemTotal(params.data);
          const percentage = total > 0 ? (paid / total * 100).toFixed(0) : 0;
          return `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span>${this.currencyFmt(paid)}</span>
              <div style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: #4caf50; transition: width 0.3s;"></div>
              </div>
            </div>
          `;
        }
      },
      { 
        headerName: 'Balance', 
        valueGetter: p => this.getItemBalance(p.data),
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value),
        minWidth: 120,
        cellRenderer: (params: any) => {
          const balance = params.value || 0;
          const color = balance > 0 ? '#d32f2f' : '#4caf50';
          return `<span style="color: ${color}; font-weight: 600;">${this.currencyFmt(balance)}</span>`;
        }
      }
    ];

    this.itemsGridOptions = {
      rowHeight: 56,
      headerHeight: 40,
      animateRows: true,
      pagination: true,
      paginationPageSize: 25
    };
  }

  private initPaymentsGrid(): void {
    this.paymentsColumnDefs = [
      { 
        headerName: 'Date', 
        field: 'date', 
        filter: 'agDateColumnFilter', 
        sortable: true,
        valueFormatter: p => new Date(p.value).toLocaleString(),
        minWidth: 160
      },
      { 
        headerName: 'Invoice #', 
        valueGetter: p => this.getPaymentInvoiceNo(p.data),
        filter: 'agTextColumnFilter', 
        sortable: true, 
        minWidth: 120 
      },
      { 
        headerName: 'Amount', 
        field: 'amount', 
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value),
        minWidth: 120,
        cellRenderer: (params: any) => {
          return `<strong>${this.currencyFmt(params.value)}</strong>`;
        }
      },
      { 
        headerName: 'Method', 
        field: 'method', 
        filter: 'agTextColumnFilter', 
        sortable: true, 
        minWidth: 130,
        cellRenderer: (params: any) => {
          const method = params.value || 'CASH';
          const methodColors: Record<string, { bg: string; color: string; icon: string }> = {
            'CASH': { bg: '#fef3c7', color: '#92400e', icon: '💵' },
            'CARD': { bg: '#dbeafe', color: '#1e40af', icon: '💳' },
            'UPI': { bg: '#e0e7ff', color: '#3730a3', icon: '📱' },
            'ONLINE': { bg: '#e0e7ff', color: '#3730a3', icon: '🌐' },
            'CHEQUE': { bg: '#fce7f3', color: '#9f1239', icon: '📄' },
            'BANK_TRANSFER': { bg: '#d1fae5', color: '#065f46', icon: '🏦' },
            'OTHER': { bg: '#f3f4f6', color: '#374151', icon: '💰' }
          };
          const style = methodColors[method] || methodColors['OTHER'];
          return `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: ${style.bg}; color: ${style.color}; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${style.icon} ${method}
          </span>`;
        }
      },
      { 
        headerName: 'Reference', 
        field: 'reference', 
        filter: 'agTextColumnFilter', 
        sortable: true, 
        minWidth: 140,
        valueFormatter: p => p.value || '-'
      },
      { 
        headerName: 'Notes', 
        field: 'notes', 
        filter: 'agTextColumnFilter', 
        sortable: true, 
        flex: 1,
        minWidth: 200,
        valueFormatter: p => p.value || '-'
      }
    ];

    this.paymentsGridOptions = {
      rowHeight: 48,
      headerHeight: 40,
      animateRows: true,
      pagination: true,
      paginationPageSize: 25
    };
  }

  private initGrid(): void {
    this.columnDefs = [
      { 
        headerName: 'Invoice #', 
        field: 'invoiceNo', 
        filter: 'agTextColumnFilter', 
        sortable: true, 
        minWidth: 140 
      },
      { 
        headerName: 'Date', 
        field: 'date', 
        filter: 'agDateColumnFilter', 
        sortable: true,
        valueFormatter: p => new Date(p.value).toLocaleDateString(),
        minWidth: 120
      },
      { 
        headerName: 'Due Date', 
        field: 'dueDate', 
        filter: 'agDateColumnFilter', 
        sortable: true,
        valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString() : '-',
        minWidth: 120,
        cellRenderer: (params: any) => {
          if (!params.value) return '-';
          const dueDate = new Date(params.value);
          const today = new Date();
          const isOverdue = dueDate < today && params.data.status !== 'PAID';
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (isOverdue) {
            return `<span style="color: #d32f2f; font-weight: 600;">${dueDate.toLocaleDateString()} (${daysOverdue}d overdue)</span>`;
          }
          return dueDate.toLocaleDateString();
        }
      },
      { 
        headerName: 'Total', 
        field: 'total', 
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value),
        minWidth: 120
      },
      { 
        headerName: 'Paid', 
        field: 'amountPaid', 
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value || 0),
        minWidth: 120,
        cellRenderer: (params: any) => {
          const paid = params.value || 0;
          const total = params.data.total || 0;
          const percentage = total > 0 ? (paid / total * 100).toFixed(0) : 0;
          return `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span>${this.currencyFmt(paid)}</span>
              <div style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: #4caf50; transition: width 0.3s;"></div>
              </div>
            </div>
          `;
        }
      },
      { 
        headerName: 'Balance', 
        valueGetter: p => (p.data.balanceDue || ((p.data.total || 0) - (p.data.amountPaid || 0))),
        filter: 'agNumberColumnFilter', 
        sortable: true,
        valueFormatter: p => this.currencyFmt(p.value),
        minWidth: 120,
        cellRenderer: (params: any) => {
          const balance = params.value || 0;
          const color = balance > 0 ? '#d32f2f' : '#4caf50';
          return `<span style="color: ${color}; font-weight: 600;">${this.currencyFmt(balance)}</span>`;
        }
      },
      { 
        headerName: 'Status', 
        field: 'status', 
        filter: 'agTextColumnFilter', 
        sortable: true, 
        minWidth: 140,
        cellRenderer: BillingStatusRendererComponent
      },
      {
        headerName: '',
        field: 'actions',
        maxWidth: 80,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          return `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
              <button class="record-payment-btn" title="Record Payment" style="
                width: 36px;
                height: 36px;
                border: none;
                background: #4caf50;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
              ">
                <svg style="width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
              </button>
            </div>
          `;
        },
        onCellClicked: (params: any) => {
          params?.event?.stopPropagation?.();
          if (params.event.target.closest('.record-payment-btn')) {
            this.recordPayment(params.data);
          }
        }
      }
    ];

    this.gridOptions = {
      rowHeight: 56,
      headerHeight: 40,
      animateRows: true,
      pagination: true,
      paginationPageSize: 25
    };
  }

  private loadPatientBilling(): void {
    this.loading = true;
    
    // Load invoices first, then load payments separately
    this.billingService.listInvoices({ patientId: this.patientId, patientName: this.patientName }).subscribe({
      next: (invoices) => {
        this.invoices = (invoices || []).map(inv => ({
          ...inv,
          amountPaid: inv.amountPaid ?? 0,
          balanceDue: inv.balanceDue ?? Math.max((inv.total || 0) - (inv.amountPaid || 0), 0)
        }));
        this.aggregateItems();
        this.loadPayments(); // Load payments separately after invoices
        this.calculateSummary();
        this.applyStatusFilter(this.activeStatus);
        this.tryOpenPendingInvoice();
        this.loading = false;
      },
      error: () => {
        // Demo fallback for development
        if (FORCE_DEMO_PATIENT_BILLING) {
          this.invoices = this.getDemoPatientInvoices(this.patientId, this.patientName);
          this.aggregateItems();
          this.loadPayments();
          this.calculateSummary();
          this.applyStatusFilter(this.activeStatus);
          this.loading = false;
          this.snackBar.open('Backend unavailable — showing demo billing data', 'OK', { duration: 3000 });
          return;
        }
        this.loading = false;
        this.snackBar.open('Failed to load billing data', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private loadPayments(): void {
    // Fetch actual payment records from API
    this.billingService.listPayments({ patientId: this.patientId }).subscribe({
      next: (payments) => {
        this.allPayments = (payments || []).map(p => ({
          ...p,
          date: p.date || new Date().toISOString()
        }));
        // Sort payments by date (newest first)
        this.allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      error: () => {
        // Fallback: create payment records from invoice payment data if API fails
        this.allPayments = [];
        for (const inv of this.invoices) {
          if (inv.amountPaid && inv.amountPaid > 0) {
            this.allPayments.push({
              id: `PAY-${inv.id}`,
              invoiceId: inv.id || '',
              amount: inv.amountPaid,
              method: 'CASH',
              reference: '',
              date: inv.date,
              notes: `Payment for invoice ${inv.invoiceNo}`
            });
          }
        }
        this.allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    });
  }

  openInvoiceDetails(inv: Invoice): void {
    if (!inv?.id) return;
    const ref = this.dialog.open(InvoiceDetailComponent, {
      width: '95%',
      maxWidth: '1200px',
      maxHeight: '95vh',
      autoFocus: false,
      data: { invoiceId: inv.id, invoice: inv }
    });
    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) {
        this.loadPatientBilling();
      }
    });
  }

  private tryOpenPendingInvoice(): void {
    const id = this.pendingOpenInvoiceId;
    if (!id || this.loading) return;
    const inv = this.invoices.find(i => i.id === id);
    if (inv) {
      this.pendingOpenInvoiceId = null;
      this.openInvoiceDetails(inv);
    } else if (this.invoices.length > 0) {
      // If invoice isn't in list (filters/server), still open detail by id
      this.pendingOpenInvoiceId = null;
      const ref = this.dialog.open(InvoiceDetailComponent, {
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '95vh',
        autoFocus: false,
        data: { invoiceId: id }
      });
      ref.afterClosed().subscribe((changed: boolean) => {
        if (changed) {
          this.loadPatientBilling();
        }
      });
    }
  }

  private getDemoPatientInvoices(patientId: string, patientName: string): Invoice[] {
    const now = Date.now();
    const d = (daysAgo: number) => new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const due = (daysFromNow: number) => new Date(now + daysFromNow * 24 * 60 * 60 * 1000).toISOString();

    const mk = (n: number, total: number, paid: number, status: Invoice['status'], date: string, dueDate?: string): Invoice => {
      const id = `PINV-${patientId}-${n}`;
      const invoiceNo = `INV-2026-${String(n).padStart(3, '0')}`;
      const balanceDue = Math.max(total - paid, 0);
      return {
        id,
        invoiceNo,
        doctorId: 'DOC-1',
        patientId,
        patientName: patientName || 'Patient',
        date,
        dueDate,
        status,
        items: [
          { description: 'OPD Consultation', quantity: 1, unitPrice: Math.min(total, 800), taxRate: 0, amountPaid: Math.min(paid, Math.min(total, 800)) },
          { description: 'Medicine', quantity: 2, unitPrice: Math.max((total - 800) / 2, 0), taxRate: 0, amountPaid: Math.max(paid - 800, 0) }
        ],
        subTotal: total,
        taxTotal: 0,
        discountTotal: 0,
        total,
        amountPaid: paid,
        balanceDue,
        notes: ''
      };
    };

    return [
      mk(1, 3200, 3200, 'PAID', d(30), d(25)),
      mk(2, 4500, 2000, 'PARTIALLY_PAID', d(18), d(10)),
      mk(3, 1200, 0, 'ISSUED', d(8), due(7))
    ];
  }

  private aggregateItems(): void {
    // Aggregate all items from all invoices for the Items tab
    this.allItems = [];
    for (const inv of this.invoices) {
      if (inv.items && inv.items.length > 0) {
        for (const item of inv.items) {
          const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
          const taxAmount = itemTotal * ((item.taxRate || 0) / 100);
          const finalTotal = itemTotal + taxAmount;
          const itemPaid = item.amountPaid || 0;
          const itemBalance = finalTotal - itemPaid;
          
          this.allItems.push({
            ...item,
            invoiceNo: inv.invoiceNo,
            invoiceDate: inv.date,
            invoiceId: inv.id || '',
            amountPaid: itemPaid,
            balanceDue: itemBalance
          });
        }
      }
    }
    // Sort items by invoice date (newest first)
    this.allItems.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
  }

  getItemTotal(item: InvoiceItem & { invoiceNo: string; invoiceDate: string }): number {
    const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
    const taxAmount = itemTotal * ((item.taxRate || 0) / 100);
    return itemTotal + taxAmount;
  }

  getItemPaid(item: InvoiceItem & { invoiceNo: string; invoiceDate: string }): number {
    return item.amountPaid || 0;
  }

  getItemBalance(item: InvoiceItem & { invoiceNo: string; invoiceDate: string }): number {
    return this.getItemTotal(item) - this.getItemPaid(item);
  }

  getPaymentInvoiceNo(payment: PaymentRecord): string {
    const invoice = this.invoices.find(inv => inv.id === payment.invoiceId);
    return invoice?.invoiceNo || '-';
  }

  private calculateSummary(): void {
    const today = new Date();
    this.summary = {
      totalBilled: this.invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      totalPaid: this.invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0),
      totalOutstanding: this.invoices.reduce((sum, inv) => {
        const balance = inv.balanceDue ?? Math.max((inv.total || 0) - (inv.amountPaid || 0), 0);
        return sum + balance;
      }, 0),
      overdue: this.invoices.filter(inv => {
        if (inv.status === 'PAID') return false;
        if (!inv.dueDate) return false;
        return new Date(inv.dueDate) < today;
      }).reduce((sum, inv) => {
        const balance = inv.balanceDue ?? Math.max((inv.total || 0) - (inv.amountPaid || 0), 0);
        return sum + balance;
      }, 0),
      invoicesCount: this.invoices.length
    };
  }

  applyStatusFilter(status: StatusFilter): void {
    this.activeStatus = status;
    const today = new Date();
    const filtered = this.invoices.filter(inv => {
      switch (status) {
        case 'UNPAID':
          return (inv.amountPaid || 0) === 0 && inv.total > 0 && inv.status !== 'PAID';
        case 'PARTIALLY_PAID':
          return (inv.amountPaid || 0) > 0 && (inv.amountPaid || 0) < (inv.total || 0) && inv.status !== 'PAID';
        case 'PAID':
          return inv.status === 'PAID' || (inv.amountPaid || 0) >= (inv.total || 0);
        case 'OVERDUE':
          return (!!inv.dueDate && new Date(inv.dueDate) < today && inv.status !== 'PAID');
        default:
          return true;
      }
    });
    this.visibleInvoices = filtered;
  }

  getTopOutstandingInvoice(): Invoice | undefined {
    return [...this.invoices]
      .sort((a, b) => ((b.balanceDue || (b.total || 0) - (b.amountPaid || 0)) - (a.balanceDue || (a.total || 0) - (a.amountPaid || 0))))[0];
  }

  createNewInvoice(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'stroked' },
      { id: 'save', text: 'Create Invoice', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(InvoiceFormComponent, {
      title: 'New Invoice',
      data: {
        patient: {
          id: this.patientId,
          fullName: this.patientName
        },
        hidePatientInfo: true
      },
      width: '95%',
      maxWidth: '1200px',
      maxHeight: '95vh',
      footerActions
    });

    ref.afterClosed().subscribe((result: any) => {
      if (result?.action === 'save' && result.invoice) {
        const invoice = result.invoice as Invoice;
        this.billingService.createInvoice(invoice).subscribe({
          next: () => {
            this.snackBar.open('Invoice created', 'OK', { duration: 2000 });
            this.loadPatientBilling();
          },
          error: () => this.snackBar.open('Failed to create invoice', 'Dismiss', { duration: 3000 })
        });
      }
    });
  }

  viewInvoice(invoice: Invoice): void {
    this.openInvoiceDetails(invoice);
  }

  recordPayment(invoice: Invoice): void {
    if (!invoice?.id) return;
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'stroked' },
      { id: 'save', text: 'Record Payment', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(PaymentDialogComponent, {
      title: 'Record Payment',
      data: { invoiceId: invoice.id, balanceDue: invoice.balanceDue },
      width: '600px',
      maxWidth: '90vw',
      footerActions
    });

    ref.afterClosed().subscribe((result: any) => {
      if (result?.action === 'save' && result.payment) {
        const payment = result.payment as PaymentRecord;
        this.billingService.recordPayment(invoice.id as string, payment).subscribe({
          next: () => {
            this.snackBar.open('Payment recorded successfully', 'OK', { duration: 2000 });
            // Reload both invoices and payments to reflect the new payment
            this.loadPatientBilling();
          },
          error: () => {
            this.snackBar.open('Failed to record payment. Please try again.', 'Dismiss', { duration: 3000 });
          }
        });
      }
    });
  }

  private buildHeaderContext() {
    // In lieu of backend doctor/clinic profile endpoints, use friendly defaults
    return {
      doctor: {
        name: 'Dr. Anika Rao',
        credentials: 'MBBS, MD (Internal Medicine)',
        registration: 'MMC/2021/45873',
        contact: {
          phone: '+91 98765 11022',
          email: 'anika.rao@carehub.in'
        }
      },
      clinic: {
        name: 'CareHub Multispeciality Clinic',
        tagline: 'Integrated Care · Compassionate Outcomes',
        address: '11th Floor, Block B, TechPark Enclave, HSR Layout, Bengaluru 560102',
        phone: '+91 80 4455 2200',
        email: 'hello@carehub.in',
        website: 'www.carehub.in',
        logoUrl: 'https://play-lh.googleusercontent.com/QFBUITewOePUVGqeNZquY5-Z4ErxsdxCeuSyW2nAHLL5K33nL6MHie-kWGv4P4auo48j=w480-h960-rw'
      }
    };
  }

  generateStatement(): void {
    if (this.invoices.length === 0) {
      this.snackBar.open('No invoices to generate statement', 'OK', { duration: 2000 });
      return;
    }
    
    // Create a combined statement invoice
    const statementInvoice: Invoice = {
      id: 'STATEMENT',
      invoiceNo: `STATEMENT-${this.patientId}-${Date.now()}`,
      patientId: this.patientId,
      patientName: this.patientName,
      date: new Date().toISOString(),
      status: 'ISSUED',
      items: this.allItems.map(item => ({
        description: `${item.description} (Invoice: ${item.invoiceNo})`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discount: item.discount,
        amountPaid: item.amountPaid,
        balanceDue: item.balanceDue
      })),
      subTotal: this.summary.totalBilled,
      discountTotal: 0,
      taxTotal: 0,
      total: this.summary.totalBilled,
      amountPaid: this.summary.totalPaid,
      balanceDue: this.summary.totalOutstanding,
      notes: `Statement for all invoices - Generated on ${new Date().toLocaleDateString()}`
    };
    
    const header = this.buildHeaderContext();

    this.dialog.open(InvoicePreviewDialogComponent, {
      width: '90%',
      maxWidth: '900px',
      maxHeight: '95vh',
      data: {
        invoice: statementInvoice,
        isStatement: true,
        doctor: header.doctor,
        clinic: header.clinic
      },
      panelClass: 'invoice-preview-dialog'
    });
  }

  getPaymentProgress(): number {
    if (this.summary.totalBilled === 0) return 0;
    return (this.summary.totalPaid / this.summary.totalBilled) * 100;
  }

  navigateBack(): void {
    this.router.navigate(['/billing']);
  }

  openPatientProfileForBilling(): void {
    // Invoice creation happens inside patient profile billing tab
    const patientId = (this.patientId || '').replace(/^P0*/, ''); // tolerate "P001" format
    this.router.navigate(['/patient-profile'], {
      queryParams: { patientId: patientId || this.patientId, patientName: this.patientName }
    });
  }

  currencyFmt(val: any): string {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
  }
}
