import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

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

  /**
   * Doctor schedule (optionally filtered by date)
   * GET /api/appointments/doctor/{doctorRegNo}/schedule?date=YYYY-MM-DD
   */
  getDoctorSchedule(doctorRegNo: string, date?: string): Observable<any> {
    const safeDoctor = encodeURIComponent((doctorRegNo || '').trim());
    const safeDate = (date || '').trim();
    const qs = safeDate ? `?date=${encodeURIComponent(safeDate)}` : '';
    return this.httpService.sendGETRequest(`${this.baseUrl}/appointments/doctor/${safeDoctor}/schedule${qs}`);
  }
  

}
