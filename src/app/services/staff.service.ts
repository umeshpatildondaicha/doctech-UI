import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface StaffMember {
  staffId?: number;
  id?: number;
  tenantId?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone?: string;
  contactNumber?: string;
  role?: string;
  roles?: string[];
  departmentId?: number;
  specialization?: string;
  qualifications?: string;
  experienceYears?: number;
  shiftPattern?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  maxPatients?: number;
  approvedByHospitalAdmin?: boolean;
  approvalNotes?: string;
  inviteAccepted?: boolean;
  profilePicture?: string;
}

export interface StaffListResponse {
  staffDetails: StaffMember[];
}

export interface StaffInviteRequest {
  email: string;
  firstName: string;
  lastName: string;
  contactNumber?: string;
  roles?: string[];
  departmentId?: number;
  specialization?: string;
  shiftPattern?: string;
}

export interface StaffInviteResponse {
  message: string;
  staffId: number;
  inviteToken: string;
}

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getStaff(_params?: { role?: string; departmentId?: number; active?: boolean }): Observable<StaffListResponse> {
    return this.http.get<unknown>(`${this.baseUrl}/api/staff`).pipe(
      map((res: unknown) => {
        if (Array.isArray(res)) {
          return { staffDetails: res as StaffMember[] };
        }
        const r = res as Record<string, unknown>;
        if (r['staffDetails']) return res as StaffListResponse;
        if (r['data'])         return { staffDetails: r['data'] as StaffMember[] };
        if (r['content'])      return { staffDetails: r['content'] as StaffMember[] };
        return { staffDetails: [] };
      }),
      catchError(() => of({ staffDetails: [] }))
    );
  }

  getStaffById(id: number): Observable<StaffMember> {
    return this.http.get<StaffMember>(`${this.baseUrl}/api/staff/${id}`);
  }

  createStaff(staff: Partial<StaffMember>): Observable<StaffMember> {
    return this.http.post<StaffMember>(`${this.baseUrl}/api/staff`, staff);
  }

  updateStaff(id: number, staff: Partial<StaffMember>): Observable<StaffMember> {
    return this.http.put<StaffMember>(`${this.baseUrl}/api/staff/${id}`, staff);
  }

  deleteStaff(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/staff/${id}`);
  }

  approveStaff(id: number, notes?: string): Observable<StaffMember> {
    return this.http.put<StaffMember>(`${this.baseUrl}/api/staff/${id}/approve`, { approvalNotes: notes ?? '' });
  }

  updateAvailability(id: number, available: boolean): Observable<StaffMember> {
    return this.http.put<StaffMember>(`${this.baseUrl}/api/staff/${id}/availability`, { available });
  }

  inviteStaff(dto: StaffInviteRequest): Observable<StaffInviteResponse> {
    return this.http.post<StaffInviteResponse>(`${this.baseUrl}/api/staff/invite`, dto);
  }
}
