import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StaffFeaturePermission {
  id: string;
  featureId: string;
  featureCode: string;
  featureName: string;
}

@Injectable({ providedIn: 'root' })
export class StaffFeatureService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** GET /api/staff/{staffId}/features?hospitalPublicId=... */
  getStaffFeatures(staffId: number, hospitalPublicId: string): Observable<StaffFeaturePermission[]> {
    return this.http.get<StaffFeaturePermission[]>(
      `${this.baseUrl}/api/staff/${staffId}/features?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}`
    );
  }

  /** POST /api/staff/{staffId}/features/grant/{featureId}?hospitalPublicId=... */
  grantFeature(staffId: number, featureId: string, hospitalPublicId: string): Observable<StaffFeaturePermission> {
    return this.http.post<StaffFeaturePermission>(
      `${this.baseUrl}/api/staff/${staffId}/features/grant/${featureId}?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}`,
      {}
    );
  }

  /** DELETE /api/staff/{staffId}/features/revoke/{featureId}?hospitalPublicId=... */
  revokeFeature(staffId: number, featureId: string, hospitalPublicId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/api/staff/${staffId}/features/revoke/${featureId}?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}`
    );
  }
}
