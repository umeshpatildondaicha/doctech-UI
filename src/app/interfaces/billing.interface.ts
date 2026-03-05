export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'VOID';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;     // percentage (e.g., 18 for 18%)
  discount?: number;    // absolute discount amount per line item
  amountPaid?: number;  // amount paid for this specific item
  balanceDue?: number;  // remaining balance for this item
}

export interface PaymentRecord {
  id?: string;
  invoiceId: string;
  itemId?: string;      // Optional: payment scoped to a specific line item
  amount: number;
  method: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'OTHER';
  reference?: string;
  date: string;         // ISO date
  notes?: string;
}

export interface Invoice {
  id?: string;
  invoiceNo: string;
  doctorId?: string;
  patientId: string;
  patientName: string;
  date: string;         // ISO date
  dueDate?: string;     // ISO date
  status: InvoiceStatus;
  items: InvoiceItem[];
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  notes?: string;
}

/**
 * Aggregated billing summary for a single doctor.
 * Used in HOSPITAL admin view to show revenue breakdown by doctor.
 */
export interface DoctorBillingSummary {
  doctorId: string;
  doctorName: string;
  patientCount: number;
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  overdue: number;
}

/**
 * Hospital-wide billing summary across all doctors and patients.
 * Used in HOSPITAL admin billing dashboard.
 */
export interface HospitalBillingSummary {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  overdue: number;
  totalPatients: number;
  totalInvoices: number;
  byDoctor: DoctorBillingSummary[];
}

/** Backward-compatible minimal alias — prefer Invoice for new code. */
export interface Billing {
  invoiceNo: string;
  patientName: string;
  amount: number;
  date: string;
  status: string;
}
