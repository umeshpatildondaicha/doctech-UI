export interface PatientQueue {
  queueId: number;
  patientId: number;
  appointmentId: number;
  queuePosition: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  estimatedDuration: number; // in minutes
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
  doctorId: number;
  roomNumber?: string;
  checkInTime: string;
  waitTime: number; // in minutes
  reasonForVisit?: string;
  isUrgent: boolean;
  hasInsurance: boolean;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  appointmentTime: string; // Scheduled appointment time
  delayTime?: number; // Delay in minutes (calculated)
}

export interface PatientQueueDisplay {
  patientId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contact: number;
  email: string;
  address: string;
  bloodGroup: string;
  createdDate: string;
  updatedDate: string;
  profilePhoto?: string; // URL to profile photo
  queueInfo: PatientQueue;
  medicalAlerts: string[];
  lastVisitDate?: string;
  upcomingTests?: string[];
  currentMedications?: string[];
  insuranceProvider?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: string[];
  chronicConditions: string[];
}

export interface QueueStatistics {
  totalPatients: number;
  waiting: number;
  inProgress: number;
  completed: number;
  averageWaitTime: number;
  estimatedCompletionTime: string;
  doctorWorkload: {
    doctorId: number;
    doctorName: string;
    currentPatients: number;
    estimatedWaitTime: number;
  }[];
}
