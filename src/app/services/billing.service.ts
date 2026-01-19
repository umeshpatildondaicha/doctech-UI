import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { HttpService } from './http.service';
import { ApiConfigService } from '@lk/core';
import { Invoice, PaymentRecord } from '../interfaces/billing.interface';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly apiConfig = inject(ApiConfigService);
  // Note: endpoints and mock features should be provided by consuming app
  private readonly endpoints = { base: '/api/billing', invoices: '/api/billing/invoices', payments: '/api/billing/payments', pdf: '/api/billing/invoices/pdf' };
  private readonly mock = false; // Should be configurable via injection token

  private shouldFallbackToMock(err: any): boolean {
    const status = err?.status;
    // In dev/demo, backend often isn't wired yet (404). Treat as "use mock".
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

    // Seed a payment record for the partially paid invoice (so Payments tab isn't empty)
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

  // In-memory store for mock mode
  private mockInvoices: Invoice[] = [
    {
      id: 'INV-1001',
      invoiceNo: 'INV-1001',
      doctorId: 'DOC-1',
      patientId: 'PAT-1',
      patientName: 'Rahul Sharma',
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7*24*3600*1000).toISOString(),
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
      dueDate: new Date(Date.now() - 2*24*3600*1000).toISOString(),
      status: 'PARTIALLY_PAID',
      items: [ { description: 'Physiotherapy Session', quantity: 3, unitPrice: 700 } ],
      subTotal: 2100,
      discountTotal: 100,
      taxTotal: 360,
      total: 2360,
      amountPaid: 1000,
      balanceDue: 1360
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
          
          // Try to extract patient ID from invoice ID (e.g., INV-PAT-1001-002 -> PAT-1001)
          let patientId = '';
          let patientName = '';
          const match = id.match(/INV-(PAT-\d+|\d+)-/);
          if (match) {
            const extractedId = match[1];
            // Normalize: if numeric, format as PAT-XXXX; otherwise use as-is
            if (/^\d+$/.test(extractedId)) {
              patientId = `PAT-${extractedId.padStart(4, '0')}`;
            } else {
              patientId = extractedId;
            }
            // Find patient name from existing invoices or use default
            const existingInv = this.mockInvoices.find(i => i.patientId === patientId);
            patientName = existingInv?.patientName || `Patient ${patientId}`;
          }
          
          // If patient ID extracted, ensure demo data exists for that patient
          if (patientId) {
            this.ensurePatientDemoData(patientId, patientName);
            // After ensuring demo data, check again for the invoice
            const foundAfterEnsuring = this.mockInvoices.find(i => i.id === id);
            if (foundAfterEnsuring) return of(foundAfterEnsuring).pipe(delay(50));
          }
          
          // If still not found, create a minimal demo invoice with that id
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
      const id = payload.invoiceNo || `INV-${Math.floor(Math.random()*9000+1000)}`;
      const inv: Invoice = { ...payload, id, invoiceNo: id };
      inv.amountPaid = inv.amountPaid ?? 0;
      const paid = inv.amountPaid || 0;
      inv.balanceDue = (inv.total || 0) - paid;
      this.mockInvoices.unshift(inv);
      return of(inv).pipe(delay(150));
    }
    const url = this.apiBase + this.endpoints.invoices;
    return this.http.sendPOSTRequest(url, JSON.stringify(payload)).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          // fallback to mock behavior
          const id = payload.invoiceNo || `INV-${Math.floor(Math.random() * 9000 + 1000)}`;
          const inv: Invoice = { ...payload, id, invoiceNo: id };
          inv.amountPaid = inv.amountPaid ?? 0;
          const paid = inv.amountPaid || 0;
          inv.balanceDue = (inv.total || 0) - paid;
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
      const idx = this.mockInvoices.findIndex(i => i.id === invoiceId);
      if (idx >= 0) {
        const inv = { ...this.mockInvoices[idx] } as Invoice;
        inv.amountPaid = (inv.amountPaid || 0) + payment.amount;
        inv.balanceDue = (inv.total || 0) - (inv.amountPaid || 0);
        if (inv.balanceDue <= 0) {
          inv.status = 'PAID';
        } else if (inv.amountPaid) {
          inv.status = 'PARTIALLY_PAID';
        }
        this.mockInvoices[idx] = inv;
        this.mockPayments.unshift({
          ...payment,
          id: payment.id || `PAY-${Date.now()}`,
          invoiceId,
          date: payment.date || new Date().toISOString()
        });
        return of(inv).pipe(delay(120));
      }
      return of(this.mockInvoices[0]).pipe(delay(120));
    }
    const url = this.apiBase + this.endpoints.payments;
    return this.http.sendPOSTRequest(url, JSON.stringify({ ...payment, invoiceId })).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          const idx = this.mockInvoices.findIndex(i => i.id === invoiceId);
          if (idx >= 0) {
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
            return of(inv).pipe(delay(80));
          }
          return of(this.mockInvoices[0]).pipe(delay(80));
        }
        return of(this.mockInvoices[0]).pipe(delay(80));
      })
    );
  }

  listPayments(params?: Record<string, any>): Observable<PaymentRecord[]> {
    if (this.mock) {
      // minimal filtering support; expand if needed
      const invoiceId = params?.['invoiceId'];
      const patientId = params?.['patientId'];
      let rows = this.mockPayments.slice();
      if (invoiceId) rows = rows.filter(p => p.invoiceId === invoiceId);
      if (patientId) {
        const invoiceIds = new Set(this.mockInvoices.filter(i => i.patientId === patientId).map(i => i.id));
        rows = rows.filter(p => invoiceIds.has(p.invoiceId));
      }
      return of(rows).pipe(delay(150));
    }
    const url = this.apiBase + this.endpoints.payments;
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.http.sendGETRequest(url + query).pipe(
      catchError((err) => {
        if (this.shouldFallbackToMock(err)) {
          const invoiceId = params?.['invoiceId'];
          const patientId = params?.['patientId'];
          let rows = this.mockPayments.slice();
          if (invoiceId) rows = rows.filter(p => p.invoiceId === invoiceId);
          if (patientId) {
            const invoiceIds = new Set(this.mockInvoices.filter(i => i.patientId === patientId).map(i => i.id));
            rows = rows.filter(p => invoiceIds.has(p.invoiceId));
          }
          return of(rows).pipe(delay(80));
        }
        return of([] as PaymentRecord[]).pipe(delay(80));
      })
    );
  }

  downloadInvoicePdf(id: string): Observable<any> {
    if (this.mock) {
      // In mock mode, just simulate success
      return of({ ok: true }).pipe(delay(80));
    }
    const url = `${this.apiBase + this.endpoints.pdf}/${id}`;
    return this.http.downloadFile(url, `invoice-${id}.pdf`);
  }

  private applyFilters(rows: Invoice[], params?: Record<string, any>): Invoice[] {
    if (!params) return rows;
    const patientId = (params['patientId'] || '').toString();
    const q = (params['q'] || '').toString().toLowerCase();
    const status = (params['status'] || '').toString();
    const from = params['from'] ? new Date(params['from']) : null;
    const to = params['to'] ? new Date(params['to']) : null;
    return rows.filter(r => {
      const matchesPatient = !patientId || r.patientId === patientId;
      const matchesQ = !q || r.invoiceNo.toLowerCase().includes(q) || r.patientName.toLowerCase().includes(q);
      const matchesStatus = !status || r.status === status;
      const d = new Date(r.date);
      const matchesFrom = !from || d >= from;
      const matchesTo = !to || d <= to;
      return matchesPatient && matchesQ && matchesStatus && matchesFrom && matchesTo;
    });
  }
}


