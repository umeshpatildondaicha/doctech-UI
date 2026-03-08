import { TestBed } from '@angular/core/testing';

import { BillingservicesService } from './billingservices.service';

describe('BillingservicesService', () => {
  let service: BillingservicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillingservicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
