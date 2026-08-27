import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { Product } from '../../core/models/models';

interface ChatSimulationMessage {
  sender: 'user' | 'bot';
  senderName: string;
  text: string;
  time: string;
  isPdf?: boolean;
  pdfTitle?: string;
  isOrderCard?: boolean;
  orderNumber?: string;
  orderTotal?: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-[100dvh] bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      
      <!-- Ambient Glow Orbs -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-indigo-100/50 via-purple-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div class="absolute top-[700px] right-[-100px] w-[500px] h-[500px] bg-emerald-50/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <!-- ================= HEADER / STICKY NAVBAR ================= -->
      <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-200/90 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-3 group">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold group-hover:scale-105 transition-transform">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span class="font-extrabold text-zinc-900 text-base sm:text-lg tracking-tight block leading-tight">WSP FLOW</span>
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-600">Bento Commerce</span>
            </div>
          </a>

          <!-- Navigation Links (Single Line Desktop) -->
          <nav class="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-600">
            <a href="#beneficios" class="hover:text-indigo-600 transition-colors">Ventajas</a>
            <a href="#simulador" class="hover:text-indigo-600 transition-colors">Simulador IA</a>
            <a href="#como-funciona" class="hover:text-indigo-600 transition-colors">Cómo Funciona</a>
            <a href="#catalogo" class="hover:text-indigo-600 transition-colors">Catálogo</a>
            <a href="#precios" class="hover:text-indigo-600 transition-colors">Planes</a>
            <a href="#faq" class="hover:text-indigo-600 transition-colors">Preguntas</a>
          </nav>

          <!-- Right Action Buttons -->
          <div class="flex items-center gap-2.5 sm:gap-3">
            <button
              (click)="downloadCatalogPdf()"
              [disabled]="isDownloadingPdf()"
              class="hidden sm:inline-flex btn-secondary text-xs py-2 px-3.5"
              title="Descargar Catálogo de Productos en PDF"
            >
              @if (isDownloadingPdf()) {
                <span class="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Generando...</span>
              } @else {
                <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Catálogo PDF</span>
              }
            </button>

            <a
              routerLink="/login"
              class="btn-primary text-xs sm:text-sm py-2 sm:py-2.5 px-4 sm:px-5"
            >
              <span>Acceder al Panel</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

        </div>
      </header>

      <!-- ================= HERO SECTION (Strict Layout Discipline) ================= -->
      <section class="pt-14 sm:pt-18 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        <!-- Max 4 Text Elements in Stack -->
        <div class="text-center max-w-3xl mx-auto space-y-4">
          
          <!-- Element 1: Announcement Pill -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 shadow-sm text-xs font-semibold text-zinc-700">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Motor OpenAI GPT-5.6-luna con Function Calling</span>
          </div>

          <!-- Element 2: Headline (Max 2 Lines Desktop) -->
          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.12]">
            Vende por WhatsApp en <br class="hidden sm:inline" />
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600">
              piloto automático con IA
            </span>
          </h1>

          <!-- Element 3: Subtext (Concise, under 20 words) -->
          <p class="text-sm sm:text-base text-zinc-600 max-w-xl mx-auto font-normal leading-relaxed">
            Convierte consultas en pedidos cerrados 24/7 con catálogo PDF maquetado, control de stock y tablero Kanban sin costo por mensaje.
          </p>

          <!-- Element 4: Primary & Secondary CTAs (Single-Line Desktop) -->
          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a routerLink="/login" class="btn-primary w-full sm:w-auto text-sm py-3 px-6 font-semibold">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Explorar Demo en Vivo</span>
            </a>

            <a href="#simulador" class="btn-secondary w-full sm:w-auto text-sm py-3 px-6 font-semibold">
              <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Probar Simulador de Chat</span>
            </a>
          </div>

        </div>

        <!-- ================= HERO BENTO GRID SHOWCASE ================= -->
        <div class="mt-12 sm:mt-14 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          <!-- Bento 1: Live Simulated WhatsApp Bot Window (7 cols) -->
          <div class="md:col-span-7 bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden">
            <div class="flex items-center justify-between border-b border-zinc-100 pb-3.5 mb-3.5">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200/70">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-bold text-zinc-900 text-xs sm:text-sm">Luna — Asistente IA WSP</h4>
                  <div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-700 font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>En línea con Baileys WhatsApp</span>
                  </div>
                </div>
              </div>
              <span class="font-mono text-[10px] uppercase font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg">
                Demostración
              </span>
            </div>

            <!-- Chat Preview Bubbles -->
            <div class="space-y-3 font-sans text-xs flex-1">
              <!-- Customer -->
              <div class="flex justify-end">
                <div class="bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3 max-w-[85%] sm:max-w-[75%] shadow-sm">
                  <p class="font-medium">¡Hola! ¿Tienen catálogo con fotos y precios de auriculares?</p>
                  <span class="text-[9px] text-indigo-200 block text-right mt-1 font-mono">10:42 AM</span>
                </div>
              </div>

              <!-- Bot Response with PDF Document Attachment -->
              <div class="flex justify-start">
                <div class="bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-2xl rounded-tl-sm p-3 max-w-[85%] sm:max-w-[75%] shadow-sm space-y-2">
                  <p class="leading-relaxed text-zinc-800">¡Hola! Claro que sí. Te adjunto nuestro <strong>Catálogo Oficial en PDF</strong> con fotos y stock en tiempo real.</p>
                  
                  <!-- PDF Card Attachment -->
                  <div class="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-zinc-200/80 shadow-sm">
                    <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-200/60">
                      PDF
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="font-bold text-zinc-900 text-[11px] block truncate">Catalogo_WSP_Flow.pdf</span>
                      <span class="text-[10px] text-zinc-400 font-mono">2.4 MB • Auto-generado</span>
                    </div>
                  </div>
                  
                  <span class="text-[9px] text-zinc-400 block text-right font-mono">10:42 AM • Bot IA</span>
                </div>
              </div>

              <!-- Customer Order -->
              <div class="flex justify-end">
                <div class="bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3 max-w-[85%] sm:max-w-[75%] shadow-sm">
                  <p class="font-medium">Quiero ordenar 2 unidades de los Auriculares Pro (SKU: PROD-102).</p>
                  <span class="text-[9px] text-indigo-200 block text-right mt-1 font-mono">10:43 AM</span>
                </div>
              </div>

              <!-- Bot Auto-Order Confirmation -->
              <div class="flex justify-start">
                <div class="bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 rounded-2xl rounded-tl-sm p-3 max-w-[85%] sm:max-w-[75%] shadow-sm space-y-1">
                  <div class="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>¡Pedido Registrado con Éxito!</span>
                  </div>
                  <p class="text-[11px] leading-relaxed">
                    Orden <strong>#ORD-1082</strong> creada por <strong>$59.98 USD</strong>. Inventario descontado en PostgreSQL.
                  </p>
                  <span class="text-[9px] text-emerald-700 block text-right font-mono">10:43 AM • Función Ejecutada</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bento 2: Metrics & To-Do Order Flow (5 cols) -->
          <div class="md:col-span-5 grid grid-cols-1 gap-5">
            
            <!-- Metric Card -->
            <div class="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div class="flex items-center justify-between mb-1">
                <span class="text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">Facturación Mensual</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ↑ +28.4%
                </span>
              </div>
              <div class="my-2">
                <span class="text-3xl sm:text-4xl font-extrabold text-zinc-900 font-mono tracking-tight">$18,450.00</span>
                <p class="text-xs text-zinc-500 mt-0.5">124 pedidos procesados en automático por WhatsApp</p>
              </div>
              <div class="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-indigo-600 h-full w-[84%] rounded-full"></div>
              </div>
            </div>

            <!-- Kanban Mini-Card -->
            <div class="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div class="flex items-center justify-between mb-3">
                <span class="text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">Pipeline de Pedidos To-Do</span>
                <span class="text-xs font-bold text-indigo-600">4 Etapas</span>
              </div>
              <div class="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-bold">
                <div class="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <span class="block text-sm">4</span>
                  <span>Atender</span>
                </div>
                <div class="p-2 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <span class="block text-sm">7</span>
                  <span>Proceso</span>
                </div>
                <div class="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                  <span class="block text-sm">5</span>
                  <span>Camino</span>
                </div>
                <div class="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span class="block text-sm">108</span>
                  <span>Entregados</span>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span class="text-zinc-500">Avance de estado en 1 clic</span>
                <a routerLink="/login" class="font-bold text-indigo-600 hover:text-indigo-700">Ver Tablero ➔</a>
              </div>
            </div>

          </div>

        </div>

      </section>

      <!-- ================= INTERACTIVE BOT SIMULATOR SECTION ================= -->
      <section id="simulador" class="py-14 sm:py-20 bg-white border-y border-zinc-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-10">
            <h2 class="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Prueba la IA en tiempo real
            </h2>
            <p class="text-zinc-500 text-sm sm:text-base mt-2">
              Haz clic en cualquiera de las consultas frecuentes para simular la conversación exacta que tendrán tus clientes por WhatsApp.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto">
            
            <!-- Left: Prompt Buttons (5 cols) -->
            <div class="lg:col-span-5 space-y-2.5">
              <h4 class="text-zinc-500 font-mono text-xs uppercase font-bold px-1 mb-1">Consultas Demostrativas:</h4>
              
              <button
                (click)="simulateScenario('catalog')"
                class="w-full text-left p-3.5 rounded-2xl bg-zinc-50 hover:bg-indigo-50/70 border border-zinc-200/90 hover:border-indigo-300 transition-all group active:scale-[0.98]"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <span class="text-xs font-bold text-zinc-900 group-hover:text-indigo-700">📄 Pedir Catálogo en PDF</span>
                  <span class="text-xs text-indigo-600 group-hover:translate-x-0.5 transition-transform">➔</span>
                </div>
                <p class="text-[11px] text-zinc-500">"Hola, ¿me podrías pasar el catálogo con precios?"</p>
              </button>

              <button
                (click)="simulateScenario('stock')"
                class="w-full text-left p-3.5 rounded-2xl bg-zinc-50 hover:bg-indigo-50/70 border border-zinc-200/90 hover:border-indigo-300 transition-all group active:scale-[0.98]"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <span class="text-xs font-bold text-zinc-900 group-hover:text-indigo-700">📦 Consultar Stock y Precio</span>
                  <span class="text-xs text-indigo-600 group-hover:translate-x-0.5 transition-transform">➔</span>
                </div>
                <p class="text-[11px] text-zinc-500">"¿Tienen disponibles los Auriculares Pro y cuánto cuestan?"</p>
              </button>

              <button
                (click)="simulateScenario('order')"
                class="w-full text-left p-3.5 rounded-2xl bg-zinc-50 hover:bg-emerald-50/70 border border-zinc-200/90 hover:border-emerald-300 transition-all group active:scale-[0.98]"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <span class="text-xs font-bold text-emerald-800 group-hover:text-emerald-900">🛒 Concretar Pedido Automático</span>
                  <span class="text-xs text-emerald-600 group-hover:translate-x-0.5 transition-transform">➔</span>
                </div>
                <p class="text-[11px] text-zinc-500">"Quiero ordenar 2 unidades del Reloj Inteligente para Martín Silva"</p>
              </button>

              <button
                (click)="simulateScenario('human')"
                class="w-full text-left p-3.5 rounded-2xl bg-zinc-50 hover:bg-purple-50/70 border border-zinc-200/90 hover:border-purple-300 transition-all group active:scale-[0.98]"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <span class="text-xs font-bold text-zinc-900 group-hover:text-purple-700">👨‍💼 Solicitar Asesor Humano</span>
                  <span class="text-xs text-purple-600 group-hover:translate-x-0.5 transition-transform">➔</span>
                </div>
                <p class="text-[11px] text-zinc-500">"Quiero hablar con una persona del equipo"</p>
              </button>
            </div>

            <!-- Right: Interactive Chat Display (7 cols) -->
            <div class="lg:col-span-7 bg-[#F8F9FB] rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm flex flex-col h-[460px]">
              
              <!-- Chat Header -->
              <div class="flex items-center justify-between border-b border-zinc-200/80 pb-3 mb-3.5 bg-white -mx-5 -mt-5 p-4 rounded-t-3xl">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    🤖
                  </div>
                  <div>
                    <h4 class="font-bold text-zinc-900 text-xs">Luna — Asistente WSP Flow</h4>
                    <span class="text-[10px] text-emerald-700 font-mono">Modo GPT-5.6 Activo</span>
                  </div>
                </div>
                <button
                  (click)="resetSimulation()"
                  class="btn-ghost text-[10px] font-mono"
                  title="Reiniciar chat"
                >
                  Reiniciar
                </button>
              </div>

              <!-- Message Stream -->
              <div class="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                @for (msg of simulationMessages(); track $index) {
                  <div [class]="'flex ' + (msg.sender === 'user' ? 'justify-end' : 'justify-start')">
                    <div [class]="'max-w-[85%] rounded-2xl p-3 shadow-sm ' + (msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-zinc-200/90 text-zinc-900 rounded-tl-sm')">
                      
                      <!-- Sender & Time -->
                      <div class="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 font-mono">
                        <span>{{ msg.senderName }}</span>
                        <span>{{ msg.time }}</span>
                      </div>

                      <!-- Text -->
                      <p class="leading-relaxed whitespace-pre-line">{{ msg.text }}</p>

                      <!-- Optional PDF Widget -->
                      @if (msg.isPdf) {
                        <div class="mt-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2">
                          <div class="flex items-center gap-2 min-w-0">
                            <span class="text-xs font-mono font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">PDF</span>
                            <span class="font-bold text-zinc-900 text-xs truncate">{{ msg.pdfTitle || 'Catalogo_WSP_Flow.pdf' }}</span>
                          </div>
                          <button (click)="downloadCatalogPdf()" class="text-[10px] font-bold text-indigo-600 bg-white px-2 py-1 rounded-md border border-zinc-200 shrink-0 hover:bg-zinc-50">
                            Descargar
                          </button>
                        </div>
                      }

                      <!-- Optional Order Card Widget -->
                      @if (msg.isOrderCard) {
                        <div class="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] space-y-1">
                          <div class="flex items-center justify-between font-bold text-emerald-900 font-mono">
                            <span>ORDEN {{ msg.orderNumber }}</span>
                            <span>{{ msg.orderTotal }}</span>
                          </div>
                          <p class="text-emerald-800 text-[10px]">Stock actualizado en PostgreSQL • Notificado al Dashboard</p>
                        </div>
                      }

                    </div>
                  </div>
                }

                @if (isSimulatingTyping()) {
                  <div class="flex justify-start">
                    <div class="bg-white border border-zinc-200 text-zinc-500 rounded-2xl rounded-tl-sm p-3 flex items-center gap-1.5 shadow-sm">
                      <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></span>
                      <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                      <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
                      <span class="text-[11px] font-mono ml-1">Luna está escribiendo...</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Input Simulator Footer -->
              <div class="mt-2.5 pt-2.5 border-t border-zinc-200/80 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Selecciona una opción del panel izquierdo..."
                  disabled
                  class="input-bento text-xs bg-white/60 cursor-not-allowed py-2"
                />
              </div>

            </div>

          </div>

        </div>
      </section>

      <!-- ================= 6 PILLARS FEATURE BENTO GRID ================= -->
      <section id="beneficios" class="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Todo lo necesario para escalar ventas
          </h2>
          <p class="text-zinc-500 text-sm sm:text-base mt-2">
            Arquitectura de producción construida con Angular 18, NestJS 10 y PostgreSQL 16.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <!-- Feature 1: AI Assistant Luna -->
          <div class="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm hover:shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3.5 border border-indigo-100">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="font-bold text-zinc-900 text-base mb-1.5">IA con Function Calling</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                OpenAI GPT-5.6-luna consulta inventario, calcula costos y crea órdenes automáticamente en base de datos.
              </p>
            </div>
            <span class="mt-4 text-[11px] font-mono font-bold text-indigo-600 block">5 Herramientas Integradas ➔</span>
          </div>

          <!-- Feature 2: WhatsApp Baileys -->
          <div class="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm hover:shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5 border border-emerald-100">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="font-bold text-zinc-900 text-base mb-1.5">WhatsApp Baileys</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Vinculación mediante código QR WebSocket multi-dispositivo sin tarifas por conversación ni intermediarios de Meta.
              </p>
            </div>
            <span class="mt-4 text-[11px] font-mono font-bold text-emerald-600 block">0% Costo por Mensaje ➔</span>
          </div>

          <!-- Feature 3: PDF Catalog Generator -->
          <div class="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm hover:shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3.5 border border-purple-100">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="font-bold text-zinc-900 text-base mb-1.5">Catálogo PDF Auto-Generado</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Genera al instante un PDF con diseño Bento, fotos en alta resolución, SKUs y precios, enviándolo como documento nativo.
              </p>
            </div>
            <span class="mt-4 text-[11px] font-mono font-bold text-purple-600 block">Descarga & Envío en 1 Clic ➔</span>
          </div>

          <!-- Feature 4: To-Do Kanban Pipeline -->
          <div class="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm hover:shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3.5 border border-amber-100">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 class="font-bold text-zinc-900 text-base mb-1.5">Tablero To-Do de Pedidos</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                4 etapas claras con avance de estado en 1 clic y enlace directo al chat de WhatsApp del comprador.
              </p>
            </div>
            <span class="mt-4 text-[11px] font-mono font-bold text-amber-700 block">Flujo Ágil de Despacho ➔</span>
          </div>

          <!-- Feature 5: Live Chat & Handover -->
          <div class="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm hover:shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3.5 border border-sky-100">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 class="font-bold text-zinc-900 text-base mb-1.5">Live Chat & Handover</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Toma el control de cualquier conversación con el selector Bot / Agente y responde desde el panel en tiempo real.
              </p>
            </div>
            <span class="mt-4 text-[11px] font-mono font-bold text-sky-600 block">Control Total en Vivo ➔</span>
          </div>

          <!-- Feature 6: Roles & Permissions -->
          <div class="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm hover:shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3.5 border border-rose-100">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 class="font-bold text-zinc-900 text-base mb-1.5">Equipo & Subadministradores</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Asigna operadores para atender pedidos y responder consultas con permisos acotados de seguridad.
              </p>
            </div>
            <span class="mt-4 text-[11px] font-mono font-bold text-rose-600 block">Seguridad & Auditoría ➔</span>
          </div>

        </div>

      </section>

      <!-- ================= HOW IT WORKS (3 STEPS) ================= -->
      <section id="como-funciona" class="py-14 sm:py-20 bg-white border-y border-zinc-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-12">
            <h2 class="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Listo en menos de 5 minutos
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            <!-- Step 1 -->
            <div class="bg-zinc-50/80 rounded-3xl border border-zinc-200/80 p-6 sm:p-7 text-center space-y-3.5">
              <div class="w-10 h-10 mx-auto rounded-xl bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center font-mono shadow-sm">
                1
              </div>
              <h3 class="font-bold text-zinc-900 text-base">Vincula tu WhatsApp</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Ingresa al panel y escanea el código QR en tiempo real para emparejar tu número de teléfono con Baileys.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="bg-zinc-50/80 rounded-3xl border border-zinc-200/80 p-6 sm:p-7 text-center space-y-3.5">
              <div class="w-10 h-10 mx-auto rounded-xl bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center font-mono shadow-sm">
                2
              </div>
              <h3 class="font-bold text-zinc-900 text-base">Carga tu Inventario</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Arrastra fotos de tus productos, asigna precios y categorías. El generador creará el catálogo PDF al instante.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="bg-zinc-50/80 rounded-3xl border border-zinc-200/80 p-6 sm:p-7 text-center space-y-3.5">
              <div class="w-10 h-10 mx-auto rounded-xl bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center font-mono shadow-sm">
                3
              </div>
              <h3 class="font-bold text-zinc-900 text-base">La IA Vende en Automático</h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Luna responde dudas, envía el PDF, concreta pedidos y los despacha a tu tablero To-Do Kanban.
              </p>
            </div>

          </div>

        </div>
      </section>

      <!-- ================= PUBLIC LIVE CATALOG SHOWCASE ================= -->
      <section id="catalogo" class="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Productos Destacados en Vivo
            </h2>
            <p class="text-zinc-500 text-sm mt-1">Conectado a la base de datos PostgreSQL en tiempo real.</p>
          </div>

          <button (click)="downloadCatalogPdf()" [disabled]="isDownloadingPdf()" class="btn-primary text-xs py-2.5 px-4 self-start md:self-auto">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Descargar Catálogo Completo (PDF)</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          @for (product of publicProducts(); track product.id) {
            <div class="bg-white rounded-3xl border border-zinc-200/90 p-4 shadow-sm hover:shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
              <div>
                <div class="relative h-40 rounded-2xl overflow-hidden bg-zinc-100 mb-3 border border-zinc-200/70">
                  <img
                    [src]="product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'"
                    [alt]="product.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-white/95 text-[10px] font-mono font-bold text-zinc-800 border border-zinc-200">
                    {{ product.sku }}
                  </span>
                </div>

                <span class="text-zinc-500 font-mono text-[10px] uppercase font-semibold block">
                  {{ product.categoryName || 'General' }}
                </span>
                <h4 class="font-bold text-zinc-900 text-sm line-clamp-1 mt-0.5 group-hover:text-indigo-600 transition-colors">
                  {{ product.name }}
                </h4>
                <p class="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                  {{ product.description }}
                </p>
              </div>

              <div class="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span class="text-base font-extrabold text-zinc-900 font-mono">&#36;{{ product.price | number: '1.2-2' }}</span>
                
                <a
                  [href]="'https://wa.me/?text=Hola!%20Quiero%20ordenar%20el%20producto%20' + product.name + '%20(SKU:%20' + product.sku + ')'"
                  target="_blank"
                  class="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 transition-colors active:scale-[0.98]"
                >
                  <span>Pedir</span>
                  <span>➔</span>
                </a>
              </div>
            </div>
          }
        </div>

      </section>

      <!-- ================= PRICING SECTION ================= -->
      <section id="precios" class="py-14 sm:py-20 bg-white border-y border-zinc-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-12">
            <h2 class="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Precios transparentes
            </h2>
            <p class="text-zinc-500 text-sm mt-1">Conecta tu WhatsApp y vende sin límites.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            
            <!-- Plan 1 -->
            <div class="bg-zinc-50/80 rounded-3xl border border-zinc-200/90 p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <h3 class="font-bold text-zinc-900 text-lg">Starter</h3>
                <p class="text-xs text-zinc-500 mt-1">Para emprendedores y tiendas iniciales</p>
                <div class="my-4">
                  <span class="text-3xl font-extrabold text-zinc-900 font-mono">&#36;29</span>
                  <span class="text-xs text-zinc-500 font-medium"> / mes</span>
                </div>
                <ul class="space-y-2.5 text-xs text-zinc-600">
                  <li class="flex items-center gap-2">✓ 1 Línea de WhatsApp Baileys</li>
                  <li class="flex items-center gap-2">✓ Hasta 100 productos en catálogo</li>
                  <li class="flex items-center gap-2">✓ Catálogo en PDF descargable</li>
                  <li class="flex items-center gap-2">✓ Respuestas automáticas con reglas</li>
                </ul>
              </div>
              <a routerLink="/login" class="btn-secondary w-full text-xs mt-6">Elegir Starter</a>
            </div>

            <!-- Plan 2 (Featured) -->
            <div class="bg-white rounded-3xl border-2 border-indigo-600 p-6 sm:p-7 shadow-lg shadow-indigo-600/5 flex flex-col justify-between relative">
              <span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Más Popular • Con IA
              </span>
              <div>
                <h3 class="font-bold text-zinc-900 text-lg">Business IA</h3>
                <p class="text-xs text-zinc-500 mt-1">Para negocios con ventas activas y stock</p>
                <div class="my-4">
                  <span class="text-3xl font-extrabold text-zinc-900 font-mono">&#36;59</span>
                  <span class="text-xs text-zinc-500 font-medium"> / mes</span>
                </div>
                <ul class="space-y-2.5 text-xs text-zinc-700 font-medium">
                  <li class="flex items-center gap-2">✓ <strong>Asistente OpenAI GPT-5.6-luna</strong></li>
                  <li class="flex items-center gap-2">✓ Function Calling & Creación de Órdenes</li>
                  <li class="flex items-center gap-2">✓ Catálogo PDF con envío automático</li>
                  <li class="flex items-center gap-2">✓ Tablero To-Do Kanban de Pedidos</li>
                  <li class="flex items-center gap-2">✓ Hasta 3 Subadministradores</li>
                </ul>
              </div>
              <a routerLink="/login" class="btn-primary w-full text-xs mt-6">Probar Business IA</a>
            </div>

            <!-- Plan 3 -->
            <div class="bg-zinc-50/80 rounded-3xl border border-zinc-200/90 p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <h3 class="font-bold text-zinc-900 text-lg">Enterprise</h3>
                <p class="text-xs text-zinc-500 mt-1">Para distribuidoras y cadenas multi-sucursal</p>
                <div class="my-4">
                  <span class="text-3xl font-extrabold text-zinc-900 font-mono">&#36;129</span>
                  <span class="text-xs text-zinc-500 font-medium"> / mes</span>
                </div>
                <ul class="space-y-2.5 text-xs text-zinc-600">
                  <li class="flex items-center gap-2">✓ Todo lo de Business IA</li>
                  <li class="flex items-center gap-2">✓ Subadministradores ilimitados</li>
                  <li class="flex items-center gap-2">✓ Múltiples líneas simultáneas</li>
                  <li class="flex items-center gap-2">✓ Soporte prioritario 24/7</li>
                </ul>
              </div>
              <a routerLink="/login" class="btn-secondary w-full text-xs mt-6">Contactar Ventas</a>
            </div>

          </div>

        </div>
      </section>

      <!-- ================= FAQ SECTION ================= -->
      <section id="faq" class="py-14 sm:py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Preguntas Frecuentes
          </h2>
        </div>

        <div class="space-y-3">
          @for (item of faqs(); track item.q) {
            <div class="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-sm">
              <h4 class="font-bold text-zinc-900 text-sm mb-1 flex items-center justify-between">
                <span>{{ item.q }}</span>
                <span class="text-indigo-600 font-mono text-xs">+</span>
              </h4>
              <p class="text-xs text-zinc-500 leading-relaxed">{{ item.a }}</p>
            </div>
          }
        </div>

      </section>

      <!-- ================= FINAL CTA BANNER ================= -->
      <section class="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div class="rounded-3xl bg-indigo-600 text-white p-8 sm:p-12 text-center space-y-5 shadow-lg shadow-indigo-600/15 relative overflow-hidden">
          <div class="max-w-2xl mx-auto space-y-3">
            <h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Comienza a vender por WhatsApp hoy mismo
            </h2>
            <p class="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Inicia sesión, vincula tu WhatsApp y deja que la IA gestione tus ventas.
            </p>
            <div class="pt-2">
              <a routerLink="/login" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-zinc-100 hover:shadow transition-all active:scale-[0.98]">
                <span>Acceder al Panel de Control</span>
                <span>➔</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= FOOTER ================= -->
      <footer class="border-t border-zinc-200/80 bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <span class="font-extrabold text-zinc-900 text-sm">WSP FLOW</span>
            <span class="text-xs text-zinc-500">© 2026 WSP Flow Commerce. Todos los derechos reservados.</span>
          </div>

          <div class="flex items-center gap-5 text-xs text-zinc-500 font-medium">
            <a href="#beneficios" class="hover:text-zinc-900">Ventajas</a>
            <a href="#simulador" class="hover:text-zinc-900">Simulador</a>
            <a href="#catalogo" class="hover:text-zinc-900">Catálogo</a>
            <a href="#precios" class="hover:text-zinc-900">Planes</a>
            <a routerLink="/login" class="hover:text-zinc-900 font-bold text-indigo-600">Acceso Panel</a>
          </div>
        </div>
      </footer>

    </div>
  `,
})
export class LandingComponent implements OnInit {
  private productsService = inject(ProductsService);

  publicProducts = signal<Product[]>([]);
  isDownloadingPdf = signal(false);
  isSimulatingTyping = signal(false);

  simulationMessages = signal<ChatSimulationMessage[]>([
    {
      sender: 'bot',
      senderName: 'Luna (IA)',
      text: '¡Hola! 👋 Soy Luna, la asistente virtual de ventas. Selecciona cualquiera de las opciones de la izquierda para ver cómo funciono en tiempo real.',
      time: 'Ahora',
    },
  ]);

  faqs = signal([
    {
      q: '¿Cómo se conecta mi WhatsApp a WSP Flow?',
      a: 'A través de Baileys WebSockets. Al ingresar al panel, se genera un código QR que escaneas desde tu aplicación de WhatsApp (Dispositivos Vinculados), exactamente igual a WhatsApp Web.',
    },
    {
      q: '¿Tiene algún costo por mensaje enviado?',
      a: 'No. Al utilizar la conexión directa de Baileys, no dependes de las tarifas de la API Cloud de Meta. Puedes enviar y recibir mensajes ilimitados.',
    },
    {
      q: '¿Cómo funciona la Inteligencia Artificial con GPT-5.6-luna?',
      a: 'Luna utiliza Function Calling para interactuar con la base de datos PostgreSQL. Cuando un cliente pregunta por un producto, Luna ejecuta una función para verificar el stock real y precios antes de responder.',
    },
    {
      q: '¿Cómo se genera y envía el Catálogo en PDF?',
      a: 'El sistema compila dinámicamente todos los productos activos con sus imágenes, SKUs y precios en un PDF estilo Bento. Cuando el cliente escribe "catalogo", el bot despacha automáticamente el archivo como documento adjunto.',
    },
    {
      q: '¿Qué permisos tienen los Subadministradores?',
      a: 'Los subadministradores pueden ver y actualizar el catálogo, gestionar pedidos en el tablero To-Do y responder chats en vivo, pero no pueden eliminar a otros usuarios ni ver configuraciones críticas.',
    },
  ]);

  ngOnInit() {
    this.productsService.getProducts().subscribe({
      next: (prods) => this.publicProducts.set(prods.slice(0, 4)),
    });
  }

  downloadCatalogPdf() {
    this.isDownloadingPdf.set(true);
    this.productsService.downloadCatalogPdf().subscribe({
      next: (blob) => {
        this.isDownloadingPdf.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Catalogo_WSP_Flow_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.isDownloadingPdf.set(false);
        alert('Error al descargar el catálogo en PDF.');
      },
    });
  }

  simulateScenario(scenario: 'catalog' | 'stock' | 'order' | 'human') {
    this.isSimulatingTyping.set(true);

    if (scenario === 'catalog') {
      this.simulationMessages.set([
        {
          sender: 'user',
          senderName: 'Tú',
          text: 'Hola, ¿me podrías pasar el catálogo de productos con precios?',
          time: '10:45 AM',
        },
      ]);

      setTimeout(() => {
        this.isSimulatingTyping.set(false);
        this.simulationMessages.update((list) => [
          ...list,
          {
            sender: 'bot',
            senderName: 'Luna (IA)',
            text: '¡Hola! Claro que sí. Te adjunto nuestro Catálogo Oficial en formato PDF con fotos, precios y stock en tiempo real.\n\nPara comprar, solo respóndeme con el código SKU del producto (ej: pedir #01).',
            time: '10:45 AM',
            isPdf: true,
            pdfTitle: 'Catalogo_WSP_Flow.pdf',
          },
        ]);
      }, 800);
    } else if (scenario === 'stock') {
      this.simulationMessages.set([
        {
          sender: 'user',
          senderName: 'Tú',
          text: '¿Tienen disponibles los Auriculares Bluetooth Pro y cuánto cuestan?',
          time: '10:46 AM',
        },
      ]);

      setTimeout(() => {
        this.isSimulatingTyping.set(false);
        this.simulationMessages.update((list) => [
          ...list,
          {
            sender: 'bot',
            senderName: 'Luna (IA)',
            text: '¡Sí, tenemos stock disponible!\n\nAuriculares Bluetooth Pro\n• Código: PROD-01\n• Precio: $29.99 USD\n• Stock actual: 25 unidades disponibles\n\n¿Te gustaría que te reserve alguno?',
            time: '10:46 AM',
          },
        ]);
      }, 800);
    } else if (scenario === 'order') {
      this.simulationMessages.set([
        {
          sender: 'user',
          senderName: 'Tú',
          text: 'Quiero ordenar 2 unidades del Reloj Inteligente para Martín Silva en Av. Corrientes 1234',
          time: '10:47 AM',
        },
      ]);

      setTimeout(() => {
        this.isSimulatingTyping.set(false);
        this.simulationMessages.update((list) => [
          ...list,
          {
            sender: 'bot',
            senderName: 'Luna (IA)',
            text: '¡Excelente Martín! Tu pedido ha sido registrado con éxito.\n\nDetalle de la compra:\n• 2x Reloj Inteligente V2\n• Total a Pagar: $99.98 USD\n• Envío a: Av. Corrientes 1234\n\nNuestro equipo ya lo tiene en la columna Por Atender del panel To-Do para su despacho.',
            time: '10:47 AM',
            isOrderCard: true,
            orderNumber: '#ORD-2045',
            orderTotal: '$99.98 USD',
          },
        ]);
      }, 1000);
    } else if (scenario === 'human') {
      this.simulationMessages.set([
        {
          sender: 'user',
          senderName: 'Tú',
          text: 'Quiero hablar con una persona de soporte, por favor.',
          time: '10:48 AM',
        },
      ]);

      setTimeout(() => {
        this.isSimulatingTyping.set(false);
        this.simulationMessages.update((list) => [
          ...list,
          {
            sender: 'bot',
            senderName: 'Luna (IA)',
            text: 'Atención Personalizada: He pausado las respuestas automáticas para este chat y notifiqué a nuestro equipo en el Live Chat. Un asesor humano te responderá por aquí en unos instantes.',
            time: '10:48 AM',
          },
        ]);
      }, 700);
    }
  }

  resetSimulation() {
    this.simulationMessages.set([
      {
        sender: 'bot',
        senderName: 'Luna (IA)',
        text: '¡Hola! 👋 Soy Luna, la asistente virtual de ventas. Selecciona cualquiera de las opciones de la izquierda para ver cómo respondo.',
        time: 'Ahora',
      },
    ]);
  }
}
