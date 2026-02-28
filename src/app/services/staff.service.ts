import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Payload for creating a new staff member (POST /api/staff) */
export interface CreateStaffPayload {
  fullName: string;
  employeeId: string;
  role: string;
  email: string;
  phone: string;
  specialization?: string;
  profilePicture?: string;
}

/** Staff member as returned from API (GET/POST) */
export interface StaffMember {
  id?: number;
  fullName: string;
  employeeId: string;
  role: string;
  email: string;
  phone: string;
  profilePicture?: string;
  specialization?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getStaff(): Observable<StaffMember[] | { data: StaffMember[] } | { content: StaffMember[] }> {
    return this.http.get<StaffMember[] | { data: StaffMember[] } | { content: StaffMember[] }>(
      `${this.baseUrl}/staff`
    );
  }

  /** POST /api/staff - create a new staff member */
  createStaff(payload: CreateStaffPayload): Observable<StaffMember | { data: StaffMember }> {
    return this.http.post<StaffMember | { data: StaffMember }>(
      `${this.baseUrl}/staff`,
      payload
    );
  }
}
