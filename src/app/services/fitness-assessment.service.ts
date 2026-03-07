import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface FitnessAssessmentDTO {
  id?: number;
  // Personal
  fullName?: string;
  mobileNumber?: string;
  emailAddress?: string;
  gender?: string;
  dateOfBirth?: string;
  // Health
  weightFluctuations?: boolean;
  physicianRecommendation?: boolean;
  hasAddictions?: boolean;
  healthTherapistInfo?: string;
  healthConditions?: string[];
  // Dietary
  mealsPerDay?: number;
  waterGlassesPerDay?: number;
  // Goals
  goalRatings?: Record<string, number>;
  mainFitnessGoal?: string;
  // Body
  age?: number;
  height?: number;
  weight?: number;
  neckCircumference?: number;
  chestCircumference?: number;
  bicepCircumference?: number;
  forearmCircumference?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  thighCircumference?: number;
  calfCircumference?: number;
  // Fitness Testing
  stepTestSteps?: number;
  stepTestHeartRate?: number;
  sitAndReachTest1?: number;
  sitAndReachTest2?: number;
  sitAndReachTest3?: number;
  kneePushUps?: number;
  plankSeconds?: number;
  wallSitSeconds?: number;
  // Metadata
  submittedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class FitnessAssessmentService {
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpService) {}

  /** GET /api/patients/{publicId}/fitness-assessments/latest */
  getLatest(patientPublicId: string): Observable<FitnessAssessmentDTO> {
    return this.http.sendGETRequest(
      `${this.baseUrl}/patients/${patientPublicId}/fitness-assessments/latest`
    );
  }

  /** GET /api/patients/{publicId}/fitness-assessments */
  listAll(patientPublicId: string): Observable<FitnessAssessmentDTO[]> {
    return this.http.sendGETRequest(
      `${this.baseUrl}/patients/${patientPublicId}/fitness-assessments`
    );
  }
}
