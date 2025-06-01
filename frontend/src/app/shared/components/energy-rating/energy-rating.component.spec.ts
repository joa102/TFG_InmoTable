import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergyRatingComponent } from './energy-rating.component';

describe('EnergyRatingComponent', () => {
  let component: EnergyRatingComponent;
  let fixture: ComponentFixture<EnergyRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergyRatingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnergyRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
