export interface PatientRound {
  id: string;
  patientId: string;
  roundType: 'DOCTOR_ROUND' | 'NURSE_ROUND' | 'CLEANING_ROUND' | 'DIET_ROUND' | 'PHYSIOTHERAPY_ROUND';
  performedBy: string;
  performedById: string;
  performedByRole: 'DOCTOR' | 'NURSE' | 'CLEANING_STAFF' | 'DIETICIAN' | 'PHYSIOTHERAPIST';
  roundDate: Date;
  roundTime: Date;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes: string;
  observations: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    painLevel?: number; // 1-10 scale
  };
  medications?: {
    medicationName: string;
    dosage: string;
    route: string;
    time: Date;
    status: 'GIVEN' | 'REFUSED' | 'NOT_AVAILABLE';
    notes?: string;
  }[];
  careInstructions: string[];
  nextRoundScheduled?: Date;
  isCritical: boolean;
  requiresFollowUp: boolean;
  followUpNotes?: string;
}

export interface RoundSchedule {
  id: string;
  patientId: string;
  roundType: 'DOCTOR_ROUND' | 'NURSE_ROUND' | 'CLEANING_ROUND' | 'DIET_ROUND' | 'PHYSIOTHERAPY_ROUND';
  scheduledTime: Date;
  frequency: 'ONCE' | 'DAILY' | 'TWICE_DAILY' | 'EVERY_4_HOURS' | 'EVERY_6_HOURS' | 'WEEKLY';
  assignedTo: string;
  assignedToId: string;
  assignedToRole: 'DOCTOR' | 'NURSE' | 'CLEANING_STAFF' | 'DIETICIAN' | 'PHYSIOTHERAPIST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isActive: boolean;
  createdBy: string;
  createdDate: Date;
  lastPerformed?: Date;
  nextScheduled?: Date;
}

export interface RoundTemplate {
  id: string;
  name: string;
  roundType: 'DOCTOR_ROUND' | 'NURSE_ROUND' | 'CLEANING_ROUND' | 'DIET_ROUND' | 'PHYSIOTHERAPY_ROUND';
  department: string;
  defaultFrequency: 'ONCE' | 'DAILY' | 'TWICE_DAILY' | 'EVERY_4_HOURS' | 'EVERY_6_HOURS' | 'WEEKLY';
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  checklist: {
    item: string;
    isRequired: boolean;
    category: 'VITALS' | 'MEDICATION' | 'CARE' | 'OBSERVATION' | 'DOCUMENTATION';
  }[];
  notes: string;
  isActive: boolean;
}

