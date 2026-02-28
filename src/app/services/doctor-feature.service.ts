import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DoctorFeatureDTO {
  featureId: string;
  featureCode: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorFeatureService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** List all features granted to a doctor in the context of a hospital */
  listFeatures(doctorPublicId: string, hospitalPublicId: string): Observable<DoctorFeatureDTO[]> {
    const url = `${this.baseUrl}/api/doctors/${encodeURIComponent(doctorPublicId)}/features?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}`;
    return this.http.get<DoctorFeatureDTO[]>(url);
  }

  /** Grant a feature to a doctor in a hospital context */
  grantFeature(doctorPublicId: string, featureId: string, hospitalPublicId: string): Observable<DoctorFeatureDTO> {
    const url = `${this.baseUrl}/api/doctors/${encodeURIComponent(doctorPublicId)}/features/grant/${encodeURIComponent(featureId)}?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}`;
    return this.http.post<DoctorFeatureDTO>(url, {});
  }

  /** Revoke a feature from a doctor in a hospital context */
  revokeFeature(doctorPublicId: string, featureId: string, hospitalPublicId: string): Observable<void> {
    const url = `${this.baseUrl}/api/doctors/${encodeURIComponent(doctorPublicId)}/features/revoke/${encodeURIComponent(featureId)}?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}`;
    return this.http.delete<void>(url);
  }
}
