import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubscriptionDTO {
  id: string;
  hospitalPublicId: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalSubscriptionService {

  private readonly baseUrl = environment.apiUrl;
  private readonly ep = environment.endpoints.hospitalSubscriptions;

  constructor(private readonly http: HttpClient) {}

  /** Returns all active subscriptions for a hospital */
  getSubscriptions(hospitalPublicId: string): Observable<SubscriptionDTO[]> {
    return this.http.get<SubscriptionDTO[]>(
      `${this.baseUrl}${this.ep.byHospital(hospitalPublicId)}`
    );
  }

  /** Subscribes the hospital to a service */
  subscribe(hospitalPublicId: string, serviceId: string): Observable<SubscriptionDTO> {
    return this.http.post<SubscriptionDTO>(
      `${this.baseUrl}${this.ep.subscribe}`,
      { hospitalPublicId, serviceId }
    );
  }

  /** Unsubscribes the hospital from a service by subscriptionId */
  unsubscribe(subscriptionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${this.ep.unsubscribe(subscriptionId)}`
    );
  }

  /** Unsubscribes the hospital from a service by serviceId */
  unsubscribeByService(hospitalPublicId: string, serviceId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${this.ep.unsubscribeByService(hospitalPublicId, serviceId)}`
    );
  }
}
