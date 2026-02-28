import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StaffRoleAssignment {
  id: string;
  staffId: number;
  roleId: string;
  roleName: string;
}

@Injectable({ providedIn: 'root' })
export class StaffRoleService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** GET /api/staff/{staffId}/roles */
  getStaffRoles(staffId: number): Observable<StaffRoleAssignment[]> {
    return this.http.get<StaffRoleAssignment[]>(
      `${this.baseUrl}/api/staff/${staffId}/roles`
    );
  }

  /** POST /api/staff/{staffId}/roles/assign/{roleId} */
  assignRole(staffId: number, roleId: string): Observable<StaffRoleAssignment> {
    return this.http.post<StaffRoleAssignment>(
      `${this.baseUrl}/api/staff/${staffId}/roles/assign/${roleId}`,
      {}
    );
  }

  /** DELETE /api/staff/{staffId}/roles/unassign/{staffRoleId} */
  unassignRole(staffId: number, staffRoleId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/api/staff/${staffId}/roles/unassign/${staffRoleId}`
    );
  }
}
