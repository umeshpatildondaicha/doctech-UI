import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecificdaydialogComponent } from './specificdaydialog.component';

describe('SpecificdaydialogComponent', () => {
  let component: SpecificdaydialogComponent;
  let fixture: ComponentFixture<SpecificdaydialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecificdaydialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecificdaydialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
