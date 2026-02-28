import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Role {
  id?: string;
  hospitalPublicId?: string;
  roleName: string;
  roleType?: string;
  description?: string;
}

export interface FeatureCatalog {
  id: string;
  featureCode: string;
  featureName: string;
  description?: string;
  serviceCode?: string;
}

/** Matches backend RolePermissionDTO: id, roleId, featureId, featureCode */
export interface RolePermission {
  id: string | number;
  roleId: string;
  featureId?: string;
  featureCode?: string;
  feature?: FeatureCatalog;
  grantedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private readonly baseUrl = environment.apiUrl;
  private readonly ep = environment.endpoints.roles;
  private readonly catalogEp = environment.endpoints.catalog;

  constructor(private http: HttpClient) {}

  getRoles(hospitalPublicId?: string): Observable<Role[]> {
    const url = hospitalPublicId
      ? `${this.baseUrl}${this.ep.base}?hospitalPublicId=${hospitalPublicId}`
      : `${this.baseUrl}${this.ep.base}`;
    return this.http.get<Role[]>(url);
  }

  getRoleById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}${this.ep.byId(id)}`);
  }

  createRole(role: Role): Observable<Role> {
    return this.http.post<Role>(`${this.baseUrl}${this.ep.base}`, role);
  }

  updateRole(id: string, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}${this.ep.byId(id)}`, role);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${this.ep.byId(id)}`);
  }

  getRolePermissions(roleId: string): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.baseUrl}${this.ep.permissions(roleId)}`);
  }

  grantPermission(roleId: string, featureId: string): Observable<RolePermission> {
    return this.http.post<RolePermission>(
      `${this.baseUrl}${this.ep.grantPermission(roleId, featureId)}`,
      {}
    );
  }

  revokePermission(roleId: string, permId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${this.ep.revokePermission(roleId, permId)}`
    );
  }

  getFeatureCatalog(): Observable<FeatureCatalog[]> {
    return this.http.get<FeatureCatalog[]>(`${this.baseUrl}${this.catalogEp.features}`);
  }
}
