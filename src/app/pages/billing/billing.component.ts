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
  PageComponent,
  SnackbarData,
  SnackbarService
} from '@lk/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BillingService } from '../../services/billing.service';
import { AuthService } from '../../services/auth.service';
import { PatientService } from '../../services/patient.service';
import { Invoice } from '../../interfaces/billing.interface';
import { PatientSearchDialogComponent } from '../patient-search-dialog/patient-search-dialog.component';
import { AppCardComponent } from '../../core/components/app-card/app-card.component';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';
import { BillingCurrencyPipe } from '../../pipes/billing-currency.pipe';
import { BillingservicesService, PatientBillingSummaryRow } from '../../services/billingservices.service';

interface PatientBillingSummaryRowLocal extends PatientBillingSummaryRow {
  /** Used only by aggregatePatients when building from invoices */
  _lastTs?: number;
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
  hospitalId = 'H1';
 


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
      field: 'totalBilled',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 140,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Paid',
      field: 'totalCollected',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 140,
      valueFormatter: p => this.fmt(p.value)
    },
    {
      headerName: 'Outstanding',
      field: 'totalOutstanding',
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
      field: 'dueDate',
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
    private readonly patientService: PatientService,
    private readonly dialogService: DialogboxService,
    private readonly snack: MatSnackBar,
    private readonly fb: FormBuilder,
    private readonly snackbarservice : SnackbarService,
    private readonly router: Router,
    private readonly eventService: CoreEventService,
    private readonly billingservices :BillingservicesService
  ) {}

  ngOnInit(): void {
    this.doctorId = this.authService.getDoctorRegistrationNumber()
      || this.authService.getCurrentUser()?.id
      || null;
    this.eventService.setBreadcrumb(this.breadcrumb);
    this.loadPatientBillingSummary();
  }

  loadPatientBillingSummary(): void {
    this.loading = true;
    this.isDemoData = false;
    this.billingservices.getPatientsBillingSummary(this.hospitalId).pipe(
      switchMap(rows => this.enrichPatientNames(rows ?? []))
    ).subscribe({
      next: (rows) => {
        this.patientRows = rows;
        this.computeSummaryFromRows(this.patientRows);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading patient billing summary', err);
        this.loadFromInvoicesFallback();
      }
    });
  }

  /**
   * API returns only patientId; enrich rows with patient names from patient list.
   */
  private enrichPatientNames(rows: PatientBillingSummaryRow[]): Observable<PatientBillingSummaryRow[]> {
    if (rows.length === 0) return of(rows);
    return this.patientService.getPatients().pipe(
      map(res => {
        const list = this.normalizePatientList(res);
        const nameMap = new Map<string, string>();
        for (const p of list) {
          const id = p?.id != null ? String(p.id) : p?.patientId != null ? String(p.patientId) : null;
          if (!id) continue;
          const firstName = p?.firstName ?? p?.first_name ?? '';
          const lastName = p?.lastName ?? p?.last_name ?? '';
          const fullName = (p?.fullName ?? `${firstName} ${lastName}`.trim() ?? p?.name ?? '').toString().trim();
          if (fullName) nameMap.set(id, fullName);
        }
        for (const row of rows) {
          const id = String(row.patientId ?? '').trim();
          if (id && !id.startsWith('NAME:')) {
            const name = nameMap.get(id);
            if (name) row.patientName = name;
          }
        }
        return rows;
      }),
      catchError(() => of(rows))
    );
  }

  private normalizePatientList(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    const data = res?.data ?? res?.content ?? res?.items ?? res?.patients ?? res;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as any).content)) return (data as any).content;
    return [];
  }

  /** Fallback: use getInvoices and aggregate by patient when summary API is unavailable. */
  private loadFromInvoicesFallback(): void {
    this.billingservices.getInvoices(this.hospitalId).pipe(
      map(invoices => this.aggregatePatients(invoices as Invoice[])),
      switchMap(rows => this.enrichPatientNames(rows))
    ).subscribe({
      next: (rows) => {
        this.patientRows = rows;
        this.computeSummaryFromRows(this.patientRows);
        this.loading = false;
      },
      error: () => {
        this.patientRows = [];
        this.computeSummaryFromRows(this.patientRows);
        this.loading = false;
        this.snack.open('Failed to load billing data', 'Dismiss', { duration: 3500 });
      }
    });
  }

  /** Compute summary from patient summary rows (from getPatientsBillingSummary). */
  private computeSummaryFromRows(rows: PatientBillingSummaryRow[]): void {
    this.summary = {
      billed: rows.reduce((s, r) => s + (r.totalBilled ?? 0), 0),
      paid: rows.reduce((s, r) => s + (r.totalCollected ?? 0), 0),
      outstanding: rows.reduce((s, r) => s + (r.totalOutstanding ?? 0), 0),
      overdue: rows.reduce((s, r) => s + (r.overdue ?? 0), 0)
    };
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
    this.loadPatientBillingSummary();
  }


  private applyRows(rows: Invoice[]): void {
    this.computeSummary(rows);
    this.patientRows = this.aggregatePatients(rows);
    this.loading = false;
  }

  private aggregatePatients(invoices: Invoice[]): PatientBillingSummaryRow[] {
    const today = new Date();
    const map = new Map<string, PatientBillingSummaryRowLocal>();

    for (const inv of invoices) {
      const pid = (inv.patientId ?? '').toString().trim()
        || `NAME:${(inv.patientName ?? 'Unknown').trim()}`;

      const existing = map.get(pid) ?? {
        patientId: pid,
        patientName: (inv.patientName ?? 'Unknown').toString(),
        invoicesCount: 0,
        totalBilled: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        overdue: 0,
        lastInvoiceDate: undefined,
        _lastTs: 0
      };

      const total = Number(inv.total) || 0;
      const paid = Number(inv.amountPaid) || 0;
      const balance = inv.balanceDue ?? Math.max(total - paid, 0);
      const ts = inv.date ? new Date(inv.date).getTime() : 0;

      existing.invoicesCount++;
      existing.totalBilled += total;
      existing.totalCollected += paid;
      existing.totalOutstanding += balance;

      const isOverdue = inv.status !== 'PAID' && !!inv.dueDate
        && new Date(inv.dueDate) < today && balance > 0;
      if (isOverdue) existing.overdue += balance;

      if (ts > (existing._lastTs ?? 0)) {
        existing._lastTs = ts;
        existing.lastInvoiceDate = inv.date;
      }

      map.set(pid, existing);
    }

    return Array.from(map.values())
      .map(({ _lastTs, ...row }) => row)
      .sort((a, b) => b.overdue - a.overdue || b.totalOutstanding - a.totalOutstanding || b.totalBilled - a.totalBilled);
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
      height:'600px',
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
}
