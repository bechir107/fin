import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientC } from './patient';

describe('Patient', () => {
  let component: PatientC;
  let fixture: ComponentFixture<PatientC>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientC]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientC);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
