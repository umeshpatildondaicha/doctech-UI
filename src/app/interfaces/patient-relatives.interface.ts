export interface PatientRelative {
  id: string;
  patientId: string;
  patientName: string;
  relativeName: string;
  relationship: 'SPOUSE' | 'PARENT' | 'CHILD' | 'SIBLING' | 'GRANDPARENT' | 'GRANDCHILD' | 'UNCLE' | 'AUNT' | 'COUSIN' | 'FRIEND' | 'GUARDIAN' | 'OTHER';
  contactNumber: string;
  alternateContactNumber?: string;
  email?: string;
  address?: string;
  emergencyContact: boolean;
  canMakeDecisions: boolean; // Medical decision making authority
  canReceiveUpdates: boolean; // Can receive patient updates
  canVisit: boolean; // Visiting permissions
  visitingHours?: {
    startTime: string;
    endTime: string;
    days: string[]; // ['MONDAY', 'TUESDAY', etc.]
  };
  addedBy: string; // Doctor or staff who added this relative
  addedDate: Date;
  lastContactDate?: Date;
  notes?: string;
  isActive: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  verificationNotes?: string;
}

export interface RelativeCommunication {
  id: string;
  patientId: string;
  relativeId: string;
  relativeName: string;
  communicationType: 'PHONE_CALL' | 'SMS' | 'EMAIL' | 'IN_PERSON' | 'VIDEO_CALL';
  initiatedBy: string; // Doctor, nurse, or relative
  initiatedById: string;
  initiatedByRole: 'DOCTOR' | 'NURSE' | 'RELATIVE' | 'STAFF';
  communicationDate: Date;
  communicationTime: Date;
  duration?: number; // in minutes for calls
  subject: string;
  message: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  response?: string;
  responseDate?: Date;
  isUrgent: boolean;
  requiresFollowUp: boolean;
  followUpDate?: Date;
  notes?: string;
}

export interface PatientUpdate {
  id: string;
  patientId: string;
  patientName: string;
  updateType: 'ADMISSION' | 'DISCHARGE' | 'CONDITION_CHANGE' | 'MEDICATION_CHANGE' | 'PROCEDURE' | 'TEST_RESULT' | 'ROUND_UPDATE' | 'EMERGENCY';
  title: string;
  description: string;
  updateDate: Date;
  updateTime: Date;
  updatedBy: string;
  updatedById: string;
  updatedByRole: 'DOCTOR' | 'NURSE' | 'STAFF';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isVisibleToRelatives: boolean;
  relativesNotified: string[]; // Array of relative IDs who were notified
  notificationMethod: 'AUTOMATIC' | 'MANUAL' | 'BOTH';
  attachments?: {
    fileName: string;
    fileType: string;
    fileUrl: string;
  }[];
  requiresAcknowledgment: boolean;
  acknowledgments: {
    relativeId: string;
    relativeName: string;
    acknowledgedDate: Date;
    acknowledgmentNotes?: string;
  }[];
}

export interface RelativePermissions {
  id: string;
  patientId: string;
  relativeId: string;
  relativeName: string;
  permissions: {
    canViewMedicalRecords: boolean;
    canReceiveTestResults: boolean;
    canMakeAppointments: boolean;
    canRequestMedications: boolean;
    canAuthorizeProcedures: boolean;
    canReceiveDischargeUpdates: boolean;
    canViewBilling: boolean;
    canRequestSecondOpinion: boolean;
  };
  restrictions: {
    restrictedFromViewing: string[]; // Specific medical conditions or treatments
    restrictedFromReceiving: string[]; // Types of updates they can't receive
    visitingRestrictions: string[];
  };
  grantedBy: string;
  grantedDate: Date;
  expiryDate?: Date;
  isActive: boolean;
}

export interface RelativeStats {
  totalRelatives: number;
  emergencyContacts: number;
  verifiedRelatives: number;
  activeCommunications: number;
  pendingVerifications: number;
  recentUpdates: number; // Updates sent in last 24 hours
  averageResponseTime: number; // Average time for relatives to respond
}

