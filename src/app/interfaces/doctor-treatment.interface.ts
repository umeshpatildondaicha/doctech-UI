export interface DoctorTreatmentDashboard {
  doctorId: string;
  doctorName: string;
  department: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'ON_CALL';
  totalPatients: number;
  criticalPatients: number;
  newAdmissions: number;
  pendingDischarges: number;
  urgentTasks: number;
  lastLogin: Date;
  currentLocation: string; // Ward/Floor they're currently on
}

export interface AdmittedPatient {
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  admissionDate: Date;
  admissionTime: Date;
  ward: string;
  room: string;
  bed: string;
  floor: string;
  primaryDiagnosis: string[];
  secondaryDiagnosis?: string[];
  attendingDoctor: string;
  attendingDoctorId: string;
  currentStatus: 'STABLE' | 'CRITICAL' | 'IMPROVING' | 'DETERIORATING' | 'RECOVERING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastVitalCheck: Date;
  lastDoctorRound: Date;
  nextScheduledRound?: Date;
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    painLevel: number;
    isAbnormal: boolean;
  };
  medications: {
    medicationName: string;
    dosage: string;
    frequency: string;
    nextDue: Date;
    status: 'ACTIVE' | 'DISCONTINUED' | 'PENDING';
  }[];
  pendingTests: {
    testName: string;
    scheduledDate: Date;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
    priority: 'ROUTINE' | 'URGENT';
  }[];
  alerts: {
    type: 'CRITICAL_VITALS' | 'MISSED_MEDICATION' | 'ABNORMAL_LAB' | 'FALL_RISK' | 'ALLERGY' | 'INFECTION_RISK';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdAt: Date;
    acknowledged: boolean;
  }[];
  relatives: {
    name: string;
    relationship: string;
    contactNumber: string;
    isEmergencyContact: boolean;
    lastContacted?: Date;
  }[];
  lengthOfStay: number;
  expectedDischarge?: Date;
  dischargeReadiness: 'NOT_READY' | 'ASSESSING' | 'READY' | 'DISCHARGED';
}

export interface DoctorTask {
  id: string;
  patientId: string;
  patientName: string;
  taskType: 'ROUND' | 'CONSULTATION' | 'PROCEDURE' | 'DISCHARGE' | 'EMERGENCY' | 'FOLLOW_UP';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedDate: Date;
  dueDate: Date;
  completedDate?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  location: string; // Ward/Room/Bed
  notes?: string;
  requiresFollowUp: boolean;
  followUpDate?: Date;
  createdBy: string;
  assignedTo: string;
  tags: string[];
}

export interface DoctorRound {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  room: string;
  bed: string;
  roundDate: Date;
  roundTime: Date;
  doctorId: string;
  doctorName: string;
  roundType: 'MORNING_ROUND' | 'EVENING_ROUND' | 'EMERGENCY_ROUND' | 'DISCHARGE_ROUND';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  duration: number; // in minutes
  findings: {
    generalCondition: string;
    vitalSigns: {
      bloodPressure: string;
      heartRate: number;
      temperature: number;
      respiratoryRate: number;
      oxygenSaturation: number;
      painLevel: number;
    };
    physicalExamination: string;
    mentalStatus: string;
    mobility: string;
    nutrition: string;
    hygiene: string;
  };
  assessment: {
    diagnosis: string[];
    complications: string[];
    improvement: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
    prognosis: 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  };
  plan: {
    medications: {
      medicationName: string;
      dosage: string;
      frequency: string;
      route: string;
      duration: string;
      changes: string;
    }[];
    investigations: {
      testName: string;
      reason: string;
      priority: 'ROUTINE' | 'URGENT';
      scheduledDate?: Date;
    }[];
    procedures: {
      procedureName: string;
      reason: string;
      scheduledDate?: Date;
      consentRequired: boolean;
    }[];
    diet: string;
    activity: string;
    monitoring: string[];
    dischargePlanning: string;
  };
  notes: string;
  nextRoundScheduled?: Date;
  requiresConsultation: boolean;
  consultationSpecialist?: string;
  familyInformed: boolean;
  familyNotes?: string;
}

export interface DoctorAlert {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  room: string;
  bed: string;
  alertType: 'CRITICAL_VITALS' | 'ABNORMAL_LAB' | 'MISSED_MEDICATION' | 'FALL_RISK' | 'INFECTION_RISK' | 'DISCHARGE_READY' | 'EMERGENCY';
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedDate?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedDate?: Date;
  resolutionNotes?: string;
  escalationLevel: number;
  autoEscalated: boolean;
  requiresImmediateAction: boolean;
}

export interface DoctorStats {
  totalPatients: number;
  criticalPatients: number;
  roundsCompleted: number;
  roundsPending: number;
  tasksCompleted: number;
  tasksPending: number;
  alertsAcknowledged: number;
  alertsPending: number;
  averageRoundTime: number; // in minutes
  patientsDischarged: number;
  emergencyCalls: number;
  consultationRequests: number;
  familyCommunications: number;
  medicationOrders: number;
  testOrders: number;
  procedureOrders: number;
}

export interface DoctorShift {
  id: string;
  doctorId: string;
  doctorName: string;
  shiftType: 'MORNING' | 'EVENING' | 'NIGHT' | 'ON_CALL';
  startTime: Date;
  endTime: Date;
  assignedWards: string[];
  assignedPatients: string[];
  handoverNotes?: string;
  handoverTo?: string;
  handoverDate?: Date;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  breakTimes: {
    startTime: Date;
    endTime: Date;
    duration: number; // in minutes
  }[];
  totalBreakTime: number;
  actualEndTime?: Date;
  overtime?: number; // in minutes
}

