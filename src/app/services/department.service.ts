import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StaffMember } from './staff.service';

export interface Department {
  departmentId?: number;
  tenantId?: string;
  hospitalId?: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface DepartmentListResponse {
  departments: Department[];
}

export interface DepartmentStaffResponse {
  staffDetails: StaffMember[];
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  private readonly baseUrl = environment.apiUrl;
  private readonly ep = environment.endpoints.departments;

  constructor(private http: HttpClient) {}

  getDepartments(): Observable<Department[]> {
    return this.http.get<DepartmentListResponse>(`${this.baseUrl}${this.ep.base}`)
      .pipe(map(res => res.departments ?? []));
  }

  getDepartmentById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.baseUrl}${this.ep.byId(id)}`);
  }

  createDepartment(dept: Department): Observable<Department> {
    return this.http.post<Department>(`${this.baseUrl}${this.ep.base}`, dept);
  }

  updateDepartment(id: number, dept: Department): Observable<Department> {
    return this.http.put<Department>(`${this.baseUrl}${this.ep.byId(id)}`, dept);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${this.ep.byId(id)}`);
  }

  getDepartmentStaff(deptId: number): Observable<StaffMember[]> {
    return this.http.get<DepartmentStaffResponse>(`${this.baseUrl}${this.ep.staff(deptId)}`)
      .pipe(map(res => res.staffDetails ?? []));
  }
}
