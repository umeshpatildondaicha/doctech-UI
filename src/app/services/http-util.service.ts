import { Injectable } from '@angular/core';
import {
  HttpHeaders,
  HttpEventType,
  HttpParams,
  HttpEvent,
} from '@angular/common/http';
import { IULDLProgressInfo, IHttpOptions, ResponseType, Observe } from '@lk/core';

/**
 * Injectable service for HTTP utilities
 */
@Injectable({
  providedIn: 'root',
})
/**
 * HttpUtilService
 */
export class HttpUtilService {
  /**
   * constructor
   */
  constructor() {}

  /**
   * Gets the upload progress
   * @param event - The HTTP event
   * @returns The upload progress
   */
  getUploadProgress(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        const progress = Math.round((100 * event.loaded) / (event.total?? 1));
        return { status: 'progress', message: progress };
      case HttpEventType.Response:
        return event.body;
      default:
        return `Unhandled event: ${event.type}`;
    }
  }

  /**
   * Gets the download progress
   * @param event - The HTTP event
   * @returns The download progress
   */
  getDownloadProgress(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.ResponseHeader:
        return { headers: event.headers, type: event.type };
      case HttpEventType.DownloadProgress:
        const progress = Math.round((100 * event.loaded) / 100);
        return { status: 'progress', message: progress };
      case HttpEventType.Response:
        return event.body;
      default:
        return `Unhandled event: ${event.type}`;
    }
  }

  /**
   * Saves a downloaded file
   * @param content - The content of the file
   * @param response - The response from the server
   * @param contentType - The content type of the file
   * @param filename - The name of the file
   * @returns The name of the file
   */
  saveDownloadedFile(
    content: any,
    response: any,
    contentType: string,
    filename?: any
  ): string | null {
    const linkElement = document.createElement('a');
    try {
      let blob = null;
      let url = null;
      blob = new Blob([response], {
        type: contentType,
      });
      if (!filename) {
        if (content?.includes("filename*=utf-8''")) {
          let tempData = content.split(';');
          let fName = '';
          tempData.forEach((item: any) => {
            if (
              item?.includes("filename*=utf-8''") &&
              item.split("filename*=utf-8''").length > 0
            ) {
              fName = decodeURI(item.split("filename*=utf-8''")[1]);
            }
          });
          filename = fName;
        } else {
          filename = content ? content.split('=')[1] : null;
          filename = filename ? filename.split(';')[0] : null;
          filename = filename ? filename.trim() : null;
          if (filename && filename.indexOf('"') > -1) {
            filename = filename.replace(/"/g, '');
          }
        }
        if (!content && !filename) {
          filename = "data";
        }
      }
      if (filename) {
        filename = decodeURIComponent(encodeURI(filename));
        url = window.URL.createObjectURL(blob);
        linkElement.setAttribute('href', url);
        linkElement.setAttribute('download', filename);
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: false,
        });
        linkElement.dispatchEvent(clickEvent);
        return filename;
      } else {
        return null;
      }
    } catch (ex) {
      return ex instanceof Error ? ex.message : 'Unknown error';
    }
  }

  /**
   * Gets the download upload progress box
   * @param type - The type of the file
   * @param url - The URL of the file
   * @param fileName - The name of the file
   * @returns The download upload progress box
   */
  getDownloadUploadProgressBox(type: string, url: string, fileName?: string) {
    const uldlData: IULDLProgressInfo = {};
    uldlData.url = url;
    uldlData.type = type;
    uldlData.size = 0;
    uldlData.progress = 0;
    uldlData.fileName = fileName ? fileName : undefined;
    return uldlData;
  }

  /**
   * Gets the HTTP options (defaults to JSON; typed for JSON for use with typed HttpClient).
   * When passing responseType: ARRAYBUFFER/BLOB/TEXT, cast the result to the appropriate
   * options type at the HttpClient call site if needed.
   * @param options - The HTTP options
   * @returns The HTTP options
   */
  getHttpOptions(options: IHttpOptions = {}): {
    headers: HttpHeaders;
    params: HttpParams;
    observe: 'body';
    reportProgress: boolean;
    responseType?: 'json';
  } {
    const {
      headers = {},
      observe = Observe.BODY,
      reportProgress = false,
      responseType = ResponseType.JSON,
      // withCredentials = true,
      params = new HttpParams(),
    } = options;
    return {
      headers: this.getHttpHeaders(headers),
      params: params,
      observe: observe as 'body',
      reportProgress: reportProgress,
      responseType: responseType as 'json' | 'arraybuffer' | 'blob' | 'text',
      // withCredentials: withCredentials,
    } as {
      headers: HttpHeaders;
      params: HttpParams;
      observe: 'body';
      reportProgress: boolean;
      responseType?: 'json';
    };
  }

  /**
   * Gets the HTTP headers
   * @param headers 
   * @returns HttpHeaders
   */
  getHttpHeaders(headers: any): HttpHeaders {
    if (headers instanceof HttpHeaders) {
      return headers;
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      // withCredentials: 'true',
      // "Access-Control-Allow-Origin" : "*",
      ...headers,
    });
  }

  /**
   * Handles an error
   * @param err - The error
   */
  errorHandler(err: any) {
    if (err.error instanceof Error) {
      // A client-side or network error occurred.
      // this.messageBox.error('client side error: ' + err.error.message);
    } else {
      // Backend returns unsuccessful response codes such as 404, 500 etc.
      if (
        err &&
        err.error &&
        (err.error.code === -4 ||
          err.error.code === -5 ||
          err.error.code === -6 ||
          (err.error.hasOwnProperty('errors') &&
            err.error.errors &&
            err.error.errors.length))
      ) {
        this.showServeError(err.error);
        return;
      }
    }
  }

  /**
   * Shows a server error
   * @param err - The error
   */
  private showServeError(err: any) {
    if (err.hasOwnProperty('errors') && err.errors && err.errors.length) {
      // this.messageBox.error(err.errors[0]);
    }
  }

  /**
   * showLoader
   */
  showLoader(): void {
    // this.loader.show();
  }

  /**
   * hideLoader
   */
  hideLoader(): void {
    // this.loader.hide();
  }
}
