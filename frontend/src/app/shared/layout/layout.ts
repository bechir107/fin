import { Component, inject } from '@angular/core';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ChatFab } from '../../chat-fab/chat-fab';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [Navbar, Footer, RouterOutlet, ChatFab],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  // Expose AuthService to the template for authentication checks
  public auth = inject(AuthService);
}
