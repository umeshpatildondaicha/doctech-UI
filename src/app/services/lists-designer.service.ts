import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiConfigService, PayloadType } from '@lk/core';

/**
 * Module reference within a data grid config (sample response structure)
 */
export interface DataGridModule {
  creatorId?: number;
  creatorName?: string;
  creationTime?: number;
  lastModifierId?: number;
  lastModifierName?: string;
  modificationTime?: number;
  id?: number;
  uuid?: string;
  name?: string;
  displayName?: string;
  category?: string;
  moduleType?: string;
  isApplication?: boolean;
  appName?: string;
  appUsageType?: string;
  enabled?: boolean;
  deleted?: boolean;
  description?: string;
  iconName?: string;
  icon?: string | null;
  endpointUrl?: string | null;
}

/**
 * Data grid configuration (lists designer) - matches sample API response
 */
export interface DataGridConfig {
  creatorId?: number;
  creatorName?: string;
  creationTime?: number;
  lastModifierId?: number;
  lastModifierName?: string;
  modificationTime?: number;
  id?: number;
  dataGridName?: string;
  applicationPackage?: string;
  module?: DataGridModule;
  isDeleted?: boolean;
  displayName?: string;
  savegridchoice?: string | null;
  mode?: string | null;
  view?: string | null;
  deviceType?: string | null;
  subList?: string | null;
  gridScope?: string | null;
  copiedBy?: number | null;
  cruTag?: string | null;
  nameAndModule?: string | null;
}

/**
 * Filter for querying data grid configs (same pattern as base config)
 */
export interface DataGridFilter {
  dataType: string;
  fieldName: string;
  operation: string;
  value: string;
}

/**
 * Request payload for getDataGridDetails
 */
export interface DataGridDetailsRequest {
  filters: DataGridFilter[];
  projection: string | null;
  ulimit: number;
  llimit: number;
  columnName: string;
  orderType: 'asc' | 'desc';
  searchType: string | null;
}

@Injectable({ providedIn: 'root' })
export class ListsDesignerService {
  private readonly apiConfig = inject(ApiConfigService);

  constructor(private readonly http: HttpService) {}

  private get apiBase(): string {
    return this.apiConfig.getApiUrl();
  }

  /** Base URL for data grid config API - adjust when backend endpoint is ready */
  private get baseUrl(): string {
    return `${this.apiBase}/base/util/rest/DataGrid`;
  }

  /**
   * Get data grid configurations with filters and pagination
   * POST .../DataGrid/getDataGridDetails (or equivalent)
   */
  getDataGridDetails(request: DataGridDetailsRequest): Observable<DataGridConfig[]> {
    return this.http.sendPOSTRequest(
      `${this.baseUrl}/getDataGridDetails`,
      request as unknown as PayloadType
    );
  }

  /**
   * Get count of data grid configs matching filters
   * POST .../DataGrid/count
   */
  getCount(filters: DataGridFilter[]): Observable<number> {
    return this.http.sendPOSTRequest(
      `${this.baseUrl}/count`,
      filters as unknown as PayloadType
    );
  }

  /**
   * Get a single data grid config by ID
   * GET .../DataGrid/{id}
   */
  getById(id: number): Observable<DataGridConfig> {
    return this.http.sendGETRequest(`${this.baseUrl}/${id}`);
  }
}
