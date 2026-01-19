import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiConfigService } from '@lk/core';

@Injectable({ providedIn: 'root' })
export class DoctorFeatureService {
  private readonly apiConfig = inject(ApiConfigService);

  constructor(private readonly http: HttpService) {}

  private get apiBase(): string {
    return this.apiConfig.getApiUrl();
  }

  grantFeature(doctorPublicId: string, featureId: string, hospitalPublicId: string): Observable<any> {
    const url = `${this.apiBase}/api/doctors/${encodeURIComponent(doctorPublicId)}/features/grant/${encodeURIComponent(featureId)}?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}`;
    // Backend accepts no body; send a minimal non-empty JSON string to satisfy PayloadType
    const payload = JSON.stringify({ doctorPublicId, featureId, hospitalPublicId, action: 'grant' });
    return this.http.sendPOSTRequest(url, payload);
  }

  revokeFeature(doctorPublicId: string, featureId: string, hospitalPublicId: string): Observable<any> {
    const url = `${this.apiBase}/api/doctors/${encodeURIComponent(doctorPublicId)}/features/revoke/${encodeURIComponent(featureId)}?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}`;
    return this.http.sendDELETERequest(url);
  }
}


