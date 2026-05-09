import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatFab } from './chat-fab';

describe('ChatFab', () => {
  let component: ChatFab;
  let fixture: ComponentFixture<ChatFab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatFab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatFab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
