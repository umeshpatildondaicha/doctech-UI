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
import { BillingservicesService } from '../../services/billingservices.service';
import { PatientService } from '../../services/patient.service';
import { Invoice, DoctorBillingSummary } from '../../interfaces/billing.interface';
import { PatientSearchDialogComponent } from '../patient-search-dialog/patient-search-dialog.component';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';
import { BillingCurrencyPipe } from '../../pipes/billing-currency.pipe';
import { forkJoin } from 'rxjs';

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
  // patientRows: PatientBillingRow[] = [];
  // doctorRows: DoctorBillingSummary[] = [];

  searchHints = [
    'Search by patient name...',
    'Search by doctor name...',
    'Search by invoice number...'
  ];
  private searchQuery = '';

  // ── Patient summary grid ──────────────────────────────────────────────────



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

  hospitalId = 'H1';

  constructor(
    private readonly billing: BillingService,
    private readonly billingservices: BillingservicesService,
    private readonly patientService: PatientService,
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

    forkJoin({
      summary: this.billing.getHospitalSummary(this.hospitalId),
      invoices: this.billingservices.getInvoices(this.hospitalId),
      patients: this.patientService.getPatients()
    }).subscribe({
      next: ({ summary, invoices, patients }) => {
        const s = Array.isArray(summary) ? summary[0] : summary;
        this.summary = {
          billed: Number(s?.totalBilled) || 0,
          paid: Number((s as any)?.totalCollected) || Number((s as any)?.totalPaid) || 0,
          outstanding: Number(s?.totalOutstanding) || 0,
          overdue: Number((s as any)?.totalOverdue) || Number((s as any)?.overdue) || 0
        };

        const patientList = this.normalizePatientList(patients);
        const nameMap = new Map<string, string>();
        for (const p of patientList) {
          const rawId = p?.id ?? p?.patientId ?? p?.patient_id;
          const id = rawId != null ? String(rawId).trim() : '';
          if (!id) continue;
          const firstName = p?.firstName ?? p?.first_name ?? '';
          const lastName = p?.lastName ?? p?.last_name ?? '';
          const fullName =
            (p?.fullName && String(p.fullName).trim()) ||
            `${firstName} ${lastName}`.trim() ||
            (p?.name && String(p.name).trim()) ||
            '';
          if (fullName) {
            nameMap.set(id, fullName);
          }
        }

        const rows = (invoices || []).map(r => ({
          ...r,
          patientName: (() => {
            const pid = String(r.patientId ?? '').trim();
            const mapped = pid ? nameMap.get(pid) : undefined;
            return mapped || r.patientName;
          })(),
          amountPaid: r.amountPaid ?? 0,
          balanceDue: r.balanceDue ?? Math.max((r.total || 0) - (r.amountPaid || 0), 0)
        }));
        let filtered = rows as Invoice[];
        if (this.searchQuery) {
          const q = this.searchQuery.toLowerCase();
          filtered = filtered.filter(r =>
            (r.patientName || '').toLowerCase().includes(q) ||
            (r.patientId || '').toLowerCase().includes(q) ||
            (r.invoiceNo || '').toLowerCase().includes(q)
          );
        }
        this.applyData(filtered, /*recomputeSummary*/ false);
      },
      error: () => {
        this.loading = false;
        this.snack.open('Failed to load hospital billing summary', 'Dismiss', { duration: 3500 });
      }
    });
  }

  /** Ensure API response is always an array (handles data/content/items wrappers). */
  private normalizePatientList(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    const data = res.data ?? res.content ?? res.items ?? res.patients ?? res;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as any).content)) return (data as any).content;
    return [];
  }

  private applyData(invoices: Invoice[], recomputeSummary = true): void {
    this.allInvoices = invoices;
    if (recomputeSummary) this.computeSummary(invoices);
   
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

}
