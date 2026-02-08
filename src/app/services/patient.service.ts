import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Patient } from '../interfaces/patient.interface';

/** Response shape for GET /api/patients/doctor/{doctorCode}/connected */
export interface DoctorConnectedPatientDTO {
  publicId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  contact?: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private baseUrl = `${environment.apiUrl}/api`;
  constructor(private httpService: HttpService) {}

  getPatients(): Observable<any> {
    return this.httpService.sendGETRequest(`${this.baseUrl}/patients`);
  }

  /**
   * Get list of patients connected to the doctor (by link or appointments).
   * Use this as the "patients I can chat with" list.
   * GET /api/patients/doctor/{doctorCode}/connected
   */
  getConnectedPatients(doctorCode: string): Observable<DoctorConnectedPatientDTO[]> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    return this.httpService.sendGETRequest(`${this.baseUrl}/patients/doctor/${safeDoctor}/connected`);
  }

  createPatient(payload: any): Observable<any> {
    return this.httpService.sendPOSTRequest(`${this.baseUrl}/patients`, payload);
  }
  updatePatient(patientId: number, payload: any): Observable<any> {
    return this.httpService.sendPUTRequest(`${this.baseUrl}/patients/${patientId}`, payload);
  }
  deletePatient(PatientId: number): Observable<any> {
    return this.httpService.sendDELETERequest(`${this.baseUrl}/patients/${PatientId}`);
  }
}