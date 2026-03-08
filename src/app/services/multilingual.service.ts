import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpUtilService } from './http-util.service';
import { environment } from '../../environments/environment';

export interface MultiLingualConfiguration {
  id?: number;
  lingualKey: string;
  defaultValue?: string;
  value: string;
  languageType: string;
  category?: string;
  appName: string;
  isDeleted?: boolean;
  createdTime?: string;
  modifiedTime?: string;
  creator?: string;
  lastModifier?: string;
}

export interface MultiLingualFilter {
  dataType?: string;
  fieldName: string;
  operation: string;
  value: string;
}

export interface MultiLingualDataRequest {
  filters: MultiLingualFilter[];
  projection: string[] | null;
  uLimit: number;
  lLimit: number;
  orderByColumnName: string;
  orderType: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
];

@Injectable({
  providedIn: 'root',
})
export class MultilingualService {
  private readonly baseUrl = `${environment.apiUrl}/api/multilingual`;
  private readonly dataUrl = `${environment.apiUrl}/api/multilingual/data`;

  /** Currently active language code; all components can subscribe */
  private readonly activeLang$ = new BehaviorSubject<string>(
    environment.ui.defaultLanguage || 'en'
  );

  /** In-memory label cache: languageCode -> (key -> value) */
  private labelCache: Record<string, Record<string, string>> = {};

  constructor(
    private readonly http: HttpClient,
    private readonly httpUtil: HttpUtilService
  ) {}

  // ─── Language State ────────────────────────────────────────────────────────

  get activeLanguage$(): Observable<string> {
    return this.activeLang$.asObservable();
  }

  get activeLanguage(): string {
    return this.activeLang$.value;
  }

  setLanguage(code: string): void {
    this.activeLang$.next(code);
  }

  // ─── Label Loading (GET) ───────────────────────────────────────────────────

  /**
   * Load all labels for an app + language combo (used at app bootstrap / lang switch).
   * Results are cached in memory.
   */
  loadLabels(appName = 'DocTech', language?: string): Observable<Record<string, string>> {
    const lang = language ?? this.activeLanguage;
    const url = `${this.baseUrl}?appName=${encodeURIComponent(appName)}&language=${encodeURIComponent(lang)}`;
    return this.http
      .get<Record<string, string>>(url)
      .pipe(tap((labels) => (this.labelCache[lang] = labels)));
  }

  /** Get a single label from the cache (falls back to the key itself) */
  getLabel(key: string, language?: string): string {
    const lang = language ?? this.activeLanguage;
    return this.labelCache[lang]?.[key] ?? key;
  }

  // ─── Admin CRUD (POST /data) ───────────────────────────────────────────────

  /**
   * Fetch configurations with filters for admin list.
   * Returns map: appName -> { lingualKey -> value }
   */
  getMultiLingualData(
    request: MultiLingualDataRequest
  ): Observable<Record<string, Record<string, string>>> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.post<Record<string, Record<string, string>>>(
      this.dataUrl,
      request,
      options
    );
  }

  /**
   * Fetch flat list of MultiLingualConfiguration entries for a given app + language.
   */
  getEntries(
    appName = 'DocTech',
    language?: string,
    search?: string,
    uLimit = 50,
    lLimit = 0
  ): Observable<MultiLingualConfiguration[]> {
    const lang = language ?? this.activeLanguage;
    const filters: MultiLingualFilter[] = [
      { fieldName: 'appName', operation: 'EQUALS', value: appName },
      { fieldName: 'languageType', operation: 'EQUALS', value: lang },
    ];
    if (search?.trim()) {
      filters.push({ fieldName: 'lingualKey', operation: 'LIKE', value: search.trim() });
    }
    const request: MultiLingualDataRequest = {
      filters,
      projection: null,
      uLimit,
      lLimit,
      orderByColumnName: 'lingualKey',
      orderType: 'ASC',
    };
    // The /data endpoint returns Map<appName, Map<key, value>>.
    // We call a dedicated flat-list approach via the GET endpoint below.
    const url = `${this.baseUrl}?appName=${encodeURIComponent(appName)}&language=${encodeURIComponent(lang)}`;
    return this.http.get<MultiLingualConfiguration[]>(url, this.httpUtil.getHttpOptions());
  }

  /**
   * Create a new translation key with multiple languages (e.g. English + Hindi).
   * Calls POST /api/multilingual/entries.
   */
  createTranslationKey(request: {
    messageKey: string;
    moduleName?: string | null;
    description?: string | null;
    appName: string;
    translations: Record<string, string>;
  }): Observable<MultiLingualConfiguration[]> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.post<MultiLingualConfiguration[]>(`${this.baseUrl}/entries`, request, options);
  }

  /**
   * Create a single new translation entry (one language).
   */
  createEntry(entry: Omit<MultiLingualConfiguration, 'id'>): Observable<MultiLingualConfiguration> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.post<MultiLingualConfiguration>(this.baseUrl + '/entry', entry, options);
  }

  /**
   * Update a translation entry by ID.
   */
  updateEntry(entry: MultiLingualConfiguration): Observable<MultiLingualConfiguration> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.put<MultiLingualConfiguration>(
      `${this.baseUrl}/entry/${entry.id}`,
      entry,
      options
    );
  }

  /**
   * Delete a translation entry by ID.
   */
  deleteEntry(id: number): Observable<void> {
    const options = this.httpUtil.getHttpOptions();
    return this.http.delete<void>(`${this.baseUrl}/entry/${id}`, options);
  }
}
