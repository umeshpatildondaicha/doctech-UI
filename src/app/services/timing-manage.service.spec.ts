import { TestBed } from '@angular/core/testing';

import { TimingManageService } from './timing-manage.service';

describe('TimingManageService', () => {
  let service: TimingManageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimingManageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
