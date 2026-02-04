import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BedService {
  private baseUrl = 'https://doctech.solutions/api/beds';

  constructor(private httpService: HttpService) {}

  // GET ALL BEDS
  getAllBeds(): Observable<any> {
    return this.httpService.sendGETRequest(this.baseUrl);
  }

  // GET BED BY ID
  getBedById(bedId: number): Observable<any> {
    return this.httpService.sendGETRequest(`${this.baseUrl}/${bedId}`);
  }

  // CREATE BED
  createBed(payload: any): Observable<any> {
    return this.httpService.sendPOSTRequest(this.baseUrl, payload);
  }

  // UPDATE BED
  updateBed(bedId: number, payload: any): Observable<any> {
    return this.httpService.sendPUTRequest(`${this.baseUrl}/${bedId}`, payload);
  }

  // DELETE BED
  deleteBed(bedId: number): Observable<any> {
    return this.httpService.sendDELETERequest(`${this.baseUrl}/${bedId}`);
  }
}
