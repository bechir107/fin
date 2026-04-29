import { Component, EventEmitter, Output, inject, ViewChild, ElementRef, AfterViewChecked, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { Service } from '../nut/service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrls: ['./chat-window.css'],
})
export class ChatWindow implements OnInit, AfterViewChecked {
  @Output() close = new EventEmitter<void>();
  @ViewChild('chatBody') chatBody!: ElementRef;

  messages: { from: 'user' | 'bot'; text: string; time: string }[] = [];
  currentSuggestions: string[] = [];
  input = '';
  loading = false;

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private service = inject(Service);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Message d'accueil du nutritionniste
    this.messages.push({
      from: 'bot',
      text: 'Bonjour ! 👋 Je suis NutriCare, votre assistant nutritionniste. '
        + 'Posez-moi vos questions sur la nutrition, les régimes alimentaires, '
        + 'les allergies ou la planification de repas. Je suis là pour vous aider ! 🥗',
      time: new Date().toLocaleTimeString()
    });
    this.currentSuggestions = ["Que manger pour le petit-déjeuner ?", "Comment perdre du poids ?", "Je suis allergique au gluten."];
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch (e) {}
  }

  private getUserId(): string {
    // 1. Essayer le service (login classique)
    const svcUser = this.service?.cuurrentUser;
    if (svcUser?.email) return svcUser.email;
    if (svcUser?.nom && svcUser?.prenom) return `${svcUser.nom} ${svcUser.prenom}`;

    // 2. Essayer app_user dans localStorage (login classique persisté)
    if (isPlatformBrowser(this.platformId)) {
      try {
        const appUser = localStorage.getItem('app_user');
        if (appUser) {
          const parsed = JSON.parse(appUser);
          if (parsed.email) return parsed.email;
          if (parsed.nom && parsed.prenom) return `${parsed.nom} ${parsed.prenom}`;
        }
      } catch (e) {}
    }

    // 3. Essayer Google auth
    if (this.auth.user?.email) return this.auth.user.email;
    if (this.auth.user?.name) return this.auth.user.name;

    return 'anonymous';
  }

  useSuggestion(suggestion: string) {
    this.input = suggestion;
    this.sendMessage();
  }

  private cdr = inject(ChangeDetectorRef);

  sendMessage() {
    const text = this.input && this.input.trim();
    if (!text || this.loading) return;
    const now = new Date().toLocaleTimeString();
    this.messages.push({ from: 'user', text, time: now });
    this.input = '';
    this.currentSuggestions = [];

    const userId = this.getUserId();
    this.loading = true;
    this.cdr.detectChanges(); // force UI update to show typing indicator

    this.http.post<any>('http://localhost:5000/chat', { user: userId, message: text }).subscribe({
      next: res => {
        console.log("===== REPONSE DU SERVEUR =====", res);
        this.loading = false;
        const reply = (res && res.reply) || 'Désolé, je n\'ai pas de réponse.';
        this.messages.push({ from: 'bot', text: reply, time: new Date().toLocaleTimeString() });
        if (res && res.suggestions && Array.isArray(res.suggestions)) {
          this.currentSuggestions = res.suggestions;
        }
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Chat request failed', err);
        this.loading = false;
        this.messages.push({ from: 'bot', text: 'Erreur de connexion au serveur. Veuillez réessayer.', time: new Date().toLocaleTimeString() });
        this.cdr.detectChanges();
      }
    });
  }
}
