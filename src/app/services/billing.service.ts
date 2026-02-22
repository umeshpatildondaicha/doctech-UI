import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { HttpService } from './http.service';
import { ApiConfigService } from '@lk/core';
import { Invoice, PaymentRecord, DoctorBillingSummary, HospitalBillingSummary } from '../interfaces/billing.interface';

/** Static display-name map used in mock mode to humanise doctor IDs. */
const MOCK_DOCTOR_NAMES: Record<string, string> = {
  'DOC-1': 'Dr. Swapnil Desai',
  'DOC-2': 'Dr. Anika Rao',
  'DOC-3': 'Dr. Rahul Mehta',
  'UNASSIGNED': 'Unassigned'
};

function resolveDoctorName(doctorId: string | undefined): string {
  if (!doctorId) return MOCK_DOCTOR_NAMES['UNASSIGNED'];
  return MOCK_DOCTOR_NAMES[doctorId] ?? `Dr. (ID: ${doctorId})`;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly apiConfig = inject(ApiConfigService);
  private readonly endpoints = {
    base: '/api/billing',
    invoices: '/api/billing/invoices',
    payments: '/api/billing/payments',
    pdf: '/api/billing/invoices/pdf',
    summary: '/api/billing/summary'
  };
  private readonly mock = false;

  private shouldFallbackToMock(err: any): boolean {
    const status = err?.status;
    return status === 404 || status === 0;
  }

  private ensurePatientDemoData(patientId: string, patientName?: string): void {
    if (!patientId) return;
    const name = patientName || `Patient ${patientId}`;
    const existing = this.mockInvoices.filter(i => i.patientId === patientId);
    if (existing.length > 0) return;

    const now = Date.now();
    const inv1: Invoice = {
      id: `INV-${patientId}-001`,
      invoiceNo: `INV-${patientId}-001`,
      doctorId: 'DOC-1',
      patientId,
      patientName: name,
      date: new Date(now - 5 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date(now + 7 * 24 * 3600 * 1000).toISOString(),
      status: 'PARTIALLY_PAID',
      items: [
        { id: 'ITEM-1', description: 'Consultation', quantity: 1, unitPrice: 500, taxRate: 0, discount: 0, amountPaid: 200 },
        { id: 'ITEM-2', description: 'Lab Tests', quantity: 1, unitPrice: 800, taxRate: 18, discount: 0, amountPaid: 0 }
      ],
      subTotal: 1300,
      discountTotal: 0,
      taxTotal: 144,
      total: 1444,
      amountPaid: 200,
      balanceDue: 1244,
      notes: 'Demo invoice'
    };
    const inv2: Invoice = {
      id: `INV-${patientId}-002`,
      invoiceNo: `INV-${patientId}-002`,
      doctorId: 'DOC-1',
      patientId,
      patientName: name,
      date: new Date(now - 20 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
      status: 'ISSUED',
      items: [
        { id: 'ITEM-3', description: 'Follow-up Visit', quantity: 1, unitPrice: 300, taxRate: 0, discount: 0, amountPaid: 0 }
      ],
      subTotal: 300,
      discountTotal: 0,
      taxTotal: 0,
      total: 300,
      amountPaid: 0,
      balanceDue: 300
    };

    this.mockInvoices.unshift(inv2, inv1);

    this.mockPayments.unshift({
      id: `PAY-${patientId}-001`,
      invoiceId: inv1.id as string,
      amount: 200,
      method: 'CASH',
      reference: '',
      date: inv1.date,
      notes: 'Partial payment (demo)'
    });
  }

  private get apiBase(): string {
    return this.apiConfig.getApiUrl();
  }

  private mockInvoices: Invoice[] = [
    {
      id: 'INV-1001',
      invoiceNo: 'INV-1001',
      doctorId: 'DOC-1',
      patientId: 'PAT-1',
      patientName: 'Rahul Sharma',
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      status: 'ISSUED',
      items: [
        { description: 'Consultation', quantity: 1, unitPrice: 500 },
        { description: 'X-Ray', quantity: 1, unitPrice: 800, taxRate: 18 }
      ],
      subTotal: 1300,
      discountTotal: 0,
      taxTotal: 144,
      total: 1444,
      amountPaid: 0,
      balanceDue: 1444,
      notes: 'Follow-up in 1 week'
    },
    {
      id: 'INV-1002',
      invoiceNo: 'INV-1002',
      doctorId: 'DOC-1',
      patientId: 'PAT-2',
      patientName: 'Aditi Verma',
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      status: 'PARTIALLY_PAID',
      items: [{ description: 'Physiotherapy Session', quantity: 3, unitPrice: 700 }],
      subTotal: 2100,
      discountTotal: 100,
      taxTotal: 360,
      total: 2360,
      amountPaid: 1000,
      balanceDue: 1360
    },
    {
      id: 'INV-1003',
      invoiceNo: 'INV-1003',
      doctorId: 'DOC-2',
      patientId: 'PAT-3',
      patientName: 'Vikram Singh',
      date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      status: 'PAID',
      items: [{ description: 'Cardiology Consultation', quantity: 1, unitPrice: 1200, taxRate: 18 }],
      subTotal: 1200,
      discountTotal: 0,
      taxTotal: 216,
      total: 1416,
      amountPaid: 1416,
      balanceDue: 0
    }
  ];

  private mockPayments: PaymentRecord[] = [];

  constructor(private readonly http: HttpService) {}

  listInvoices(params?: Record<string, any>): Observable<Invoice[]> {
    if (this.mock) {
      return of(this.applyFilters(this.mockInvoices.slice(), params)).pipe(delay(150));
    }
    const url = this.apiBase + this.endpoints.invoices;
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.http.sendGETRequest(url + query).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          const patientId = (params?.['patientId'] || '').toString();
          const patientName = (params?.['patientName'] || '').toString();
          if (patientId) this.ensurePatientDemoData(patientId, patientName);
          return of(this.applyFilters(this.mockInvoices.slice(), params)).pipe(delay(80));
        }
        return of([] as Invoice[]);
      })
    );
  }

  getInvoice(id: string): Observable<Invoice> {
    if (this.mock) {
      const found = this.mockInvoices.find(i => i.id === id) || this.mockInvoices[0];
      return of(found).pipe(delay(100));
    }
    const url = `${this.apiBase + this.endpoints.invoices}/${id}`;
    return this.http.sendGETRequest(url).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          const found = this.mockInvoices.find(i => i.id === id);
          if (found) return of(found).pipe(delay(50));

          let patientId = '';
          let patientName = '';
          const match = id.match(/INV-(PAT-\d+|\d+)-/);
          if (match) {
            const extractedId = match[1];
            patientId = /^\d+$/.test(extractedId) ? `PAT-${extractedId.padStart(4, '0')}` : extractedId;
            const existingInv = this.mockInvoices.find(i => i.patientId === patientId);
            patientName = existingInv?.patientName || `Patient ${patientId}`;
          }

          if (patientId) {
            this.ensurePatientDemoData(patientId, patientName);
            const foundAfter = this.mockInvoices.find(i => i.id === id);
            if (foundAfter) return of(foundAfter).pipe(delay(50));
          }

          const created: Invoice = {
            id,
            invoiceNo: id,
            doctorId: 'DOC-1',
            patientId: patientId || 'PAT-1',
            patientName: patientName || 'Demo Patient',
            date: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            status: 'ISSUED',
            items: [{ id: 'ITEM-1', description: 'Consultation', quantity: 1, unitPrice: 500, taxRate: 0, discount: 0, amountPaid: 0 }],
            subTotal: 500,
            discountTotal: 0,
            taxTotal: 0,
            total: 500,
            amountPaid: 0,
            balanceDue: 500
          };
          this.mockInvoices.unshift(created);
          return of(created).pipe(delay(50));
        }
        return of(this.mockInvoices[0]).pipe(delay(50));
      })
    );
  }

  createInvoice(payload: Invoice): Observable<Invoice> {
    if (this.mock) {
      const id = payload.invoiceNo || `INV-${Math.floor(Math.random() * 9000 + 1000)}`;
      const inv: Invoice = { ...payload, id, invoiceNo: id, amountPaid: payload.amountPaid ?? 0 };
      inv.balanceDue = (inv.total || 0) - (inv.amountPaid || 0);
      this.mockInvoices.unshift(inv);
      return of(inv).pipe(delay(150));
    }
    const url = this.apiBase + this.endpoints.invoices;
    return this.http.sendPOSTRequest(url, JSON.stringify(payload)).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          const id = payload.invoiceNo || `INV-${Math.floor(Math.random() * 9000 + 1000)}`;
          const inv: Invoice = { ...payload, id, invoiceNo: id, amountPaid: payload.amountPaid ?? 0 };
          inv.balanceDue = (inv.total || 0) - (inv.amountPaid || 0);
          this.mockInvoices.unshift(inv);
          return of(inv).pipe(delay(80));
        }
        return of(payload as Invoice).pipe(delay(80));
      })
    );
  }

  updateInvoice(id: string, payload: Partial<Invoice>): Observable<Invoice> {
    if (this.mock) {
      const idx = this.mockInvoices.findIndex(i => i.id === id);
      if (idx >= 0) {
        const merged: Invoice = { ...this.mockInvoices[idx], ...payload } as Invoice;
        merged.amountPaid = merged.amountPaid ?? 0;
        merged.balanceDue = (merged.total || 0) - (merged.amountPaid || 0);
        this.mockInvoices[idx] = merged;
        return of(merged).pipe(delay(120));
      }
      return of(this.mockInvoices[0]).pipe(delay(120));
    }
    const url = `${this.apiBase + this.endpoints.invoices}/${id}`;
    return this.http.sendPUTRequest(url, JSON.stringify(payload)).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          const idx = this.mockInvoices.findIndex(i => i.id === id);
          if (idx >= 0) {
            const merged: Invoice = { ...this.mockInvoices[idx], ...payload } as Invoice;
            merged.amountPaid = merged.amountPaid ?? 0;
            merged.balanceDue = (merged.total || 0) - (merged.amountPaid || 0);
            this.mockInvoices[idx] = merged;
            return of(merged).pipe(delay(60));
          }
          return of(this.mockInvoices[0]).pipe(delay(60));
        }
        return of(this.mockInvoices[0]).pipe(delay(60));
      })
    );
  }

  deleteInvoice(id: string): Observable<void> {
    if (this.mock) {
      this.mockInvoices = this.mockInvoices.filter(i => i.id !== id);
      return of(void 0).pipe(delay(100));
    }
    const url = `${this.apiBase + this.endpoints.invoices}/${id}`;
    return this.http.sendDELETERequest(url).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          this.mockInvoices = this.mockInvoices.filter(i => i.id !== id);
          return of(void 0).pipe(delay(60));
        }
        return of(void 0).pipe(delay(60));
      })
    );
  }

  recordPayment(invoiceId: string, payment: PaymentRecord): Observable<Invoice> {
    if (this.mock) {
      return of(this.applyPaymentToMock(invoiceId, payment)).pipe(delay(120));
    }
    const url = this.apiBase + this.endpoints.payments;
    return this.http.sendPOSTRequest(url, JSON.stringify({ ...payment, invoiceId })).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          return of(this.applyPaymentToMock(invoiceId, payment)).pipe(delay(80));
        }
        return of(this.mockInvoices[0]).pipe(delay(80));
      })
    );
  }

  private applyPaymentToMock(invoiceId: string, payment: PaymentRecord): Invoice {
    const idx = this.mockInvoices.findIndex(i => i.id === invoiceId);
    if (idx < 0) return this.mockInvoices[0];
    const inv = { ...this.mockInvoices[idx] } as Invoice;
    inv.amountPaid = (inv.amountPaid || 0) + payment.amount;
    inv.balanceDue = (inv.total || 0) - (inv.amountPaid || 0);
    if (inv.balanceDue <= 0) inv.status = 'PAID';
    else if (inv.amountPaid) inv.status = 'PARTIALLY_PAID';
    this.mockInvoices[idx] = inv;
    this.mockPayments.unshift({
      ...payment,
      id: payment.id || `PAY-${Date.now()}`,
      invoiceId,
      date: payment.date || new Date().toISOString()
    });
    return inv;
  }

  listPayments(params?: Record<string, any>): Observable<PaymentRecord[]> {
    if (this.mock) {
      return of(this.filterPayments(params)).pipe(delay(150));
    }
    const url = this.apiBase + this.endpoints.payments;
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.http.sendGETRequest(url + query).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          return of(this.filterPayments(params)).pipe(delay(80));
        }
        return of([] as PaymentRecord[]).pipe(delay(80));
      })
    );
  }

  private filterPayments(params?: Record<string, any>): PaymentRecord[] {
    const invoiceId = params?.['invoiceId'];
    const patientId = params?.['patientId'];
    let rows = this.mockPayments.slice();
    if (invoiceId) rows = rows.filter(p => p.invoiceId === invoiceId);
    if (patientId) {
      const invoiceIds = new Set(this.mockInvoices.filter(i => i.patientId === patientId).map(i => i.id));
      rows = rows.filter(p => invoiceIds.has(p.invoiceId));
    }
    return rows;
  }

  downloadInvoicePdf(id: string): Observable<any> {
    if (this.mock) return of({ ok: true }).pipe(delay(80));
    const url = `${this.apiBase + this.endpoints.pdf}/${id}`;
    return this.http.downloadFile(url, `invoice-${id}.pdf`);
  }

  /**
   * Returns a hospital-wide billing summary grouped by doctor.
   * Falls back to computing from mock invoices when the backend is unavailable.
   */
  getHospitalSummary(params?: Record<string, any>): Observable<HospitalBillingSummary> {
    if (this.mock) {
      return of(this.computeHospitalSummary(this.mockInvoices.slice())).pipe(delay(150));
    }
    const url = `${this.apiBase}${this.endpoints.summary}/hospital`;
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.http.sendGETRequest(url + query).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          const rows = this.applyFilters(this.mockInvoices.slice(), params);
          return of(this.computeHospitalSummary(rows)).pipe(delay(80));
        }
        return of(this.computeHospitalSummary([]));
      })
    );
  }

  private computeHospitalSummary(invoices: Invoice[]): HospitalBillingSummary {
    const today = new Date();
    const doctorMap = new Map<string, DoctorBillingSummary & { _patients: Set<string> }>();
    const allPatients = new Set<string>();

    for (const inv of invoices) {
      const doctorId = (inv.doctorId || 'UNASSIGNED').toString();
      const doctorName = resolveDoctorName(inv.doctorId);
      const total = Number(inv.total) || 0;
      const paid = Number(inv.amountPaid) || 0;
      const balance = Math.max(total - paid, 0);
      const isOverdue = inv.status !== 'PAID' && !!inv.dueDate && new Date(inv.dueDate) < today && balance > 0;

      allPatients.add(inv.patientId);

      const existing = doctorMap.get(doctorId) ?? {
        doctorId, doctorName, patientCount: 0, invoiceCount: 0,
        totalBilled: 0, totalPaid: 0, totalOutstanding: 0, overdue: 0,
        _patients: new Set<string>()
      };

      existing._patients.add(inv.patientId);
      existing.invoiceCount++;
      existing.totalBilled += total;
      existing.totalPaid += paid;
      existing.totalOutstanding += balance;
      if (isOverdue) existing.overdue += balance;
      doctorMap.set(doctorId, existing);
    }

    const byDoctor: DoctorBillingSummary[] = Array.from(doctorMap.values()).map(({ _patients, ...row }) => ({
      ...row,
      patientCount: _patients.size
    }));

    return {
      totalBilled: invoices.reduce((s, i) => s + (i.total || 0), 0),
      totalPaid: invoices.reduce((s, i) => s + (i.amountPaid || 0), 0),
      totalOutstanding: invoices.reduce((s, i) => s + Math.max((i.total || 0) - (i.amountPaid || 0), 0), 0),
      overdue: invoices.filter(i => i.status !== 'PAID' && !!i.dueDate && new Date(i.dueDate) < today)
                       .reduce((s, i) => s + Math.max((i.total || 0) - (i.amountPaid || 0), 0), 0),
      totalPatients: allPatients.size,
      totalInvoices: invoices.length,
      byDoctor
    };
  }

  private applyFilters(rows: Invoice[], params?: Record<string, any>): Invoice[] {
    if (!params) return rows;
    const patientId = (params['patientId'] || '').toString();
    const doctorId = (params['doctorId'] || '').toString();
    const q = (params['q'] || '').toString().toLowerCase();
    const status = (params['status'] || '').toString();
    const from = params['from'] ? new Date(params['from']) : null;
    const to = params['to'] ? new Date(params['to']) : null;
    return rows.filter(r => {
      const matchesPatient = !patientId || r.patientId === patientId;
      const matchesDoctor = !doctorId || r.doctorId === doctorId;
      const matchesQ = !q || r.invoiceNo.toLowerCase().includes(q) || r.patientName.toLowerCase().includes(q);
      const matchesStatus = !status || r.status === status;
      const d = new Date(r.date);
      const matchesFrom = !from || d >= from;
      const matchesTo = !to || d <= to;
      return matchesPatient && matchesDoctor && matchesQ && matchesStatus && matchesFrom && matchesTo;
    });
  }
}
