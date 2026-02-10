import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyBaseDialogComponent } from './daily-base-dialog.component';

describe('DailyBaseDialogComponent', () => {
  let component: DailyBaseDialogComponent;
  let fixture: ComponentFixture<DailyBaseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyBaseDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyBaseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
