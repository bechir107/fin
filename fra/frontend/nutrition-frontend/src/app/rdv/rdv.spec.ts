import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rdv } from './rdv';

describe('Rdv', () => {
  let component: Rdv;
  let fixture: ComponentFixture<Rdv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rdv]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rdv);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
