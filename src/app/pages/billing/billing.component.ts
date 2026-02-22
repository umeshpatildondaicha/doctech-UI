import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import {
  AppButtonComponent,
  BreadcrumbItem,
  CoreEventService,
  DialogboxService,
  ExtendedGridOptions,
  GridComponent,
  IconComponent,
  PageBodyDirective,
  PageComponent
} from '@lk/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { AuthService } from '../../services/auth.service';
import { Invoice } from '../../interfaces/billing.interface';
import { PatientSearchDialogComponent } from '../patient-search-dialog/patient-search-dialog.component';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';
import { BillingCurrencyPipe } from '../../pipes/billing-currency.pipe';

interface PatientBillingSummaryRow {
  patientId: string;
  patientName: string;
  invoicesCount: number;
  billed: number;
  paid: number;
  outstanding: number;
  overdue: number;
  lastInvoiceDate?: string;
}

@Component({
  selector: 'app-billing',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    GridComponent,
    AppCardComponent,
    EntityToolbarComponent,
    AdminStatsCardComponent,
    AppButtonComponent,
    PageComponent,
    PageBodyDirective,
    IconComponent,
    BillingCurrencyPipe
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent implements OnInit, OnDestroy {

  breadcrumb: BreadcrumbItem[] = [{ label: 'Billing', route: '/billing' }];
  loading = false;
  isDemoData = false;
  summary = { billed: 0, paid: 0, outstanding: 0, overdue: 0 };
  today = new Date();

  /** Doctor's own ID — used to scope the billing list to their patients only. */
  private doctorId: string | null = null;

  billingSearchHints = [
    'Search by patient name...',
    'Search by patient number...',
    'Search by invoice number...'
  ];

  patientRows: PatientBillingSummaryRow[] = [];

  // ── Patient summary grid ──────────────────────────────────────────────────

  columnDefs: ColDef[] = [
    {
      headerName: 'Patient',
      field: 'patientName',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 200,
      flex: 1,
      cellRenderer: (p: any) => {
        const name = p?.data?.patientName ?? '';
        const id = p?.data?.patientId ?? '';
        return `<div class="cell-two-line">
          <div class="primary">${name}</div>
          <div class="secondary">ID: ${id}</div>
        </div>`;
      }
    },
    {
      headerName: 'Invoices',
      field: 'invoicesCount',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 110,
      maxWidth: 130
    },
    {
      headerName: 'Billed',
      field: 'billed',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 140,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Paid',
      field: 'paid',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 140,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Outstanding',
      field: 'outstanding',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 160,
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-danger-color)' : 'var(--status-success-color)';
        return `<span style="color:${color};font-weight:var(--font-weight-semibold);">${this.fmt(v)}</span>`;
      }
    },
    {
      headerName: 'Overdue',
      field: 'overdue',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 140,
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-warning-color)' : 'var(--status-neutral-color)';
        return `<span style="color:${color};font-weight:var(--font-weight-semibold);">${this.fmt(v)}</span>`;
      }
    },
    {
      headerName: 'Last Invoice',
      field: 'lastInvoiceDate',
      filter: 'agDateColumnFilter',
      sortable: true,
      minWidth: 160,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString() : '-'
    }
  ];

  gridOptions: ExtendedGridOptions = {
    rowHeight: 56,
    headerHeight: 40,
    animateRows: true,
    pagination: true,
    paginationPageSize: 25,
    paginationPageSizeSelector: [10, 25, 50, 100]
  };

  filters = this.fb.group({
    search: [''],
    status: [''],
    from: [null as Date | null],
    to: [null as Date | null]
  });

  constructor(
    private readonly billing: BillingService,
    private readonly authService: AuthService,
    private readonly dialogService: DialogboxService,
    private readonly snack: MatSnackBar,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly eventService: CoreEventService
  ) {}

  ngOnInit(): void {
    // Resolve doctor's own ID to scope invoices to their patients only
    this.doctorId = this.authService.getDoctorRegistrationNumber()
                    || this.authService.getCurrentUser()?.id
                    || null;

    this.eventService.setBreadcrumb(this.breadcrumb);
    this.refresh();
  }

  ngOnDestroy(): void {
    this.eventService.clearBreadcrumb();
  }

  get statCards(): StatCard[] {
    return [
      { label: 'Total Billed',  value: this.fmt(this.summary.billed),      icon: 'account_balance_wallet', type: 'info'    },
      { label: 'Total Paid',    value: this.fmt(this.summary.paid),         icon: 'payments',               type: 'success' },
      { label: 'Outstanding',   value: this.fmt(this.summary.outstanding),  icon: 'warning',                type: 'warning' },
      { label: 'Overdue',       value: this.fmt(this.summary.overdue),      icon: 'error',                  type: 'danger'  }
    ];
  }

  fmt(val: any): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2
    }).format(Number(val) || 0);
  }

  onBillingSearch(query: string): void {
    this.filters.patchValue({ search: query ?? '' });
    this.refresh();
  }

  onBillingFilterClick(): void {
    this.clearFilters();
  }

  refresh(): void {
    this.loading = true;
    this.isDemoData = false;

    const params: Record<string, string> = {};
    const f = this.filters.getRawValue();
    if (f.search)                   params['q']       = f.search;
    if (f.status)                   params['status']  = f.status;
    if (f.from instanceof Date)     params['from']    = f.from.toISOString();
    if (f.to instanceof Date)       params['to']      = f.to.toISOString();
    // Scope invoices to this doctor's patients only
    if (this.doctorId)              params['doctorId'] = this.doctorId;

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
        const demo = this.getDemoInvoices();
        this.isDemoData = true;
        this.applyRows(demo);
        this.snack.open('Backend unavailable — showing demo billing data', 'OK', { duration: 3500 });
      }
    });
  }

  private applyRows(rows: Invoice[]): void {
    this.computeSummary(rows);
    this.patientRows = this.aggregatePatients(rows);
    this.loading = false;
  }

  private aggregatePatients(invoices: Invoice[]): PatientBillingSummaryRow[] {
    const today = new Date();
    const map = new Map<string, PatientBillingSummaryRow & { _lastTs: number }>();

    for (const inv of invoices) {
      const pid = (inv.patientId ?? '').toString().trim()
        || `NAME:${(inv.patientName ?? 'Unknown').trim()}`;

      const existing = map.get(pid) ?? {
        patientId: pid,
        patientName: (inv.patientName ?? 'Unknown').toString(),
        invoicesCount: 0, billed: 0, paid: 0, outstanding: 0, overdue: 0,
        lastInvoiceDate: undefined, _lastTs: 0
      };

      const total = Number(inv.total) || 0;
      const paid  = Number(inv.amountPaid) || 0;
      const balance = inv.balanceDue ?? Math.max(total - paid, 0);
      const ts = inv.date ? new Date(inv.date).getTime() : 0;

      existing.invoicesCount++;
      existing.billed      += total;
      existing.paid        += paid;
      existing.outstanding += balance;

      const isOverdue = inv.status !== 'PAID' && !!inv.dueDate
        && new Date(inv.dueDate) < today && balance > 0;
      if (isOverdue) existing.overdue += balance;

      if (ts > existing._lastTs) {
        existing._lastTs = ts;
        existing.lastInvoiceDate = inv.date;
      }

      map.set(pid, existing);
    }

    return Array.from(map.values())
      .map(({ _lastTs, ...row }) => row)
      .sort((a, b) => b.overdue - a.overdue || b.outstanding - a.outstanding || b.billed - a.billed);
  }

  private computeSummary(rows: Invoice[]): void {
    const today = new Date();
    const billed      = rows.reduce((s, r) => s + (r.total || 0), 0);
    const paid        = rows.reduce((s, r) => s + (r.amountPaid || 0), 0);
    const outstanding = rows.reduce((s, r) => s + Math.max((r.total || 0) - (r.amountPaid || 0), 0), 0);
    const overdue     = rows
      .filter(r => r.status !== 'PAID' && r.dueDate && new Date(r.dueDate) < today)
      .reduce((s, r) => s + Math.max((r.total || 0) - (r.amountPaid || 0), 0), 0);
    this.summary = { billed, paid, outstanding, overdue };
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  openPatientProfile(): void {
    const ref = this.dialogService.openDialog(PatientSearchDialogComponent, {
      title: 'Search Patient',
      width: '90%',
      data: {}
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.action === 'select' && result?.patient) {
        const patient = result.patient;
        const patientName = patient.fullName || `${patient.firstName} ${patient.lastName}`;
        this.router.navigate(['/patient-profile'], {
          queryParams: { patientId: patient.id, patientName }
        });
      }
    });
  }

  onPatientRowClick(row: PatientBillingSummaryRow): void {
    const patientId = (row?.patientId || '').toString();
    const patientName = row?.patientName || '';
    if (!patientId || patientId.startsWith('NAME:')) {
      this.snack.open('Cannot open patient billing — missing patient ID', 'Dismiss', { duration: 2500 });
      return;
    }
    this.router.navigate(['/billing/patient', patientId], {
      queryParams: { patientName }
    });
  }

  clearFilters(): void {
    this.filters.reset({ search: '', status: '', from: null, to: null });
    this.refresh();
  }

  // ── Demo data fallback ────────────────────────────────────────────────────

  private getDemoInvoices(): Invoice[] {
    const now = Date.now();
    const d   = (days: number) => new Date(now - days * 86_400_000).toISOString();
    const f   = (days: number) => new Date(now + days * 86_400_000).toISOString();

    const mk = (
      n: number, patientId: string, patientName: string, doctorId: string,
      total: number, paid: number, status: Invoice['status'],
      date: string, dueDate?: string
    ): Invoice => {
      const id = `INV-${String(n).padStart(4, '0')}`;
      return {
        id, invoiceNo: `INV-2026-${String(n).padStart(3, '0')}`,
        doctorId, patientId, patientName,
        date, dueDate, status,
        items: [
          { description: 'OPD Consultation', quantity: 1, unitPrice: Math.min(total, 700), taxRate: 0, amountPaid: Math.min(paid, 700) },
          { description: 'Lab Test - CBC',   quantity: 1, unitPrice: Math.max(total - 700, 0), taxRate: 0, amountPaid: Math.max(paid - 700, 0) }
        ],
        subTotal: total, taxTotal: 0, discountTotal: 0, total,
        amountPaid: paid, balanceDue: Math.max(total - paid, 0), notes: ''
      };
    };

    // Demo invoices scoped to DOC-12332 (default mock doctor ID)
    const myDoctorId = this.doctorId || 'DOC-12332';
    return [
      mk(1, 'PAT-1001', 'Anjali Bendre',  myDoctorId, 3200, 3200, 'PAID',           d(98), f(0)),
      mk(2, 'PAT-1002', 'Rahul Sharma',   myDoctorId, 4500, 2000, 'PARTIALLY_PAID', d(74), d(60)),
      mk(3, 'PAT-1005', 'Neha Kapoor',    myDoctorId, 5000, 1500, 'PARTIALLY_PAID', d(16), d(2)),
      mk(4, 'PAT-1009', 'Kavita Joshi',   myDoctorId, 6200, 6200, 'PAID',           d(45), f(0)),
    ];
  }
}
