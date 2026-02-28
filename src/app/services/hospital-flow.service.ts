import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrgFlowLayout {
  nodes: OrgFlowNode[];
  edges: OrgFlowEdge[];
}

export interface OrgFlowNode {
  id: string;
  type: string;
  entityId: string;
  title: string;
  subtitle?: string;
  x: number;
  y: number;
}

export interface OrgFlowEdge {
  id: string;
  from: string;
  to: string;
}

export interface OrgFlowResponse {
  hospitalPublicId: string;
  layoutJson: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalFlowService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Loads the saved canvas layout for a hospital. Returns 404 if none saved yet. */
  getOrgFlow(hospitalPublicId: string): Observable<OrgFlowResponse> {
    return this.http.get<OrgFlowResponse>(
      `${this.baseUrl}${environment.endpoints.orgFlow.get(hospitalPublicId)}`
    );
  }

  /** Upserts the canvas layout for a hospital. */
  saveOrgFlow(hospitalPublicId: string, layout: OrgFlowLayout): Observable<OrgFlowResponse> {
    return this.http.put<OrgFlowResponse>(
      `${this.baseUrl}${environment.endpoints.orgFlow.save(hospitalPublicId)}`,
      { layoutJson: JSON.stringify(layout) }
    );
  }

  /** Fetch hospital details by publicId */
  getHospital(hospitalPublicId: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${environment.endpoints.hospitals.base}/${hospitalPublicId}`
    );
  }
}
