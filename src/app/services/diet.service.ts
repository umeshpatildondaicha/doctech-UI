import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { HttpService } from "@lk/core";

@Injectable({ providedIn: 'root' })
export class DietService {

  private baseUrl = 'https://doctech.solutions/api/doctors';

  constructor(private http: HttpClient) {}
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
  createDietPlan(doctorCode: string, payload: any) {
    return this.http.post(
      `${this.baseUrl}/${doctorCode}/diet-plans/create`,
      payload
    );
  }

  // LIST
  getDietPlans(doctorCode: string) {
    return this.http.get<any>(
      `${this.baseUrl}/${doctorCode}/diet-plans`
    );
  }

  // VIEW
  getDietPlanById(doctorCode: string, id: number) {
    return this.http.get(
      `${this.baseUrl}/${doctorCode}/diet-plans/getDietPlan/${id}`
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
