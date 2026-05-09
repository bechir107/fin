import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ChatWindow } from './chat-window';
import { Service } from '../nut/service';

@Component({
  selector: 'app-chat-fab',
  standalone: true,
  imports: [CommonModule, ChatWindow],
  templateUrl: './chat-fab.html',
  styleUrls: ['./chat-fab.css'],
})
export class ChatFab {
  public auth = inject(AuthService);
  public service = inject(Service);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  open = false;

  get isVisible(): boolean {
    if (this.router.url.includes('/login') || this.router.url === '/') {
      return false;
    }
    try {
      const hasLocal = isPlatformBrowser(this.platformId) && !!localStorage.getItem('app_user');
      return !!(this.auth && this.auth.isLoggedIn) || !!this.service?.cuurrentUser || hasLocal;
    } catch (e) {
      return !!(this.auth && this.auth.isLoggedIn) || !!this.service?.cuurrentUser;
    }
  }

  ngOnInit(): void {
    try {
      if (isPlatformBrowser(this.platformId)) {
        console.log('[ChatFab] init: auth.isLoggedIn=', this.auth?.isLoggedIn, 'service.cuurrentUser=', this.service?.cuurrentUser, 'local app_user=', localStorage.getItem('app_user'));
      }
    } catch (e) {
      console.log('[ChatFab] init: error reading state', e);
    }
  }

  toggle() { this.open = !this.open; }
  close() { this.open = false; }
}
