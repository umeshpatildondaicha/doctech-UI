export interface MedicineRequest {
  id: string;
  patientId: string;
  patientName: string;
  requestedBy: string; // Patient, relative, or staff member
  requestedById: string;
  requestedByRole: 'PATIENT' | 'RELATIVE' | 'NURSE' | 'DOCTOR';
  requestDate: Date;
  requestTime: Date;
  medicineName: string;
  dosage: string;
  frequency: string;
  route: string; // Oral, IV, IM, etc.
  quantity: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  reason: string;
  currentSymptoms?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPENSED' | 'CANCELLED';
  approvedBy?: string;
  approvedById?: string;
  approvedDate?: Date;
  rejectionReason?: string;
  dispensedBy?: string;
  dispensedDate?: Date;
  notes?: string;
  isPrescriptionRequired: boolean;
  prescriptionId?: string;
  pharmacyNotes?: string;
  cost?: number;
  insuranceCovered?: boolean;
}

export interface MedicineInventory {
  id: string;
  medicineName: string;
  genericName: string;
  dosage: string;
  form: string; // Tablet, Syrup, Injection, etc.
  manufacturer: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  unitPrice: number;
  category: 'ANTIBIOTIC' | 'ANALGESIC' | 'ANTIHYPERTENSIVE' | 'ANTIDIABETIC' | 'CARDIAC' | 'RESPIRATORY' | 'GASTROINTESTINAL' | 'OTHER';
  isControlled: boolean;
  requiresPrescription: boolean;
  sideEffects: string[];
  contraindications: string[];
  storageConditions: string;
  lastRestocked: Date;
  minimumStock: number;
  isAvailable: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  prescriptionDate: Date;
  medications: {
    medicineName: string;
    dosage: string;
    frequency: string;
    route: string;
    duration: string;
    quantity: number;
    instructions: string;
    isSubstitutable: boolean;
  }[];
  diagnosis: string[];
  notes: string;
  followUpDate?: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pharmacyNotes?: string;
  totalCost?: number;
}

export interface MedicineRequestStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  dispensedRequests: number;
  urgentRequests: number;
  averageApprovalTime: number; // in minutes
  mostRequestedMedicines: {
    medicineName: string;
    requestCount: number;
  }[];
}

