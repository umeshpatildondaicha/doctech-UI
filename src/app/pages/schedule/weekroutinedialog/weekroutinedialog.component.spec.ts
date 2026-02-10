import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekroutinedialogComponent } from './weekroutinedialog.component';

describe('WeekroutinedialogComponent', () => {
  let component: WeekroutinedialogComponent;
  let fixture: ComponentFixture<WeekroutinedialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekroutinedialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeekroutinedialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
