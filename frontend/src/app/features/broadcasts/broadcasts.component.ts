import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { StatsCardComponent } from '../../shared/components/stats-card/stats-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BroadcastService } from '../../core/services/broadcast.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { BroadcastCampaign, CustomerPortfolioItem } from '../../core/models/models';

@Component({
  selector: 'app-broadcasts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BentoCardComponent,
    StatsCardComponent,
    BadgeComponent,
    NavbarComponent,
  ],
  template: `
    <app-navbar
      title="Difusión Inteligente & Cartera CRM"
      subtitle="Gestión de cartera de clientes, comunicados programados y catálogo oficial con protección Anti-Ban"
    ></app-navbar>

    <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
      <!-- TOP TAB NAVIGATION -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div class="flex items-center gap-2 p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 shadow-inner w-fit">
          <button
            type="button"
            (click)="activeTab.set('campaigns')"
            [class.bg-white]="activeTab() === 'campaigns'"
            [class.text-indigo-600]="activeTab() === 'campaigns'"
            [class.shadow-sm]="activeTab() === 'campaigns'"
            [class.font-bold]="activeTab() === 'campaigns'"
            [class.text-zinc-600]="activeTab() !== 'campaigns'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
          >
            <span>📢 Campañas de Difusión</span>
            <span
              class="px-2 py-0.5 rounded-full text-[11px] font-bold"
              [class.bg-indigo-50]="activeTab() === 'campaigns'"
              [class.text-indigo-600]="activeTab() === 'campaigns'"
              [class.bg-zinc-200]="activeTab() !== 'campaigns'"
              [class.text-zinc-600]="activeTab() !== 'campaigns'"
            >
              {{ campaigns().length }}
            </span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('customers')"
            [class.bg-white]="activeTab() === 'customers'"
            [class.text-indigo-600]="activeTab() === 'customers'"
            [class.shadow-sm]="activeTab() === 'customers'"
            [class.font-bold]="activeTab() === 'customers'"
            [class.text-zinc-600]="activeTab() !== 'customers'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
          >
            <span>👥 Cartera de Clientes (CRM)</span>
            <span
              class="px-2 py-0.5 rounded-full text-[11px] font-bold"
              [class.bg-indigo-50]="activeTab() === 'customers'"
              [class.text-indigo-600]="activeTab() === 'customers'"
              [class.bg-zinc-200]="activeTab() !== 'customers'"
              [class.text-zinc-600]="activeTab() !== 'customers'"
            >
              {{ customers().length }}
            </span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            *ngIf="activeTab() === 'customers'"
            type="button"
            (click)="openAddCustomerModal()"
            class="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
          >
            <span>➕ Agregar Cliente Manual</span>
          </button>

          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Motor WhatsApp: Conectado
          </span>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- TAB 1: CAMPAÑAS DE DIFUSIÓN                -->
      <!-- ========================================== -->
      <div *ngIf="activeTab() === 'campaigns'" class="space-y-6 animate-fadeIn">
        <!-- TOP BANNER INFO -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white border border-indigo-100 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/20">
              📢
            </div>
            <div>
              <h3 class="text-sm font-bold text-zinc-900">Marketing Conversacional & Novedades</h3>
              <p class="text-xs text-zinc-500">
                Notifica a tus clientes sobre nuevos ingresos, catálogo y avisos sin riesgo de bloqueo en WhatsApp.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Motor Anti-Ban: Activo (Pausas 8s-18s)
            </span>
          </div>
        </div>

        <!-- STATS KPI BENTO -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <app-stats-card
            title="Total Campañas"
            [value]="campaigns().length.toString()"
            subtitle="Historial registrado"
            trend="100% informativas"
            [trendUp]="true"
            iconClass="bg-indigo-50 text-indigo-700 border-indigo-200/70"
          >
            <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </app-stats-card>

          <app-stats-card
            title="Mensajes Entregados"
            [value]="totalSent().toString()"
            subtitle="Contactos alcanzados"
            trend="Sin spam masivo"
            [trendUp]="true"
            iconClass="bg-emerald-50 text-emerald-700 border-emerald-200/70"
          >
            <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </app-stats-card>

          <app-stats-card
            title="Audiencia Estimada"
            [value]="estimatedCount().toString()"
            [subtitle]="currentSegmentName()"
            trend="Segmentación CRM"
            [trendUp]="true"
            iconClass="bg-purple-50 text-purple-700 border-purple-200/70"
          >
            <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </app-stats-card>

          <app-stats-card
            title="Pausas de Seguridad"
            value="8 - 18 seg"
            subtitle="Intervalo humanizado"
            trend="Presencia activa"
            [trendUp]="true"
            iconClass="bg-amber-50 text-amber-700 border-amber-200/70"
          >
            <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </app-stats-card>
        </div>

        <!-- MAIN GRID: CREATOR & LIVE SMARTPHONE PREVIEW -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- FORMULARIO CREADOR BENTO (7 COLS) -->
          <div class="lg:col-span-7">
            <app-bento-card>
              <div class="p-6 space-y-6">
                <div class="border-b border-zinc-100 pb-4">
                  <h2 class="text-base font-bold text-zinc-900 flex items-center gap-2">
                    ✍️ Nueva Campaña de Difusión
                  </h2>
                  <p class="text-xs text-zinc-500 mt-0.5">
                    Personaliza el mensaje y selecciona el segmento de clientes a notificar.
                  </p>
                </div>

                <form [formGroup]="broadcastForm" (ngSubmit)="onCreateCampaign()" class="space-y-5">
                  <!-- Título de Campaña -->
                  <div>
                    <label class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                      Título del Comunicado / Asunto
                    </label>
                    <input
                      type="text"
                      formControlName="title"
                      placeholder="Ej: Aviso: Ingreso de Nuevos Modelos y Catálogo"
                      class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                  </div>

                  <!-- Segmento CRM -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        Segmento de Clientes (CRM)
                      </label>
                      <span class="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                        👥 {{ estimatedCount() }} contactos calculados
                      </span>
                    </div>
                    <select
                      formControlName="targetSegment"
                      (change)="onSegmentChange()"
                      class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    >
                      <option value="ALL_CUSTOMERS">👥 Todos los Clientes (Base Completa de Chat & Pedidos)</option>
                      <option value="FREQUENT_BUYERS">💎 Compradores Frecuentes (2 o más compras cerradas)</option>
                      <option value="RECENT_CONTACTS">💬 Contactos Recientes (Interacción en los últimos 30 días)</option>
                      <option value="PENDING_ORDERS">⏳ Clientes con Pedidos Pendientes de Pago/Confirmación</option>
                    </select>
                  </div>

                  <!-- Plantilla de Mensaje -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        Contenido del Mensaje
                      </label>
                      <div class="flex items-center gap-1.5">
                        <button
                          type="button"
                          (click)="insertTag('{{nombre}}')"
                          class="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors border border-zinc-200 shadow-sm"
                        >
                          + {{ '{' }}{{ '{' }}nombre{{ '}' }}{{ '}' }}
                        </button>
                        <button
                          type="button"
                          (click)="insertTag('{{catalogo_link}}')"
                          class="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors border border-zinc-200 shadow-sm"
                        >
                          + {{ '{' }}{{ '{' }}catalogo_link{{ '}' }}{{ '}' }}
                        </button>
                      </div>
                    </div>
                    <textarea
                      formControlName="messageTemplate"
                      rows="6"
                      [placeholder]="'¡Hola {{nombre}}! 👋 Te escribimos para compartirte las novedades de nuestro catálogo...'"
                      class="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans leading-relaxed shadow-sm"
                    ></textarea>
                  </div>

                  <!-- Adjuntos -->
                  <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm border border-indigo-200">
                          📄
                        </div>
                        <div>
                          <div class="text-sm font-bold text-zinc-900">Adjuntar Catálogo PDF Oficial</div>
                          <div class="text-xs text-zinc-500">Genera y envía automáticamente el PDF con fotos y precios</div>
                        </div>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" formControlName="attachPdfCatalog" class="sr-only peer" />
                        <div class="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div>
                      <label class="block text-xs font-semibold text-zinc-600 mb-1">
                        URL de Imagen / Banner (Opcional)
                      </label>
                      <input
                        type="url"
                        formControlName="mediaUrl"
                        placeholder="https://ejemplo.com/banner-comunicado.jpg"
                        class="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <!-- BOTÓN DE ACCIÓN -->
                  <div class="pt-2">
                    <button
                      type="submit"
                      [disabled]="broadcastForm.invalid || isSubmitting()"
                      class="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span *ngIf="!isSubmitting()">🚀 Programar y Crear Campaña</span>
                      <span *ngIf="isSubmitting()" class="flex items-center gap-2">
                        <svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        Guardando Campaña...
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </app-bento-card>
          </div>

          <!-- SMARTPHONE LIVE PREVIEW (5 COLS) -->
          <div class="lg:col-span-5 flex flex-col items-center">
            <div class="w-full max-w-sm">
              <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between px-1">
                <span>📱 Vista Previa en WhatsApp</span>
                <span class="text-emerald-600 font-semibold">En Vivo</span>
              </div>

              <!-- DISPOSITIVO MÓVIL ESTILIZADO -->
              <div class="w-full rounded-[36px] bg-white border-4 border-zinc-200 shadow-xl overflow-hidden p-3 text-zinc-800">
                <!-- Header WhatsApp -->
                <div class="bg-[#008069] -mx-3 -mt-3 p-3 flex items-center justify-between text-white shadow-sm">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                      WF
                    </div>
                    <div>
                      <div class="text-xs font-bold text-white leading-tight">WSP Flow Oficial</div>
                      <div class="text-[10px] text-emerald-100">cuenta de empresa</div>
                    </div>
                  </div>
                  <div class="flex gap-3 text-white/90 text-xs">
                    <span>📞</span>
                    <span>⋮</span>
                  </div>
                </div>

                <!-- Chat Canvas con Wallpaper WhatsApp clásico -->
                <div class="py-6 px-1 min-h-[380px] flex flex-col justify-end space-y-3 bg-[#efeae2] rounded-2xl my-2 p-2.5">
                  <!-- Burbuja de mensaje -->
                  <div class="self-start max-w-[92%] bg-white text-zinc-900 p-3 rounded-2xl rounded-tl-none shadow-sm space-y-2 border border-zinc-200/50">
                    <!-- Preview de Archivo PDF o Imagen -->
                    <div *ngIf="broadcastForm.get('attachPdfCatalog')?.value" class="p-2.5 bg-zinc-50 rounded-xl flex items-center gap-2.5 border border-zinc-200">
                      <span class="text-xl">📄</span>
                      <div class="overflow-hidden">
                        <div class="text-xs font-bold text-zinc-900 truncate">Catalogo_WSP_Flow.pdf</div>
                        <div class="text-[10px] text-zinc-500">Catálogo Oficial • 364 KB</div>
                      </div>
                    </div>

                    <div *ngIf="broadcastForm.get('mediaUrl')?.value" class="rounded-lg overflow-hidden border border-zinc-200">
                      <img [src]="broadcastForm.get('mediaUrl')?.value" alt="Banner" class="w-full h-28 object-cover" />
                    </div>

                    <!-- Texto renderizado -->
                    <div class="text-xs leading-relaxed whitespace-pre-wrap font-sans text-zinc-800">
                      {{ previewText() }}
                    </div>

                    <div class="flex items-center justify-end gap-1 text-[10px] text-zinc-400 pt-0.5">
                      <span>{{ currentHour }}</span>
                      <span class="text-[#53bdeb]">✓✓</span>
                    </div>
                  </div>
                </div>

                <!-- Barra inferior de mensaje simulada -->
                <div class="bg-zinc-100 -mx-3 -mb-3 p-2.5 flex items-center gap-2 border-t border-zinc-200 text-zinc-500 text-xs">
                  <span>😊</span>
                  <div class="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-zinc-400 border border-zinc-200">
                    Mensaje...
                  </div>
                  <span>🎙️</span>
                </div>
              </div>

              <div class="mt-4 p-3.5 rounded-xl bg-white border border-zinc-200 shadow-sm text-xs text-zinc-600 flex items-start gap-2.5">
                <span class="text-amber-500 text-base">💡</span>
                <div>
                  <strong class="text-zinc-900">Personalización Dinámica:</strong> Cada cliente recibirá el mensaje con su nombre real y número sin mostrar etiquetas de código.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MONITOR DE HISTORIAL & PROGRESO DE CAMPAÑAS BENTO -->
        <app-bento-card>
          <div class="p-6 space-y-6">
            <div class="border-b border-zinc-100 pb-4 flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-zinc-900 flex items-center gap-2">
                  📊 Historial y Monitor de Campañas
                </h2>
                <p class="text-xs text-zinc-500 mt-0.5">
                  Supervisa el progreso de envío en vivo, pausas Anti-Ban y estado de entrega.
                </p>
              </div>

              <button
                (click)="loadCampaigns()"
                class="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors border border-zinc-200 shadow-sm flex items-center gap-1.5"
              >
                🔄 Actualizar
              </button>
            </div>

            <div *ngIf="campaigns().length === 0" class="text-center py-12 text-zinc-400">
              <div class="text-4xl mb-2">📢</div>
              <div class="text-sm font-semibold text-zinc-700">Aún no hay campañas de difusión registradas</div>
              <div class="text-xs text-zinc-500 mt-1">Crea tu primera campaña utilizando el formulario superior</div>
            </div>

            <div *ngIf="campaigns().length > 0" class="space-y-4">
              <div
                *ngFor="let camp of campaigns()"
                class="p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 hover:border-zinc-300 hover:bg-white transition-all space-y-4 shadow-sm"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2.5">
                      <span class="text-sm font-bold text-zinc-900">{{ camp.title }}</span>
                      <app-badge [variant]="getStatusBadgeVariant(camp.status)">
                        {{ getStatusLabel(camp.status) }}
                      </app-badge>
                      <span *ngIf="camp.attachPdfCatalog" class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        📄 Catálogo PDF
                      </span>
                    </div>
                    <div class="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                      <span>🎯 Segmento: <strong class="text-zinc-700">{{ getSegmentLabel(camp.targetSegment) }}</strong></span>
                      <span>•</span>
                      <span>📅 {{ camp.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                  </div>

                  <!-- ACCIONES -->
                  <div class="flex items-center gap-2">
                    <button
                      *ngIf="camp.status === 'DRAFT' || camp.status === 'PAUSED'"
                      (click)="onStartCampaign(camp.id)"
                      class="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 shadow-sm"
                    >
                      ▶️ {{ camp.status === 'PAUSED' ? 'Reanudar' : 'Iniciar Envío' }}
                    </button>

                    <button
                      *ngIf="camp.status === 'SENDING'"
                      (click)="onPauseCampaign(camp.id)"
                      class="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-white transition-all flex items-center gap-1 shadow-sm"
                    >
                      ⏸️ Pausar
                    </button>

                    <button
                      *ngIf="camp.status === 'SENDING' || camp.status === 'PAUSED'"
                      (click)="onCancelCampaign(camp.id)"
                      class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                    >
                      🛑 Cancelar
                    </button>

                    <button
                      *ngIf="camp.status === 'COMPLETED' || camp.status === 'CANCELLED' || camp.status === 'DRAFT'"
                      (click)="onDeleteCampaign(camp.id)"
                      class="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Eliminar registro"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <!-- BARRA DE PROGRESO EN VIVO -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs text-zinc-600">
                    <span>
                      Progreso de entrega: <strong class="text-zinc-900">{{ camp.sentCount }} / {{ camp.totalRecipients }}</strong> enviados
                    </span>
                    <span class="font-bold text-indigo-600">
                      {{ getProgressPercentage(camp) }}%
                    </span>
                  </div>
                  <div class="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                      [style.width.%]="getProgressPercentage(camp)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </app-bento-card>
      </div>

      <!-- ========================================== -->
      <!-- TAB 2: CARTERA DE CLIENTES CRM             -->
      <!-- ========================================== -->
      <div *ngIf="activeTab() === 'customers'" class="space-y-6 animate-fadeIn">
        <!-- KPI METRICS DE CARTERA -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <app-stats-card
            title="Total Clientes"
            [value]="customers().length.toString()"
            subtitle="Contactos en base CRM"
            trend="Cartera unificada"
            [trendUp]="true"
            iconClass="bg-indigo-50 text-indigo-700 border-indigo-200/70"
          >
            <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </app-stats-card>

          <app-stats-card
            title="Con Compras Activas"
            [value]="customersWithOrders().toString()"
            subtitle="Clientes compradores"
            trend="Historial de pedidos"
            [trendUp]="true"
            iconClass="bg-emerald-50 text-emerald-700 border-emerald-200/70"
          >
            <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </app-stats-card>

          <app-stats-card
            title="Volumen Acumulado"
            [value]="'S/ ' + totalSalesVolume().toFixed(2)"
            subtitle="Ventas generadas"
            trend="Ingresos totales"
            [trendUp]="true"
            iconClass="bg-purple-50 text-purple-700 border-purple-200/70"
          >
            <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </app-stats-card>

          <app-stats-card
            title="Cobertura Bot IA"
            [value]="activeBotCount().toString()"
            subtitle="Atención automatizada 24/7"
            trend="Respuesta inmediata"
            [trendUp]="true"
            iconClass="bg-blue-50 text-blue-700 border-blue-200/70"
          >
            <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </app-stats-card>
        </div>

        <!-- DIRECTORIO Y TABLA BENTO -->
        <app-bento-card>
          <div class="p-6 space-y-6">
            <!-- BARRA DE BÚSQUEDA Y FILTROS -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
              <div class="relative flex-1 max-w-md">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                  🔍
                </span>
                <input
                  type="text"
                  [ngModel]="customerSearch()"
                  (ngModelChange)="customerSearch.set($event)"
                  placeholder="Buscar por nombre o número de teléfono..."
                  class="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <div class="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs">
                  <button
                    type="button"
                    (click)="customerFilter.set('ALL')"
                    [class.bg-white]="customerFilter() === 'ALL'"
                    [class.text-indigo-600]="customerFilter() === 'ALL'"
                    [class.shadow-sm]="customerFilter() === 'ALL'"
                    [class.font-bold]="customerFilter() === 'ALL'"
                    [class.text-zinc-600]="customerFilter() !== 'ALL'"
                    class="px-3 py-1.5 rounded-lg transition-all"
                  >
                    Todos ({{ customers().length }})
                  </button>
                  <button
                    type="button"
                    (click)="customerFilter.set('ORDERS')"
                    [class.bg-white]="customerFilter() === 'ORDERS'"
                    [class.text-indigo-600]="customerFilter() === 'ORDERS'"
                    [class.shadow-sm]="customerFilter() === 'ORDERS'"
                    [class.font-bold]="customerFilter() === 'ORDERS'"
                    [class.text-zinc-600]="customerFilter() !== 'ORDERS'"
                    class="px-3 py-1.5 rounded-lg transition-all"
                  >
                    🛒 Con Pedidos
                  </button>
                  <button
                    type="button"
                    (click)="customerFilter.set('MANUAL')"
                    [class.bg-white]="customerFilter() === 'MANUAL'"
                    [class.text-indigo-600]="customerFilter() === 'MANUAL'"
                    [class.shadow-sm]="customerFilter() === 'MANUAL'"
                    [class.font-bold]="customerFilter() === 'MANUAL'"
                    [class.text-zinc-600]="customerFilter() !== 'MANUAL'"
                    class="px-3 py-1.5 rounded-lg transition-all"
                  >
                    👤 Manuales
                  </button>
                </div>

                <button
                  type="button"
                  (click)="loadCustomers()"
                  class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors border border-zinc-200 shadow-sm flex items-center gap-1.5"
                >
                  🔄 Refrescar
                </button>
              </div>
            </div>

            <!-- EMPTY STATE -->
            <div *ngIf="filteredCustomers().length === 0" class="text-center py-16 text-zinc-400">
              <div class="text-5xl mb-3">👥</div>
              <div class="text-base font-bold text-zinc-800">No se encontraron clientes</div>
              <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                No hay clientes que coincidan con la búsqueda. Puedes agregar un nuevo cliente manualmente con el botón superior.
              </p>
              <button
                type="button"
                (click)="openAddCustomerModal()"
                class="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 inline-flex items-center gap-2"
              >
                <span>➕ Registrar Primer Cliente</span>
              </button>
            </div>

            <!-- TABLA DE CLIENTES CRM -->
            <div *ngIf="filteredCustomers().length > 0" class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50/50">
                    <th class="py-3.5 px-4 rounded-l-xl">Cliente</th>
                    <th class="py-3.5 px-4">WhatsApp / Teléfono</th>
                    <th class="py-3.5 px-4">Historial Pedidos</th>
                    <th class="py-3.5 px-4">Última Actividad</th>
                    <th class="py-3.5 px-4">Bot IA</th>
                    <th class="py-3.5 px-4 text-right rounded-r-xl">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 text-xs text-zinc-700">
                  <tr
                    *ngFor="let cust of filteredCustomers()"
                    class="hover:bg-zinc-50/80 transition-colors group"
                  >
                    <!-- CLIENTE -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {{ getInitials(cust.customerName) }}
                        </div>
                        <div>
                          <div class="font-bold text-zinc-900 text-sm">
                            {{ cust.customerName }}
                          </div>
                          <div class="flex items-center gap-1.5 mt-0.5">
                            <span
                              *ngIf="cust.source === 'MANUAL'"
                              class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                            >
                              👤 Registro Manual
                            </span>
                            <span
                              *ngIf="cust.source === 'ORDER'"
                              class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            >
                              🛒 Venta Tienda
                            </span>
                            <span
                              *ngIf="cust.source === 'CHAT'"
                              class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            >
                              💬 WhatsApp
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- TELÉFONO -->
                    <td class="py-3.5 px-4 font-mono font-medium text-zinc-800">
                      <div class="flex items-center gap-1.5">
                        <span>🇵🇪</span>
                        <span>+{{ cust.customerPhone }}</span>
                      </div>
                    </td>

                    <!-- HISTORIAL PEDIDOS -->
                    <td class="py-3.5 px-4">
                      <div *ngIf="cust.totalOrders > 0" class="space-y-0.5">
                        <div class="font-bold text-zinc-900">
                          {{ cust.totalOrders }} {{ cust.totalOrders === 1 ? 'pedido' : 'pedidos' }}
                        </div>
                        <div class="text-[11px] font-semibold text-emerald-600">
                          Total: S/ {{ cust.totalSpent.toFixed(2) }}
                        </div>
                      </div>
                      <div *ngIf="cust.totalOrders === 0" class="text-zinc-400 italic text-[11px]">
                        Sin compras aún
                      </div>
                    </td>

                    <!-- ÚLTIMA ACTIVIDAD -->
                    <td class="py-3.5 px-4 text-zinc-500">
                      <div>{{ cust.lastInteraction | date: 'dd/MM/yyyy HH:mm' }}</div>
                      <div *ngIf="cust.lastOrderDate" class="text-[10px] text-zinc-400">
                        Último pedido: {{ cust.lastOrderDate | date: 'dd/MM/yy' }}
                      </div>
                    </td>

                    <!-- ESTADO BOT -->
                    <td class="py-3.5 px-4">
                      <span
                        *ngIf="cust.isBotActive"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        🤖 IA Activa
                      </span>
                      <span
                        *ngIf="!cust.isBotActive"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200"
                      >
                        👤 Manual
                      </span>
                    </td>

                    <!-- ACCIONES -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          (click)="openLiveChat(cust.customerPhone)"
                          class="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors border border-indigo-200 flex items-center gap-1"
                          title="Abrir conversación en Live Chat"
                        >
                          💬 Chat
                        </button>

                        <button
                          type="button"
                          (click)="onDeleteCustomer(cust)"
                          class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar de cartera"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </app-bento-card>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: AGREGAR CLIENTE MANUALMENTE        -->
    <!-- ========================================== -->
    <div
      *ngIf="isAddCustomerModalOpen()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        class="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden p-6 sm:p-7 space-y-6 relative"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold border border-indigo-200">
              👤
            </div>
            <div>
              <h3 class="text-base font-bold text-zinc-900">Agregar Cliente a Cartera CRM</h3>
              <p class="text-xs text-zinc-500">Registra un nuevo contacto para difusiones y atención en WhatsApp.</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeAddCustomerModal()"
            class="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <!-- Formulario -->
        <form [formGroup]="manualCustomerForm" (ngSubmit)="onSaveManualCustomer()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Nombre Completo o Empresa <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="customerName"
              placeholder="Ej: Carlos Mendoza / Zapatería Lima"
              class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Número de WhatsApp / Teléfono <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-xs font-bold text-zinc-400">
                🇵🇪 +51
              </span>
              <input
                type="tel"
                formControlName="customerPhone"
                placeholder="987 654 321"
                class="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-16 pr-4 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>
            <p class="text-[11px] text-zinc-400 mt-1">
              Ingresa el número de 9 dígitos para Perú o con código internacional si es del exterior.
            </p>
          </div>

          <!-- Opción de Saludo Automático -->
          <div class="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
            <input
              type="checkbox"
              id="sendGreeting"
              formControlName="sendGreeting"
              class="mt-1 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label for="sendGreeting" class="text-xs text-zinc-700 cursor-pointer">
              <strong class="text-indigo-900 font-semibold block">Enviar saludo de bienvenida inmediato</strong>
              Envía un mensaje de saludo inicial por WhatsApp informando que su contacto ha sido registrado en WSP Flow.
            </label>
          </div>

          <!-- Acciones -->
          <div class="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100">
            <button
              type="button"
              (click)="closeAddCustomerModal()"
              class="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="manualCustomerForm.invalid || isSavingCustomer()"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span *ngIf="!isSavingCustomer()">💾 Guardar en Cartera</span>
              <span *ngIf="isSavingCustomer()" class="flex items-center gap-1.5">
                <svg class="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Guardando...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class BroadcastsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private broadcastService = inject(BroadcastService);
  private socketService = inject(SocketService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Tabs
  activeTab = signal<'campaigns' | 'customers'>('campaigns');

  // Campañas
  campaigns = signal<BroadcastCampaign[]>([]);
  estimatedCount = signal<number>(0);
  isSubmitting = signal<boolean>(false);

  // Cartera CRM
  customers = signal<CustomerPortfolioItem[]>([]);
  customerSearch = signal<string>('');
  customerFilter = signal<'ALL' | 'ORDERS' | 'MANUAL'>('ALL');
  isAddCustomerModalOpen = signal<boolean>(false);
  isSavingCustomer = signal<boolean>(false);

  private subs: Subscription[] = [];
  currentHour = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  broadcastForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    targetSegment: ['ALL_CUSTOMERS', Validators.required],
    messageTemplate: [
      '¡Hola {{nombre}}! 👋 Te escribimos de WSP Flow para compartirte que acabamos de actualizar nuestro catálogo oficial con nuevos modelos disponibles ✨.\n\n📄 Puedes consultar el catálogo actualizado respondiendo a este mensaje o escribirnos si deseas consultar por algún artículo en específico.',
      [Validators.required, Validators.minLength(10)],
    ],
    attachPdfCatalog: [true],
    mediaUrl: [''],
  });

  manualCustomerForm = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerPhone: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{8,15}$/)]],
    sendGreeting: [true],
  });

  previewText = computed(() => {
    const raw = this.broadcastForm.get('messageTemplate')?.value || '';
    return raw
      .replace(/{{nombre}}/gi, 'Carlos')
      .replace(/{{telefono}}/gi, '+51 987 654 321')
      .replace(/{{catalogo_link}}/gi, 'http://localhost:4200/catalog');
  });

  totalSent = computed(() => {
    return this.campaigns().reduce((acc, c) => acc + (c.sentCount || 0), 0);
  });

  currentSegmentName = computed(() => {
    const seg = this.broadcastForm.get('targetSegment')?.value;
    return this.getSegmentLabel(seg || 'ALL_CUSTOMERS');
  });

  // Métricas computadas de Cartera CRM
  filteredCustomers = computed(() => {
    const list = this.customers();
    const query = this.customerSearch().trim().toLowerCase();
    const filter = this.customerFilter();

    return list.filter((c) => {
      // Filtro de texto
      const matchesSearch =
        !query ||
        c.customerName.toLowerCase().includes(query) ||
        c.customerPhone.includes(query);

      if (!matchesSearch) return false;

      // Filtro de tipo
      if (filter === 'ORDERS') return c.totalOrders > 0;
      if (filter === 'MANUAL') return c.source === 'MANUAL';
      return true;
    });
  });

  customersWithOrders = computed(() => {
    return this.customers().filter((c) => c.totalOrders > 0).length;
  });

  totalSalesVolume = computed(() => {
    return this.customers().reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  });

  activeBotCount = computed(() => {
    return this.customers().filter((c) => c.isBotActive).length;
  });

  ngOnInit() {
    this.loadCampaigns();
    this.loadCustomers();
    this.onSegmentChange();
    this.listenSockets();
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  loadCampaigns() {
    this.broadcastService.getCampaigns().subscribe({
      next: (data) => this.campaigns.set(data),
      error: (err) => console.error('Error cargando campañas:', err),
    });
  }

  loadCustomers() {
    this.broadcastService.getCustomerPortfolio().subscribe({
      next: (data) => this.customers.set(data),
      error: (err) => console.error('Error cargando cartera de clientes:', err),
    });
  }

  onSegmentChange() {
    const seg = this.broadcastForm.get('targetSegment')?.value || 'ALL_CUSTOMERS';
    this.broadcastService.estimateAudience(seg).subscribe({
      next: (res) => this.estimatedCount.set(res.count),
      error: () => this.estimatedCount.set(0),
    });
  }

  insertTag(tag: string) {
    const current = this.broadcastForm.get('messageTemplate')?.value || '';
    this.broadcastForm.patchValue({ messageTemplate: current + ' ' + tag });
  }

  onCreateCampaign() {
    if (this.broadcastForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.broadcastForm.value;

    this.broadcastService
      .createCampaign({
        title: formVal.title!,
        targetSegment: formVal.targetSegment!,
        messageTemplate: formVal.messageTemplate!,
        attachPdfCatalog: !!formVal.attachPdfCatalog,
        mediaUrl: formVal.mediaUrl || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.success('Campaña de difusión creada exitosamente.');
          this.loadCampaigns();
          this.broadcastForm.patchValue({
            title: '',
          });
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toast.error('Error creando campaña: ' + (err.error?.message || err.message));
        },
      });
  }

  // Métodos de Cartera CRM
  openAddCustomerModal() {
    this.manualCustomerForm.reset({ sendGreeting: true });
    this.isAddCustomerModalOpen.set(true);
  }

  closeAddCustomerModal() {
    this.isAddCustomerModalOpen.set(false);
  }

  onSaveManualCustomer() {
    if (this.manualCustomerForm.invalid) return;

    this.isSavingCustomer.set(true);
    const val = this.manualCustomerForm.value;

    this.broadcastService
      .addManualCustomer({
        customerName: val.customerName!,
        customerPhone: val.customerPhone!,
        sendGreeting: !!val.sendGreeting,
      })
      .subscribe({
        next: () => {
          this.isSavingCustomer.set(false);
          this.closeAddCustomerModal();
          this.toast.success('Cliente registrado exitosamente en la cartera CRM.');
          this.loadCustomers();
          this.onSegmentChange();
        },
        error: (err) => {
          this.isSavingCustomer.set(false);
          this.toast.error('Error registrando cliente: ' + (err.error?.message || err.message));
        },
      });
  }

  async onDeleteCustomer(customer: CustomerPortfolioItem) {
    const confirmed = await this.toast.confirm({
      title: 'Eliminar Cliente de Cartera',
      message: `¿Estás seguro de eliminar a "${customer.customerName}" (${customer.customerPhone}) de la cartera CRM?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.broadcastService.deleteCustomer(customer.id || customer.customerPhone).subscribe({
      next: () => {
        this.toast.success(`Cliente "${customer.customerName}" eliminado.`);
        this.loadCustomers();
        this.onSegmentChange();
      },
      error: (err) => this.toast.error('Error eliminando cliente: ' + err.message),
    });
  }

  openLiveChat(phone: string) {
    this.router.navigate(['/chat'], { queryParams: { phone } });
  }

  getInitials(name: string): string {
    if (!name) return 'CL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  onStartCampaign(id: string) {
    this.broadcastService.startCampaign(id).subscribe({
      next: () => {
        this.toast.success('Campaña iniciada.');
        this.loadCampaigns();
      },
      error: (err) => this.toast.error('Error iniciando campaña: ' + err.message),
    });
  }

  onPauseCampaign(id: string) {
    this.broadcastService.pauseCampaign(id).subscribe({
      next: () => {
        this.toast.info('Campaña pausada.');
        this.loadCampaigns();
      },
      error: (err) => this.toast.error('Error pausando campaña: ' + err.message),
    });
  }

  async onCancelCampaign(id: string) {
    const confirmed = await this.toast.confirm({
      title: 'Cancelar Difusión',
      message: '¿Estás seguro de cancelar esta campaña de difusión masiva?',
      confirmText: 'Sí, Cancelar',
      type: 'warning',
    });
    if (!confirmed) return;

    this.broadcastService.cancelCampaign(id).subscribe({
      next: () => {
        this.toast.success('Campaña cancelada con éxito.');
        this.loadCampaigns();
      },
      error: (err) => this.toast.error('Error cancelando campaña: ' + err.message),
    });
  }

  async onDeleteCampaign(id: string) {
    const confirmed = await this.toast.confirm({
      title: 'Eliminar Registro de Campaña',
      message: '¿Deseas eliminar permanentemente el registro histórico de esta campaña?',
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.broadcastService.deleteCampaign(id).subscribe({
      next: () => {
        this.toast.success('Campaña eliminada.');
        this.loadCampaigns();
      },
      error: (err) => this.toast.error('Error eliminando campaña: ' + err.message),
    });
  }

  private listenSockets() {
    const progressSub = this.socketService.listen<any>('BROADCAST_PROGRESS').subscribe((evt) => {
      if (evt) {
        this.campaigns.update((list) =>
          list.map((c) =>
            c.id === evt.campaignId
              ? {
                  ...c,
                  sentCount: evt.sentCount,
                  deliveredCount: evt.deliveredCount,
                  status: evt.status || 'SENDING',
                }
              : c,
          ),
        );
      }
    });

    const completedSub = this.socketService.listen<any>('BROADCAST_COMPLETED').subscribe((evt) => {
      if (evt) {
        this.loadCampaigns();
      }
    });

    this.subs.push(progressSub, completedSub);
  }

  getProgressPercentage(camp: BroadcastCampaign): number {
    if (!camp.totalRecipients || camp.totalRecipients === 0) return 0;
    return Math.min(100, Math.round(((camp.sentCount || 0) / camp.totalRecipients) * 100));
  }

  getStatusBadgeVariant(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'SENDING':
        return 'info';
      case 'PAUSED':
        return 'warning';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return '✅ Completado';
      case 'SENDING':
        return '🚀 En Progreso';
      case 'PAUSED':
        return '⏸️ Pausado';
      case 'CANCELLED':
        return '🛑 Cancelado';
      default:
        return '⏳ Borrador';
    }
  }

  getSegmentLabel(segment: string): string {
    switch (segment) {
      case 'FREQUENT_BUYERS':
        return '💎 Compradores Frecuentes';
      case 'RECENT_CONTACTS':
        return '💬 Contactos Recientes';
      case 'PENDING_ORDERS':
        return '⏳ Pedidos Pendientes';
      case 'ALL_CUSTOMERS':
      default:
        return '👥 Todos los Clientes';
    }
  }
}
