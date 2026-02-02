import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { Observable } from 'rxjs';

export interface Room {
  roomId: number;
  roomNumber: string;
  roomType: string;
  capacity: number;
  currentOccupancy: number;
  status: string;
  floorId: number;
  floorName: string;
  floorNumber: number;
  wardId: number;
  wardName: string;
  hospitalId: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomsService {
  constructor(private http:HttpService) { 
  }
  getRoomById(id: number) {
    return this.http.sendGETRequest(`https://doctech.solutions/api/rooms/${id}`);
  }
  
  getRooms(){
    return this.http.sendGETRequest('https://doctech.solutions/api/rooms');
  }
 createdRoom(payload:any):Observable<any>{
  return this.http.sendPOSTRequest('https://doctech.solutions/api/rooms',payload);
 }

}