import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateInvoiceRequest,
  Invoice,
  InvoiceResponse,
  InvoiceStatus
} from '../interfaces/billing.interface';

/** Raw API response for summary/by-patient (field names may vary). */
export interface PatientBillingSummaryResponse {
  patientId?: string;
  patientName?: string;
  invoiceCount?: number;
  invoicesCount?: number;
  totalBilled?: number;
  totalPaid?: number;
  totalCollected?: number;
  totalOutstanding?: number;
  overdue?: number;
  lastInvoiceDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BillingservicesService {
  private baseUrl = `${environment.apiUrl}/api/billing`;

  constructor(private http: HttpClient) {}
  doctorId:string ="DR1";

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`
    });
  }

  /**
   * Map API response to app Invoice shape so UI and grids work correctly.
   */
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

  /**
   * Extract numeric ID for APIs that expect patientId as number.
   * Handles "P015" -> 15, "PAT-1001" -> 1001, "15" -> 15.
   */
  private parseNumericId(value: string | undefined): number | null {
    if (value == null || value === '') return null;
    const s = String(value).trim();
    const num = parseInt(s, 10);
    if (!Number.isNaN(num) && String(num) === s) return num;
    const match = s.match(/^P(\d+)$/i) || s.match(/^PAT-?(\d+)$/i) || s.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  /** Create invoice (POST). Returns mapped Invoice for consistency. */
  createInvoice(data: CreateInvoiceRequest): Observable<Invoice> {
    const patientIdNum = this.parseNumericId(data.patientId);
    const body = {
      hospitalId: data.hospitalId,
      patientId: patientIdNum !== null ? patientIdNum : data.patientId,
      doctorId: data.doctorId,
      dueDate: data.dueDate,
      items: data.items,
      notes: data.notes
    };
    return this.http.post<InvoiceResponse>(
      `${this.baseUrl}/invoices`,
      body,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => this.mapResponseToInvoice(res))
    );
  }

  /**
   * Get invoices (GET). Returns Invoice[] for UI.
   * Handles response as array or { data: array }.
   */
  getInvoices(hospitalId: string): Observable<Invoice[]> {
    const url = `${this.baseUrl}/invoices?hospitalId=${encodeURIComponent(hospitalId)}`;
    return this.http.get<InvoiceResponse[] | { data: InvoiceResponse[] }>(
      url,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return (list as InvoiceResponse[]).map(r => this.mapResponseToInvoice(r));
      })
    );
  }
  /**
   * GET patient billing summary per hospital.
   * Returns rows shaped for the billing grid: patientId, patientName, invoicesCount, totalBilled, totalCollected, totalOutstanding, overdue, lastInvoiceDate.
   */
  getPatientsBillingSummary(hospitalId: string): Observable<PatientBillingSummaryRow[]> {
    const url = `${this.baseUrl}/summary/by-patient?hospitalId=${encodeURIComponent(hospitalId)}`;
    return this.http.get<PatientBillingSummaryResponse[] | { data: PatientBillingSummaryResponse[] }>(
      url,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return (list as PatientBillingSummaryResponse[]).map(r => ({
          patientId: r.patientId ?? '',
          patientName: (r.patientName && r.patientName.trim()) ? r.patientName.trim() : `patient ${r.patientId ?? ''}`,
          invoicesCount: r.invoiceCount ?? r.invoicesCount ?? 0,
          totalBilled: Number(r.totalBilled) || 0,
          totalCollected: Number(r.totalPaid) || Number(r.totalCollected) || 0,
          totalOutstanding: Number(r.totalOutstanding) || 0,
          overdue: Number(r.overdue) || 0,
          lastInvoiceDate: r.lastInvoiceDate ?? undefined
        }));
      })
    );
  }
}

/** Row shape for billing grid (matches columnDefs). */
export interface PatientBillingSummaryRow {
  patientId: string;
  patientName: string;
  invoicesCount: number;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  overdue: number;
  lastInvoiceDate?: string;
}
