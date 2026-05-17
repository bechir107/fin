import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Disponibilite } from './disponibilite';

describe('Disponibilite', () => {
  let component: Disponibilite;
  let fixture: ComponentFixture<Disponibilite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Disponibilite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Disponibilite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
