export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'VOID';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number; // percentage (e.g., 18 for 18%)
  discount?: number; // absolute amount per line
  amountPaid?: number; // amount paid for this specific item
  balanceDue?: number; // remaining balance for this item
}

export interface PaymentRecord {
  id?: string;
  invoiceId: string;
  itemId?: string; // Optional: if payment is for specific item
  amount: number;
  method: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'OTHER';
  reference?: string;
  date: string; // ISO date
  notes?: string;
}

export interface Invoice {
  id?: string;
  invoiceNo: string;
  doctorId?: string;
  patientId: string;
  patientName: string;
  date: string; // ISO date
  dueDate?: string; // ISO date
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

// Backward-compatible minimal alias
export interface Billing {
  invoiceNo: string;
  patientName: string;
  amount: number;
  date: string;
  status: string;
}
