import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminActionBarComponent } from './admin-action-bar.component';

describe('AdminActionBarComponent', () => {
  let component: AdminActionBarComponent;
  let fixture: ComponentFixture<AdminActionBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminActionBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminActionBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
