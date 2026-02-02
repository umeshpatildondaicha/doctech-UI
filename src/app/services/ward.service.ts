import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WardService {
   constructor(private http:HttpService){}
   getWards(){
    return this.http.sendGETRequest('https://doctech.solutions/api/wards');
   }
   createWard(payload: any): Observable<any> {
    return this.http.sendPOSTRequest(
      'https://doctech.solutions/api/wards',
      payload
    );
  }
}
