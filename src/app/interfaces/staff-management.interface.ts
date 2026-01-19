export interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  role: 'DOCTOR' | 'NURSE' | 'WARD_BOY' | 'CLEANING_STAFF' | 'DIETICIAN' | 'PHYSIOTHERAPIST' | 'TECHNICIAN' | 'OTHER';
  department: string;
  specialization?: string;
  contactNumber: string;
  email: string;
  shiftPattern: 'MORNING' | 'EVENING' | 'NIGHT' | 'ROTATING' | 'FLEXIBLE';
  isActive: boolean;
  isAvailable: boolean;
  currentLocation?: string;
  avatar?: string;
  color: string;
  qualifications: string[];
  experience: number; // in years
  certifications: string[];
  lastActive: Date;
  maxPatients: number; // maximum patients they can handle
  currentPatientCount: number;
}

export interface StaffAssignment {
  id: string;
  patientId: string;
  patientName: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  assignmentType: 'PRIMARY' | 'SECONDARY' | 'BACKUP' | 'SPECIALIST';
  shiftStart: Date;
  shiftEnd: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ON_BREAK';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes: string;
  assignedBy: string;
  assignedDate: Date;
  lastUpdated: Date;
  responsibilities: string[];
  handoverNotes?: string;
  nextHandover?: Date;
}

export interface StaffRoster {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: Date;
  shiftStart: Date;
  shiftEnd: Date;
  ward: string;
  floor: string;
  isOnDuty: boolean;
  breakTimes: {
    start: Date;
    end: Date;
    type: 'LUNCH' | 'TEA' | 'PERSONAL' | 'EMERGENCY';
  }[];
  maxPatients: number;
  currentLoad: number;
  isOvertime: boolean;
  notes: string;
}

export interface CareTask {
  id: string;
  patientId: string;
  patientName: string;
  taskType: 'MEDICATION' | 'VITALS' | 'CARE' | 'OBSERVATION' | 'PROCEDURE' | 'DOCUMENTATION' | 'COMMUNICATION';
  title: string;
  description: string;
  assignedTo: string;
  assignedToId: string;
  assignedToRole: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  scheduledTime: Date;
  dueTime: Date;
  completedTime?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  instructions: string[];
  requiredEquipment?: string[];
  requiresSupervision: boolean;
  supervisorId?: string;
  notes: string;
  completionNotes?: string;
  createdBy: string;
  createdDate: Date;
  lastUpdated: Date;
  isRecurring: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  parentTaskId?: string;
  tags: string[];
}

export interface HandoverNote {
  id: string;
  fromStaffId: string;
  fromStaffName: string;
  toStaffId: string;
  toStaffName: string;
  patientId: string;
  patientName: string;
  handoverType: 'SHIFT' | 'BREAK' | 'EMERGENCY' | 'SPECIALIST';
  handoverTime: Date;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED';
  criticalInformation: string[];
  ongoingTasks: string[];
  medications: {
    name: string;
    dosage: string;
    nextDue: Date;
    specialInstructions: string;
  }[];
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    painLevel: number;
  };
  concerns: string[];
  familyUpdates: string[];
  doctorNotes: string[];
  nextActions: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isUrgent: boolean;
  acknowledgedBy?: string;
  acknowledgedTime?: Date;
  completionNotes?: string;
}

export interface StaffPerformance {
  id: string;
  staffId: string;
  staffName: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    tasksCompleted: number;
    tasksOnTime: number;
    tasksOverdue: number;
    roundsCompleted: number;
    patientSatisfaction: number;
    handoverAccuracy: number;
    responseTime: number; // average response time in minutes
  };
  qualityScore: number; // 0-100
  efficiencyScore: number; // 0-100
  reliabilityScore: number; // 0-100
  notes: string;
  improvements: string[];
  achievements: string[];
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  weekStarting: Date;
  shifts: {
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
    shiftStart?: Date;
    shiftEnd?: Date;
    isWorking: boolean;
    ward?: string;
    floor?: string;
    notes?: string;
  }[];
  totalHours: number;
  overtimeHours: number;
  isApproved: boolean;
  approvedBy?: string;
  approvedDate?: Date;
  createdBy: string;
  createdDate: Date;
}

export interface WardStaffing {
  wardId: string;
  wardName: string;
  floor: string;
  date: Date;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  requiredStaff: {
    role: string;
    count: number;
    currentCount: number;
    shortage: number;
  }[];
  assignedStaff: StaffMember[];
  coverage: number; // percentage
  isFullyStaffed: boolean;
  alerts: string[];
  lastUpdated: Date;
}

