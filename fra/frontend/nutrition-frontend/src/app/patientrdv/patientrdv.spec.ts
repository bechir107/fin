import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Patientrdv } from './patientrdv';

describe('Patientrdv', () => {
  let component: Patientrdv;
  let fixture: ComponentFixture<Patientrdv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Patientrdv]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Patientrdv);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
