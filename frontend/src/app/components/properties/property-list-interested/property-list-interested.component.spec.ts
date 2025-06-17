import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyListInterestedComponent } from './property-list-interested.component';

describe('PropertyListInterestedComponent', () => {
  let component: PropertyListInterestedComponent;
  let fixture: ComponentFixture<PropertyListInterestedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyListInterestedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyListInterestedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
