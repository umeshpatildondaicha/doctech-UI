import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { HttpService } from "@lk/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class DietService {

  private baseUrl = 'https://doctech.solutions/api/doctors';

  constructor(private http: HttpClient,
    private httpService :HttpService
  ) {}
  getWeeklyDietPlans(doctorCode:string){
    return this.http.get<any>(
      `${this.baseUrl}/${doctorCode}/weekly-diet-plans`
    )
    
  }
  getAllDietPlanGroups(doctorCode: string) {
    return this.http.get<any>(
      `${this.baseUrl}/${doctorCode}/diet-plan-groups/getAllDietPlanGroups`
    );
  }
  // CREATE
  createDietPlan(doctorCode:string ,payload:any):Observable<any>{
    return this.httpService.sendPOSTRequest(`${this.baseUrl}/${doctorCode}/diet-plans`,payload)
  }
  updateDiet(dietId: number, payload: any) {
    return this.httpService.sendPUTRequest(
      `${this.baseUrl}/diet-plans/${dietId}`,
      payload
    );
  }
  getDietPlanById(doctorCode: string, dietId: number): Observable<any> {
    const url = `${this.baseUrl}/${doctorCode}/diet-plans/${dietId}`;
    return this.http.get<any>(url);
  }
  getWeeklyDietPlansCount(registrationNumber: string): Observable<any> {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/${registrationNumber}/weekly-diet-plans/count`
    );
  }
  // ✅ GET TOTAL DIET COUNT

getDietPlansCount(registrationNumber: string): Observable<any> {
  return this.httpService.sendGETRequest(
    `${this.baseUrl}/${registrationNumber}/diet-plans/count`
  );
}


  // LIST
  getDietPlans(doctorCode: string) {
    return this.http.get<any>(
      `${this.baseUrl}/${doctorCode}/diet-plans`
    );
  }


  // UPDATE
  updateDietPlan(doctorCode: string, id: number, payload: any) {
    return this.http.put(
      `${this.baseUrl}/${doctorCode}/diet-plans/updateDietPlan/${id}`,
      payload
    );
  }

  // DELETE
  deleteDietPlan(doctorCode: string, id: number) {
    return this.http.delete(
      `${this.baseUrl}/${doctorCode}/diet-plans/deleteDietPlan/${id}`
    );
  }

}
