import { TestBed } from '@angular/core/testing';

import { FloorServicesService } from './floor-services.service';

describe('FloorServicesService', () => {
  let service: FloorServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FloorServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
