import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiConfigService } from '@lk/core';

export interface ServiceCatalogItem {
  id: string;
  serviceCode: string;
  name: string;
  description?: string;
}

export interface FeatureCatalogItem {
  id: string;
  featureCode: string;
  name: string;
  description?: string;
  serviceId: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly apiConfig = inject(ApiConfigService);

  constructor(private readonly http: HttpService) {}

  private get apiBase(): string {
    return this.apiConfig.getApiUrl();
  }

  getServices(): Observable<ServiceCatalogItem[]> {
    const url = `${this.apiBase}/api/catalog/services`;
    return this.http.sendGETRequest(url);
  }

  getFeatures(serviceId: string): Observable<FeatureCatalogItem[]> {
    const url = `${this.apiBase}/api/catalog/features?serviceId=${encodeURIComponent(serviceId)}`;
    return this.http.sendGETRequest(url);
  }
}


