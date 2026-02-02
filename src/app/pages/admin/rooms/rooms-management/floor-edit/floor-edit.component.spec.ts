import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloorEditComponent } from './floor-edit.component';

describe('FloorEditComponent', () => {
  let component: FloorEditComponent;
  let fixture: ComponentFixture<FloorEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloorEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloorEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
