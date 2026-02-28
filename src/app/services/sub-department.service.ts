import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubDepartment {
  subDepartmentId?: number;
  name: string;
  description?: string;
  departmentId?: number;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SubDepartmentService {

  private readonly baseUrl = environment.apiUrl;
  private readonly ep = environment.endpoints.subDepartments;

  constructor(private readonly http: HttpClient) {}

  getSubDepartments(): Observable<SubDepartment[]> {
    return this.http.get<SubDepartment[]>(`${this.baseUrl}${this.ep.base}`);
  }

  getSubDepartmentsByDept(departmentId: number): Observable<SubDepartment[]> {
    return this.http.get<SubDepartment[]>(`${this.baseUrl}${this.ep.byDepartment(departmentId)}`);
  }

  getSubDepartmentById(id: number): Observable<SubDepartment> {
    return this.http.get<SubDepartment>(`${this.baseUrl}${this.ep.byId(id)}`);
  }

  createSubDepartment(body: SubDepartment): Observable<SubDepartment> {
    return this.http.post<SubDepartment>(`${this.baseUrl}${this.ep.base}`, body);
  }

  updateSubDepartment(id: number, body: Partial<SubDepartment>): Observable<SubDepartment> {
    return this.http.put<SubDepartment>(`${this.baseUrl}${this.ep.byId(id)}`, body);
  }

  deleteSubDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${this.ep.byId(id)}`);
  }
}
