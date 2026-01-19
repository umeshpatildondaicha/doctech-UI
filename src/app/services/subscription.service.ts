import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiConfigService } from '@lk/core';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly apiConfig = inject(ApiConfigService);

  constructor(private readonly http: HttpService) {}

  private get apiBase(): string {
    return this.apiConfig.getApiUrl();
  }

  /**
   * Subscribe a hospital to a catalog service
   */
  subscribe(hospitalPublicId: string, serviceId: string): Observable<any> {
    const url = `${this.apiBase}/api/subscriptions/subscribe?hospitalPublicId=${encodeURIComponent(hospitalPublicId)}&serviceId=${encodeURIComponent(serviceId)}`;
    // Backend accepts no body; send a minimal non-empty JSON string to satisfy PayloadType
    const payload = JSON.stringify({ hospitalPublicId, serviceId });
    return this.http.sendPOSTRequest(url, payload);
  }
}


