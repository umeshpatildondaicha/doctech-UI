import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WardService {
  private baseUrl = `${environment.apiUrl}/api/wards`;

  constructor(private http: HttpService) {}

  getWards(): Observable<any> {
    return this.http.sendGETRequest(this.baseUrl);
  }

  createWard(payload: any): Observable<any> {
    return this.http.sendPOSTRequest(this.baseUrl, payload);
  }

  updateWard(wardId: number, payload: any): Observable<any> {
    return this.http.sendPUTRequest(`${this.baseUrl}/${wardId}`, payload);
  }

  deleteWard(wardId: number): Observable<any> {
    return this.http.sendDELETERequest(`${this.baseUrl}/${wardId}`);
  }
}
