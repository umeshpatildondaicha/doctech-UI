import { TestBed } from '@angular/core/testing';

import { PatientQueueService } from './patient-queue.service';

describe('PatientQueueService', () => {
  let service: PatientQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatientQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
