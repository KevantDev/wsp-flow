import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ChatService, PaginatedMessagesResponse } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatSession, ChatMessage, MessageSender } from '../../core/models/models';

@Component({
  selector: 'app-live-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BentoCardComponent, BadgeComponent],
  template: `
    <app-navbar title="Bandeja de Entrada & Live Chat" subtitle="Atención en vivo, control del bot, scroll infinito e historial"></app-navbar>

    <!-- Master Layout Compartment (Fixed Viewport Height, No Global Page Double-Scroll) -->
    <div class="mt-4 sm:mt-5 h-[calc(100vh-140px)] min-h-[580px] max-h-[900px] rounded-2xl md:rounded-3xl overflow-hidden bg-white border border-zinc-200/90 grid grid-cols-1 md:grid-cols-12 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_20px_rgba(0,0,0,0.05)]">
      
      <!-- ================= LEFT COMPARTMENT: CONVERSATIONS LIST ================= -->
      <aside [class]="'md:col-span-4 lg:col-span-4 border-r border-zinc-200/80 flex flex-col h-full bg-zinc-50/50 overflow-hidden ' + (activeSession() && isMobileView() ? 'hidden md:flex' : 'flex')">
        
        <!-- Header & Search -->
        <div class="p-3 sm:p-3.5 border-b border-zinc-200/80 bg-white space-y-2.5 shrink-0">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-bold text-zinc-900 text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
              <span>Chats Activos</span>
              <span class="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-mono font-bold text-zinc-600">
                {{ sessions().length }}
              </span>
            </h3>
            <button
              (click)="openNewChatModal()"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200/80 transition-all shadow-sm active:scale-95"
              title="Iniciar nueva conversación"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Chat</span>
            </button>
          </div>

          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar por cliente o teléfono..."
              class="input-bento pl-9 py-1.5 text-xs"
            />
            <svg class="w-4 h-4 text-zinc-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Conversations Scrollable Stream -->
        <div class="flex-1 overflow-y-auto divide-y divide-zinc-100/80 min-h-0">
          @for (session of filteredSessions(); track session.id) {
            <button
              (click)="selectSession(session)"
              [class]="'w-full p-3 sm:p-3.5 text-left flex items-start gap-3 transition-all hover:bg-zinc-100/70 ' + (activeSession()?.id === session.id ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-sm' : '')"
            >
              <!-- Avatar -->
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-100 to-indigo-50 border border-indigo-200/80 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0 shadow-sm">
                {{ (session.customerName || session.customerPhone).substring(0, 2).toUpperCase() }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-0.5">
                  <h4 class="font-bold text-zinc-900 text-xs truncate">
                    {{ session.customerName || session.customerPhone }}
                  </h4>
                  <span class="text-[10px] font-mono text-zinc-400">
                    {{ session.lastInteraction | date: 'HH:mm' }}
                  </span>
                </div>

                <p class="text-[11px] text-zinc-500 font-mono truncate">
                  +{{ session.customerPhone }}
                </p>

                <!-- Bot Status & Unread Badge -->
                <div class="flex items-center justify-between mt-1.5">
                  @if (session.isBotActive) {
                    <span class="inline-flex items-center gap-1 text-[9px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200/70">
                      <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      Bot Activo
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/70">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Agente Humano
                    </span>
                  }

                  @if (session.unreadCount > 0) {
                    <span class="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] font-mono">
                      {{ session.unreadCount }}
                    </span>
                  }
                </div>
              </div>
            </button>
          } @empty {
            <div class="p-8 text-center text-zinc-400 text-xs space-y-3">
              <div class="w-10 h-10 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p>No hay conversaciones registradas.</p>
            </div>
          }
        </div>
      </aside>

      <!-- ================= RIGHT COMPARTMENT: ACTIVE CONVERSATION ================= -->
      <section [class]="'md:col-span-8 lg:col-span-8 flex flex-col h-full bg-[#F8F9FB] overflow-hidden ' + (!activeSession() && isMobileView() ? 'hidden md:flex' : 'flex')">
        @if (activeSession()) {
          
          <!-- Chat Header (Fixed Top) -->
          <div class="p-3 sm:p-3.5 px-3 sm:px-5 border-b border-zinc-200/80 flex items-center justify-between bg-white shadow-xs z-10 shrink-0">
            <div class="flex items-center gap-2 sm:gap-3">
              <!-- Back button on mobile -->
              <button
                (click)="activeSession.set(null)"
                aria-label="Volver a la lista de chats"
                class="p-1.5 rounded-xl text-zinc-600 hover:bg-zinc-100 md:hidden transition-colors"
                title="Volver a la lista de chats"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs sm:text-sm border border-indigo-200/70 shadow-sm shrink-0">
                {{ (activeSession()?.customerName || activeSession()?.customerPhone || '').substring(0, 2).toUpperCase() }}
              </div>
              
              <div class="min-w-0 max-w-[140px] sm:max-w-xs">
                <h3 class="font-bold text-zinc-900 text-xs sm:text-sm truncate">
                  {{ activeSession()?.customerName || activeSession()?.customerPhone }}
                </h3>
                <div class="flex items-center gap-1.5">
                  <p class="text-[10px] sm:text-[11px] text-zinc-500 font-mono">+{{ activeSession()?.customerPhone }}</p>
                  <a
                    [href]="'https://wa.me/' + cleanPhone(activeSession()?.customerPhone || '')"
                    target="_blank"
                    class="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                    title="Abrir en WhatsApp Web externo"
                  >
                    ↗ WhatsApp
                  </a>
                </div>
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

          <!-- Quick Canned Replies Bar (Fixed Top 2) -->
          <div class="px-3 sm:px-5 py-1.5 bg-zinc-100/70 border-b border-zinc-200/60 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
            <span class="text-zinc-400 font-medium whitespace-nowrap text-[10px] uppercase font-mono">Respuestas rápidas:</span>
            <button
              (click)="useCannedReply('¡Hola! 👋 ¿En qué podemos ayudarte hoy?')"
              class="px-2.5 py-0.5 rounded-lg bg-white border border-zinc-200 hover:border-indigo-300 text-zinc-700 hover:text-indigo-600 whitespace-nowrap transition-colors shadow-xs text-xs"
            >
              👋 Saludo
            </button>
            <button
              (click)="useCannedReply('📦 Aquí tienes nuestro catálogo de productos con stock actualizado. Escribe *catalogo* para recibir el PDF.')"
              class="px-2.5 py-0.5 rounded-lg bg-white border border-zinc-200 hover:border-indigo-300 text-zinc-700 hover:text-indigo-600 whitespace-nowrap transition-colors shadow-xs text-xs"
            >
              📄 Catálogo
            </button>
            <button
              (click)="useCannedReply('🚚 Tu pedido ya está siendo preparado y saldrá en el próximo despacho.')"
              class="px-2.5 py-0.5 rounded-lg bg-white border border-zinc-200 hover:border-indigo-300 text-zinc-700 hover:text-indigo-600 whitespace-nowrap transition-colors shadow-xs text-xs"
            >
              🚚 En preparación
            </button>
          </div>

          <!-- ================= MESSAGES STREAM AREA (SCROLLABLE CONTAINER) ================= -->
          <div
            #scrollContainer
            (scroll)="onScroll($event)"
            class="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 min-h-0 relative scroll-smooth"
          >
            
            <!-- Infinite Scroll Top Loader / Trigger Button -->
            @if (hasMoreMessages()) {
              <div class="text-center py-2">
                <button
                  type="button"
                  (click)="loadOlderMessages()"
                  [disabled]="isLoadingMore()"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50 text-zinc-600 hover:text-indigo-700 text-[11px] font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  @if (isLoadingMore()) {
                    <span class="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Cargando mensajes anteriores...</span>
                  } @else {
                    <span>⬆ Cargar mensajes anteriores ({{ totalMessages() - messages().length }} restantes)</span>
                  }
                </button>
              </div>
            }

            <!-- Messages List -->
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
                  <div class="text-xs leading-relaxed font-sans break-words msg-bubble-content" [innerHTML]="formatMessageContent(msg.content)"></div>
                </div>

              </div>
            } @empty {
              <div class="h-full flex items-center justify-center text-zinc-400 text-xs">
                Inicia una conversación enviando un mensaje abajo.
              </div>
            }

            <!-- Floating Jump To Bottom Button with Unread Badge -->
            @if (!isNearBottom()) {
              <div class="sticky bottom-2 flex justify-center pointer-events-none z-20">
                <button
                  type="button"
                  (click)="scrollToBottom('smooth')"
                  class="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 animate-fade-in"
                >
                  <span>↓ Bajar al final</span>
                  @if (unreadIncomingCount() > 0) {
                    <span class="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                      +{{ unreadIncomingCount() }}
                    </span>
                  }
                </button>
              </div>
            }

          </div>

          <!-- Message Input Bar (Fixed Bottom) -->
          <div class="p-3 sm:p-3.5 px-3 sm:px-5 border-t border-zinc-200/80 bg-white shrink-0">
            <form (ngSubmit)="sendMessage()" class="flex items-center gap-2 sm:gap-3">
              <input
                #messageInput
                type="text"
                [(ngModel)]="newMessageText"
                name="messageText"
                placeholder="Escribe una respuesta a WhatsApp..."
                [disabled]="isSending()"
                class="input-bento flex-1 py-2 sm:py-2.5 text-xs sm:text-sm disabled:opacity-50"
                autocomplete="off"
              />
              <button
                type="submit"
                [disabled]="!newMessageText.trim() || isSending()"
                class="btn-primary py-2 sm:py-2.5 px-4 sm:px-5 text-xs font-semibold whitespace-nowrap active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                @if (isSending()) {
                  <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Enviando...</span>
                } @else {
                  <span>Enviar</span>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
              </button>
            </form>
          </div>

        } @else {
          <!-- Empty State when no chat is selected -->
          <div class="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-4">
            <div class="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div class="max-w-xs space-y-1">
              <h3 class="text-sm font-bold text-zinc-800">Selecciona o inicia una conversación</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">
                Elige un chat de la lista lateral o inicia una nueva conversación con cualquier número de WhatsApp.
              </p>
            </div>
            <button
              (click)="openNewChatModal()"
              class="btn-primary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Conversación</span>
            </button>
          </div>
        }
      </section>

    </div>

    <!-- New Chat Modal -->
    @if (showNewChatModal()) {
      <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-zinc-900">Nueva Conversación por WhatsApp</h3>
            <button
              (click)="showNewChatModal.set(false)"
              class="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-zinc-700 mb-1">Teléfono con código de país *</label>
              <input
                type="text"
                [(ngModel)]="newChatPhone"
                placeholder="Ej: 51988776655 o +51988776655"
                class="input-bento text-xs font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-700 mb-1">Nombre del cliente (opcional)</label>
              <input
                type="text"
                [(ngModel)]="newChatName"
                placeholder="Ej: Juan Pérez"
                class="input-bento text-xs"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-700 mb-1">Primer Mensaje (opcional)</label>
              <textarea
                [(ngModel)]="newChatInitialMsg"
                rows="3"
                placeholder="Escribe el mensaje inicial a enviar..."
                class="input-bento text-xs resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              (click)="showNewChatModal.set(false)"
              class="btn-secondary text-xs py-2 px-4"
            >
              Cancelar
            </button>
            <button
              (click)="startNewChat()"
              [disabled]="!newChatPhone.trim() || isCreatingChat()"
              class="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              @if (isCreatingChat()) {
                <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Iniciando...</span>
              } @else {
                <span>Iniciar Chat</span>
                <span>➔</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class LiveChatComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  authService = inject(AuthService);

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLInputElement>;

  sessions = signal<ChatSession[]>([]);
  activeSession = signal<ChatSession | null>(null);
  messages = signal<ChatMessage[]>([]);
  searchQuery = '';
  newMessageText = '';

  // Infinite Scroll & Pagination state
  hasMoreMessages = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);
  totalMessages = signal<number>(0);
  isNearBottom = signal<boolean>(true);
  unreadIncomingCount = signal<number>(0);

  isSending = signal<boolean>(false);
  showNewChatModal = signal<boolean>(false);
  isCreatingChat = signal<boolean>(false);

  newChatPhone = '';
  newChatName = '';
  newChatInitialMsg = '';

  private subs: Subscription[] = [];

  isMobileView(): boolean {
    return window.innerWidth < 768;
  }

  ngOnInit() {
    this.loadSessions();
    this.listenWebSockets();
    this.checkQueryParams();
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  checkQueryParams() {
    this.subs.push(
      this.route.queryParams.subscribe((params) => {
        if (params['phone']) {
          const phone = params['phone'];
          const name = params['name'] || '';
          this.chatService.createSession(phone, name).subscribe({
            next: (session) => {
              this.loadSessions(session.id);
            },
          });
        }
      }),
    );
  }

  loadSessions(autoSelectId?: string) {
    this.chatService.getSessions().subscribe({
      next: (data: any) => {
        const list: ChatSession[] = Array.isArray(data)
          ? data
          : data?.sessions && Array.isArray(data.sessions)
          ? data.sessions
          : [];
        this.sessions.set(list);

        if (autoSelectId) {
          const target = list.find((s) => s.id === autoSelectId);
          if (target) {
            this.selectSession(target);
            return;
          }
        }

        const currentActive = this.activeSession();
        if (currentActive) {
          const updated = list.find((s) => s.id === currentActive.id);
          if (updated) {
            this.activeSession.set(updated);
          }
        } else if (list.length > 0 && !this.isMobileView()) {
          this.selectSession(list[0]);
        }
      },
      error: (err) => {
        console.error('Error cargando sesiones:', err);
        this.sessions.set([]);
      },
    });
  }

  filteredSessions(): ChatSession[] {
    const list = Array.isArray(this.sessions()) ? this.sessions() : [];
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s &&
        ((s.customerPhone && s.customerPhone.includes(q)) ||
          (s.customerName && s.customerName.toLowerCase().includes(q))),
    );
  }

  selectSession(session: ChatSession) {
    this.activeSession.set(session);
    this.messages.set([]);
    this.hasMoreMessages.set(false);
    this.totalMessages.set(0);
    this.unreadIncomingCount.set(0);
    this.isNearBottom.set(true);

    this.loadInitialMessages(session.id);
    setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);
  }

  loadInitialMessages(sessionId: string) {
    this.chatService.getSessionMessages(sessionId, 30, 0).subscribe({
      next: (res: any) => {
        const msgsList: ChatMessage[] = Array.isArray(res)
          ? res
          : res?.messages && Array.isArray(res.messages)
          ? res.messages
          : [];
        this.messages.set(msgsList);
        this.hasMoreMessages.set(Boolean(res?.hasMore));
        this.totalMessages.set(res?.total || msgsList.length);
        this.scrollToBottom('instant');
      },
      error: (err) => {
        console.error('Error cargando mensajes:', err);
        this.messages.set([]);
      },
    });
  }

  loadOlderMessages() {
    const session = this.activeSession();
    if (!session || this.isLoadingMore() || !this.hasMoreMessages()) return;

    this.isLoadingMore.set(true);
    const container = this.scrollContainer?.nativeElement;
    const oldScrollHeight = container ? container.scrollHeight : 0;
    const oldScrollTop = container ? container.scrollTop : 0;
    const currentOffset = Array.isArray(this.messages()) ? this.messages().length : 0;

    this.chatService.getSessionMessages(session.id, 30, currentOffset).subscribe({
      next: (res: any) => {
        const msgsList: ChatMessage[] = Array.isArray(res)
          ? res
          : res?.messages && Array.isArray(res.messages)
          ? res.messages
          : [];
        this.messages.update((curr) => [
          ...msgsList,
          ...(Array.isArray(curr) ? curr : []),
        ]);
        this.hasMoreMessages.set(Boolean(res?.hasMore));
        this.totalMessages.set(res?.total || 0);
        this.isLoadingMore.set(false);

        // Preserve scroll position without visual jumping
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
          }
        }, 15);
      },
      error: () => {
        this.isLoadingMore.set(false);
      },
    });
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Check if scrolled near the top to automatically load older messages
    if (target.scrollTop < 40 && this.hasMoreMessages() && !this.isLoadingMore()) {
      this.loadOlderMessages();
    }

    // Check if user is near the bottom
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceFromBottom < 80) {
      this.isNearBottom.set(true);
      this.unreadIncomingCount.set(0);
    } else {
      this.isNearBottom.set(false);
    }
  }

  scrollToBottom(behavior: 'smooth' | 'instant' = 'smooth') {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        const el = this.scrollContainer.nativeElement;
        if (behavior === 'instant') {
          el.scrollTop = el.scrollHeight;
        } else {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
        this.isNearBottom.set(true);
        this.unreadIncomingCount.set(0);
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

  useCannedReply(text: string) {
    this.newMessageText = text;
    this.messageInput?.nativeElement?.focus();
  }

  sendMessage() {
    const s = this.activeSession();
    if (!s || !this.newMessageText.trim() || this.isSending()) return;

    const text = this.newMessageText.trim();
    this.isSending.set(true);

    this.chatService.sendMessage(s.customerPhone, text).subscribe({
      next: (msg: ChatMessage) => {
        this.messages.update((list) => {
          if (list.some((m) => m.id === msg.id)) return list;
          return [...list, msg];
        });
        this.newMessageText = '';
        this.isSending.set(false);
        this.scrollToBottom('smooth');
        this.loadSessions();
      },
      error: (err) => {
        this.isSending.set(false);
        alert(err.error?.message || 'Error al enviar mensaje a WhatsApp.');
      },
    });
  }

  listenWebSockets() {
    this.subs.push(
      this.socketService.onNewChatMessage$.subscribe((msg: any) => {
        const active = this.activeSession();
        const activeCleanPhone = active?.customerPhone ? this.cleanPhone(active.customerPhone) : '';
        const msgCleanPhone = msg.customerPhone ? this.cleanPhone(msg.customerPhone) : '';

        if (active && (msg.chatSessionId === active.id || msgCleanPhone === activeCleanPhone)) {
          this.messages.update((list) => {
            if (list.some((m) => m.id === msg.id)) return list;
            return [...list, msg];
          });

          if (this.isNearBottom()) {
            this.scrollToBottom('smooth');
          } else {
            this.unreadIncomingCount.update((c) => c + 1);
          }
        }
        this.loadSessions();
      }),
    );
  }

  openNewChatModal() {
    this.newChatPhone = '';
    this.newChatName = '';
    this.newChatInitialMsg = '';
    this.showNewChatModal.set(true);
  }

  startNewChat() {
    if (!this.newChatPhone.trim() || this.isCreatingChat()) return;

    this.isCreatingChat.set(true);
    const phone = this.newChatPhone.trim();
    const name = this.newChatName.trim();
    const initialMsg = this.newChatInitialMsg.trim();

    this.chatService.createSession(phone, name).subscribe({
      next: (session) => {
        this.showNewChatModal.set(false);
        this.isCreatingChat.set(false);
        this.activeSession.set(session);
        this.loadSessions(session.id);

        if (initialMsg) {
          this.chatService.sendMessage(session.customerPhone, initialMsg).subscribe({
            next: (msg) => {
              this.messages.update((list) => {
                if (list.some((m) => m.id === msg.id)) return list;
                return [...list, msg];
              });
              this.scrollToBottom('smooth');
            },
          });
        }
      },
      error: (err) => {
        this.isCreatingChat.set(false);
        alert(err.error?.message || 'Error creando la conversación.');
      },
    });
  }

  cleanPhone(phone: string): string {
    return phone ? phone.replace(/\D/g, '') : '';
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

  formatMessageContent(raw: string): string {
    if (!raw) return '';

    // 1. Escapar HTML para evitar XSS
    let text = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Enlaces URL a links interactivos estilizados
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-0.5">${url}</a>`;
    });

    // 3. Negritas: **texto** y *texto* a <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');

    // 4. Cursivas: _texto_ a <em>
    text = text.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // 5. Tachado: ~texto~ a <del>
    text = text.replace(/~([^~\n]+)~/g, '<del class="opacity-75">$1</del>');

    // 6. Código en línea: `código` a <code>
    text = text.replace(
      /`([^`\n]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-zinc-200/70 font-mono text-[11px] font-bold text-zinc-900">$1</code>',
    );

    // 7. Corrección de signos de dólar accidentales a Soles
    text = text.replace(/\$(\s*\d+(\.\d+)?)/g, 'S/ $1');

    // 8. Saltos de línea
    text = text.replace(/\n/g, '<br>');

    return text;
  }
}
