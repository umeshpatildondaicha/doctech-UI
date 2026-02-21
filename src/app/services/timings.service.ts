import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  BaseTimingUpsertRequest,
  DoctorTimingsResponse,
  LeaveUpsertRequest,
  OverrideTimingUpsertRequest,
  TimingsForecastDay,
  TimingRule,
  WeeklyTimingUpsertRequest
} from '../interfaces/timings.interface';

@Injectable({ providedIn: 'root' })
export class TimingsService {
  private readonly doctorsBaseUrl = `${environment.apiUrl}/api/doctors`;

  constructor(private readonly http: HttpClient) {}

  // ---- View mode ----

  getDoctorTimings(doctorId: string): Observable<DoctorTimingsResponse> {
    return this.http.get<DoctorTimingsResponse>(`${this.doctorsBaseUrl}/${doctorId}/timings`);
  }

  getForecast(doctorId: string, from: string, days: number = 15): Observable<TimingsForecastDay[]> {
    const params = new HttpParams().set('from', from).set('days', String(days));
    return this.http.get<TimingsForecastDay[]>(`${this.doctorsBaseUrl}/${doctorId}/timings/forecast`, { params });
  }

  getWeek(doctorId: string, weekStart: string): Observable<TimingsForecastDay[]> {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get<TimingsForecastDay[]>(`${this.doctorsBaseUrl}/${doctorId}/timings/week`, { params });
  }

  // ---- P4 Base (Daily base availability) ----
  // Delete: DELETE ${doctorsBaseUrl}/${doctorId}/timings/base

  getBase(doctorId: string): Observable<TimingRule | null> {
    return this.http.get<TimingRule | null>(`${this.doctorsBaseUrl}/${doctorId}/timings/base`);
  }

  upsertBase(doctorId: string, body: BaseTimingUpsertRequest): Observable<TimingRule> {
    return this.http.put<TimingRule>(`${this.doctorsBaseUrl}/${doctorId}/timings/base`, body);
  }

  /** Delete daily base availability: DELETE /api/doctors/:doctorId/timings/base */
  deleteBase(doctorId: string): Observable<void> {
    return this.http.delete<void>(`${this.doctorsBaseUrl}/${doctorId}/timings/base`);
  }

  // ---- P3 Weekly (Weekly routine) ----
  // Edit: PATCH ${doctorsBaseUrl}/${doctorId}/timings/weekly/${weeklyRuleId}
  // Delete: DELETE ${doctorsBaseUrl}/${doctorId}/timings/weekly/${weeklyRuleId}

  listWeekly(doctorId: string): Observable<TimingRule[]> {
    return this.http.get<TimingRule[]>(`${this.doctorsBaseUrl}/${doctorId}/timings/weekly`);
  }

  createWeekly(doctorId: string, body: WeeklyTimingUpsertRequest): Observable<TimingRule> {
    return this.http.post<TimingRule>(`${this.doctorsBaseUrl}/${doctorId}/timings/weekly`, body);
  }

  /** Edit weekly routine: PATCH /api/doctors/:doctorId/timings/weekly/:weeklyRuleId */
  updateWeekly(doctorId: string, weeklyRuleId: string, body: WeeklyTimingUpsertRequest): Observable<TimingRule> {
    return this.http.patch<TimingRule>(`${this.doctorsBaseUrl}/${doctorId}/timings/weekly/${weeklyRuleId}`, body);
  }

  /** Delete weekly routine: DELETE /api/doctors/:doctorId/timings/weekly/:weeklyRuleId */
  deleteWeekly(doctorId: string, weeklyRuleId: string): Observable<void> {
    return this.http.delete<void>(`${this.doctorsBaseUrl}/${doctorId}/timings/weekly/${weeklyRuleId}`);
  }

  // ---- P2 Overrides (Specific day overrides) ----
  // API base: GET/POST ${doctorsBaseUrl}/${doctorId}/timings/overrides
  // Edit: PATCH ${doctorsBaseUrl}/${doctorId}/timings/overrides/${overrideId}
  // Delete: DELETE ${doctorsBaseUrl}/${doctorId}/timings/overrides/${overrideId}

  listOverrides(doctorId: string, from: string, to: string): Observable<TimingRule[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<TimingRule[]>(`${this.doctorsBaseUrl}/${doctorId}/timings/overrides`, { params });
  }

  createOverride(doctorId: string, body: OverrideTimingUpsertRequest): Observable<TimingRule> {
    return this.http.post<TimingRule>(`${this.doctorsBaseUrl}/${doctorId}/timings/overrides`, body);
  }

  /** Edit specific day override: PATCH /api/doctors/:doctorId/timings/overrides/:overrideId */
  updateOverride(doctorId: string, overrideId: number, body: OverrideTimingUpsertRequest): Observable<TimingRule> {
    return this.http.patch<TimingRule>(`${this.doctorsBaseUrl}/${doctorId}/timings/overrides/${overrideId}`, body);
  }

  /** Delete specific day override: DELETE /api/doctors/:doctorId/timings/overrides/:overrideId */
  deleteOverride(doctorId: string, overrideId: number): Observable<void> {
    return this.http.delete<void>(`${this.doctorsBaseUrl}/${doctorId}/timings/overrides/${overrideId}`);
  }

  // ---- P1 Leaves ----

  listLeaves(doctorId: string, from: string, to: string): Observable<TimingRule[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<TimingRule[]>(`${this.doctorsBaseUrl}/${doctorId}/timings/leaves`, { params });
  }

  createLeave(doctorId: string, body: LeaveUpsertRequest): Observable<TimingRule> {
    return this.http.post<TimingRule>(`${this.doctorsBaseUrl}/${doctorId}/timings/leaves`, body);
  }

  updateLeave(doctorId: string, leaveId: number, body: LeaveUpsertRequest): Observable<TimingRule> {
    return this.http.patch<TimingRule>(`${this.doctorsBaseUrl}/${doctorId}/timings/leaves/${leaveId}`, body);
  }

  deleteLeave(doctorId: string, leaveId: number): Observable<void> {
    return this.http.delete<void>(`${this.doctorsBaseUrl}/${doctorId}/timings/leaves/${leaveId}`);
  }
}

