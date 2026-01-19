import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { ColDef } from 'ag-grid-community';
import { ExtendedGridOptions, GridComponent } from "@lk/core";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogboxService, DialogFooterAction } from "@lk/core";
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BillingService } from '../../services/billing.service';
import { Invoice, InvoiceItem, PaymentRecord } from '../../interfaces/billing.interface';
import { InvoiceFormComponent } from './invoice-form.component';
import { PaymentDialogComponent } from './payment-dialog.component';
import { InvoicePreviewDialogComponent } from './invoice-preview-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { BillingActionsRendererComponent } from './billing-actions-renderer.component';
import { BillingStatusRendererComponent } from './billing-status-renderer.component';
import { BillingPatientRendererComponent } from './billing-patient-renderer.component';
import { PatientSearchDialogComponent } from '../patient-search-dialog/patient-search-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { AdminPageHeaderComponent, HeaderAction } from '../../components/admin-page-header/admin-page-header.component';
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';
import { AdminTabsComponent, TabItem } from '../../components/admin-tabs/admin-tabs.component';

type StatusFilter = 'ALL' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
const FORCE_DEMO_BILLING_DATA = false;

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatSortModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    GridComponent,
    BillingActionsRendererComponent,
    BillingStatusRendererComponent,
    BillingPatientRendererComponent,
    AppCardComponent,
    AdminPageHeaderComponent,
    AdminStatsCardComponent,
    AdminTabsComponent
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent implements OnInit, AfterViewInit {
  displayedColumns = ['invoiceNo', 'patientName', 'date', 'total', 'balance', 'status', 'actions'];
  dataSource = new MatTableDataSource<Invoice>([]);
  loading = false;
  summary = { billed: 0, paid: 0, outstanding: 0, overdue: 0 };
  today = new Date();
  selectedTabIndex = 0;
  isDemoData = false;
  activeMainTab: 'invoices' | 'payments' | 'items' = 'invoices';

  activeStatus: StatusFilter = 'ALL';
  statusChips: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'UNPAID', label: 'Unpaid' },
    { key: 'PARTIALLY_PAID', label: 'Partial' },
    { key: 'PAID', label: 'Paid' },
    { key: 'OVERDUE', label: 'Overdue' }
  ];
  statusTabs: TabItem[] = [
    { id: 'ALL', label: 'All' },
    { id: 'UNPAID', label: 'Unpaid' },
    { id: 'PARTIALLY_PAID', label: 'Partial' },
    { id: 'PAID', label: 'Paid' },
    { id: 'OVERDUE', label: 'Overdue' }
  ];

  mainTabs: TabItem[] = [
    { id: 'invoices', label: 'Invoices' },
    { id: 'payments', label: 'Payments' },
    { id: 'items', label: 'Items / Services' }
  ];

  headerActions: HeaderAction[] = [
    { text: 'Export CSV', color: 'accent', fontIcon: 'description', action: 'export_csv' },
    { text: 'Download JSON', color: 'accent', fontIcon: 'download', action: 'download_json' },
    { text: 'Print', color: 'accent', fontIcon: 'print', action: 'print' },
    { text: 'Create Invoice', color: 'primary', fontIcon: 'add', action: 'create_invoice' }
  ];

  rowData: Invoice[] = [];
  visibleInvoices: Invoice[] = [];

  allItems: (InvoiceItem & { invoiceNo: string; patientName: string; invoiceId: string; date: string; dueDate?: string; status: string })[] = [];
  itemsColumnDefs: ColDef[] = [];
  itemsGridOptions: ExtendedGridOptions = {};

  allPayments: PaymentRecord[] = [];
  paymentsColumnDefs: ColDef[] = [];
  paymentsGridOptions: ExtendedGridOptions = {};
  columnDefs: ColDef[] = [
    { headerName: 'Invoice #', field: 'invoiceNo', filter: 'agTextColumnFilter', sortable: true, minWidth: 140, maxWidth: 160 },
    { headerName: 'Patient', field: 'patientName', filter: 'agTextColumnFilter', sortable: true, minWidth: 200, flex: 1, cellRenderer: BillingPatientRendererComponent },
    { headerName: 'Date', field: 'date', filter: 'agDateColumnFilter', sortable: true, valueFormatter: p => new Date(p.value).toLocaleDateString(), minWidth: 120 },
    { headerName: 'Total', field: 'total', filter: 'agNumberColumnFilter', sortable: true, valueFormatter: p => this.currencyFmt(p.value), minWidth: 120 },
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
    { headerName: 'Status', field: 'status', filter: 'agTextColumnFilter', sortable: true, minWidth: 140, cellRenderer: BillingStatusRendererComponent },
    { headerName: '', field: 'actions', maxWidth: 72, pinned: 'right', sortable: false, filter: false,
      cellRenderer: BillingActionsRendererComponent,
      cellRendererParams: () => ({
        onViewPatient: (row: Invoice) => this.viewPatientProfile(row),
        onEdit: (row: Invoice) => this.openEdit(row),
        onPayment: (row: Invoice) => this.openPayment(row),
        onPreview: (row: Invoice) => this.preview(row),
        onDownload: (row: Invoice) => this.downloadPdf(row),
        onDelete: (row: Invoice) => this.delete(row)
      })
    }
  ];
  gridOptions: ExtendedGridOptions = { 
    rowHeight: 48, 
    headerHeight: 40, 
    animateRows: true,
    pagination: true,
    paginationPageSize: 25,
    paginationPageSizeSelector: [10, 25, 50, 100]
    // Note: menuActions removed to avoid duplicate action buttons
    // Using BillingActionsRendererComponent in columnDefs instead
  };

  currencyFmt(val: any): string {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
  }

  filters = this.fb.group({
    search: [''],
    status: [''],
    from: [null as Date | null],
    to: [null as Date | null]
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly billing: BillingService,
    private readonly dialogService: DialogboxService,
    private readonly snack: MatSnackBar,
    private readonly fb: FormBuilder,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initItemsGrid();
    this.initPaymentsGrid();
    this.refresh();
  }

  get statCards(): StatCard[] {
    return [
      { label: 'Total Billed', value: this.currencyFmt(this.summary.billed), icon: 'account_balance_wallet', type: 'info' },
      { label: 'Total Paid', value: this.currencyFmt(this.summary.paid), icon: 'payments', type: 'success' },
      { label: 'Outstanding', value: this.currencyFmt(this.summary.outstanding), icon: 'warning', type: 'warning' },
      { label: 'Overdue', value: this.currencyFmt(this.summary.overdue), icon: 'error', type: 'danger' }
    ];
  }

  onHeaderAction(action: string): void {
    switch (action) {
      case 'create_invoice':
        this.openPatientProfile();
        break;
      case 'export_csv':
        this.exportInvoicesCsv();
        break;
      case 'download_json':
        this.downloadInvoicesJson();
        break;
      case 'print':
        this.printBilling();
        break;
    }
  }

  onMainTabChanged(id: string): void {
    if (id === 'payments' || id === 'items' || id === 'invoices') {
      this.activeMainTab = id;
    }
  }

  onStatusTabChanged(id: string): void {
    if (id === 'ALL' || id === 'UNPAID' || id === 'PARTIALLY_PAID' || id === 'PAID' || id === 'OVERDUE') {
      this.applyStatusFilter(id);
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


  refresh(): void {
    this.loading = true;
    this.isDemoData = false;

    if (FORCE_DEMO_BILLING_DATA) {
      const demo = this.getDemoInvoices();
      this.applyRows(demo);
      this.snack.open('Showing demo billing data', 'OK', { duration: 2500 });
      return;
    }

    const params: Record<string, string> = {};
    const f = this.filters.getRawValue();
    if (f.search) params['q'] = f.search;
    if (f.status) params['status'] = f.status;
    if (f.from instanceof Date) params['from'] = f.from.toISOString();
    if (f.to instanceof Date) params['to'] = f.to.toISOString();

    this.billing.listInvoices(params).subscribe({
      next: (res) => {
        const rows = (res || []).map(r => ({
          ...r,
          amountPaid: r.amountPaid ?? 0,
          balanceDue: r.balanceDue ?? Math.max((r.total || 0) - (r.amountPaid || 0), 0)
        }));
        this.applyRows(rows as Invoice[]);
      },
      error: () => {
        // Demo fallback so the UI is still usable during development
        const demo = this.getDemoInvoices();
        this.isDemoData = true;
        this.applyRows(demo);
        this.snack.open('Backend unavailable — showing demo billing data', 'OK', { duration: 3500 });
      }
    });
  }

  private applyRows(rows: Invoice[]): void {
    this.dataSource.data = rows;
    this.rowData = rows;
    this.applyStatusFilter(this.activeStatus);
    this.aggregateItems(rows);
    this.computeSummary(rows);
    this.loadPayments();
    this.loading = false;
  }

  applyStatusFilter(status: StatusFilter): void {
    this.activeStatus = status;
    const today = new Date();
    this.visibleInvoices = this.rowData.filter(inv => {
      const paid = inv.amountPaid || 0;
      const total = inv.total || 0;
      const balance = inv.balanceDue ?? Math.max(total - paid, 0);
      const overdue = inv.status !== 'PAID' && !!inv.dueDate && new Date(inv.dueDate) < today && balance > 0;
      switch (status) {
        case 'UNPAID':
          return paid === 0 && total > 0 && inv.status !== 'PAID';
        case 'PARTIALLY_PAID':
          return paid > 0 && paid < total && inv.status !== 'PAID';
        case 'PAID':
          return inv.status === 'PAID' || paid >= total;
        case 'OVERDUE':
          return overdue;
        default:
          return true;
      }
    });
  }

  private aggregateItems(invoices: Invoice[]): void {
    this.allItems = [];
    for (const inv of invoices) {
      for (const item of inv.items || []) {
        this.allItems.push({
          ...item,
          invoiceNo: inv.invoiceNo,
          patientName: inv.patientName,
          invoiceId: inv.id || '',
          date: inv.date,
          dueDate: inv.dueDate,
          status: inv.status
        });
      }
    }
  }

  private loadPayments(): void {
    // Prefer backend payments endpoint if available; otherwise gracefully fall back to derived records
    this.billing.listPayments().subscribe({
      next: (rows) => {
        this.allPayments = (rows || []).slice();
      },
      error: () => {
        // fallback: derive a minimal payment list from invoices
        this.allPayments = this.isDemoData
          ? this.getDemoPayments(this.rowData)
          : this.getDerivedPayments(this.rowData);
      }
    });
  }

  private getDerivedPayments(invoices: Invoice[]): PaymentRecord[] {
    const derived: PaymentRecord[] = [];
    for (const inv of invoices) {
      if ((inv.amountPaid || 0) > 0 && inv.id) {
        derived.push({
          id: `PAY-${inv.id}`,
          invoiceId: inv.id,
          amount: inv.amountPaid || 0,
          method: 'OTHER',
          date: inv.date,
          notes: `Payment for invoice ${inv.invoiceNo}`
        });
      }
    }
    return derived.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private getDemoPayments(invoices: Invoice[]): PaymentRecord[] {
    const rows: PaymentRecord[] = [];
    const byId = new Map<string, Invoice>(invoices.filter(i => i.id).map(i => [i.id as string, i]));
    for (const inv of byId.values()) {
      if ((inv.amountPaid || 0) <= 0) continue;
      // split into 1–2 payments for realism
      const paid = inv.amountPaid || 0;
      const first = Math.min(paid, Math.round(paid * 0.6));
      const second = paid - first;
      rows.push({
        id: `PAY-${inv.id}-1`,
        invoiceId: inv.id as string,
        amount: first,
        method: 'UPI',
        reference: `UPI-${(inv.invoiceNo || '').replace(/[^0-9]/g, '')}-${(Date.now() % 10000)}`,
        date: new Date(new Date(inv.date).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        notes: 'Collected at reception'
      });
      if (second > 0) {
        rows.push({
          id: `PAY-${inv.id}-2`,
          invoiceId: inv.id as string,
          amount: second,
          method: 'CASH',
          reference: '',
          date: new Date(new Date(inv.date).getTime() + 6 * 60 * 60 * 1000).toISOString(),
          notes: 'Paid in cash'
        });
      }
    }
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private getDemoInvoices(): Invoice[] {
    const now = Date.now();
    const d = (daysAgo: number) => new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const due = (daysFromNow: number) => new Date(now + daysFromNow * 24 * 60 * 60 * 1000).toISOString();

    const mk = (n: number, patientId: string, patientName: string, total: number, paid: number, status: Invoice['status'], date: string, dueDate?: string, items?: InvoiceItem[]): Invoice => {
      const id = `INV-${String(n).padStart(4, '0')}`;
      const invoiceNo = `INV-2026-${String(n).padStart(3, '0')}`;
      const balanceDue = Math.max(total - paid, 0);
      return {
        id,
        invoiceNo,
        doctorId: 'DOC-1',
        patientId,
        patientName,
        date,
        dueDate,
        status,
        items: items ?? [
          { description: 'OPD Consultation', quantity: 1, unitPrice: Math.min(total, 700), taxRate: 0, amountPaid: Math.min(paid, Math.min(total, 700)) },
          { description: 'Lab Test - CBC', quantity: 1, unitPrice: Math.max(total - 700, 0), taxRate: 0, amountPaid: Math.max(paid - 700, 0) }
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
      mk(1, 'PAT-1001', 'Anjali Bendre', 3200, 3200, 'PAID', d(98), due(0)),
      mk(2, 'PAT-1002', 'Rahul Sharma', 4500, 2000, 'PARTIALLY_PAID', d(74), d(60)),
      mk(3, 'PAT-1003', 'Aditi Verma', 1200, 0, 'ISSUED', d(48), d(34)),
      mk(4, 'PAT-1004', 'Vikram Singh', 3600, 3600, 'PAID', d(8), d(1)),
      mk(5, 'PAT-1005', 'Neha Kapoor', 5000, 1500, 'PARTIALLY_PAID', d(16), d(2)),
      mk(6, 'PAT-1006', 'Sanjay Patel', 1800, 0, 'ISSUED', d(3), due(7))
    ];
  }

  private initItemsGrid(): void {
    this.itemsColumnDefs = [
      { headerName: 'Invoice #', field: 'invoiceNo', filter: 'agTextColumnFilter', sortable: true, minWidth: 140 },
      { headerName: 'Patient', field: 'patientName', filter: 'agTextColumnFilter', sortable: true, minWidth: 200, flex: 1 },
      { headerName: 'Item / Service', field: 'description', filter: 'agTextColumnFilter', sortable: true, minWidth: 220, flex: 2 },
      { headerName: 'Qty', field: 'quantity', filter: 'agNumberColumnFilter', sortable: true, minWidth: 80, maxWidth: 100 },
      { headerName: 'Total', valueGetter: p => this.getItemTotal(p.data), filter: 'agNumberColumnFilter', sortable: true, minWidth: 120, valueFormatter: p => this.currencyFmt(p.value) },
      { headerName: 'Paid', valueGetter: p => (p.data.amountPaid || 0), filter: 'agNumberColumnFilter', sortable: true, minWidth: 120, valueFormatter: p => this.currencyFmt(p.value) },
      { headerName: 'Balance', valueGetter: p => this.getItemBalance(p.data), filter: 'agNumberColumnFilter', sortable: true, minWidth: 120, valueFormatter: p => this.currencyFmt(p.value) },
      { headerName: 'Status', field: 'status', filter: 'agTextColumnFilter', sortable: true, minWidth: 140, cellRenderer: BillingStatusRendererComponent }
    ];
    this.itemsGridOptions = { rowHeight: 56, headerHeight: 40, animateRows: true, pagination: true, paginationPageSize: 25 };
  }

  private initPaymentsGrid(): void {
    this.paymentsColumnDefs = [
      { headerName: 'Date', field: 'date', filter: 'agDateColumnFilter', sortable: true, minWidth: 160, valueFormatter: p => new Date(p.value).toLocaleString() },
      { headerName: 'Invoice #', valueGetter: p => this.getPaymentInvoiceNo(p.data), filter: 'agTextColumnFilter', sortable: true, minWidth: 140 },
      { headerName: 'Patient', valueGetter: p => this.getPaymentPatientName(p.data), filter: 'agTextColumnFilter', sortable: true, minWidth: 220, flex: 1 },
      { headerName: 'Mode', field: 'method', filter: 'agTextColumnFilter', sortable: true, minWidth: 120 },
      { headerName: 'Amount', field: 'amount', filter: 'agNumberColumnFilter', sortable: true, minWidth: 120, valueFormatter: p => this.currencyFmt(p.value) },
      { headerName: 'Reference', field: 'reference', filter: 'agTextColumnFilter', sortable: true, minWidth: 160, valueFormatter: p => p.value || '-' },
      { headerName: 'Notes', field: 'notes', filter: 'agTextColumnFilter', sortable: true, minWidth: 220, flex: 2, valueFormatter: p => p.value || '-' }
    ];
    this.paymentsGridOptions = { rowHeight: 48, headerHeight: 40, animateRows: true, pagination: true, paginationPageSize: 25 };
  }

  getItemTotal(item: any): number {
    const qty = Number(item?.quantity) || 0;
    const unitPrice = Number(item?.unitPrice) || 0;
    const discount = Number(item?.discount) || 0;
    const taxRate = Number(item?.taxRate) || 0;
    const sub = (qty * unitPrice) - discount;
    return sub + (sub * (taxRate / 100));
  }

  getItemBalance(item: any): number {
    const total = this.getItemTotal(item);
    const paid = Number(item?.amountPaid) || 0;
    return Math.max(total - paid, 0);
  }

  private getPaymentInvoiceNo(payment: PaymentRecord): string {
    const invoice = this.rowData.find(inv => inv.id === payment.invoiceId);
    return invoice?.invoiceNo || '-';
  }

  private getPaymentPatientName(payment: PaymentRecord): string {
    const invoice = this.rowData.find(inv => inv.id === payment.invoiceId);
    return invoice?.patientName || '-';
  }

  private computeSummary(rows: Invoice[]): void {
    const today = new Date();
    const billed = rows.reduce((s, r) => s + (r.total || 0), 0);
    const paid = rows.reduce((s, r) => s + (r.amountPaid || 0), 0);
    const outstanding = rows.reduce((s, r) => s + (Math.max((r.total || 0) - (r.amountPaid || 0), 0)), 0);
    const overdue = rows.filter(r => r.status !== 'PAID' && r.dueDate && new Date(r.dueDate) < today)
                        .reduce((s, r) => s + (Math.max((r.total || 0) - (r.amountPaid || 0), 0)), 0);
    this.summary = { billed, paid, outstanding, overdue };
  }

  openPatientProfile(): void {
    // Create invoices only from patient profile: pick patient then navigate
    const patientSearchRef = this.dialogService.openDialog(PatientSearchDialogComponent, {
      title: 'Search Patient',
      width: '90%',
      data: {}
    });

    patientSearchRef.afterClosed().subscribe((result) => {
      if (result?.action === 'select' && result?.patient) {
        const patient = result.patient;
        const patientName = patient.fullName || `${patient.firstName} ${patient.lastName}`;
        this.router.navigate(['/patient-profile'], {
          queryParams: { patientId: patient.id, patientName }
        });
      }
    });
  }

  viewPatientProfile(inv: Invoice): void {
    const patientId = (inv.patientId || '').toString();
    const patientName = inv.patientName || '';
    if (!patientId) {
      this.snack.open('Patient not available for this invoice', 'Dismiss', { duration: 2500 });
      return;
    }
    this.router.navigate(['/patient-profile'], {
      queryParams: { patientId, patientName }
    });
  }

  exportInvoicesCsv(): void {
    const rows = this.rowData || [];
    const header = ['invoiceNo', 'patientName', 'date', 'dueDate', 'status', 'total', 'amountPaid', 'balanceDue'];
    const escapeCsv = (v: any) => {
      const s = (v ?? '').toString();
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(',')].concat(
      rows.map(r => header.map(k => escapeCsv((r as any)[k])).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadInvoicesJson(): void {
    const blob = new Blob([JSON.stringify(this.rowData || [], null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-invoices-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  printBilling(): void {
    window.print();
  }

  openEdit(inv: Invoice): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'stroked' },
      { id: 'save', text: 'Update Invoice', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(InvoiceFormComponent, {
      title: 'Edit Invoice',
      width: '900px',
      data: { invoice: inv },
      footerActions
    });
    ref.afterClosed().subscribe((result: any) => {
      if (result?.action !== 'save' || !result.invoice || !inv.id) { return; }
      const invoice = result.invoice as Invoice;
      this.billing.updateInvoice(inv.id, invoice).subscribe({
        next: () => {
          this.snack.open('Invoice updated', 'OK', { duration: 2000 });
          this.refresh();
        },
        error: () => this.snack.open('Failed to update invoice', 'Dismiss', { duration: 3000 })
      });
    });
  }

  openPayment(inv: Invoice): void {
    if (!inv?.id) { return; }
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'stroked' },
      { id: 'save', text: 'Record Payment', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(PaymentDialogComponent, {
      title: 'Record Payment',
      width: '600px',
      data: { invoiceId: inv.id, balanceDue: inv.balanceDue },
      footerActions
    });
    ref.afterClosed().subscribe((result: any) => {
      if (result?.action !== 'save' || !result.payment) { return; }
      const payment = result.payment as PaymentRecord;
      this.billing.recordPayment(inv.id as string, payment).subscribe({
        next: () => {
          this.snack.open('Payment recorded', 'OK', { duration: 2000 });
          this.refresh();
        },
        error: () => this.snack.open('Failed to record payment', 'Dismiss', { duration: 3000 })
      });
    });
  }

  downloadPdf(inv: Invoice): void {
    if (!inv?.id) { return; }
    this.billing.downloadInvoicePdf(inv.id).subscribe({
      next: () => this.snack.open('Download started', 'OK', { duration: 2000 }),
      error: () => this.snack.open('Failed to download PDF', 'Dismiss', { duration: 3000 })
    });
  }

  preview(inv: Invoice): void {
    this.dialogService.openDialog(InvoicePreviewDialogComponent, { title: 'Invoice Preview', width: '900px', data: { invoice: inv } });
  }

  delete(inv: Invoice): void {
    if (!inv?.id) { return; }
    const ref = this.dialogService.openDialog(ConfirmDialogComponent, { title: 'Confirm Delete', data: { message: `Delete invoice ${inv.invoiceNo}?`, confirmText: 'Delete', cancelText: 'Cancel' }});
    ref.afterClosed().subscribe((yes: boolean) => {
      if (!yes) return;
      this.billing.deleteInvoice(inv.id as string).subscribe({
        next: () => {
          this.snack.open('Invoice deleted', 'OK', { duration: 2000 });
          this.refresh();
        },
        error: () => this.snack.open('Failed to delete invoice', 'Dismiss', { duration: 3000 })
      });
    });
  }

  clearFilters(): void {
    this.filters.reset({ search: '', status: '', from: null, to: null });
    this.refresh();
  }

  isOverdue(inv: Invoice): boolean {
    if (!inv.dueDate) return false;
    if (inv.status === 'PAID') return false;
    const balance = inv.balanceDue ?? Math.max((inv.total || 0) - (inv.amountPaid || 0), 0);
    if (balance <= 0) return false;
    return new Date(inv.dueDate) < this.today;
  }

  onRowClick(row: Invoice): void {
    // Open invoice inside patient profile billing tab
    const patientId = (row.patientId || '').toString();
    const patientName = row.patientName || '';
    if (!patientId || !row.id) {
      this.snack.open('Cannot open invoice details', 'Dismiss', { duration: 2500 });
      return;
    }
    this.router.navigate(['/patient-profile'], {
      queryParams: { patientId, patientName, tab: 'billing', invoiceId: row.id }
    });
  }
}
