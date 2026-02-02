import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FloorServicesService {
   private baseUrl = 'https://doctech.solutions/api/floors';
  constructor(private HttpService:HttpService,
    private http :HttpClient
  ){}
  getFloors(){
    return this.HttpService.sendGETRequest('https://doctech.solutions/api/floors');
  }
  createFloor(payload :any):Observable<any>{
     return this.HttpService.sendPOSTRequest(this.baseUrl,payload);
  }
  updateFloor(floorId:number ,payload:any){
    return this.HttpService.sendPUTRequest(`${this.baseUrl}/${floorId}`,payload)
  }
   deleteFloor(floorId:number):Observable<any>{
    return this.http.delete(`${this.baseUrl}/floors/${floorId}`)
   }
}
