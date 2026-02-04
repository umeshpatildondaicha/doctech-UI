import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';
import { Patient } from '../interfaces/patient.interface';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private baseUrl ='https://doctech.solutions/api';
  constructor(private httpService: HttpService) {}
  getPatients():Observable<any>{
    return this.httpService.sendGETRequest(`${this.baseUrl}/patients`);
  }

  createPatient(payload: any): Observable<any> {
    return this.httpService.sendPOSTRequest(`${this.baseUrl}/patients`, payload);
  }
  updatePatient(patientId:number,payload:any):Observable<any>{
    return this.httpService.sendPUTRequest(`${this.baseUrl}/patients/${patientId}`,payload);
  }
  deletePatient(PatientId:number):Observable<any>{
    return this.httpService.sendDELETERequest(`${this.baseUrl}/patients/${PatientId}`)
  }
}