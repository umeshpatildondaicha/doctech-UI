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

  /** GET all appointments for a doctor. */
  getDoctorAppointments(doctorCode: string): Observable<any> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${safeDoctor}/appointments`
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

  /** GET doctor's patient queue (today's queue order). */
  getDoctorQueue(doctorCode: string): Observable<any> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${safeDoctor}/queue`
    );
  }

  /** Reschedule an appointment by public id. */
  rescheduleAppointment(
    appointmentPublicId: string,
    payload: { newDate: string; newStartTime: string; newEndTime: string }
  ): Observable<any> {
    const safeId = encodeURIComponent((appointmentPublicId || '').trim());
    return this.httpService.sendPUTRequest(
      `${this.baseUrl}/appointments/${safeId}/reschedule`,
      JSON.stringify(payload)
    );
  }

  /** GET available appointment slots for a doctor on a date. */
  getAppointmentSlotsForDate(
    doctorRegNo: string,
    date: string,
    slotMinutes?: number
  ): Observable<any> {
    const safeDoctor = encodeURIComponent((doctorRegNo || '').trim());
    const safeDate = encodeURIComponent((date || '').trim());
    const params = new URLSearchParams({ date: safeDate });
    if (slotMinutes != null) params.set('slotMinutes', String(slotMinutes));
    const qs = `?${params.toString()}`;
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${safeDoctor}/slots${qs}`
    );
  }

  /** GET total appointment count for a doctor (e.g. for dashboard). */
  getAllAppointmentsCount(doctorCode: string): Observable<{ count: number }> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${safeDoctor}/count`
    );
  }

  /** GET pending appointment requests count for a doctor. */
  getPendingRequestsCount(doctorCode: string): Observable<{ count: number }> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${safeDoctor}/requests/count`
    );
  }

  /** GET appointments for a specific patient (doctor + patient). */
  getPatientAppointments(doctorCode: string, patientPublicId: string): Observable<any> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    const safePatient = encodeURIComponent((patientPublicId || '').trim());
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/appointments/doctor/${safeDoctor}/patient/${safePatient}/appointments`
    );
  }
}
