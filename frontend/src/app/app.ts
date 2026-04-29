import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatFab } from './chat-fab/chat-fab';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ChatFab],
  template: `<router-outlet></router-outlet><app-chat-fab></app-chat-fab>`
})
export class App {}