import { TestBed } from '@angular/core/testing';

import { CoreEventService } from './custom-events.service';

describe('CoreEventService', () => {
  let service: CoreEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoreEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
