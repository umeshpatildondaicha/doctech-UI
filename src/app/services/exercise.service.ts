import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private baseUrl = `${environment.apiUrl}/api`
  constructor(private httpService :HttpService){}
   getIndividualExerciseCount(){
    return this.httpService.sendGETRequest(`${this.baseUrl}/exercise/count`);
   }
   getGroupExercisesCount() {
    return this.httpService.sendGETRequest(
      `${this.baseUrl}/exercise-group/count`
    );
  }
}
