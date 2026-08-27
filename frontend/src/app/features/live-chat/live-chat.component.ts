import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ChatService } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatSession, ChatMessage, MessageSender } from '../../core/models/models';

@Component({
  selector: 'app-live-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BentoCardComponent, BadgeComponent],
  template: `
    <app-navbar title="Bandeja de Entrada & Live Chat" subtitle="Atención en vivo y toma de control del bot"></app-navbar>

    <div class="mt-4 sm:mt-6 h-[calc(100vh-130px)] sm:h-[calc(100vh-160px)] rounded-2xl md:rounded-3xl overflow-hidden bg-white border border-zinc-200/90 grid grid-cols-1 md:grid-cols-12 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_20px_rgba(0,0,0,0.05)]">
      
      <!-- Left Column: Conversations List -->
      <div [class]="'md:col-span-4 border-r border-zinc-200/80 flex flex-col h-full bg-zinc-50/50 ' + (activeSession() && isMobileView() ? 'hidden md:flex' : 'flex')">
        <!-- Search chats -->
        <div class="p-3.5 border-b border-zinc-200/80 bg-white">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar por cliente o teléfono..."
              class="input-bento pl-9 py-2 text-xs"
            />
            <svg class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Conversations Scroll -->
        <div class="flex-1 overflow-y-auto divide-y divide-zinc-100/80">
          @for (session of filteredSessions(); track session.id) {
            <button
              (click)="selectSession(session)"
              [class]="'w-full p-3.5 sm:p-4 text-left flex items-start gap-3 transition-all hover:bg-zinc-100/70 ' + (activeSession()?.id === session.id ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-sm' : '')"
            >
              <!-- Avatar -->
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-100 to-indigo-50 border border-indigo-200/80 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0 shadow-sm">
                {{ (session.customerName || session.customerPhone).substring(0, 2).toUpperCase() }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-0.5">
                  <h4 class="font-bold text-zinc-900 text-xs truncate">
                    {{ session.customerName || session.customerPhone }}
                  </h4>
                  <span class="text-[10px] font-mono text-zinc-400">
                    {{ session.lastInteraction | date: 'shortTime' }}
                  </span>
                </div>

                <p class="text-[11px] text-zinc-500 font-mono truncate">
                  +{{ session.customerPhone }}
                </p>

                <!-- Bot Status & Unread Badge -->
                <div class="flex items-center justify-between mt-1.5">
                  @if (session.isBotActive) {
                    <span class="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70">
                      <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      Bot Activo
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Agente Humano
                    </span>
                  }

                  @if (session.unreadCount > 0) {
                    <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                      {{ session.unreadCount }}
                    </span>
                  }
                </div>
              </div>
            </button>
          } @empty {
            <div class="p-8 text-center text-zinc-400 text-xs">
              No hay conversaciones registradas.
            </div>
          }
        </div>
      </div>

      <!-- Right Column: Active Conversation -->
      <div [class]="'md:col-span-8 flex flex-col h-full bg-[#F8F9FB] ' + (!activeSession() && isMobileView() ? 'hidden md:flex' : 'flex')">
        @if (activeSession()) {
          <!-- Chat Header -->
          <div class="p-3 sm:p-3.5 px-3 sm:px-5 border-b border-zinc-200/80 flex items-center justify-between bg-white">
            <div class="flex items-center gap-2 sm:gap-3">
              <!-- Back button on mobile -->
              <button
                (click)="activeSession.set(null)"
                aria-label="Volver a la lista de chats"
                class="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 md:hidden transition-colors"
                title="Volver a la lista de chats"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div class="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs sm:text-sm border border-indigo-200/70 shadow-sm">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div class="min-w-0 max-w-[140px] sm:max-w-none">
                <h3 class="font-bold text-zinc-900 text-xs sm:text-sm truncate">
                  {{ activeSession()?.customerName || activeSession()?.customerPhone }}
                </h3>
                <p class="text-[10px] sm:text-[11px] text-zinc-500 font-mono">+{{ activeSession()?.customerPhone }}</p>
              </div>
            </div>

            <!-- Bot Mode Toggle Switch -->
            <div class="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 scale-90 sm:scale-100 origin-right">
              <button
                (click)="setBotActive(true)"
                [class]="'px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ' + (activeSession()?.isBotActive ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800')"
              >
                🤖 Bot Activo
              </button>
              <button
                (click)="setBotActive(false)"
                [class]="'px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ' + (!activeSession()?.isBotActive ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800')"
              >
                👤 Agente
              </button>
            </div>
          </div>

          <!-- Messages Stream Area with Auto-Scroll -->
          <div #scrollContainer class="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 scroll-smooth">
            @for (msg of messages(); track msg.id) {
              <div [class]="'flex ' + (msg.sender === 'CUSTOMER' ? 'justify-start' : 'justify-end')">
                
                <div [class]="'max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-3.5 shadow-sm ' + getMessageBubbleClass(msg.sender)">
                  <!-- Sender Header -->
                  <div class="flex items-center justify-between gap-3 mb-1 text-[10px] font-bold opacity-80">
                    <span class="flex items-center gap-1">
                      @if (msg.sender === 'BOT') {
                        <span class="text-indigo-600">🤖 Bot WSP</span>
                      } @else if (msg.sender === 'AGENT') {
                        <span class="text-emerald-700">👤 {{ msg.senderName || 'Asesor Humano' }}</span>
                      } @else {
                        <span>{{ activeSession()?.customerName || 'Cliente' }}</span>
                      }
                    </span>
                    <span class="font-mono">{{ msg.createdAt | date: 'HH:mm' }}</span>
                  </div>

                  <!-- Text Content -->
                  <p class="text-xs leading-relaxed whitespace-pre-wrap font-sans break-words">{{ msg.content }}</p>
                </div>

              </div>
            } @empty {
              <div class="h-full flex items-center justify-center text-zinc-400 text-xs">
                Inicia una conversación enviando un mensaje.
              </div>
            }
          </div>

          <!-- Message Input Bar -->
          <div class="p-3 sm:p-3.5 px-3 sm:px-5 border-t border-zinc-200/80 bg-white">
            <form (ngSubmit)="sendMessage()" class="flex items-center gap-2 sm:gap-3">
              <input
                type="text"
                [(ngModel)]="newMessageText"
                name="messageText"
                placeholder="Escribe una respuesta a WhatsApp..."
                class="input-bento flex-1 py-2 sm:py-2.5 text-xs sm:text-sm"
              />
              <button
                type="submit"
                [disabled]="!newMessageText.trim()"
                class="btn-primary py-2 sm:py-2.5 px-4 sm:px-5 text-xs font-semibold whitespace-nowrap active:scale-[0.98]"
              >
                <span>Enviar</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>

        } @else {
          <div class="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8">
            <div class="w-14 h-14 rounded-3xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3 border border-zinc-200">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 class="text-sm font-bold text-zinc-800">Selecciona una conversación</h3>
            <p class="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Elige un chat de la lista para ver el historial en tiempo real y responder directamente por WhatsApp.
            </p>
          </div>
        }
      </div>

    </div>
  `,
})
export class LiveChatComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  private chatService = inject(ChatService);
  private socketService = inject(SocketService);
  authService = inject(AuthService);

  sessions = signal<ChatSession[]>([]);
  activeSession = signal<ChatSession | null>(null);
  messages = signal<ChatMessage[]>([]);
  searchQuery = '';
  newMessageText = '';

  private subs: Subscription[] = [];

  isMobileView(): boolean {
    return window.innerWidth < 768;
  }

  ngOnInit() {
    this.loadSessions();
    this.listenWebSockets();
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  loadSessions() {
    this.chatService.getSessions().subscribe({
      next: (data) => {
        this.sessions.set(data);
        if (!this.activeSession() && data.length > 0 && !this.isMobileView()) {
          this.selectSession(data[0]);
        }
      },
    });
  }

  filteredSessions(): ChatSession[] {
    if (!this.searchQuery.trim()) return this.sessions();
    const q = this.searchQuery.toLowerCase();
    return this.sessions().filter(
      (s) =>
        s.customerPhone.includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)),
    );
  }

  selectSession(session: ChatSession) {
    this.activeSession.set(session);
    this.loadMessages(session.id);
  }

  loadMessages(sessionId: string) {
    this.chatService.getSessionMessages(sessionId).subscribe({
      next: (msgs: ChatMessage[]) => {
        this.messages.set(msgs);
        this.scrollToBottom();
      },
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 60);
  }

  setBotActive(active: boolean) {
    const s = this.activeSession();
    if (!s) return;

    this.chatService.toggleBot(s.customerPhone, active).subscribe({
      next: () => {
        this.activeSession.update((curr) => (curr ? { ...curr, isBotActive: active } : null));
        this.sessions.update((list) =>
          list.map((item) => (item.id === s.id ? { ...item, isBotActive: active } : item)),
        );
      },
    });
  }

  sendMessage() {
    const s = this.activeSession();
    if (!s || !this.newMessageText.trim()) return;

    const text = this.newMessageText.trim();
    this.newMessageText = '';

    this.chatService.sendMessage(s.customerPhone, text).subscribe({
      next: (msg: ChatMessage) => {
        this.messages.update((list) => [...list, msg]);
        this.scrollToBottom();
      },
    });
  }

  listenWebSockets() {
    this.subs.push(
      this.socketService.onNewChatMessage$.subscribe((msg: any) => {
        const active = this.activeSession();
        if (active && (msg.chatSessionId === active.id || msg.customerPhone === active.customerPhone)) {
          this.messages.update((list) => [...list, msg]);
          this.scrollToBottom();
        }
        this.loadSessions();
      }),
    );
  }

  getMessageBubbleClass(sender: MessageSender | string): string {
    switch (sender) {
      case 'CUSTOMER':
        return 'bg-white border border-zinc-200 text-zinc-900 rounded-tl-sm';
      case 'BOT':
        return 'bg-indigo-50 border border-indigo-200/80 text-zinc-900 rounded-tr-sm';
      case 'AGENT':
        return 'bg-emerald-50 border border-emerald-200/80 text-zinc-900 rounded-tr-sm';
      default:
        return 'bg-zinc-100 border border-zinc-200 text-zinc-900';
    }
  }
}
