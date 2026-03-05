import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FeatureDTO {
  id: string;
  featureCode: string;
  name: string;
  description?: string;
}

export interface ServiceWithFeaturesDTO {
  id: string;
  serviceCode: string;
  name: string;
  description?: string;
  features: FeatureDTO[];
}

export interface ServiceCatalog {
  id: string;
  serviceCode: string;
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class FeatureCatalogService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Returns all services with their nested features — ideal for building grouped UI */
  getServicesWithFeatures(): Observable<ServiceWithFeaturesDTO[]> {
    return this.http.get<ServiceWithFeaturesDTO[]>(
      `${this.baseUrl}${environment.endpoints.catalog.featuresGrouped}`
    );
  }

  /** Returns the flat list of all services */
  getServices(): Observable<ServiceCatalog[]> {
    return this.http.get<ServiceCatalog[]>(
      `${this.baseUrl}${environment.endpoints.catalog.services}`
    );
  }

  createService(body: Partial<ServiceCatalog>): Observable<ServiceCatalog> {
    return this.http.post<ServiceCatalog>(
      `${this.baseUrl}${environment.endpoints.catalog.services}`, body
    );
  }

  updateService(id: string, body: Partial<ServiceCatalog>): Observable<ServiceCatalog> {
    return this.http.put<ServiceCatalog>(
      `${this.baseUrl}${environment.endpoints.catalog.services}/${id}`, body
    );
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${environment.endpoints.catalog.services}/${id}`
    );
  }
}
