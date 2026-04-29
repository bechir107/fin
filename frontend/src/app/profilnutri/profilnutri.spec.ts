import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Profilnutri } from './profilnutri';

describe('Profilnutri', () => {
  let component: Profilnutri;
  let fixture: ComponentFixture<Profilnutri>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profilnutri]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Profilnutri);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
