import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import { ApiConfigService } from '@lk/core';
import { Invoice, PaymentRecord, HospitalBillingSummary, InvoiceResponse } from '../interfaces/billing.interface';
import type { InvoiceStatus } from '../interfaces/billing.interface';

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

  private get apiBase(): string {
    return this.apiConfig.getApiUrl();
  }

  private mapResponseToInvoice(r: InvoiceResponse): Invoice {
    const id = String(r.id);
    const total = r.totalAmount ?? 0;
    const amountPaid = r.amountPaid ?? 0;
    const balanceDue = r.balanceDue ?? Math.max(total - amountPaid, 0);
    const status = (r.status || 'ISSUED') as InvoiceStatus;
    return {
      id,
      invoiceNo: r.invoiceNumber ?? id,
      doctorId: r.doctorId,
      patientId: r.patientId,
      patientName: r.patientName ?? `Patient ${r.patientId}`,
      date: r.date ?? new Date().toISOString(),
      dueDate: r.dueDate,
      status,
      items: r.items ?? [{ description: 'Charges', quantity: 1, unitPrice: total, taxRate: 0, discount: 0 }],
      subTotal: r.subTotal ?? 0,
      taxTotal: r.taxTotal ?? 0,
      discountTotal: r.discountTotal ?? 0,
      total,
      amountPaid,
      balanceDue
    };
  }

  constructor(private readonly http: HttpService) {}

  /** GET invoices for hospital (optional patient filter). API only. */
  listInvoices(hospitalId: string, patientId?: string): Observable<Invoice[]> {
    let url = `${this.apiBase}/api/billing/invoices?hospitalId=${encodeURIComponent(hospitalId)}`;
    if (patientId) {
      url += `&patientId=${encodeURIComponent(patientId)}`;
    }
    return this.http.sendGETRequest(url).pipe(
      map((res: InvoiceResponse[] | { data: InvoiceResponse[] }) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return (list as InvoiceResponse[]).map(r => this.mapResponseToInvoice(r));
      })
    );
  }

  getInvoice(id: string): Observable<Invoice> {
    const url = `${this.apiBase + this.endpoints.invoices}/${id}`;
    return this.http.sendGETRequest(url).pipe(
      map((res: InvoiceResponse) => this.mapResponseToInvoice(res))
    );
  }

  createInvoice(payload: Invoice): Observable<Invoice> {
    const url = this.apiBase + this.endpoints.invoices;
    return this.http.sendPOSTRequest(url, JSON.stringify(payload)).pipe(
      map((res: InvoiceResponse) => this.mapResponseToInvoice(res))
    );
  }

  updateInvoice(id: string, payload: Partial<Invoice>): Observable<Invoice> {
    const url = `${this.apiBase + this.endpoints.invoices}/${id}`;
    return this.http.sendPUTRequest(url, JSON.stringify(payload)).pipe(
      map((res: InvoiceResponse) => this.mapResponseToInvoice(res))
    );
  }

  deleteInvoice(id: string): Observable<void> {
    const url = `${this.apiBase + this.endpoints.invoices}/${id}`;
    return this.http.sendDELETERequest(url).pipe(map(() => undefined));
  }

  /** Record payment. Accepts PaymentRecord (dialog result) or (amount, method). API only. */
  recordPayment(invoiceId: string, payment: PaymentRecord): Observable<unknown>;
  recordPayment(invoiceId: string, amount: number, method: string): Observable<unknown>;
  recordPayment(invoiceId: string, paymentOrAmount: PaymentRecord | number, method?: string): Observable<unknown> {
    const amount = typeof paymentOrAmount === 'object' ? paymentOrAmount.amount : paymentOrAmount;
    const methodStr = typeof paymentOrAmount === 'object' ? paymentOrAmount.method : (method ?? 'CASH');
    const url = `${this.apiBase}/api/billing/payments?invoiceId=${encodeURIComponent(invoiceId)}`;
    return this.http.sendPOSTRequest(url, JSON.stringify({ amount, method: methodStr }));
  }

  /** GET payments for an invoice. API only. */
  listPayments(invoiceId: string): Observable<PaymentRecord[]> {
    const url = `${this.apiBase}/api/billing/payments?invoiceId=${encodeURIComponent(invoiceId)}`;
    return this.http.sendGETRequest(url).pipe(
      map((res: PaymentRecord[] | { data: PaymentRecord[] }) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return list as PaymentRecord[];
      })
    );
  }

  downloadInvoicePdf(id: string): Observable<unknown> {
    const url = `${this.apiBase + this.endpoints.pdf}/${id}`;
    return this.http.downloadFile(url, `invoice-${id}.pdf`);
  }

  /** GET hospital billing summary. API only. */
  getHospitalSummary(hospitalId: string): Observable<HospitalBillingSummary | HospitalBillingSummary[]> {
    const url = `${this.apiBase}/api/billing/summary/hospital?hospitalId=${encodeURIComponent(hospitalId)}`;
    return this.http.sendGETRequest(url).pipe(
      map((res: HospitalBillingSummary | HospitalBillingSummary[] | { data: HospitalBillingSummary[] }) => {
        const normalizeOne = (r: any): HospitalBillingSummary => {
          const totalBilled = Number(r?.totalBilled) || 0;
          const totalCollected = Number(r?.totalCollected) || Number(r?.totalPaid) || 0;
          const totalOutstanding = Number(r?.totalOutstanding) || 0;
          const totalOverdue = Number(r?.totalOverdue) || Number(r?.overdue) || 0;
          return {
            totalBilled,
            totalPaid: totalCollected,
            totalCollected,
            totalOutstanding,
            overdue: totalOverdue,
            totalOverdue,
            totalPatients: Number(r?.totalPatients) || 0,
            totalInvoices: Number(r?.totalInvoices) || 0,
            byDoctor: Array.isArray(r?.byDoctor) ? r.byDoctor : []
          };
        };

        if (Array.isArray(res)) return res.map(normalizeOne);
        if (res && typeof res === 'object' && 'data' in res) return (res as { data: HospitalBillingSummary[] }).data.map(normalizeOne);
        return normalizeOne(res);
      })
    );
  }
}
