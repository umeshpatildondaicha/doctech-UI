import { Injectable } from '@angular/core';
import { HttpService, PayloadType } from '@lk/core';
import { Appointment } from '../interfaces/appointment.interface';
import { Observable } from 'rxjs';
import { AppointmentTiming, AppointmentTimingDaily, AppointmentTimings, WeeklyRoutineTiming } from '../interfaces/timings.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimingManageService {
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(private httpService: HttpService) {}

  getAllTimings(doctorCode: string):Observable<any> {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/doctor/appointment-timings/${doctorCode}`
    );
  }

  addLeave(doctorCode:string ,payload: AppointmentTiming):Observable<any> {
    return this.httpService.sendPOSTRequest(
      `${this.baseUrl}/doctor/appointment-timings/${doctorCode}`,
      payload as any
    );
  }
  updateTiming(doctorCode: string, payload: any) {
    return this.httpService.sendPOSTRequest(
      `${this.baseUrl}/doctor/appointment-timings/${doctorCode}`,
      payload
    );
  }
  
  // getAllTimining(doctorCode:string):Observable<any[]>{
  //   return this.httpService.sendGETRequest(`${this.baseUrl}/doctor/appoinment-timings/${doctorCode}`) ;

  // }
  addTiming(
    doctorCode: string,
    payload: AppointmentTimings
  ): Observable<any> {
    return this.httpService.sendPOSTRequest(
      `${this.baseUrl}/doctor/appointment-timings/${doctorCode}`,
      payload as any
    );
  }

  dailySaveTiming(doctorCode:string , payload:AppointmentTimingDaily):Observable<any>{
    return this.httpService.sendPOSTRequest(`${this.baseUrl}/doctor/appointment-timings/${doctorCode}`,
      payload as any
    )

  }
  UpdateDaliyTiming(id:number,payload:any){
    return this.httpService.sendPUTRequest(`${this.baseUrl}/doctor/appointment-timings/${id}`,
      payload
    );
  }
  addWeeklyRoutine(
    doctorCode: string,
    payload: WeeklyRoutineTiming
  ) {
    return this.httpService.sendPOSTRequest(
      `${this.baseUrl}/doctor/appointment-timings/${doctorCode}`,
      payload as any
    );
  }
  deleteTiming(doctorCode:string ,timingId :number) {
    return this.httpService.sendDELETERequest(
      `${this.baseUrl}/doctor/appointment-timings/${doctorCode}/${timingId}`
    );
  }

  
}

