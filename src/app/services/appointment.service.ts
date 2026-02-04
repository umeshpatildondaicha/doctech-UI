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
  
}
