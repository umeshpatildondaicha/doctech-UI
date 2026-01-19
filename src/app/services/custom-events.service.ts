import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CoreEventService {

  breadcrumbEvent = new EventEmitter<any>();
  
  constructor() { }
}
