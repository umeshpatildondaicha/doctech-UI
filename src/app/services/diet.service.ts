import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { HttpService } from "@lk/core";
import { Observable } from "rxjs";
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DietService {

  private readonly baseUrl = `${environment.apiUrl}/api/doctors`;

  constructor(private http: HttpClient,
    private httpService: HttpService
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
  createDietPlan(payload:any):Observable<any>{
    return this.httpService.sendPOSTRequest(`${this.baseUrl}/diet-plans`,payload)
  }
  /**
   * Update a diet plan.
   * PUT /api/doctors/{doctorCode}/diet-plans/updateDietPlan/{id}
   */
  updateDietPlan(doctorCode: string, id: number, payload: any): Observable<any> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    return this.httpService.sendPUTRequest(
      `${this.baseUrl}/${safeDoctor}/diet-plans/updateDietPlan/${id}`,
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

  // DELETE
  deleteDietPlan(doctorCode: string, id: number) {
    return this.http.delete(
      `${this.baseUrl}/${doctorCode}/diet-plans/deleteDietPlan/${id}`
    );
  }

}
