import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpUtilService } from './http-util.service';

export interface BaseConfiguration {
  id?: number;
  configKey: string;
  configValue: string;
  configTag: string;
  applicationName: string;
  customerId: number;
  createdDate?: string;
  updatedDate?: string;
}

export interface BaseConfigFilter {
  dataType: string;
  fieldName: string;
  operation: string;
  value: string;
}

export interface BaseConfigSearchRequest {
  filters: BaseConfigFilter[];
  projection: string | null;
  ulimit: number;
  llimit: number;
  columnName: string;
  orderType: string;
  searchType: string | null;
}

// Alias for backward compatibility
export type BaseConfigDetailsRequest = BaseConfigSearchRequest;

/**
 * Injectable service for Base Configuration management
 */
@Injectable({
  providedIn: 'root',
})
export class BaseConfigurationService {
  private baseUrl = '/base/util/rest/BaseConfiguration';

  constructor(
    private http: HttpClient,
    private httpUtil: HttpUtilService
  ) {}

  /**
   * Create a new base configuration
   * @param config - The configuration to create
   * @returns Observable of the created configuration
   */
  createBaseConfiguration(config: BaseConfiguration): Observable<BaseConfiguration> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.post<BaseConfiguration>(this.baseUrl, config, options);
  }

  /**
   * Update an existing base configuration
   * @param config - The configuration to update
   * @returns Observable of the updated configuration
   */
  updateBaseConfiguration(config: BaseConfiguration): Observable<BaseConfiguration> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.put<BaseConfiguration>(this.baseUrl, config, options);
  }

  /**
   * Get base configuration by ID
   * @param id - The configuration ID
   * @returns Observable of the configuration
   */
  getBaseConfigurationById(id: number): Observable<BaseConfiguration> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.get<BaseConfiguration>(`${this.baseUrl}/${id}`, options);
  }

  /**
   * Get base configuration by tag
   * @param configKey - The configuration key
   * @param configTag - The configuration tag
   * @param appName - The application name
   * @returns Observable of the configuration
   */
  getBaseConfigByTag(
    configKey: string,
    configTag: string,
    appName: string
  ): Observable<BaseConfiguration> {
    const options = this.httpUtil.getHttpOptions();
    const url = `${this.baseUrl}/getBaseConfigByTag?configKey=${configKey}&configTag=${configTag}&appName=${appName}`;
    return this.http.get<BaseConfiguration>(url, options);
  }

  /**
   * Get base configuration by key, type and app name
   * @param key - The configuration key
   * @param configType - The configuration type
   * @param appName - The application name
   * @returns Observable of the configuration
   */
  getBaseConfigByKeyTypeApp(
    key: string,
    configType: string,
    appName: string
  ): Observable<BaseConfiguration> {
    const options = this.httpUtil.getHttpOptions();
    const url = `${this.baseUrl}/key-type-app?key=${key}&configType=${configType}&appName=${appName}`;
    return this.http.get<BaseConfiguration>(url, options);
  }

  /**
   * Get base configuration details with filters
   * @param searchRequest - The search request with filters
   * @returns Observable of configuration array
   */
  getBaseConfigurationDetails(
    searchRequest: BaseConfigSearchRequest
  ): Observable<BaseConfiguration[]> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.post<BaseConfiguration[]>(
      `${this.baseUrl}/getBaseConfigurationDetails`,
      searchRequest,
      options
    );
  }

  /**
   * Get count of base configurations matching filters
   * @param filters - Array of filters
   * @returns Observable of count
   */
  getBaseConfigurationCount(filters: BaseConfigFilter[]): Observable<number> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.post<number>(`${this.baseUrl}/count`, filters, options);
  }

  /**
   * Delete base configuration by ID
   * @param id - The configuration ID
   * @returns Observable of void
   */
  deleteBaseConfiguration(id: number): Observable<void> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.delete<void>(`${this.baseUrl}/${id}`, options);
  }

  /**
   * Get all base configurations for an application
   * @param appName - The application name
   * @param limit - Number of records to fetch
   * @param offset - Offset for pagination
   * @returns Observable of configuration array
   */
  getAllBaseConfigurations(
    appName: string = 'doctech',
    limit: number = 50,
    offset: number = 0
  ): Observable<BaseConfiguration[]> {
    const searchRequest: BaseConfigSearchRequest = {
      filters: [
        {
          dataType: 'String',
          fieldName: 'applicationName',
          operation: 'EQUALS',
          value: appName,
        },
      ],
      projection: null,
      ulimit: limit,
      llimit: offset,
      columnName: 'configKey',
      orderType: 'asc',
      searchType: null,
    };
    return this.getBaseConfigurationDetails(searchRequest);
  }

  // Convenience method aliases for component compatibility
  
  /**
   * Alias for createBaseConfiguration
   */
  create(config: BaseConfiguration): Observable<BaseConfiguration> {
    return this.createBaseConfiguration(config);
  }

  /**
   * Alias for updateBaseConfiguration
   */
  update(config: BaseConfiguration): Observable<BaseConfiguration> {
    return this.updateBaseConfiguration(config);
  }

  /**
   * Alias for deleteBaseConfiguration
   */
  delete(id: number): Observable<void> {
    return this.deleteBaseConfiguration(id);
  }

  /**
   * Alias for getBaseConfigurationById
   */
  getById(id: number): Observable<BaseConfiguration> {
    return this.getBaseConfigurationById(id);
  }

  /**
   * Alias for getBaseConfigurationCount
   */
  getCount(filters: BaseConfigFilter[]): Observable<number> {
    return this.getBaseConfigurationCount(filters);
  }
}
