import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rdvp } from './rdvp';

describe('Rdvp', () => {
  let component: Rdvp;
  let fixture: ComponentFixture<Rdvp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rdvp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rdvp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
