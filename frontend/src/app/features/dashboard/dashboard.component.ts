import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { StatsCardComponent } from '../../shared/components/stats-card/stats-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { QrModalComponent } from '../../shared/components/qr-modal/qr-modal.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardMetrics, SessionStatus, WhatsAppStatus } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BentoCardComponent,
    StatsCardComponent,
    BadgeComponent,
    QrModalComponent,
    NavbarComponent,
  ],
  template: `
    <app-navbar title="Panel de Control" subtitle="Métricas en tiempo real, catálogo y bot Baileys"></app-navbar>

    <div class="space-y-6 mt-6">
      
      <!-- Top Stats Row (Bento Grid Light Mode) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <app-stats-card
          title="Facturación Total"
          [value]="'S/ ' + (metrics()?.financial?.totalRevenue || 0 | number: '1.2-2')"
          trend="18.5%"
          [trendUp]="true"
          subtitle="Ventas acumuladas procesadas"
          iconClass="bg-indigo-50 text-indigo-700 border-indigo-200/70"
        >
          <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </app-stats-card>

        <app-stats-card
          title="Pedidos Totales"
          [value]="(metrics()?.financial?.totalOrders || 0).toString()"
          trend="12 hoy"
          [trendUp]="true"
          subtitle="Atendidos por el bot y panel"
          iconClass="bg-purple-50 text-purple-700 border-purple-200/70"
        >
          <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </app-stats-card>

        <app-stats-card
          title="Pedidos Pendientes"
          [value]="(metrics()?.financial?.pendingOrders || 0).toString()"
          subtitle="Requieren preparación o despacho"
          iconClass="bg-amber-50 text-amber-700 border-amber-200/70"
        >
          <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </app-stats-card>

        <app-stats-card
          title="Clientes WhatsApp"
          [value]="(metrics()?.chats?.totalChats || 0).toString()"
          subtitle="Conversaciones en base de datos"
          iconClass="bg-emerald-50 text-emerald-700 border-emerald-200/70"
        >
          <svg icon class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </app-stats-card>
      </div>

      <!-- Main Bento Layout (Asymmetrical Grid) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Bento Card: Operatividad Bot de WhatsApp & QR Streaming (5 cols) -->
        <div class="lg:col-span-5">
          <app-bento-card [glow]="true" customClass="h-full flex flex-col justify-between">
            <div>
              <!-- Header -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shadow-sm">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-bold text-zinc-900 text-sm">Bot de WhatsApp (Baileys)</h3>
                    <p class="text-xs text-zinc-500 font-normal">Motor multi-device con venta y OpenAI</p>
                  </div>
                </div>
                
                @switch (whatsappStatus().status) {
                  @case ('CONNECTED') {
                    <app-badge variant="success">Conectado</app-badge>
                  }
                  @case ('SCAN_QR') {
                    <app-badge variant="warning">Escanear QR</app-badge>
                  }
                  @case ('CONNECTING') {
                    <app-badge variant="info">Conectando...</app-badge>
                  }
                  @default {
                    <app-badge variant="neutral">Desconectado</app-badge>
                  }
                }
              </div>

              <!-- Estado Visual de WhatsApp en Light Mode -->
              @if (whatsappStatus().status === 'CONNECTED') {
                <div class="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 my-4 text-center">
                  <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-2 shadow-xs">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-emerald-800 font-mono text-[11px] font-bold uppercase tracking-wider block">Línea Oficial Conectada</span>
                  <p class="text-lg font-extrabold text-zinc-900 mt-1 font-mono">
                    +{{ whatsappStatus().phoneNumber || 'Número Vinculado' }}
                  </p>
                  <p class="text-xs text-zinc-500 mt-1">El catálogo y pedidos interactivos están atendiendo en vivo.</p>
                </div>
              } @else if (whatsappStatus().status === 'SCAN_QR' && whatsappStatus().qrCode) {
                <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 my-4 text-center">
                  <p class="text-xs font-bold text-amber-800 mb-2">Escanea el código QR con WhatsApp</p>
                  <img [src]="whatsappStatus().qrCode" alt="QR Code" class="w-44 h-44 mx-auto rounded-xl p-2 bg-white border border-zinc-200 shadow-sm" />
                  <p class="text-[11px] text-zinc-500 mt-2">Transmisión en tiempo real vía WebSocket</p>
                </div>
              } @else {
                <div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 my-4 text-center">
                  <div class="w-10 h-10 mx-auto rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-2">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p class="text-sm font-semibold text-zinc-800">Sesión no iniciada</p>
                  <p class="text-xs text-zinc-500 mt-1">Inicia la conexión para generar el código QR de vinculación.</p>
                </div>
              }
            </div>

            <!-- Botones de Acción de WhatsApp -->
            <div class="flex items-center gap-3 pt-4 border-t border-zinc-100">
              @if (whatsappStatus().status === 'CONNECTED') {
                <button
                  (click)="disconnectWhatsApp()"
                  class="btn-danger w-full py-2.5 text-xs font-semibold"
                  [disabled]="!authService.isAdmin()"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Desconectar Bot</span>
                </button>
              } @else {
                <button
                  (click)="connectWhatsApp()"
                  class="btn-whatsapp w-full py-2.5 text-xs font-semibold"
                  [disabled]="!authService.isAdmin()"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Conectar WhatsApp & Ver QR</span>
                </button>
              }
            </div>
          </app-bento-card>
        </div>

        <!-- Bento Card: Catálogo, Inventario y Atajos (7 cols) -->
        <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          <!-- Quick Card: Catálogo & Stock Crítico -->
          <app-bento-card customClass="flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">Inventario</span>
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <p class="text-3xl font-extrabold tracking-tight text-zinc-900 font-mono">{{ metrics()?.inventory?.totalProducts || 0 }}</p>
              <p class="text-xs text-zinc-500 mt-1">Productos registrados en catálogo</p>

              @if (metrics()?.inventory?.lowStockCount) {
                <div class="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center gap-2 text-amber-800 text-xs">
                  <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span><strong>{{ metrics()?.inventory?.lowStockCount }}</strong> productos con stock bajo</span>
                </div>
              }
            </div>

            <div class="mt-4 pt-3 border-t border-zinc-100">
              <a routerLink="/products" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-between group">
                <span>Administrar Productos</span>
                <span class="group-hover:translate-x-1 transition-transform">➔</span>
              </a>
            </div>
          </app-bento-card>

          <!-- Quick Card: Live Chat & Intervención -->
          <app-bento-card customClass="flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">Bandeja en Vivo</span>
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <p class="text-3xl font-extrabold tracking-tight text-zinc-900 font-mono">{{ metrics()?.chats?.totalChats || 0 }}</p>
              <p class="text-xs text-zinc-500 mt-1">Clientes interactuando</p>

              <!-- Stacked avatars preview -->
              <div class="mt-4 flex items-center justify-between">
                <div class="flex -space-x-2">
                  <div class="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-xs">CL</div>
                  <div class="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700 shadow-xs">MG</div>
                  <div class="w-7 h-7 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-amber-700 shadow-xs">AR</div>
                </div>
                <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">En Vivo</span>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-zinc-100">
              <a routerLink="/live-chat" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-between group">
                <span>Abrir Live Chat</span>
                <span class="group-hover:translate-x-1 transition-transform">➔</span>
              </a>
            </div>
          </app-bento-card>

          <!-- Quick Actions Bar (Full width in this column) -->
          <app-bento-card customClass="sm:col-span-2">
            <h4 class="text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-3">Acciones Rápidas</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <a routerLink="/products" class="p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 text-center transition-all group hover:-translate-y-0.5">
                <div class="w-7 h-7 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-zinc-800">Nuevo Producto</span>
              </a>

              <a routerLink="/orders" class="p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 text-center transition-all group hover:-translate-y-0.5">
                <div class="w-7 h-7 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-zinc-800">Ver Pedidos</span>
              </a>

              <button (click)="loadMetrics()" class="p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 text-center transition-all group hover:-translate-y-0.5">
                <div class="w-7 h-7 mx-auto rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-zinc-800">Actualizar</span>
              </button>
            </div>
          </app-bento-card>

        </div>

      </div>

      <!-- Bottom Row: Pedidos Recientes (Bento Card Grande) -->
      <app-bento-card>
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="font-bold text-zinc-900 text-sm">Últimos Pedidos Registrados</h3>
            <p class="text-xs text-zinc-500 font-normal">Sincronizados en tiempo real vía WhatsApp y Panel</p>
          </div>
          <a routerLink="/orders" class="btn-secondary text-xs">
            <span>Ver Todos</span>
            <span>➔</span>
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-zinc-600">
            <thead class="text-zinc-500 font-mono text-[10px] uppercase tracking-wider font-semibold border-b border-zinc-100 bg-zinc-50/60">
              <tr>
                <th class="py-3 px-4 rounded-l-xl">Pedido #</th>
                <th class="py-3 px-4">Cliente</th>
                <th class="py-3 px-4">Teléfono</th>
                <th class="py-3 px-4">Origen</th>
                <th class="py-3 px-4">Total</th>
                <th class="py-3 px-4 rounded-r-xl">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              @for (order of metrics()?.recentOrders || []; track order.id) {
                <tr class="hover:bg-zinc-50/70 transition-colors">
                  <td class="py-3 px-4 font-mono font-bold text-zinc-900">{{ order.orderNumber }}</td>
                  <td class="py-3 px-4 font-medium text-zinc-800">{{ order.customerName }}</td>
                  <td class="py-3 px-4 font-mono text-zinc-500">{{ order.customerPhone }}</td>
                  <td class="py-3 px-4">
                    @if (order.source === 'WHATSAPP_BOT') {
                      <span class="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 text-[11px]">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        WhatsApp
                      </span>
                    } @else {
                      <span class="text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/60 text-[11px]">
                        Panel Web
                      </span>
                    }
                  </td>
                  <td class="py-3 px-4 font-bold text-zinc-900 font-mono">S/ {{ order.total | number: '1.2-2' }}</td>
                  <td class="py-3 px-4">
                    <app-badge [variant]="getOrderBadgeVariant(order.status)">
                      {{ order.status }}
                    </app-badge>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-8 text-center text-zinc-400">
                    No hay pedidos registrados todavía.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-bento-card>

    </div>

    <!-- Modal QR -->
    <app-qr-modal
      [isOpen]="isQrModalOpen()"
      [qrCode]="whatsappStatus().qrCode || null"
      (close)="isQrModalOpen.set(false)"
    ></app-qr-modal>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private whatsappService = inject(WhatsAppService);
  private socketService = inject(SocketService);
  authService = inject(AuthService);

  metrics = signal<DashboardMetrics | null>(null);
  whatsappStatus = signal<WhatsAppStatus>({ status: SessionStatus.DISCONNECTED });
  isQrModalOpen = signal(false);

  private subs: Subscription[] = [];

  ngOnInit() {
    this.loadMetrics();
    this.listenWebSockets();
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  loadMetrics() {
    this.dashboardService.getMetrics().subscribe({
      next: (data) => {
        this.metrics.set(data);
        if (data.whatsappStatus) {
          this.whatsappStatus.set(data.whatsappStatus);
        }
      },
    });
  }

  listenWebSockets() {
    this.subs.push(
      this.socketService.onQrCode$.subscribe((data) => {
        this.whatsappStatus.update((s) => ({
          ...s,
          status: SessionStatus.SCAN_QR,
          qrCode: data.qr,
        }));
      }),
    );

    this.subs.push(
      this.socketService.onStatusChange$.subscribe((status) => {
        this.whatsappStatus.set(status);
        if (status.status === SessionStatus.CONNECTED) {
          this.isQrModalOpen.set(false);
        }
      }),
    );

    this.subs.push(
      this.socketService.onNewOrder$.subscribe(() => {
        this.loadMetrics();
      }),
    );
  }

  connectWhatsApp() {
    this.isQrModalOpen.set(true);
    this.whatsappService.connect().subscribe();
  }

  disconnectWhatsApp() {
    this.whatsappService.disconnect().subscribe({
      next: () => {
        this.whatsappStatus.set({ status: SessionStatus.DISCONNECTED });
      },
    });
  }

  getOrderBadgeVariant(status: string): any {
    switch (status) {
      case 'CONFIRMED':
      case 'DELIVERED':
        return 'success';
      case 'PENDING':
      case 'PROCESSING':
        return 'warning';
      case 'SHIPPED':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  }
}
