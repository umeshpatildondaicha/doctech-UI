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
  /**
   * Create a diet plan.
   * POST /api/doctors/{doctorCode}/diet-plans/create
   */
  createDietPlan(doctorCode: string, payload: any): Observable<any> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    return this.httpService.sendPOSTRequest(
      `${this.baseUrl}/${safeDoctor}/diet-plans/create`,
      payload
    );
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
  //Diet Plans Count
  getDietPlansCount(registrationNumber: string): Observable<number> {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/${registrationNumber}/diet-plans/count`
    );
  }

  //  Weekly Diet Plans Count
  getWeeklyDietPlansCount(registrationNumber: string): Observable<number> {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/${registrationNumber}/weekly-diet-plans/count`
    );
  }
  getDietPlanGroupsCount(registrationNumber: string): Observable<number> {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/${registrationNumber}/diet-plan-groups/count`
    );
  }

}
