import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../../shared/components/bento-card/bento-card.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TenantsService } from '../../../core/services/tenants.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  EnrichedTenant,
  AdminMetrics,
  TenantPlan,
  TenantStatus,
} from '../../../core/models/models';

@Component({
  selector: 'app-tenants-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, BentoCardComponent, BadgeComponent],
  template: `
    <app-navbar
      title="👑 Gestión de Tenants SaaS"
      subtitle="Supervisión global de tiendas, planes, volumen transaccional y salud de WhatsApp"
    ></app-navbar>

    <div class="space-y-6 mt-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      
      <!-- Top Action Banner -->
      <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 text-2xl">
            👑
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg sm:text-xl font-extrabold tracking-tight">Panel de Control Super Admin</h2>
              <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase">
                SaaS Multi-Tenant
              </span>
            </div>
            <p class="text-xs text-slate-300 font-normal mt-1">
              Monitorea en tiempo real todas las tiendas de la plataforma, modifica planes y brinda soporte directo.
            </p>
          </div>
        </div>

        <button
          (click)="openCreateModal.set(true)"
          class="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Aprovisionar Nueva Tienda</span>
        </button>
      </div>

      <!-- Bento Global KPI Metrics -->
      @if (metrics(); as m) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Metric 1: MRR -->
          <app-bento-card customClass="hover:border-indigo-200 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Ingresos MRR</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                💰
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                S/ {{ m.financials.mrr | number: '1.2-2' }}
              </div>
              <p class="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 font-medium">
                <span class="text-emerald-600 font-bold">ARR estimado:</span> S/ {{ m.financials.arr | number: '1.0-0' }} /año
              </p>
            </div>
          </app-bento-card>

          <!-- Metric 2: GMV Global -->
          <app-bento-card customClass="hover:border-indigo-200 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">GMV Procesado</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                📈
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                S/ {{ m.financials.totalGmv | number: '1.2-2' }}
              </div>
              <p class="text-[11px] text-zinc-500 mt-1 font-medium">
                En {{ m.stats.totalOrders }} pedidos pagados
              </p>
            </div>
          </app-bento-card>

          <!-- Metric 3: Tiendas Registradas -->
          <app-bento-card customClass="hover:border-indigo-200 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Total Tiendas</span>
              <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
                🏬
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                {{ m.totalTenants }}
              </div>
              <p class="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                <span class="text-emerald-600 font-bold">{{ m.activeTenants }} activas</span>
                <span>•</span>
                <span class="text-amber-600 font-bold">{{ m.trialTenants }} trial</span>
              </p>
            </div>
          </app-bento-card>

          <!-- Metric 4: Sockets Baileys Online -->
          <app-bento-card customClass="hover:border-indigo-200 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">WhatsApp Online</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                📲
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                {{ m.stats.connectedWhatsAppSessions }} / {{ m.totalTenants }}
              </div>
              <p class="text-[11px] text-zinc-500 mt-1 font-medium">
                Conexiones Baileys activas
              </p>
            </div>
          </app-bento-card>
        </div>
      }

      <!-- Search & Filters -->
      <div class="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por nombre de tienda, slug o correo del dueño..."
            class="input-bento pl-10 text-xs py-2.5"
          />
          <svg class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Filter Pills: Plan -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            (click)="selectedPlanFilter.set('ALL')"
            [class]="selectedPlanFilter() === 'ALL' ? 'px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs' : 'px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-xs font-semibold'"
          >
            Todos
          </button>
          <button
            type="button"
            (click)="selectedPlanFilter.set('FREE_TRIAL')"
            [class]="selectedPlanFilter() === 'FREE_TRIAL' ? 'px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs' : 'px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-xs font-semibold'"
          >
            Free Trial
          </button>
          <button
            type="button"
            (click)="selectedPlanFilter.set('PRO')"
            [class]="selectedPlanFilter() === 'PRO' ? 'px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs' : 'px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-xs font-semibold'"
          >
            Plan PRO
          </button>
          <button
            type="button"
            (click)="selectedPlanFilter.set('ENTERPRISE')"
            [class]="selectedPlanFilter() === 'ENTERPRISE' ? 'px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-xs' : 'px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-xs font-semibold'"
          >
            Enterprise
          </button>
        </div>
      </div>

      <!-- Tenants Directory Bento Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        @for (tenant of filteredTenants(); track tenant.id) {
          <app-bento-card customClass="flex flex-col justify-between hover:border-zinc-300 transition-all shadow-sm">
            <div>
              <!-- Store Header -->
              <div class="flex items-start justify-between gap-3 pb-4 border-b border-zinc-100">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-indigo-500/20">
                    {{ tenant.name.substring(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <h3 class="font-extrabold text-zinc-900 text-base leading-tight">{{ tenant.name }}</h3>
                    <a
                      [routerLink]="'/tienda/' + tenant.slug"
                      target="_blank"
                      class="text-xs text-indigo-600 hover:underline font-mono flex items-center gap-1 mt-0.5"
                    >
                      <span>wspflow.com/tienda/{{ tenant.slug }}</span>
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <!-- Plan & Status Badges -->
                <div class="flex flex-col items-end gap-1.5">
                  <app-badge [variant]="getPlanBadgeVariant(tenant.plan)">
                    {{ tenant.plan }}
                  </app-badge>

                  <span
                    [class]="tenant.status === 'ACTIVE' ? 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200' : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200'"
                  >
                    {{ tenant.status === 'ACTIVE' ? 'Activo' : 'Suspendido' }}
                  </span>
                </div>
              </div>

              <!-- Owner & Contact Info -->
              <div class="py-3.5 border-b border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">Administrador Dueño</span>
                  <p class="font-bold text-zinc-800">{{ tenant.owner?.name || 'No registrado' }}</p>
                  <p class="text-zinc-500 font-mono text-[11px]">{{ tenant.owner?.email }}</p>
                </div>

                <div>
                  <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">WhatsApp Conexión</span>
                  <div class="flex items-center gap-1.5">
                    <span
                      [class]="'w-2 h-2 rounded-full ' + (tenant.whatsapp.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')"
                    ></span>
                    <span class="font-semibold text-zinc-800">
                      {{ tenant.whatsapp.phoneNumber || 'Sin vincular' }}
                    </span>
                  </div>
                  <span class="text-[10px] text-zinc-500 font-mono">
                    Estado: {{ tenant.whatsapp.status }}
                  </span>
                </div>
              </div>

              <!-- Metrics Row -->
              <div class="py-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div class="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span class="block text-[10px] text-zinc-500 font-mono uppercase">Productos</span>
                  <span class="font-extrabold text-zinc-900 text-sm">
                    {{ tenant.metrics.productCount }}
                    <span class="text-zinc-400 font-normal text-xs">/ {{ tenant.metrics.maxProducts }}</span>
                  </span>
                </div>

                <div class="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span class="block text-[10px] text-zinc-500 font-mono uppercase">Órdenes</span>
                  <span class="font-extrabold text-zinc-900 text-sm">{{ tenant.metrics.orderCount }}</span>
                </div>

                <div class="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span class="block text-[10px] text-zinc-500 font-mono uppercase">Ventas GMV</span>
                  <span class="font-extrabold text-emerald-600 text-sm">
                    S/ {{ tenant.metrics.totalGmv | number: '1.2-2' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Action Buttons Footer -->
            <div class="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <!-- Impersonate Button -->
                <button
                  type="button"
                  (click)="impersonate(tenant)"
                  title="Gestionar e iniciar sesión como esta tienda"
                  class="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <span>👤 Gestionar Tienda</span>
                </button>

                <!-- Edit Plan / Status Button -->
                <button
                  type="button"
                  (click)="openEditModal(tenant)"
                  title="Cambiar Plan o Estado de la tienda"
                  class="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <span>⚙️ Plan / Estado</span>
                </button>
              </div>

              <!-- Reset WhatsApp Button -->
              <button
                type="button"
                (click)="resetWhatsApp(tenant)"
                title="Forzar reinicio de socket de WhatsApp"
                class="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </app-bento-card>
        } @empty {
          <div class="col-span-2 py-16 text-center bg-white rounded-3xl border border-zinc-200">
            <p class="text-sm font-bold text-zinc-800">No se encontraron tiendas con los filtros actuales</p>
            <p class="text-xs text-zinc-500 mt-1">Prueba cambiando los términos de búsqueda o filtros de plan.</p>
          </div>
        }
      </div>

    </div>

    <!-- Modal: Editar Plan & Estado -->
    @if (editingTenant(); as t) {
      <div class="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-extrabold text-zinc-900 text-base">Modificar Tienda</h3>
              <p class="text-xs text-zinc-500 font-medium">{{ t.name }} ({{ t.slug }})</p>
            </div>
            <button (click)="editingTenant.set(null)" class="text-zinc-400 hover:text-zinc-800 font-bold p-1">✕</button>
          </div>

          <div class="space-y-4">
            <!-- Plan Picker -->
            <div>
              <label class="block text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold mb-2">Plan Suscripción</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="setTempPlan('FREE_TRIAL')"
                  [class]="tempPlan === 'FREE_TRIAL' ? 'p-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-800 text-xs font-bold' : 'p-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold'"
                >
                  Free Trial
                </button>
                <button
                  type="button"
                  (click)="setTempPlan('PRO')"
                  [class]="tempPlan === 'PRO' ? 'p-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-indigo-800 text-xs font-bold' : 'p-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold'"
                >
                  Plan PRO
                </button>
                <button
                  type="button"
                  (click)="setTempPlan('ENTERPRISE')"
                  [class]="tempPlan === 'ENTERPRISE' ? 'p-2.5 rounded-xl border-2 border-purple-500 bg-purple-50 text-purple-800 text-xs font-bold' : 'p-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold'"
                >
                  Enterprise
                </button>
              </div>
            </div>

            <!-- Status Picker -->
            <div>
              <label class="block text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold mb-2">Estado de la Tienda</label>
              <select [(ngModel)]="tempStatus" class="input-bento text-xs py-2.5">
                <option value="ACTIVE">✅ Activo (Acceso total)</option>
                <option value="SUSPENDED">⛔ Suspendido (Bloqueado)</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              (click)="editingTenant.set(null)"
              class="px-4 py-2.5 rounded-xl text-zinc-600 hover:bg-zinc-100 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="saveTenantChanges()"
              [disabled]="savingChanges()"
              class="btn-primary text-xs py-2.5 px-5 font-bold"
            >
              {{ savingChanges() ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal: Aprovisionar Nueva Tienda -->
    @if (openCreateModal()) {
      <div class="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-extrabold text-zinc-900 text-base">Aprovisionar Nueva Tienda SaaS</h3>
              <p class="text-xs text-zinc-500">Crea manualmente una tienda y asigna credenciales</p>
            </div>
            <button (click)="openCreateModal.set(false)" class="text-zinc-400 hover:text-zinc-800 font-bold p-1">✕</button>
          </div>

          <form (ngSubmit)="submitNewStore()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-zinc-700 mb-1">Nombre de la Tienda *</label>
              <input
                type="text"
                [(ngModel)]="newStoreName"
                name="newStoreName"
                (input)="onNewStoreNameChange()"
                required
                placeholder="Ej: Calzados Lima"
                class="input-bento text-xs py-2.5"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-zinc-700 mb-1">Slug Web *</label>
              <input
                type="text"
                [(ngModel)]="newStoreSlug"
                name="newStoreSlug"
                required
                placeholder="calzados-lima"
                class="input-bento text-xs py-2.5 font-mono"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-zinc-700 mb-1">Nombre Dueño *</label>
                <input
                  type="text"
                  [(ngModel)]="newOwnerName"
                  name="newOwnerName"
                  required
                  placeholder="Juan Perez"
                  class="input-bento text-xs py-2.5"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-zinc-700 mb-1">WhatsApp Negocio</label>
                <input
                  type="text"
                  [(ngModel)]="newPhone"
                  name="newPhone"
                  placeholder="51987654321"
                  class="input-bento text-xs py-2.5 font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-zinc-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  [(ngModel)]="newEmail"
                  name="newEmail"
                  required
                  placeholder="juan@calzados.com"
                  class="input-bento text-xs py-2.5"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-zinc-700 mb-1">Contraseña Inicial *</label>
                <input
                  type="password"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  required
                  placeholder="••••••••"
                  class="input-bento text-xs py-2.5"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-zinc-700 mb-1">Plan Inicial</label>
              <select [(ngModel)]="newPlan" name="newPlan" class="input-bento text-xs py-2.5">
                <option value="FREE_TRIAL">Prueba Gratis (14 días)</option>
                <option value="PRO">Plan PRO (Hasta 100 prods - S/ 79/mes)</option>
                <option value="ENTERPRISE">Plan Enterprise (Ilimitado - S/ 149/mes)</option>
              </select>
            </div>

            <div class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                (click)="openCreateModal.set(false)"
                class="px-4 py-2.5 rounded-xl text-zinc-600 hover:bg-zinc-100 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="creatingStore()"
                class="btn-primary text-xs py-2.5 px-5 font-bold"
              >
                {{ creatingStore() ? 'Aprovisionando...' : 'Crear Tienda' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class TenantsManagementComponent implements OnInit {
  private tenantsService = inject(TenantsService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  metrics = signal<AdminMetrics | null>(null);
  tenants = signal<EnrichedTenant[]>([]);
  loading = signal(true);

  searchQuery = '';
  selectedPlanFilter = signal<'ALL' | 'FREE_TRIAL' | 'PRO' | 'ENTERPRISE'>('ALL');

  // Modal: Editar
  editingTenant = signal<EnrichedTenant | null>(null);
  tempPlan: TenantPlan = TenantPlan.PRO;
  tempStatus: TenantStatus = TenantStatus.ACTIVE;
  savingChanges = signal(false);

  setTempPlan(plan: 'FREE_TRIAL' | 'PRO' | 'ENTERPRISE') {
    this.tempPlan = plan as TenantPlan;
  }

  // Modal: Crear
  openCreateModal = signal(false);
  newStoreName = '';
  newStoreSlug = '';
  newOwnerName = '';
  newEmail = '';
  newPassword = '';
  newPhone = '';
  newPlan: TenantPlan = TenantPlan.PRO;
  creatingStore = signal(false);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.tenantsService.getAdminMetrics().subscribe({
      next: (m) => this.metrics.set(m),
    });

    this.tenantsService.getEnrichedTenants().subscribe({
      next: (list) => {
        this.tenants.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredTenants = computed(() => {
    let list = this.tenants();

    if (this.selectedPlanFilter() !== 'ALL') {
      list = list.filter((t) => t.plan === this.selectedPlanFilter());
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          (t.owner?.name && t.owner.name.toLowerCase().includes(q)) ||
          (t.owner?.email && t.owner.email.toLowerCase().includes(q)),
      );
    }

    return list;
  });

  getPlanBadgeVariant(plan: TenantPlan): 'info' | 'purple' | 'success' | 'warning' {
    switch (plan) {
      case TenantPlan.ENTERPRISE:
        return 'purple';
      case TenantPlan.PRO:
        return 'info';
      case TenantPlan.FREE_TRIAL:
        return 'warning';
      default:
        return 'info';
    }
  }

  async impersonate(tenant: EnrichedTenant) {
    const confirmed = await this.toast.confirm({
      title: 'Modo Soporte / Suplantación',
      message: `¿Deseas iniciar sesión en el panel de "${tenant.name}" en modo soporte como Super Administrador?`,
      confirmText: 'Acceder a Tienda',
      type: 'info',
    });
    if (!confirmed) return;

    this.tenantsService.impersonateTenant(tenant.id).subscribe({
      next: (res) => {
        this.toast.success(`Accediendo al portal de "${tenant.name}"...`);
        this.authService.applyImpersonation(res.impersonationToken, tenant.name);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error al suplantar identidad de la tienda');
      },
    });
  }

  openEditModal(tenant: EnrichedTenant) {
    this.editingTenant.set(tenant);
    this.tempPlan = tenant.plan;
    this.tempStatus = tenant.status;
  }

  saveTenantChanges() {
    const t = this.editingTenant();
    if (!t) return;

    this.savingChanges.set(true);

    this.tenantsService.updateTenantPlan(t.id, this.tempPlan).subscribe({
      next: () => {
        this.tenantsService.updateTenantStatus(t.id, this.tempStatus).subscribe({
          next: () => {
            this.savingChanges.set(false);
            this.editingTenant.set(null);
            this.loadData();
          },
          error: () => this.savingChanges.set(false),
        });
      },
      error: () => this.savingChanges.set(false),
    });
  }

  async resetWhatsApp(tenant: EnrichedTenant) {
    const confirmed = await this.toast.confirm({
      title: 'Reiniciar Sesión de WhatsApp',
      message: `¿Forzar reinicio de conexión WhatsApp para "${tenant.name}"?\nSe desconectará la sesión actual y se generará un nuevo QR.`,
      confirmText: 'Sí, Reiniciar',
      type: 'warning',
    });
    if (!confirmed) return;

    this.tenantsService.resetTenantWhatsApp(tenant.id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Sesión de WhatsApp reiniciada.');
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error al reiniciar WhatsApp');
      },
    });
  }

  onNewStoreNameChange() {
    this.newStoreSlug = this.newStoreName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  submitNewStore() {
    if (!this.newStoreName || !this.newOwnerName || !this.newEmail || !this.newPassword) {
      this.toast.warning('Por favor completa todos los campos obligatorios.', 'Campos Requeridos');
      return;
    }

    this.creatingStore.set(true);

    this.authService
      .registerStore({
        storeName: this.newStoreName,
        slug: this.newStoreSlug,
        ownerName: this.newOwnerName,
        email: this.newEmail,
        password: this.newPassword,
        phoneNumber: this.newPhone || undefined,
        plan: this.newPlan,
      })
      .subscribe({
        next: () => {
          this.creatingStore.set(false);
          this.openCreateModal.set(false);
          this.resetNewStoreForm();
          this.loadData();
          this.toast.success('¡Tienda aprovisionada exitosamente!', 'Registro SaaS');
        },
        error: (err) => {
          this.creatingStore.set(false);
          this.toast.error(err.error?.message || 'Error al aprovisionar la tienda');
        },
      });
  }

  private resetNewStoreForm() {
    this.newStoreName = '';
    this.newStoreSlug = '';
    this.newOwnerName = '';
    this.newEmail = '';
    this.newPassword = '';
    this.newPhone = '';
    this.newPlan = TenantPlan.PRO;
  }
}
