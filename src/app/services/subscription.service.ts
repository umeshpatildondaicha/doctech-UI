import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiConfigService } from '@lk/core';

export interface HospitalSubscription {
  id: string;
  hospitalPublicId: string;
  service: {
    id: string;
    serviceCode: string;
    name: string;
    description?: string;
  };
  startsAt?: string;
  expiresAt?: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly apiConfig = inject(ApiConfigService);

  constructor(private readonly http: HttpService) {}

  private get apiBase(): string {
    return this.apiConfig.getApiUrl();
  }

  getHospitalSubscriptions(hospitalPublicId: string): Observable<HospitalSubscription[]> {
    const url = `${this.apiBase}/api/subscriptions/hospital/${encodeURIComponent(hospitalPublicId)}`;
    return this.http.sendGETRequest(url);
  }

  subscribe(hospitalPublicId: string, serviceId: string): Observable<any> {
    const url = `${this.apiBase}/api/subscriptions/subscribe?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}&serviceId=${encodeURIComponent(serviceId)}`;
    const payload = JSON.stringify({ hospitalPublicId, serviceId });
    return this.http.sendPOSTRequest(url, payload);
  }

  unsubscribe(hospitalPublicId: string, serviceId: string): Observable<any> {
    const url = `${this.apiBase}/api/subscriptions/unsubscribe?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}&serviceId=${encodeURIComponent(serviceId)}`;
    return this.http.sendDELETERequest(url);
  }
}
