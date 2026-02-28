import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FloorServicesService {
  private baseUrl = `${environment.apiUrl}/api/floors`;
  
  constructor(private httpService: HttpService) {}

  getFloors(): Observable<any> {
    return this.httpService.sendGETRequest(this.baseUrl);
  }

  createFloor(payload: any): Observable<any> {
    return this.httpService.sendPOSTRequest(this.baseUrl, payload);
  }

  updateFloor(floorId: number, payload: any): Observable<any> {
    return this.httpService.sendPUTRequest(`${this.baseUrl}/${floorId}`, payload);
  }

  deleteFloor(floorId: number): Observable<any> {
    return this.httpService.sendDELETERequest(`${this.baseUrl}/${floorId}`);
  }
}
