import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TenantsService } from '../../../core/services/tenants.service';
import { AdminMetrics, EnrichedTenant, TenantStatus } from '../../../core/models/models';

@Component({
  selector: 'app-system-status',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <app-navbar
      title="Estado del Sistema"
      subtitle="Salud operacional de la plataforma WSP Flow"
    ></app-navbar>

    <div class="space-y-6 mt-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">

      <!-- System Health Header -->
      <div class="p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
           [class]="overallHealthy() ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center"
               [class]="overallHealthy() ? 'bg-emerald-100 border border-emerald-200' : 'bg-amber-100 border border-amber-200'">
            @if (overallHealthy()) {
              <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            } @else {
              <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            }
          </div>
          <div>
            <h2 class="text-sm font-bold" [class]="overallHealthy() ? 'text-emerald-800' : 'text-amber-800'">
              {{ overallHealthy() ? 'Sistema Operativo — Sin incidentes' : 'Atención Requerida — Revisar alertas' }}
            </h2>
            <p class="text-xs mt-0.5" [class]="overallHealthy() ? 'text-emerald-600' : 'text-amber-600'">
              Última revisión: {{ lastRefresh() | date:'HH:mm:ss' }}
            </p>
          </div>
        </div>
        <button
          (click)="refresh()"
          [disabled]="loading()"
          class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          [class]="overallHealthy() ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-amber-700 hover:bg-amber-800 text-white'"
        >
          <svg [class.animate-spin]="loading()" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refrescar
        </button>
      </div>

      <!-- Status Indicators Grid -->
      @if (metrics(); as m) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <!-- Tenants Status -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm">
            <h3 class="text-xs font-bold text-zinc-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
              </svg>
              Estado de Tiendas
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-zinc-50">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span class="text-xs text-zinc-700">Activas</span>
                </div>
                <span class="text-sm font-extrabold text-emerald-700">{{ m.activeTenants }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-zinc-50">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span class="text-xs text-zinc-700">En Trial</span>
                </div>
                <span class="text-sm font-extrabold" [class]="m.trialTenants > 0 ? 'text-amber-700' : 'text-zinc-400'">{{ m.trialTenants }}</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span class="text-xs text-zinc-700">Suspendidas</span>
                </div>
                <span class="text-sm font-extrabold" [class]="m.suspendedTenants > 0 ? 'text-rose-700' : 'text-zinc-400'">{{ m.suspendedTenants }}</span>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-zinc-100">
              <div class="flex items-center justify-between text-xs">
                <span class="text-zinc-500">Total registradas</span>
                <span class="font-bold text-zinc-900">{{ m.totalTenants }}</span>
              </div>
            </div>
          </div>

          <!-- WhatsApp Connectivity -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm">
            <h3 class="text-xs font-bold text-zinc-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Conectividad WhatsApp
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-zinc-50">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="text-xs text-zinc-700">Sesiones Activas</span>
                </div>
                <span class="text-sm font-extrabold text-emerald-700">{{ m.stats.connectedWhatsAppSessions }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-zinc-50">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-zinc-400"></span>
                  <span class="text-xs text-zinc-700">Desconectadas</span>
                </div>
                <span class="text-sm font-extrabold text-zinc-500">{{ (m.totalTenants - m.stats.connectedWhatsAppSessions) }}</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-xs text-zinc-500">Ratio de conexión</span>
                <span class="text-sm font-extrabold text-zinc-900">
                  {{ m.totalTenants > 0 ? ((m.stats.connectedWhatsAppSessions / m.totalTenants) * 100 | number:'1.0-0') : 0 }}%
                </span>
              </div>
            </div>
            <!-- Connection ratio bar -->
            <div class="mt-3 h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all duration-700"
                [style.width.%]="m.totalTenants > 0 ? (m.stats.connectedWhatsAppSessions / m.totalTenants * 100) : 0"
              ></div>
            </div>
          </div>

          <!-- Platform Volume -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm">
            <h3 class="text-xs font-bold text-zinc-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Volumen de Plataforma
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-zinc-50">
                <span class="text-xs text-zinc-700">Total Pedidos</span>
                <span class="text-sm font-extrabold text-zinc-900">{{ m.stats.totalOrders | number }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-zinc-50">
                <span class="text-xs text-zinc-700">Total Productos</span>
                <span class="text-sm font-extrabold text-zinc-900">{{ m.stats.totalProducts | number }}</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-xs text-zinc-700">Total Usuarios</span>
                <span class="text-sm font-extrabold text-zinc-900">{{ m.stats.totalUsers | number }}</span>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-zinc-100">
              <div class="flex items-center justify-between text-xs">
                <span class="text-zinc-500">GMV Plataforma</span>
                <span class="font-extrabold text-zinc-900">S/ {{ m.financials.totalGmv | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Suspicious Tenants (SUSPENDED / PENDING_PAYMENT) -->
        @if (alertTenants().length > 0) {
          <div class="bg-white rounded-2xl border border-rose-200/80 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-rose-100 bg-rose-50/50">
              <h3 class="text-sm font-bold text-rose-800 flex items-center gap-2">
                <svg class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                Tiendas que Requieren Atención ({{ alertTenants().length }})
              </h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[500px]">
                <tbody class="divide-y divide-zinc-50">
                  @for (tenant of alertTenants(); track tenant.id) {
                    <tr class="hover:bg-rose-50/30 transition-colors">
                      <td class="px-5 py-3.5">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-xs font-bold text-rose-700 flex-shrink-0">
                            {{ tenant.name.charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <p class="text-xs font-bold text-zinc-900">{{ tenant.name }}</p>
                            <p class="text-[10px] text-zinc-400">{{ tenant.owner?.email || '' }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-rose-700">
                          {{ tenant.status }}
                        </span>
                      </td>
                      <td class="px-4 py-3.5">
                        <div class="flex items-center gap-1.5">
                          <span [class]="tenant.whatsapp.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-zinc-300'"
                                class="w-2 h-2 rounded-full"></span>
                          <span class="text-[11px] text-zinc-600 font-medium">WA {{ tenant.whatsapp.status }}</span>
                        </div>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <span class="text-xs font-bold text-zinc-500">{{ tenant.plan }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse h-48">
              <div class="h-3 w-32 bg-zinc-200 rounded mb-6"></div>
              <div class="space-y-3">
                <div class="h-2.5 bg-zinc-100 rounded"></div>
                <div class="h-2.5 bg-zinc-100 rounded"></div>
                <div class="h-2.5 bg-zinc-100 rounded"></div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SystemStatusComponent implements OnInit {
  private tenantsService = inject(TenantsService);

  loading = signal(true);
  metrics = signal<AdminMetrics | null>(null);
  tenants = signal<EnrichedTenant[]>([]);
  lastRefresh = signal<Date>(new Date());

  overallHealthy = () => {
    const m = this.metrics();
    return m ? m.suspendedTenants === 0 : true;
  };

  alertTenants = () =>
    this.tenants().filter(
      t => t.status === TenantStatus.SUSPENDED || t.status === TenantStatus.PENDING_PAYMENT
    );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.tenantsService.getAdminMetrics().subscribe({
      next: (m) => {
        this.metrics.set(m);
        this.lastRefresh.set(new Date());
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.tenantsService.getEnrichedTenants().subscribe({
      next: (t) => this.tenants.set(t),
    });
  }

  refresh() {
    this.loadData();
  }
}
