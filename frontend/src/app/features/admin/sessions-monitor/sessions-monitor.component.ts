import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TenantsService } from '../../../core/services/tenants.service';
import { ToastService } from '../../../core/services/toast.service';
import { EnrichedTenant } from '../../../core/models/models';

@Component({
  selector: 'app-sessions-monitor',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <app-navbar
      title="Monitor de WhatsApp"
      subtitle="Estado en tiempo real de todas las sesiones Baileys"
    ></app-navbar>

    <div class="space-y-6 mt-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">

      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold text-zinc-900">Sesiones WhatsApp en Vivo</h2>
            <p class="text-xs text-zinc-500 mt-0.5">
              <span class="font-bold text-emerald-600">{{ connectedCount() }}</span> conectadas ·
              <span class="font-bold text-amber-600">{{ qrCount() }}</span> con QR pendiente ·
              <span class="font-bold text-zinc-400">{{ disconnectedCount() }}</span> desconectadas
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Auto-refresh indicator -->
          <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-medium">
            <span class="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></span>
            Actualiza cada 30s
          </div>
          <button
            (click)="refresh()"
            [disabled]="loading()"
            class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <svg [class.animate-spin]="loading()" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refrescar
          </button>
        </div>
      </div>

      <!-- Loading skeletons -->
      @if (loading() && tenants().length === 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-zinc-200"></div>
                <div class="space-y-2 flex-1">
                  <div class="h-3 w-28 bg-zinc-200 rounded"></div>
                  <div class="h-2 w-20 bg-zinc-100 rounded"></div>
                </div>
              </div>
              <div class="h-2.5 w-full bg-zinc-100 rounded"></div>
            </div>
          }
        </div>
      }

      <!-- Sessions Grid -->
      @if (tenants().length > 0) {
        <!-- Filter Tabs -->
        <div class="flex items-center gap-2 flex-wrap">
          @for (filter of filters; track filter.value) {
            <button
              (click)="activeFilter.set(filter.value)"
              [class]="activeFilter() === filter.value
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'"
              class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
            >
              {{ filter.label }}
              <span class="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                [class]="activeFilter() === filter.value ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'">
                {{ getCount(filter.value) }}
              </span>
            </button>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (tenant of filteredTenants(); track tenant.id) {
            <div class="bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md"
                 [class]="tenant.whatsapp.status === 'CONNECTED'
                   ? 'border-emerald-200/80 hover:border-emerald-300'
                   : tenant.whatsapp.status === 'QR_READY'
                   ? 'border-amber-200/80 hover:border-amber-300'
                   : 'border-zinc-200/80'">
              <div class="p-5">
                <!-- Tenant Header -->
                <div class="flex items-start justify-between gap-3 mb-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                      {{ tenant.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-zinc-900 truncate">{{ tenant.name }}</p>
                      <p class="text-[10px] text-zinc-400 font-mono truncate">/{{ tenant.slug }}</p>
                    </div>
                  </div>

                  <!-- WA Status Badge -->
                  <div class="flex-shrink-0">
                    @if (tenant.whatsapp.status === 'CONNECTED') {
                      <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        CONECTADO
                      </span>
                    } @else if (tenant.whatsapp.status === 'QR_READY') {
                      <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        QR PENDIENTE
                      </span>
                    } @else {
                      <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-500 text-[10px] font-bold">
                        <span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                        DESCONECTADO
                      </span>
                    }
                  </div>
                </div>

                <!-- Phone number (if connected) -->
                @if (tenant.whatsapp.phoneNumber) {
                  <div class="flex items-center gap-2 text-xs text-zinc-600 mb-3">
                    <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span class="font-mono font-medium">{{ tenant.whatsapp.phoneNumber }}</span>
                  </div>
                }

                <!-- Metrics row -->
                <div class="flex items-center gap-3 text-[11px] text-zinc-500 mb-4">
                  <span><span class="font-bold text-zinc-700">{{ tenant.metrics.orderCount }}</span> pedidos</span>
                  <span class="text-zinc-200">·</span>
                  <span><span class="font-bold text-zinc-700">{{ tenant.metrics.chatCount }}</span> chats</span>
                  <span class="text-zinc-200">·</span>
                  <span class="font-bold" [class]="getPlanColor(tenant.plan)">{{ tenant.plan }}</span>
                </div>

                <!-- Action buttons -->
                <div class="flex items-center gap-2 pt-3 border-t border-zinc-100">
                  <button
                    (click)="resetWhatsApp(tenant.id, tenant.name)"
                    [disabled]="resettingId() === tenant.id"
                    class="flex-1 py-2 rounded-xl bg-zinc-50 hover:bg-amber-50 border border-zinc-200 hover:border-amber-200 text-zinc-600 hover:text-amber-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    @if (resettingId() === tenant.id) {
                      <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Reiniciando...
                    } @else {
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Reset WA
                    }
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && filteredTenants().length === 0 && tenants().length > 0) {
        <div class="text-center py-16">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <p class="text-sm font-bold text-zinc-700">Sin sesiones en este filtro</p>
          <p class="text-xs text-zinc-400 mt-1">Intenta con otro filtro de estado</p>
        </div>
      }
    </div>
  `,
})
export class SessionsMonitorComponent implements OnInit, OnDestroy {
  private tenantsService = inject(TenantsService);
  private toast = inject(ToastService);
  private intervalId: any;

  loading = signal(true);
  tenants = signal<EnrichedTenant[]>([]);
  activeFilter = signal<string>('ALL');
  resettingId = signal<string | null>(null);

  filters = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Conectadas', value: 'CONNECTED' },
    { label: 'QR Pendiente', value: 'QR_READY' },
    { label: 'Desconectadas', value: 'DISCONNECTED' },
  ];

  connectedCount = () => this.tenants().filter(t => t.whatsapp.status === 'CONNECTED').length;
  qrCount = () => this.tenants().filter(t => t.whatsapp.status === 'QR_READY').length;
  disconnectedCount = () => this.tenants().filter(t => t.whatsapp.status === 'DISCONNECTED').length;

  filteredTenants = () => {
    const f = this.activeFilter();
    if (f === 'ALL') return this.tenants();
    return this.tenants().filter(t => t.whatsapp.status === f);
  };

  getCount(filterValue: string): number {
    if (filterValue === 'ALL') return this.tenants().length;
    return this.tenants().filter(t => t.whatsapp.status === filterValue).length;
  }

  ngOnInit() {
    this.loadTenants();
    this.intervalId = setInterval(() => this.loadTenants(), 30000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  loadTenants() {
    this.loading.set(true);
    this.tenantsService.getEnrichedTenants().subscribe({
      next: (t) => {
        this.tenants.set(t);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  refresh() {
    this.loadTenants();
  }

  async resetWhatsApp(id: string, name: string) {
    const confirmed = await this.toast.confirm({
      title: 'Reiniciar Sesión Baileys',
      message: `¿Deseas forzar el reinicio de la sesión de WhatsApp de "${name}"?`,
      confirmText: 'Sí, Reiniciar',
      type: 'warning',
    });
    if (!confirmed) return;

    this.resettingId.set(id);
    this.tenantsService.resetTenantWhatsApp(id).subscribe({
      next: () => {
        this.resettingId.set(null);
        this.toast.success(`Sesión de "${name}" reiniciada.`);
        this.loadTenants();
      },
      error: (err) => {
        this.resettingId.set(null);
        this.toast.error(err.error?.message || 'Error al reiniciar la sesión.');
      },
    });
  }

  getPlanColor(plan: string): string {
    const map: Record<string, string> = {
      FREE_TRIAL: 'text-zinc-500',
      BASIC: 'text-blue-600',
      PRO: 'text-indigo-600',
      ENTERPRISE: 'text-amber-600',
    };
    return map[plan] || 'text-zinc-500';
  }
}
