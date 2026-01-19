import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpService } from './http.service';

// Doctor Profile Interfaces
export interface DoctorProfileResponse {
  firstName: string;
  lastName: string;
  registrationNumber: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  contactNumber: string;
  profileImageUrl?: string;
  doctorStatus: string;
  primaryHospital: string;
  professionalBio?: string;
  specialization: string;
  additionalSpecializations: string[];
  qualifications: string[];
  workStartDate: string;
  experienceYears: number;
  certifications: string[];
  hospitalAddresses: HospitalAddress[];
  affiliations: Affiliation[];
}

export interface DoctorProfileUpdateRequest {
  firstName: string;
  lastName: string;
  registrationNumber: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  contactNumber: string;
  profileImageUrl?: string;
  doctorStatus: string;
  primaryHospital: string;
  professionalBio?: string;
  specialization: string;
  additionalSpecializations: string[];
  qualifications: string[];
  workStartDate: string;
  experienceYears: number;
  certifications: string[];
  hospitalAddresses: HospitalAddress[];
  affiliations: Affiliation[];
}

export interface HospitalAddress {
  hospitalName: string;
  type: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface Affiliation {
  institutionName: string;
  type: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  constructor(private httpService: HttpService) { }

  /**
   * Get doctor profile by registration number
   */
  getProfile(registrationNumber: string): Observable<DoctorProfileResponse> {
    // For now, return mock data. Replace with actual API call when backend is ready
    return of({
      firstName: 'Umesh',
      lastName: 'Patil',
      registrationNumber: registrationNumber,
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      email: 'u513107@gmail.com',
      contactNumber: '8788802334',
      profileImageUrl: 'assets/avatars/default-avatar.jpg',
      doctorStatus: 'APPROVED',
      primaryHospital: 'Shree Clinic',
      professionalBio: 'Experienced orthopedic surgeon with specialization in sports medicine and joint replacement surgeries.',
      specialization: 'Orthopedics',
      additionalSpecializations: ['Sports Medicine', 'Joint Replacement', 'Arthroscopy'],
      qualifications: ['MBBS', 'MS - Orthopedics', 'Fellowship in Sports Medicine'],
      workStartDate: '2015-06-01',
      experienceYears: 8,
      certifications: ['BLS', 'ACLS', 'Fellowship in Joint Replacement'],
      hospitalAddresses: [
        {
          hospitalName: 'Shree Clinic',
          type: 'Primary Hospital',
          streetAddress: '123 Medical Center Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          phone: '+91-22-12345678',
          email: 'info@shreeclinic.com'
        }
      ],
      affiliations: [
        {
          institutionName: 'Indian Medical Association',
          type: 'Professional Association',
          role: 'Active Member',
          startDate: '2015-06-01',
          description: 'Active member of the Indian Medical Association, participating in continuing medical education programs and professional development activities.'
        }
      ]
    });

    // TODO: Replace with actual API call when backend is ready
    // return this.httpService.get<DoctorProfileResponse>(`/api/doctors/${registrationNumber}/profile`);
  }

  /**
   * Update doctor profile
   */
  updateProfile(registrationNumber: string, profileData: DoctorProfileUpdateRequest): Observable<DoctorProfileResponse> {
    // For now, return the updated data as mock response
    return of({
      ...profileData,
      registrationNumber: registrationNumber
    } as DoctorProfileResponse);

    // TODO: Replace with actual API call when backend is ready
    // return this.httpService.put<DoctorProfileResponse>(`/api/doctors/${registrationNumber}/profile`, profileData);
  }
}
