import { Component, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Invoice } from '../../interfaces/billing.interface';
import { AppButtonComponent } from '@lk/core';

export interface InvoicePreviewData {
  invoice: Invoice;
  isStatement?: boolean;
  doctor?: {
    name?: string;
    credentials?: string;
    registration?: string;
    contact?: {
      phone?: string;
      email?: string;
    };
    clinic?: {
      name?: string;
      tagline?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      logoUrl?: string;
    };
  };
  clinic?: {
    name?: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
  };
}

@Component({
    selector: 'app-invoice-preview-dialog',
    imports: [CommonModule, MatDialogModule,AppButtonComponent, MatButtonModule, MatIconModule, MatTooltipModule, DatePipe, CurrencyPipe],
    templateUrl: './invoice-preview-dialog.component.html',
    styleUrl: './invoice-preview-dialog.component.scss'
})
export class InvoicePreviewDialogComponent {
  @ViewChild('printContent', { static: false }) private readonly printContent?: ElementRef<HTMLElement>;

  constructor(
    private readonly dialogRef: MatDialogRef<InvoicePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvoicePreviewData
  ) {}

  print(): void {
    const sourceEl = this.printContent?.nativeElement;
    if (!sourceEl) {
      // Nothing to print
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const iframeWin = iframe.contentWindow;
    if (!iframeWin) {
      iframe.remove();
      return;
    }

    const doc = iframeWin.document;
    this.populatePrintDocument(doc, sourceEl.innerHTML);

    const finalizePrint = () => {
      try {
        iframeWin.focus();
        iframeWin.print();
      } finally {
        setTimeout(() => iframe.remove(), 100);
      }
    };

    if (doc.readyState === 'complete') {
      finalizePrint();
    } else {
      iframe.onload = finalizePrint;
    }
  }

  downloadPdf(): void {
    // Trigger print which can be saved as PDF
    this.print();
  }

  close(): void {
    this.dialogRef.close();
  }

  private buildPrintStyles(): string {
    return `
      *, *::before, *::after { box-sizing: border-box; }
      html, body { height: 100%; margin: 0; padding: 0; }
      body { background: #ffffff; color: #111827; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.55; font-size: 13px; padding: 10mm 12mm; }
      h1, h2, h3, h4, h5, h6 { margin: 0; }
      p { margin: 0; }
      table { border-collapse: collapse; width: 100%; }
      th, td { vertical-align: top; }
      .print-container { max-width: 210mm; margin: 0 auto; display: block; width: 100%; }

      .print-header { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; border-bottom: 1.5px solid #d8dee6; padding-bottom: 14px; margin-bottom: 16px; align-items: center; }
      .header-left { display: flex; align-items: center; }
      .hospital-logo { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; margin: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; font-weight: 700; font-size: 22px; text-transform: uppercase; }
      .hospital-logo img { width: 100%; height: 100%; object-fit: cover; }
      .hospital-logo.fallback { border: 2px solid rgba(59, 130, 246, 0.2); }

      .header-center { display: flex; flex-direction: column; justify-content: center; gap: 4px; }
      .clinic-name { font-size: 20px; font-weight: 700; letter-spacing: -0.2px; color: #0f172a; }
      .clinic-tagline { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #6366f1; font-weight: 600; }
      .clinic-contact { font-size: 11px; color: #475569; display: flex; flex-wrap: wrap; gap: 4px; line-height: 1.4; }

      .header-right { display: flex; flex-direction: column; justify-content: center; gap: 3px; text-align: right; }
      .doctor-name { font-size: 14px; font-weight: 700; color: #0f172a; }
      .doctor-line { font-size: 11px; color: #475569; }

      .invoice-details-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid #e5e7eb; }
      .section-heading { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; font-weight: 700; }
      .bill-to-content .patient-name { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
      .bill-to-content .patient-id { font-size: 13px; color: #475569; }
      .invoice-meta-section { display: flex; flex-direction: column; gap: 10px; }
      .meta-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
      .meta-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 600; }
      .meta-value { font-size: 14px; font-weight: 600; color: #0f172a; }
      .status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; background: #f3f4f6; font-size: 12px; font-weight: 700; text-transform: capitalize; color: #1f2937; }
      .status-badge.paid { background: #dcfce7; color: #166534; border: 1px solid rgba(22,101,52,0.35); }

      .items-section { margin-top: 6px; }
      .invoice-table { width: 100%; border: 1px solid #e5e7eb; margin-bottom: 16px; }
      .invoice-table thead th { background: #f8fafc; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px; border-bottom: 1px solid #e5e7eb; color: #475569; }
      .invoice-table tbody td { padding: 10px; border-bottom: 1px solid #eef2f8; font-size: 12.5px; color: #1f2937; }
      .invoice-table tbody tr:last-child td { border-bottom: none; }
      .invoice-table .right { text-align: right; }
      .invoice-table .col-qty, .invoice-table .col-tax { text-align: center; }

      .totals-section { display: flex; justify-content: flex-end; margin-top: 8px; }
      .totals-table { width: 280px; border-top: 2px solid #e5e7eb; padding-top: 8px; }
      .total-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 12.5px; }
      .total-label { color: #64748b; font-weight: 600; }
      .total-amount { color: #0f172a; font-weight: 700; }
      .total-amount.paid-amount { color: #0f766e; }
      .total-amount.outstanding { color: #dc2626; }
      .total-row.grand-total { border-top: 2px solid #e5e7eb; margin-top: 6px; padding-top: 8px; }
      .total-row.grand-total .total-label { font-size: 14px; font-weight: 700; color: #0f172a; }
      .total-row.grand-total .total-amount { font-size: 19px; font-weight: 800; letter-spacing: -0.3px; }
      .balance-row { border-top: 1px solid #e5e7eb; margin-top: 4px; padding-top: 5px; }

      .notes-section { margin-top: 18px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
      .notes-section .section-heading { margin-bottom: 4px; }
      .notes-text { font-size: 12.5px; line-height: 1.55; color: #374151; }

      @page { size: A4 portrait; margin: 12mm; }
      @media print {
        .no-print { display: none !important; }
        thead { display: table-header-group; }
        tbody { display: table-row-group; }
        tr, img { page-break-inside: avoid; break-inside: avoid; }
        .print-container { page-break-inside: avoid; }
      }
    `.trim();
  }

  private populatePrintDocument(targetDoc: Document, contentHtml: string): void {
    const title = `${this.data.isStatement ? 'Statement' : 'Invoice'} — ${this.data.invoice?.patientName ?? ''}`;
    const styles = this.buildPrintStyles();

    const templateDoc = document.implementation.createHTMLDocument(title);
    const styleEl = templateDoc.createElement('style');
    styleEl.textContent = styles;
    templateDoc.head.appendChild(styleEl);
    const container = templateDoc.createElement('div');
    container.classList.add('print-container');
    container.innerHTML = contentHtml;
    templateDoc.body.innerHTML = '';
    templateDoc.body.appendChild(container);

    const importedHtml = targetDoc.importNode(templateDoc.documentElement, true);
    const importedDoctype = templateDoc.doctype ? targetDoc.importNode(templateDoc.doctype, true) : null;

    while (targetDoc.firstChild) {
      targetDoc.firstChild.remove();
    }

    if (importedDoctype) {
      targetDoc.appendChild(importedDoctype);
    }
    targetDoc.appendChild(importedHtml);
  }
}


