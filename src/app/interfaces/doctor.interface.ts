export interface Doctor {
  // Mandatory fields
  registrationNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
  password: string;
  doctorStatus: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  // Optional fields
  contactNumber?: string;
  email?: string;
  qualifications?: string;
  certifications?: string[];
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  approvals?: any[];
  workingDays?: any[];
  appointmentTimings?: any[];
  careerHistories?: any[];
  blogs?: any[];
  hospitalAssociations?: any[];

  // Legacy fields (keeping for backward compatibility)
  doctorId?: number;
  hospitalId?: number;
  globalNumber?: string;
  persanalNumber?: string;
  departmentId?: number;
  isDeleted?: boolean;
} 
