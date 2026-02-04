import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private baseUrl ='https://doctech.solutions/api';

  constructor(private httpService :HttpService){}

  getAppointments(): Observable<any> {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/patient/my-appointments`
    );
  }

  getAppointmentRequests(doctorCode: string): Observable<any> {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${doctorCode}/requests`
    );
  }

  approveAppointmentRequest(doctorCode: string, requestId: string): Observable<any> {
    return this.httpService.sendPUTRequest(
      `${this.baseUrl}/appointments/doctor/${doctorCode}/requests/${requestId}/approve`,
      JSON.stringify({ approved: true })
    );
  }

  /** GET appointment status-wise counts for the doctor in a date range. */
  getAppointmentStatusCounts(doctorCode: string, from: string, to: string): Observable<any> {
    const fromEnc = encodeURIComponent(from);
    const toEnc = encodeURIComponent(to);
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${doctorCode}/status-counts?from=${fromEnc}&to=${toEnc}`
    );
  }

  /** GET age-wise count of patients for the doctor (demographics). */
  getAgeGroupDemographics(doctorCode: string): Observable<any> {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${doctorCode}/demographics/age-groups`
    );
  }
}