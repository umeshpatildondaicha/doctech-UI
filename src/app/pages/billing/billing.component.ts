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
} from "@lk/core";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { Invoice } from '../../interfaces/billing.interface';
import { PatientSearchDialogComponent } from '../patient-search-dialog/patient-search-dialog.component';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';

const FORCE_DEMO_BILLING_DATA = false;

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
    IconComponent
],
    templateUrl: './billing.component.html',
    styleUrl: './billing.component.scss'
})
export class BillingComponent implements OnInit, OnDestroy {
  breadcrumb: BreadcrumbItem[] = [{ label: 'Billing', route: '/billing' }];
  loading = false;
  summary = { billed: 0, paid: 0, outstanding: 0, overdue: 0 };
  today = new Date();
  isDemoData = false;

  /** Search bar hint texts (typing animation) */
  billingSearchHints = [
    'Search by patient name...',
    'Search by patient number...',
    'Search by invoice number...'
  ];

  rowData: Invoice[] = [];
  patientRows: PatientBillingSummaryRow[] = [];

  patientColumnDefs: ColDef[] = [
    {
      headerName: 'Patient',
      field: 'patientName',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 240,
      flex: 1,
      cellRenderer: (p: any) => {
        const name = p?.data?.patientName ?? '';
        const id = p?.data?.patientId ?? '';
        return `
          <div class="cell-two-line">
            <div class="primary">${name}</div>
            <div class="secondary">ID: ${id}</div>
          </div>
        `;
      }
    },
    { headerName: 'Invoices', field: 'invoicesCount', filter: 'agNumberColumnFilter', sortable: true, minWidth: 110, maxWidth: 130 },
    { headerName: 'Billed', field: 'billed', filter: 'agNumberColumnFilter', sortable: true, minWidth: 140, valueFormatter: p => this.currencyFmt(p.value) },
    { headerName: 'Paid', field: 'paid', filter: 'agNumberColumnFilter', sortable: true, minWidth: 140, valueFormatter: p => this.currencyFmt(p.value) },
    {
      headerName: 'Outstanding',
      field: 'outstanding',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 160,
      valueFormatter: p => this.currencyFmt(p.value),
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-danger-color)' : 'var(--status-success-color)';
        return `<span style="color:${color};font-weight:var(--font-weight-semibold);">${this.currencyFmt(v)}</span>`;
      }
    },
    {
      headerName: 'Overdue',
      field: 'overdue',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 140,
      valueFormatter: p => this.currencyFmt(p.value),
      cellRenderer: (p: any) => {
        const v = Number(p?.value) || 0;
        const color = v > 0 ? 'var(--status-warning-color)' : 'var(--status-neutral-color)';
        return `<span style="color:${color};font-weight:var(--font-weight-semibold);">${this.currencyFmt(v)}</span>`;
      }
    },
    { headerName: 'Last invoice', field: 'lastInvoiceDate', filter: 'agDateColumnFilter', sortable: true, minWidth: 160, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString() : '-' }
  ];

  patientGridOptions: ExtendedGridOptions = {
    rowHeight: 56,
    headerHeight: 40,
    animateRows: true,
    pagination: true,
    paginationPageSize: 25,
    paginationPageSizeSelector: [10, 25, 50, 100]
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

  constructor(
    private readonly billing: BillingService,
    private readonly dialogService: DialogboxService,
    private readonly snack: MatSnackBar,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly eventService: CoreEventService
  ) {}

  ngOnInit(): void {
    this.eventService.setBreadcrumb(this.breadcrumb);
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

  onBillingSearch(query: string): void {
    this.filters.patchValue({ search: query ?? '' });
    this.refresh();
  }

  onBillingFilterClick(): void {
    this.clearFilters();
  }

  ngOnDestroy(): void {
    this.eventService.clearBreadcrumb();
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
    this.rowData = rows;
    this.computeSummary(rows);
    this.patientRows = this.aggregatePatients(rows);
    this.loading = false;
  }

  private aggregatePatients(invoices: Invoice[]): PatientBillingSummaryRow[] {
    const today = new Date();
    const map = new Map<string, (PatientBillingSummaryRow & { _lastTs: number })>();

    for (const inv of invoices) {
      const pidRaw = (inv.patientId ?? '').toString().trim();
      const patientId = pidRaw || `NAME:${(inv.patientName ?? 'Unknown').trim()}`;
      const patientName = (inv.patientName ?? 'Unknown').toString();

      const total = Number(inv.total) || 0;
      const paid = Number(inv.amountPaid) || 0;
      const balance = inv.balanceDue ?? Math.max(total - paid, 0);

      const dateTs = inv.date ? new Date(inv.date).getTime() : 0;

      const existing = map.get(patientId) ?? {
        patientId,
        patientName,
        invoicesCount: 0,
        billed: 0,
        paid: 0,
        outstanding: 0,
        overdue: 0,
        lastInvoiceDate: undefined,
        _lastTs: 0
      };

      existing.invoicesCount += 1;
      existing.billed += total;
      existing.paid += paid;
      existing.outstanding += balance;

      const isOverdue = inv.status !== 'PAID' && !!inv.dueDate && new Date(inv.dueDate) < today && balance > 0;
      if (isOverdue) existing.overdue += balance;

      if (dateTs > existing._lastTs) {
        existing._lastTs = dateTs;
        existing.lastInvoiceDate = inv.date;
      }

      map.set(patientId, existing);
    }

    return Array.from(map.values())
      .map(({ _lastTs, ...row }) => row)
      .sort((a, b) => (b.overdue - a.overdue) || (b.outstanding - a.outstanding) || (b.billed - a.billed));
  }

  private getDemoInvoices(): Invoice[] {
    const now = Date.now();
    const d = (daysAgo: number) => new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const due = (daysFromNow: number) => new Date(now + daysFromNow * 24 * 60 * 60 * 1000).toISOString();

    const mk = (p: {
      n: number;
      patientId: string;
      patientName: string;
      total: number;
      paid: number;
      status: Invoice['status'];
      date: string;
      dueDate?: string;
      items?: any[];
    }): Invoice => {
      const { n, patientId, patientName, total, paid, status, date, dueDate, items } = p;
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
      mk({ n: 1, patientId: 'PAT-1001', patientName: 'Anjali Bendre', total: 3200, paid: 3200, status: 'PAID', date: d(98), dueDate: due(0) }),
      mk({ n: 2, patientId: 'PAT-1002', patientName: 'Rahul Sharma', total: 4500, paid: 2000, status: 'PARTIALLY_PAID', date: d(74), dueDate: d(60) }),
      mk({ n: 3, patientId: 'PAT-1003', patientName: 'Aditi Verma', total: 1200, paid: 0, status: 'ISSUED', date: d(48), dueDate: d(34) }),
      mk({ n: 4, patientId: 'PAT-1004', patientName: 'Vikram Singh', total: 3600, paid: 3600, status: 'PAID', date: d(8), dueDate: d(1) }),
      mk({ n: 5, patientId: 'PAT-1005', patientName: 'Neha Kapoor', total: 5000, paid: 1500, status: 'PARTIALLY_PAID', date: d(16), dueDate: d(2) }),
      mk({ n: 6, patientId: 'PAT-1006', patientName: 'Sanjay Patel', total: 1800, paid: 0, status: 'ISSUED', date: d(3), dueDate: due(7) })
    ];
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
      return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
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

  onPatientRowClick(row: PatientBillingSummaryRow): void {
    const patientId = (row?.patientId || '').toString();
    const patientName = row?.patientName || '';
    if (!patientId) {
      this.snack.open('Cannot open patient billing', 'Dismiss', { duration: 2500 });
      return;
    }
    // Use the existing Patient Profile → Billing tab (single source of truth)
    this.router.navigate(['/patient-profile'], {
      queryParams: { patientId, patientName, tab: 'billing' }
    });
  }

  private openPatientBillingFromSearch(): void {
    const patientSearchRef = this.dialogService.openDialog(PatientSearchDialogComponent, {
      title: 'Search Patient',
      width: '90%',
      data: {}
    });

    patientSearchRef.afterClosed().subscribe((result) => {
      if (result?.action !== 'select' || !result?.patient) return;
      const patient = result.patient;
      const patientId = (patient.id ?? '').toString();
      const patientName = patient.fullName || `${patient.firstName} ${patient.lastName}`;
      this.router.navigate(['/patient-profile'], {
        queryParams: { patientId, patientName, tab: 'billing' }
      });
    });
  }
}
