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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { BillingService } from '../../services/billing.service';
import { Invoice, DoctorBillingSummary } from '../../interfaces/billing.interface';
import { PatientSearchDialogComponent } from '../patient-search-dialog/patient-search-dialog.component';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';
import { BillingCurrencyPipe } from '../../pipes/billing-currency.pipe';

interface PatientBillingRow {
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  invoicesCount: number;
  billed: number;
  paid: number;
  outstanding: number;
  overdue: number;
  lastInvoiceDate?: string;
}

@Component({
  selector: 'app-admin-billing',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
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
  templateUrl: './admin-billing.component.html',
  styleUrl: './admin-billing.component.scss'
})
export class AdminBillingComponent implements OnInit, OnDestroy {

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Admin', route: '/admin-dashboard', icon: 'admin_panel_settings' },
    { label: 'Billing', icon: 'credit_card', isActive: true }
  ];

  loading = false;
  isDemoData = false;
  summary = { billed: 0, paid: 0, outstanding: 0, overdue: 0 };

  allInvoices: Invoice[] = [];
  patientRows: PatientBillingRow[] = [];
  doctorRows: DoctorBillingSummary[] = [];

  searchHints = [
    'Search by patient name...',
    'Search by doctor name...',
    'Search by invoice number...'
  ];
  private searchQuery = '';

  // ── Patient summary grid ──────────────────────────────────────────────────

  patientColumnDefs: ColDef[] = [
    {
      headerName: 'Patient',
      field: 'patientName',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 200,
      flex: 2,
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
      headerName: 'Doctor',
      field: 'doctorName',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 160,
      flex: 1
    },
    {
      headerName: 'Invoices',
      field: 'invoicesCount',
      sortable: true,
      minWidth: 100,
      maxWidth: 120
    },
    {
      headerName: 'Billed',
      field: 'billed',
      sortable: true,
      minWidth: 140,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Paid',
      field: 'paid',
      sortable: true,
      minWidth: 140,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Outstanding',
      field: 'outstanding',
      sortable: true,
      minWidth: 150,
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-danger-color)' : 'var(--status-success-color)';
        return `<span style="color:${color};font-weight:600;">${this.fmt(v)}</span>`;
      }
    },
    {
      headerName: 'Overdue',
      field: 'overdue',
      sortable: true,
      minWidth: 130,
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-warning-color)' : 'var(--status-neutral-color)';
        return `<span style="color:${color};font-weight:600;">${this.fmt(v)}</span>`;
      }
    },
    {
      headerName: 'Last Invoice',
      field: 'lastInvoiceDate',
      sortable: true,
      minWidth: 140,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '-'
    }
  ];

  patientGridOptions: ExtendedGridOptions = {
    rowHeight: 56,
    headerHeight: 40,
    animateRows: true,
    pagination: true,
    paginationPageSize: 25,
    paginationPageSizeSelector: [10, 25, 50, 100]
  };

  // ── Doctor summary grid ───────────────────────────────────────────────────

  doctorColumnDefs: ColDef[] = [
    {
      headerName: 'Doctor',
      field: 'doctorName',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 200,
      flex: 2,
      cellRenderer: (p: any) => {
        const name = p?.data?.doctorName ?? '';
        const id = p?.data?.doctorId ?? '';
        return `<div class="cell-two-line">
          <div class="primary">${name}</div>
          <div class="secondary">ID: ${id}</div>
        </div>`;
      }
    },
    {
      headerName: 'Patients',
      field: 'patientCount',
      sortable: true,
      minWidth: 100,
      maxWidth: 120
    },
    {
      headerName: 'Invoices',
      field: 'invoiceCount',
      sortable: true,
      minWidth: 100,
      maxWidth: 120
    },
    {
      headerName: 'Total Billed',
      field: 'totalBilled',
      sortable: true,
      minWidth: 150,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Total Collected',
      field: 'totalPaid',
      sortable: true,
      minWidth: 150,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Outstanding',
      field: 'totalOutstanding',
      sortable: true,
      minWidth: 150,
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-danger-color)' : 'var(--status-success-color)';
        return `<span style="color:${color};font-weight:600;">${this.fmt(v)}</span>`;
      }
    },
    {
      headerName: 'Overdue',
      field: 'overdue',
      sortable: true,
      minWidth: 130,
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-warning-color)' : 'var(--status-neutral-color)';
        return `<span style="color:${color};font-weight:600;">${this.fmt(v)}</span>`;
      }
    }
  ];

  doctorGridOptions: ExtendedGridOptions = {
    rowHeight: 56,
    headerHeight: 40,
    animateRows: true,
    pagination: true,
    paginationPageSize: 25,
    paginationPageSizeSelector: [10, 25, 50]
  };

  // ── All invoices flat grid ────────────────────────────────────────────────

  invoiceColumnDefs: ColDef[] = [
    {
      headerName: 'Invoice #',
      field: 'invoiceNo',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 150
    },
    {
      headerName: 'Patient',
      field: 'patientName',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 180,
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
      headerName: 'Doctor',
      field: 'doctorId',
      sortable: true,
      minWidth: 130,
      valueFormatter: p => p.value ? `Dr. (${p.value})` : '-'
    },
    {
      headerName: 'Date',
      field: 'date',
      sortable: true,
      minWidth: 120,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '-'
    },
    {
      headerName: 'Due Date',
      field: 'dueDate',
      sortable: true,
      minWidth: 120,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '-'
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      minWidth: 140,
      cellRenderer: (p: any) => {
        const status = (p?.value || '').toLowerCase();
        const label = (p?.value || '').replace('_', ' ');
        return `<span class="status-pill ${status}">${label}</span>`;
      }
    },
    {
      headerName: 'Total',
      field: 'total',
      sortable: true,
      minWidth: 130,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Paid',
      field: 'amountPaid',
      sortable: true,
      minWidth: 130,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Balance',
      field: 'balanceDue',
      sortable: true,
      minWidth: 130,
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-danger-color)' : 'var(--status-success-color)';
        return `<span style="color:${color};font-weight:600;">${this.fmt(v)}</span>`;
      }
    }
  ];

  invoiceGridOptions: ExtendedGridOptions = {
    rowHeight: 56,
    headerHeight: 40,
    animateRows: true,
    pagination: true,
    paginationPageSize: 25,
    paginationPageSizeSelector: [10, 25, 50, 100]
  };

  constructor(
    private readonly billing: BillingService,
    private readonly dialogService: DialogboxService,
    private readonly snack: MatSnackBar,
    private readonly router: Router,
    private readonly eventService: CoreEventService
  ) {}

  ngOnInit(): void {
    this.eventService.setBreadcrumb(this.breadcrumb);
    this.refresh();
  }

  ngOnDestroy(): void {
    this.eventService.clearBreadcrumb();
  }

  get statCards(): StatCard[] {
    return [
      { label: 'Total Billed', value: this.fmt(this.summary.billed), icon: 'account_balance_wallet', type: 'info' },
      { label: 'Total Collected', value: this.fmt(this.summary.paid), icon: 'payments', type: 'success' },
      { label: 'Outstanding', value: this.fmt(this.summary.outstanding), icon: 'warning', type: 'warning' },
      { label: 'Overdue', value: this.fmt(this.summary.overdue), icon: 'error', type: 'danger' }
    ];
  }

  fmt(val: any): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2
    }).format(Number(val) || 0);
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  refresh(): void {
    this.loading = true;
    this.isDemoData = false;

    const params: Record<string, string> = {};
    if (this.searchQuery) params['q'] = this.searchQuery;

    this.billing.listInvoices(params).subscribe({
      next: (res) => {
        const rows = (res || []).map(r => ({
          ...r,
          amountPaid: r.amountPaid ?? 0,
          balanceDue: r.balanceDue ?? Math.max((r.total || 0) - (r.amountPaid || 0), 0)
        }));
        this.applyData(rows as Invoice[]);
      },
      error: () => {
        const demo = this.buildDemoData();
        this.isDemoData = true;
        this.applyData(demo);
        this.snack.open('Backend unavailable — showing demo billing data', 'OK', { duration: 3500 });
      }
    });
  }

  private applyData(invoices: Invoice[]): void {
    this.allInvoices = invoices;
    this.computeSummary(invoices);
    this.patientRows = this.aggregateByPatient(invoices);
    this.doctorRows = this.aggregateByDoctor(invoices);
    this.loading = false;
  }

  private computeSummary(invoices: Invoice[]): void {
    const today = new Date();
    this.summary = {
      billed: invoices.reduce((s, r) => s + (r.total || 0), 0),
      paid: invoices.reduce((s, r) => s + (r.amountPaid || 0), 0),
      outstanding: invoices.reduce((s, r) => s + Math.max((r.total || 0) - (r.amountPaid || 0), 0), 0),
      overdue: invoices
        .filter(r => r.status !== 'PAID' && r.dueDate && new Date(r.dueDate) < today)
        .reduce((s, r) => s + Math.max((r.total || 0) - (r.amountPaid || 0), 0), 0)
    };
  }

  private aggregateByPatient(invoices: Invoice[]): PatientBillingRow[] {
    const today = new Date();
    const map = new Map<string, PatientBillingRow & { _lastTs: number }>();

    for (const inv of invoices) {
      const pid = (inv.patientId ?? '').toString().trim()
        || `NAME:${(inv.patientName ?? 'Unknown').trim()}`;

      const existing = map.get(pid) ?? {
        patientId: pid,
        patientName: (inv.patientName ?? 'Unknown').toString(),
        doctorId: inv.doctorId,
        doctorName: inv.doctorId ? `Dr. (${inv.doctorId})` : '-',
        invoicesCount: 0, billed: 0, paid: 0, outstanding: 0, overdue: 0,
        lastInvoiceDate: undefined, _lastTs: 0
      };

      const total = Number(inv.total) || 0;
      const paid = Number(inv.amountPaid) || 0;
      const balance = inv.balanceDue ?? Math.max(total - paid, 0);
      const ts = inv.date ? new Date(inv.date).getTime() : 0;

      existing.invoicesCount++;
      existing.billed += total;
      existing.paid += paid;
      existing.outstanding += balance;
      if (inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < today && balance > 0) {
        existing.overdue += balance;
      }
      if (ts > existing._lastTs) {
        existing._lastTs = ts;
        existing.lastInvoiceDate = inv.date;
      }
      map.set(pid, existing);
    }

    return Array.from(map.values())
      .map(({ _lastTs, ...row }) => row)
      .sort((a, b) => b.overdue - a.overdue || b.outstanding - a.outstanding);
  }

  private aggregateByDoctor(invoices: Invoice[]): DoctorBillingSummary[] {
    const today = new Date();
    const map = new Map<string, DoctorBillingSummary & { _patients: Set<string> }>();

    for (const inv of invoices) {
      const did = (inv.doctorId || 'UNASSIGNED').toString();
      const total = Number(inv.total) || 0;
      const paid = Number(inv.amountPaid) || 0;
      const balance = Math.max(total - paid, 0);
      const isOverdue = inv.status !== 'PAID' && !!inv.dueDate && new Date(inv.dueDate) < today && balance > 0;

      const existing = map.get(did) ?? {
        doctorId: did,
        doctorName: `Dr. (${did})`,
        patientCount: 0, invoiceCount: 0,
        totalBilled: 0, totalPaid: 0, totalOutstanding: 0, overdue: 0,
        _patients: new Set<string>()
      };

      existing._patients.add(inv.patientId);
      existing.invoiceCount++;
      existing.totalBilled += total;
      existing.totalPaid += paid;
      existing.totalOutstanding += balance;
      if (isOverdue) existing.overdue += balance;
      map.set(did, existing);
    }

    return Array.from(map.values())
      .map(({ _patients, ...row }) => ({ ...row, patientCount: _patients.size }))
      .sort((a, b) => b.totalBilled - a.totalBilled);
  }

  // ── User actions ──────────────────────────────────────────────────────────

  onSearch(query: string): void {
    this.searchQuery = query ?? '';
    this.refresh();
  }

  onPatientRowClick(row: PatientBillingRow): void {
    const patientId = (row?.patientId || '').toString();
    if (!patientId || patientId.startsWith('NAME:')) {
      this.snack.open('Cannot open patient billing — missing patient ID', 'Dismiss', { duration: 2500 });
      return;
    }
    this.router.navigate(['/billing/patient', patientId], {
      queryParams: { patientName: row.patientName }
    });
  }

  onInvoiceRowClick(invoice: Invoice): void {
    if (!invoice?.id) return;
    this.router.navigate(['/billing/invoice', invoice.id]);
  }

  createInvoice(): void {
    const ref = this.dialogService.openDialog(PatientSearchDialogComponent, {
      title: 'Search Patient',
      width: '90%',
      data: {}
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.action === 'select' && result?.patient) {
        const patient = result.patient;
        const patientName = patient.fullName || `${patient.firstName} ${patient.lastName}`;
        this.router.navigate(['/billing/patient', patient.id], {
          queryParams: { patientName, createNew: true }
        });
      }
    });
  }

  exportCsv(): void {
    const headers = ['invoiceNo', 'patientName', 'patientId', 'doctorId', 'date', 'dueDate', 'status', 'total', 'amountPaid', 'balanceDue'];
    const escape = (v: any) => {
      const s = (v ?? '').toString();
      return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
    };
    const csv = [headers.join(',')]
      .concat(this.allInvoices.map(r => headers.map(h => escape((r as any)[h])).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital-billing-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Demo data fallback ────────────────────────────────────────────────────

  private buildDemoData(): Invoice[] {
    const now = Date.now();
    const d = (days: number) => new Date(now - days * 86_400_000).toISOString();
    const f = (days: number) => new Date(now + days * 86_400_000).toISOString();

    const mk = (
      n: number, pid: string, pName: string, did: string,
      total: number, paid: number, status: Invoice['status'],
      date: string, dueDate?: string
    ): Invoice => {
      const id = `INV-${String(n).padStart(4, '0')}`;
      return {
        id, invoiceNo: `INV-2026-${String(n).padStart(3, '0')}`,
        doctorId: did, patientId: pid, patientName: pName,
        date, dueDate, status,
        items: [
          { description: 'OPD Consultation', quantity: 1, unitPrice: Math.min(total, 700), taxRate: 0, amountPaid: Math.min(paid, 700) },
          { description: 'Diagnostics / Lab', quantity: 1, unitPrice: Math.max(total - 700, 0), taxRate: 0, amountPaid: Math.max(paid - 700, 0) }
        ],
        subTotal: total, taxTotal: 0, discountTotal: 0, total,
        amountPaid: paid, balanceDue: Math.max(total - paid, 0), notes: ''
      };
    };

    return [
      mk(1, 'PAT-1001', 'Anjali Bendre',  'DOC-1', 3200, 3200, 'PAID',           d(98), f(0)),
      mk(2, 'PAT-1002', 'Rahul Sharma',   'DOC-1', 4500, 2000, 'PARTIALLY_PAID', d(74), d(60)),
      mk(3, 'PAT-1003', 'Aditi Verma',    'DOC-2', 1200,    0, 'ISSUED',         d(48), d(34)),
      mk(4, 'PAT-1004', 'Vikram Singh',   'DOC-2', 3600, 3600, 'PAID',           d(8),  d(1)),
      mk(5, 'PAT-1005', 'Neha Kapoor',    'DOC-1', 5000, 1500, 'PARTIALLY_PAID', d(16), d(2)),
      mk(6, 'PAT-1006', 'Sanjay Patel',   'DOC-2', 1800,    0, 'ISSUED',         d(3),  f(7)),
      mk(7, 'PAT-1007', 'Priya Mehta',    'DOC-3', 2500, 2500, 'PAID',           d(20), f(15)),
      mk(8, 'PAT-1008', 'Arjun Rao',      'DOC-3', 3100,    0, 'ISSUED',         d(5),  d(5)),
      mk(9, 'PAT-1009', 'Kavita Joshi',   'DOC-1', 6200, 6200, 'PAID',           d(45), f(0)),
      mk(10,'PAT-1010', 'Deepak Nair',    'DOC-2', 2800,  900, 'PARTIALLY_PAID', d(12), d(8)),
    ];
  }
}
