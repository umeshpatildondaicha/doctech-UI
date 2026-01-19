import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEventType,
  HttpEvent,
  HttpHeaders,
  HttpBackend
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { HttpUtilService } from './http-util.service';
import { IHttpOptions, Observe, ResponseType, PayloadType } from '@lk/core';

/**
 * Injectable decorator to provide the service at the root level
 */ 
@Injectable({
  providedIn: 'root',
})

/**
 * HttpService class
 */ 
export class HttpService {

  /**
   * Creates an instance of HttpService.
   * @param http - The HttpClient instance for making HTTP requests.
   * @param httpUtil - The HttpUtilService instance for handling HTTP utilities.
   * @param coreUtils - The CoreUtilService instance for core utility functions.
   * @param httpbackend - The HttpBackend instance for handling HTTP requests.
   */
  constructor(
    private http: HttpClient, 
    private httpUtil: HttpUtilService,
    private httpbackend: HttpBackend) {
  }

  /**
   * Http GET request
   * @param url - The URL to send the GET request to.
   * @param options - The options for the GET request.
   * @returns An Observable that emits the response from the GET request.
   */
  sendGETRequest(url: string, options?: IHttpOptions): Observable<any> {
    const httpOptions = this.httpUtil.getHttpOptions(options);
    return this.http.get(url, httpOptions);
  }

  /**
   * Http GET can pass custom heeaders
   * @param url - The URL to send the GET request to. 
   * @param options - The options for the GET request.
   * @returns An Observable that emits the response from the GET request.
   */
  sendGETRequestBackend(url: string, options: any): Observable<any> {//+
    let httpClient = new HttpClient(this.httpbackend);
    return httpClient.get(url,options);
  }

  /**
   * Http DELETE request
   * @param url - The URL to send the DELETE request to.
   * @param options - The options for the DELETE request.
   * @returns An Observable that emits the response from the DELETE request.
   */
  sendDELETERequest(url: string, options?: IHttpOptions): Observable<any> {
    const httpOptions = this.httpUtil.getHttpOptions(options);
    return this.http.delete(url, httpOptions);
  }

  /**
   * Http POST request  
   * @param url - The URL to send the POST request to.
   * @param json - The payload to send in the POST request.
   * @param options - The options for the POST request.
   * @returns An Observable that emits the response from the POST request.
   */
  sendPOSTRequest(
    url: string,
    json: PayloadType,
    options?: IHttpOptions
  ): Observable<any> {
    if (
      !(json instanceof FormData) &&
      (json === '' || json === '{}' || json === '[]')
    ) {
      return throwError(new Error('Json should not be empty'));
    }
    const httpOptions = this.httpUtil.getHttpOptions(options);
    return this.http.post(url, json, httpOptions);
  }

  /**
   * Http POST can pass custom header
   * @param url - The URL to send the POST request to.
   * @param json - The payload to send in the POST request.
   * @param options - The options for the POST request.
   * @returns An Observable that emits the response from the POST request.
   */
  sendPOSTRequestBackend(
    url: string,
    json: PayloadType,
    options: any
  ): Observable<any> {
    let httpClient = new HttpClient(this.httpbackend);
    return httpClient.post(url, json, options);
  }

  /**
   * Http PUT request 
   * @param url - The URL to send the PUT request to.
   * @param json - The payload to send in the PUT request.
   * @param options - The options for the PUT request.
   * @returns An Observable that emits the response from the PUT request.
   */
  sendPUTRequest(
    url: string,
    json: PayloadType,
    options?: IHttpOptions
  ): Observable<any> {
    if (
      !(json instanceof FormData) &&
      (json === '' || json === '{}' || json === '[]')
    ) {
      return throwError(new Error('Json should not be empty'));
    }
    const httpOptions = this.httpUtil.getHttpOptions(options);
    return this.http.put(url, json, httpOptions);
  }

  /**
   * Http PATCH request
   * @param url - The URL to send the PATCH request to.
   * @param json - The payload to send in the PATCH request.
   * @param options - The options for the PATCH request.
   * @returns An Observable that emits the response from the PATCH request.
   */
  sendPATCHRequest(
    url: string,
    json: PayloadType,
    options?: IHttpOptions
  ): Observable<any> {
    if (
      !(json instanceof FormData) &&
      (json === '' || json === '{}' || json === '[]')
    ) {
      return throwError(new Error('Json should not be empty'));
    }
    const httpOptions = this.httpUtil.getHttpOptions(options);
    return this.http.patch(url, json, httpOptions);
  }


  /**
   * Http Proxy request
   * @param proxyUrl - The URL to send the proxy request to.
   * @param obj - The payload to send in the proxy request.
   * @returns An Observable that emits the response from the proxy request.
   */
    sendProxyRequest(proxyUrl: string, obj: any){
    // let keyCloakToken= this.coreUtils.getKeycloakToken();
    // let headers= { 'Authorization': `Bearer ${keyCloakToken}`}
  //   if(obj.headers){
  //     headers = Object.assign(headers, obj.headers);
  //   }
  //   let json:any={
  //     "url": obj.url,
  //     "auth":JSON.stringify(headers),
  //     "methodType": obj.methodType,
  //     "Content-Type":'application/json'
  //   }
  //   if(obj.methodType=='POST'){
  //   json['body']=JSON.stringify(obj);
  //  }
  //   return this.sendPOSTRequest(proxyUrl,json);
  }

  /**
   * upload file
   * @param url - The URL to send the upload request to.  
   * @param json - The payload to send in the upload request.
   * @param options - The options for the upload request.
   * @returns An Observable that emits the response from the upload request.
   */
  uploadFile(
    url: string,
    json: PayloadType,
    options?: IHttpOptions
  ): Observable<any> {
    const defaultOptions: IHttpOptions = {
      observe: Observe.EVENTS,
      headers: new HttpHeaders(),
      // withCredentials: true,
    };
    return this.sendPOSTRequest(url, json, {
      ...defaultOptions,
      ...options,
    }).pipe(
      filter(
        (event: HttpEvent<any>) =>
          event.type === HttpEventType.UploadProgress ||
          event.type === HttpEventType.Response
      ),
      map(this.httpUtil.getUploadProgress)
    );
  }

  /**
   * upload file and download response
   * @p aram url - The URL to send the upload request to.
   * @param json - The payload to send in the upload request.
   * @param fileName - The name of the file to download.
   * @param options - The options for the upload request.
   * @returns An Observable that emits the response from the upload request.
   */
  uploadFileAndDownloadResponse(
    url: string,
    json: PayloadType,
    fileName?: string,
    options?: IHttpOptions
  ): Observable<any> {
    const downloadFile = new Observable((observer) => {
      let contentDisposition: any = null;
      let contentType: any = null;
      const defaultOptions: IHttpOptions = {
        observe: Observe.EVENTS,
        headers: new HttpHeaders(),
        // withCredentials: true,
        responseType: ResponseType.BLOB,
      };
      defaultOptions.headers =
        options && options.headers ? options.headers : new HttpHeaders();
      this.sendPOSTRequest(url, json, {
        ...defaultOptions,
        ...options,
      })
        .pipe(
          filter(
            (event: HttpEvent<any>) =>
              event.type === HttpEventType.ResponseHeader ||
              event.type === HttpEventType.Response ||
              event.type === HttpEventType.DownloadProgress
          ),
          map(this.httpUtil.getUploadProgress)
        )
        .subscribe((response) => {
          if (response.status && response.status === 'progress') {
            // Progress event, no action needed
          } else if (
            response.type &&
            response.type === 'application/octet-stream' //HttpEventType.ResponseHeader
          ) {
            contentDisposition = 'attachment; filename="IPAddressList.xlsx"'; //response.headers.get('Content-Disposition');
            contentType = 'application/octet-stream'; //response.headers.get('content-type');
            try {
              this.httpUtil.saveDownloadedFile(
                contentDisposition,
                response,
                contentType,
                fileName
              );
              observer.next(response);
            } catch (ex) {
              observer.error(response);
            }
          } else {
            try {
              if (
                !contentType ||
                contentType === 'application/json' ||
                contentType === 'application/json;charset=UTF-8'
              ) {
                const reader = new FileReader();
                reader.addEventListener('loadend', (event: any) => {
                  const text = event.srcElement['result'];
                  if (JSON.parse(text) && JSON.parse(text).errorMsg) {
                    // Error message found, no action needed
                  } else {
                    this.httpUtil.saveDownloadedFile(
                      contentDisposition,
                      response,
                      contentType,
                      fileName
                    );
                  }
                });
                reader.readAsText(response);
              } else {
                this.httpUtil.saveDownloadedFile(
                  contentDisposition,
                  response,
                  contentType,
                  fileName
                );
              }
              observer.next(response);
            } catch (ex) {
              observer.error(response);
            }
          }
        },
        (err) => {
          observer.error(err);
        });
    });
    return downloadFile;
  }

  /**
   * downloadFile
   * @param url - The URL to send the download request to.  
   * @param fileName - The name of the file to download.
   * @param options - The options for the download request.
   * @param reportDownloadProgress - Whether to report download progress.
   * @param json - The payload to send in the download request.
   * @returns An Observable that emits the response from the download request.
   */
  downloadFile(
    url: string,
    fileName?: string,
    options?: IHttpOptions,
    reportDownloadProgress = false,
    json: PayloadType = ''
  ): Observable<any> {
    const downloadFile = new Observable((observer) => {
      let contentDisposition: any = null;
      let contentType: any = null;
      const defaultOptions: IHttpOptions = {
        reportProgress: true,
        observe: Observe.EVENTS,
        headers: new HttpHeaders(),
        responseType: json ? ResponseType.ARRAYBUFFER : ResponseType.BLOB,
        // withCredentials: true,
      };
      defaultOptions.headers =
        options && options.headers ? options.headers : new HttpHeaders();
      let urlResponse = json
        ? this.sendPOSTRequest(url, json, defaultOptions)
        : this.sendGETRequest(url, defaultOptions);
      urlResponse
        .pipe(
          filter(
            (event: HttpEvent<any>) =>
              event.type === HttpEventType.ResponseHeader ||
              event.type === HttpEventType.Response ||
              event.type === HttpEventType.DownloadProgress
          ),
          map(this.httpUtil.getDownloadProgress)
        )
        .subscribe(
          (response) => {
            if (response?.status && response.status === 'progress') {
              if (reportDownloadProgress) {
                observer.next(response);
              }
            } else if (
              response?.type &&
              response.type === HttpEventType.ResponseHeader
            ) {
              contentDisposition = response.headers.get('Content-Disposition');
              if(!contentDisposition){console.warn('Unable to access Content-Disposition')}
              contentType = response.headers.get('content-type');
              if (options && options.fileNameHeader) {
                fileName = response.headers.get(options.fileNameHeader);
              }

              if (reportDownloadProgress) {
                observer.next(response);
              }
            } else {
              try {
                if (
                  !contentType ||
                  contentType === 'application/json' ||
                  contentType === 'application/json;charset=UTF-8'
                ) {
                  const reader = new FileReader();
                  reader.addEventListener('loadend', (event: any) => {
                    const text = event.srcElement['result'];
                    if (text && JSON.parse(text) && JSON.parse(text).errorMsg) {
                      // Error message found, no action needed
                    } else {
                      this.httpUtil.saveDownloadedFile(
                        contentDisposition,
                        response,
                        contentType,
                        fileName
                      );
                    }
                  });
                  reader.readAsText(response);
                } else {
                  this.httpUtil.saveDownloadedFile(
                    contentDisposition,
                    response,
                    contentType,
                    fileName
                  );
                }
                observer.next(response);
              } catch (ex) {
                observer.error(response);
              }
            }
          },
          (err) => {
            observer.error(err);
          }
        );
    });
    return downloadFile;
  }

  //Dont use Method "downloadFileByPostRequest" both get/post request support provided in downloadFile method.
  /**
   * download file by post request
   * @param url - The URL to send the download request to.
   * @param json - The payload to send in the download request.
   * @param fileName - The name of the file to download.
   * @param options - The options for the download request.
   * @returns An Observable that emits the response from the download request.
   */
  downloadFileByPostRequest(
    url: string,
    json: PayloadType,
    fileName?: string,
    options?: IHttpOptions
  ) {
    const downloadFile = new Observable((observer) => {
      let contentDisposition: any = null;
      let contentType: any = null;
      const defaultOptions: IHttpOptions = {
        reportProgress: true,
        observe: Observe.EVENTS,
        responseType: ResponseType.ARRAYBUFFER,
        headers: new HttpHeaders(),
        // withCredentials: true,
      };
      defaultOptions.headers =
        options && options.headers ? options.headers : new HttpHeaders();
      this.sendPOSTRequest(url, json, defaultOptions)
        .pipe(
          filter(
            (event: HttpEvent<any>) =>
              event.type === HttpEventType.ResponseHeader ||
              event.type === HttpEventType.Response ||
              event.type === HttpEventType.DownloadProgress
          ),
          map(this.httpUtil.getDownloadProgress)
        )
        .subscribe((response) => {
          if (response?.status && response.status === 'progress') {
            // Progress event, no action needed
          } else if (
            response.type &&
            response.type === HttpEventType.ResponseHeader
          ) {
            contentDisposition = response.headers.get('Content-Disposition');
            contentType = response.headers.get('content-type');
          } else {
            try {
              if (
                !contentType ||
                contentType === 'application/json' ||
                contentType === 'application/json;charset=UTF-8'
              ) {
                const reader = new FileReader();
                reader.addEventListener('loadend', (event: any) => {
                  const text = event.srcElement['result'];
                  if (JSON.parse(text) && JSON.parse(text).errorMsg) {
                    // Error message found, no action needed
                  } else {
                    this.httpUtil.saveDownloadedFile(
                      contentDisposition,
                      response,
                      contentType,
                      fileName
                    );
                  }
                });
                reader.readAsText(response);
              } else {
                this.httpUtil.saveDownloadedFile(
                  contentDisposition,
                  response,
                  contentType,
                  fileName
                );
              }
              observer.next(response);
            } catch (ex) {
              observer.error(response);
            }
          }
        });
    });
    return downloadFile;
  }

  /**
   * download file by location
   * @param url - The URL to send the download request to.  
   */
  downloadFileByLocation(url: string) {
    const downloadUrl =
      window.location.protocol + '//' + window.location.hostname + '/' + url;
    window.location.href = downloadUrl;
  }
}
