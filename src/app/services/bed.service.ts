import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BedService {
   private baseUrl ='https://doctech.solutions/api';

  constructor(private http: HttpClient) {}

  // GET ALL BEDS
  getAllBeds() {
    return this.http.get<any>(`${this.baseUrl}/beds`);
  }
}
