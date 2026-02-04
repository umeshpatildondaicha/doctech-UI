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
  private baseUrl = 'https://doctech.solutions/api/rooms';

  constructor(private http: HttpService) {}

  getRoomById(id: number): Observable<any> {
    return this.http.sendGETRequest(`${this.baseUrl}/${id}`);
  }
  
  getRooms(): Observable<any> {
    return this.http.sendGETRequest(this.baseUrl);
  }

  createRoom(payload: any): Observable<any> {
    return this.http.sendPOSTRequest(this.baseUrl, payload);
  }

  updateRoom(roomId: number, payload: any): Observable<any> {
    return this.http.sendPUTRequest(`${this.baseUrl}/${roomId}`, payload);
  }

  deleteRoom(roomId: number): Observable<any> {
    return this.http.sendDELETERequest(`${this.baseUrl}/${roomId}`);
  }
}