import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Createacc } from './createacc';

describe('Createacc', () => {
  let component: Createacc;
  let fixture: ComponentFixture<Createacc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Createacc]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Createacc);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
