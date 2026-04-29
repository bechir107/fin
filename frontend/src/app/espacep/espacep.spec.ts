import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Espacep } from './espacep';

describe('Espacep', () => {
  let component: Espacep;
  let fixture: ComponentFixture<Espacep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Espacep]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Espacep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
