import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TenantsService } from '../../../core/services/tenants.service';
import { ToastService } from '../../../core/services/toast.service';
import { EnrichedTenant, TenantPlan, TenantStatus, SaaSPlan } from '../../../core/models/models';

@Component({
  selector: 'app-plans-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar
      title="Planes & Límites SaaS"
      subtitle="Configuración dinámica de suscripciones, cuotas por tienda y control de límites"
    ></app-navbar>

    <div class="space-y-10 mt-6 pb-24 max-w-7xl mx-auto px-4 sm:px-6">

      <!-- Header & Stats Summary Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
        <div>
          <h2 class="text-base font-bold text-zinc-900 flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Planes de Suscripción Administrables
          </h2>
          <p class="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Configura en caliente los precios, límites de productos, difusiones masivas y accesos a pasarelas para cada nivel. Los cambios se sincronizan en vivo con las tiendas suscritas.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="loadData()"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-2 cursor-pointer"
            [disabled]="loadingPlans() || loadingTenants()"
          >
            <svg class="w-4 h-4 text-zinc-600" [class.animate-spin]="loadingPlans()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Plan Cards Grid (Spacious & Clean Layout) -->
      @if (loadingPlans()) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
          @for (n of [1, 2, 3, 4]; track n) {
            <div class="rounded-2xl border border-zinc-200 bg-white p-6 h-80 animate-pulse space-y-4">
              <div class="h-6 bg-zinc-100 rounded-lg w-24"></div>
              <div class="h-8 bg-zinc-100 rounded-lg w-32"></div>
              <div class="space-y-2 pt-2">
                <div class="h-4 bg-zinc-100 rounded w-full"></div>
                <div class="h-4 bg-zinc-100 rounded w-4/5"></div>
                <div class="h-4 bg-zinc-100 rounded w-3/4"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-7">
          @for (plan of plans(); track plan.code) {
            <div class="rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between bg-white"
                 [class]="plan.isPopular ? 'border-indigo-300 bg-gradient-to-b from-indigo-50/40 via-white to-white ring-2 ring-indigo-500/20' : 'border-zinc-200/80'">

              @if (plan.isPopular) {
                <div class="absolute top-4 right-4">
                  <span class="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest shadow-sm">
                    Popular
                  </span>
                </div>
              }

              <div>
                <!-- Plan Header / Badge -->
                <div class="flex items-center gap-2 mb-4">
                  <span class="px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide border"
                        [class]="getBadgeClasses(plan.badgeColor)">
                    {{ plan.name }}
                  </span>
                  @if (!plan.isActive) {
                    <span class="px-2 py-0.5 rounded text-[9px] bg-zinc-100 text-zinc-500 font-semibold uppercase">Inactivo</span>
                  }
                </div>

                <!-- Price & Description -->
                <div class="mb-5">
                  <div class="text-3xl font-black text-zinc-900 tracking-tight">
                    @if (plan.price === 0) {
                      <span>Gratis</span>
                    } @else {
                      <span>S/ {{ plan.price }}</span>
                      <span class="text-xs font-normal text-zinc-400">/mes</span>
                    }
                  </div>
                  @if (plan.description) {
                    <p class="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{{ plan.description }}</p>
                  }
                </div>

                <!-- Limits Grid Bento Box -->
                <div class="bg-zinc-50/90 rounded-xl p-4 border border-zinc-100 space-y-2.5 my-4">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-zinc-500 flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                      Productos:
                    </span>
                    <strong class="text-zinc-900 font-bold font-mono">
                      {{ plan.maxProducts === -1 ? 'Ilimitados' : plan.maxProducts }}
                    </strong>
                  </div>

                  <div class="flex items-center justify-between text-xs">
                    <span class="text-zinc-500 flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      Difusiones/mes:
                    </span>
                    <strong class="text-zinc-900 font-bold font-mono">
                      {{ plan.maxBroadcasts === -1 ? 'Ilimitadas' : plan.maxBroadcasts }}
                    </strong>
                  </div>

                  <div class="flex items-center justify-between text-xs">
                    <span class="text-zinc-500 flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                      Operadores:
                    </span>
                    <strong class="text-zinc-900 font-bold font-mono">
                      {{ plan.maxUsers === -1 ? 'Ilimitados' : plan.maxUsers }}
                    </strong>
                  </div>
                </div>

                <!-- Feature Badges -->
                <div class="flex flex-wrap gap-1.5 mb-5">
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-semibold"
                        [class]="plan.hasMercadoPago ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-zinc-100 text-zinc-400 border border-zinc-200/50 line-through'">
                    💳 Mercado Pago
                  </span>
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-semibold"
                        [class]="plan.hasCustomThemes ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' : 'bg-zinc-100 text-zinc-400 border border-zinc-200/50 line-through'">
                    🎨 Multitemas
                  </span>
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-semibold"
                        [class]="plan.hasPdfCatalog ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-zinc-100 text-zinc-400 border border-zinc-200/50 line-through'">
                    📄 Catálogo PDF
                  </span>
                </div>

                <!-- Feature Bullets -->
                <div class="space-y-2 mb-6">
                  @for (feat of plan.features; track feat) {
                    <div class="flex items-start gap-2 text-xs text-zinc-600">
                      <svg class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span class="leading-snug">{{ feat }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Card Footer: Tenant count + Edit button -->
              <div class="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3 mt-auto">
                <span class="text-xs text-zinc-500">
                  <strong class="text-zinc-900 font-bold font-mono">{{ plan.tenantsCount || 0 }}</strong> tiendas
                </span>

                <button
                  (click)="openEditModal(plan)"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <svg class="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Configurar Plan
                </button>
              </div>

            </div>
          }
        </div>
      }

      <!-- Tenant Assignment & Quota Monitoring Table -->
      <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Asignación de Planes & Monitoreo de Cuotas
            </h3>
            <p class="text-xs text-zinc-400 mt-1">Control de consumo en tiempo real de productos y asignación por comercio.</p>
          </div>
          <span class="text-xs text-zinc-600 font-semibold px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-200">
            {{ tenants().length }} tiendas registradas
          </span>
        </div>

        @if (loadingTenants()) {
          <div class="p-12 text-center">
            <svg class="w-6 h-6 animate-spin text-zinc-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <p class="text-xs text-zinc-400 mt-2">Cargando tiendas...</p>
          </div>
        }

        @if (!loadingTenants() && tenants().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[760px]">
              <thead>
                <tr class="border-b border-zinc-100 bg-zinc-50/80">
                  <th class="text-left text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-6 py-4">Tienda</th>
                  <th class="text-left text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-4 py-4">Dueño</th>
                  <th class="text-left text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-4 py-4">Plan Actual</th>
                  <th class="text-left text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-4 py-4">Consumo Productos</th>
                  <th class="text-left text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-4 py-4">Estado</th>
                  <th class="text-left text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-4 py-4">GMV Total</th>
                  <th class="text-left text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-6 py-4">Cambiar Plan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-50">
                @for (tenant of tenants(); track tenant.id) {
                  <tr class="hover:bg-zinc-50/60 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                          {{ tenant.name.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <p class="text-xs font-bold text-zinc-900">{{ tenant.name }}</p>
                          <p class="text-[10px] text-zinc-400 font-mono">/{{ tenant.slug }}</p>
                        </div>
                      </div>
                    </td>

                    <td class="px-4 py-4">
                      <p class="text-xs text-zinc-700 font-medium">{{ tenant.owner?.name || '—' }}</p>
                      <p class="text-[10px] text-zinc-400">{{ tenant.owner?.email || '' }}</p>
                    </td>

                    <td class="px-4 py-4">
                      <span [class]="getPlanBadgeClass(tenant.plan)" class="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border">
                        {{ tenant.plan }}
                      </span>
                    </td>

                    <!-- Real-time Quota Consumption Pill -->
                    <td class="px-4 py-4">
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between text-[11px]">
                          <span class="font-bold text-zinc-800 font-mono">
                            {{ tenant.metrics.productCount }}
                            <span class="font-normal text-zinc-400">/ {{ tenant.metrics.maxProducts === -1 ? '∞' : tenant.metrics.maxProducts }}</span>
                          </span>
                          @if (tenant.metrics.maxProducts !== -1 && tenant.metrics.productCount >= tenant.metrics.maxProducts) {
                            <span class="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Límite</span>
                          }
                        </div>
                        <!-- Progress bar -->
                        <div class="w-28 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all"
                               [class]="getProgressBarClass(tenant.metrics.productCount, tenant.metrics.maxProducts)"
                               [style.width.%]="getProgressPercent(tenant.metrics.productCount, tenant.metrics.maxProducts)">
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="px-4 py-4">
                      <span [class]="getStatusBadgeClass(tenant.status)" class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide">
                        {{ tenant.status }}
                      </span>
                    </td>

                    <td class="px-4 py-4">
                      <span class="text-xs font-bold text-zinc-900 font-mono">S/ {{ tenant.metrics.totalGmv | number:'1.2-2' }}</span>
                    </td>

                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <select
                          [value]="tenant.plan"
                          (change)="onPlanChange(tenant.id, $event)"
                          [disabled]="updatingId() === tenant.id"
                          class="text-xs font-semibold border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          @for (p of plans(); track p.code) {
                            <option [value]="p.code">{{ p.name }} (S/ {{ p.price }})</option>
                          }
                        </select>
                        @if (updatingId() === tenant.id) {
                          <svg class="w-4 h-4 animate-spin text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>

    <!-- Modal Bento: Configurar / Editar Plan -->
    @if (isEditModalOpen() && selectedPlan()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div class="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-150">

          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-zinc-900">Configurar Plan: {{ editForm.name }}</h3>
                <p class="text-xs text-zinc-400 font-mono">Código de sistema: {{ editForm.code }}</p>
              </div>
            </div>

            <button
              (click)="closeEditModal()"
              class="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Modal Body Form -->
          <div class="p-6 space-y-6 flex-1">

            <!-- Name & Price Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-zinc-700 mb-1.5">Nombre Visible del Plan</label>
                <input
                  type="text"
                  [(ngModel)]="editForm.name"
                  class="w-full px-3.5 py-2.5 text-xs font-medium border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Ej: Pro, Business"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-zinc-700 mb-1.5">Precio Mensual (PEN S/.)</label>
                <div class="relative">
                  <span class="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">S/</span>
                  <input
                    type="number"
                    [(ngModel)]="editForm.price"
                    min="0"
                    step="1"
                    class="w-full pl-8 pr-3.5 py-2.5 text-xs font-bold border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-bold text-zinc-700 mb-1.5">Descripción del Plan</label>
              <textarea
                [(ngModel)]="editForm.description"
                rows="2"
                class="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                placeholder="Breve resumen del valor de este plan..."
              ></textarea>
            </div>

            <!-- Quotas & Limits Configuration -->
            <div class="bg-zinc-50/90 p-5 rounded-2xl border border-zinc-200/70 space-y-4">
              <h4 class="text-xs font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
                <svg class="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Límites y Cuotas de Consumo (-1 = Ilimitado)
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <!-- Max Products -->
                <div>
                  <label class="block text-[11px] font-bold text-zinc-600 mb-1">Límite Productos</label>
                  <input
                    type="number"
                    [(ngModel)]="editForm.maxProducts"
                    class="w-full px-3 py-2 text-xs font-bold font-mono border border-zinc-200 rounded-lg bg-white"
                  />
                  <span class="text-[10px] text-zinc-400 mt-1 block">Ej: 20, 100, o -1</span>
                </div>

                <!-- Max Broadcasts -->
                <div>
                  <label class="block text-[11px] font-bold text-zinc-600 mb-1">Difusiones / Mes</label>
                  <input
                    type="number"
                    [(ngModel)]="editForm.maxBroadcasts"
                    class="w-full px-3 py-2 text-xs font-bold font-mono border border-zinc-200 rounded-lg bg-white"
                  />
                  <span class="text-[10px] text-zinc-400 mt-1 block">Ej: 50, 500, o -1</span>
                </div>

                <!-- Max Users -->
                <div>
                  <label class="block text-[11px] font-bold text-zinc-600 mb-1">Operadores / Subadmins</label>
                  <input
                    type="number"
                    [(ngModel)]="editForm.maxUsers"
                    class="w-full px-3 py-2 text-xs font-bold font-mono border border-zinc-200 rounded-lg bg-white"
                  />
                  <span class="text-[10px] text-zinc-400 mt-1 block">Ej: 1, 2, 5, o -1</span>
                </div>
              </div>
            </div>

            <!-- Feature Toggles (Switches) -->
            <div class="space-y-3">
              <label class="block text-xs font-bold text-zinc-700 uppercase tracking-wide">Acceso a Funcionalidades</label>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer transition-colors shadow-xs">
                  <div class="text-xs">
                    <span class="font-bold text-zinc-800 block">💳 Pasarela Mercado Pago</span>
                    <span class="text-[11px] text-zinc-400">Permitir vincular OAuth & cobros</span>
                  </div>
                  <input type="checkbox" [(ngModel)]="editForm.hasMercadoPago" class="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-400 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer transition-colors shadow-xs">
                  <div class="text-xs">
                    <span class="font-bold text-zinc-800 block">🎨 Multitemas Avanzados</span>
                    <span class="text-[11px] text-zinc-400">Temas Cyber Tech & Warm Brand</span>
                  </div>
                  <input type="checkbox" [(ngModel)]="editForm.hasCustomThemes" class="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-400 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer transition-colors shadow-xs">
                  <div class="text-xs">
                    <span class="font-bold text-zinc-800 block">📄 Catálogo PDF Descargable</span>
                    <span class="text-[11px] text-zinc-400">Generación automática en PDFKit</span>
                  </div>
                  <input type="checkbox" [(ngModel)]="editForm.hasPdfCatalog" class="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-400 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer transition-colors shadow-xs">
                  <div class="text-xs">
                    <span class="font-bold text-zinc-800 block">🌟 Destacar como Popular</span>
                    <span class="text-[11px] text-zinc-400">Resaltar con borde y badge</span>
                  </div>
                  <input type="checkbox" [(ngModel)]="editForm.isPopular" class="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-400 cursor-pointer" />
                </label>
              </div>
            </div>

            <!-- Features List Editor -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-bold text-zinc-700">Lista de Beneficios / Bullets</label>
                <span class="text-[10px] text-zinc-400 font-mono">{{ editForm.features?.length || 0 }} items</span>
              </div>

              <div class="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                @for (feat of editForm.features; track $index) {
                  <div class="flex items-center gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/70 text-xs">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    <input
                      type="text"
                      [(ngModel)]="editForm.features![$index]"
                      class="flex-1 bg-transparent border-none text-xs text-zinc-800 focus:outline-none font-medium"
                    />
                    <button
                      (click)="removeFeature($index)"
                      type="button"
                      class="text-zinc-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>

              <!-- Add Feature Input -->
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="newFeatureText"
                  (keyup.enter)="addFeature()"
                  class="flex-1 px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-400"
                  placeholder="Agregar nuevo beneficio y presionar Enter..."
                />
                <button
                  (click)="addFeature()"
                  type="button"
                  class="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  + Agregar
                </button>
              </div>
            </div>

            <!-- Sync Tenants limits checkbox -->
            <div class="pt-3 border-t border-zinc-100">
              <label class="flex items-center gap-2.5 text-xs text-zinc-600 cursor-pointer">
                <input type="checkbox" [(ngModel)]="syncTenants" class="w-4 h-4 text-indigo-600 rounded border-zinc-300 cursor-pointer" />
                <span>Sincronizar límites con las <strong>{{ selectedPlan()?.tenantsCount || 0 }} tiendas</strong> suscritas a este plan de inmediato.</span>
              </label>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md">
            <button
              (click)="closeEditModal()"
              type="button"
              class="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              (click)="savePlan()"
              [disabled]="isSavingPlan()"
              type="button"
              class="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              @if (isSavingPlan()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              }
              Guardar Configuración
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class PlansManagementComponent implements OnInit {
  private tenantsService = inject(TenantsService);
  private toast = inject(ToastService);

  loadingPlans = signal(true);
  loadingTenants = signal(true);

  plans = signal<SaaSPlan[]>([]);
  tenants = signal<EnrichedTenant[]>([]);
  updatingId = signal<string | null>(null);

  // Edit Modal Signals & State
  isEditModalOpen = signal(false);
  isSavingPlan = signal(false);
  selectedPlan = signal<SaaSPlan | null>(null);
  syncTenants = true;
  newFeatureText = '';

  editForm: Partial<SaaSPlan> = {};

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadingPlans.set(true);
    this.loadingTenants.set(true);

    // 1. Cargar Planes Administrables con conteo de tiendas
    this.tenantsService.getAdminPlans().subscribe({
      next: (data) => {
        this.plans.set(data);
        this.loadingPlans.set(false);
      },
      error: (err) => {
        this.loadingPlans.set(false);
        this.toast.error('Error al cargar planes: ' + (err.error?.message || err.message));
      },
    });

    // 2. Cargar Tiendas Enriquecidas con métricas de cuota
    this.tenantsService.getEnrichedTenants().subscribe({
      next: (t) => {
        this.tenants.set(t);
        this.loadingTenants.set(false);
      },
      error: () => this.loadingTenants.set(false),
    });
  }

  openEditModal(plan: SaaSPlan) {
    this.selectedPlan.set(plan);
    this.editForm = {
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency || 'PEN',
      maxProducts: plan.maxProducts,
      maxBroadcasts: plan.maxBroadcasts,
      maxUsers: plan.maxUsers,
      hasMercadoPago: plan.hasMercadoPago,
      hasCustomThemes: plan.hasCustomThemes,
      hasPdfCatalog: plan.hasPdfCatalog,
      features: [...(plan.features || [])],
      isPopular: plan.isPopular,
      isActive: plan.isActive,
    };
    this.newFeatureText = '';
    this.syncTenants = true;
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.selectedPlan.set(null);
  }

  addFeature() {
    const text = this.newFeatureText.trim();
    if (!text) return;
    if (!this.editForm.features) this.editForm.features = [];
    this.editForm.features.push(text);
    this.newFeatureText = '';
  }

  removeFeature(index: number) {
    if (!this.editForm.features) return;
    this.editForm.features.splice(index, 1);
  }

  savePlan() {
    const plan = this.selectedPlan();
    if (!plan) return;

    this.isSavingPlan.set(true);

    // Enviar ÚNICAMENTE los campos actualizables permitidos por UpdatePlanDto (sin id, sin code, etc.)
    const payload = {
      name: this.editForm.name?.trim(),
      description: this.editForm.description?.trim() || undefined,
      price: Number(this.editForm.price ?? 0),
      currency: this.editForm.currency || 'PEN',
      maxProducts: Number(this.editForm.maxProducts ?? 20),
      maxBroadcasts: Number(this.editForm.maxBroadcasts ?? 50),
      maxUsers: Number(this.editForm.maxUsers ?? 1),
      hasMercadoPago: Boolean(this.editForm.hasMercadoPago),
      hasAiBot: Boolean(this.editForm.hasAiBot ?? true),
      hasCustomThemes: Boolean(this.editForm.hasCustomThemes),
      hasPdfCatalog: Boolean(this.editForm.hasPdfCatalog),
      features: (this.editForm.features || []).filter((f) => f && f.trim().length > 0),
      badgeColor: this.editForm.badgeColor || 'zinc',
      isPopular: Boolean(this.editForm.isPopular),
      isActive: Boolean(this.editForm.isActive ?? true),
      syncTenantLimits: Boolean(this.syncTenants),
    };

    this.tenantsService.updatePlan(plan.code, payload).subscribe({
      next: (updated) => {
        this.isSavingPlan.set(false);
        this.toast.success(`Plan "${updated.name}" actualizado exitosamente`);

        // Actualizar lista reactiva de planes
        this.plans.update((list) =>
          list.map((p) => (p.code === plan.code ? { ...p, ...updated, tenantsCount: p.tenantsCount } : p)),
        );

        this.closeEditModal();

        // Si se sincronizaron las tiendas, refrescar lista de tiendas
        if (this.syncTenants) {
          this.loadData();
        }
      },
      error: (err) => {
        this.isSavingPlan.set(false);
        this.toast.error('Error al guardar el plan: ' + (err.error?.message || err.message));
      },
    });
  }

  onPlanChange(id: string, event: Event) {
    const newPlan = (event.target as HTMLSelectElement).value as TenantPlan;
    this.updatingId.set(id);

    this.tenantsService.updateTenantPlan(id, newPlan).subscribe({
      next: () => {
        this.toast.success('Plan de tienda actualizado y cuotas sincronizadas.');
        this.updatingId.set(null);
        this.loadData();
      },
      error: (err) => {
        this.updatingId.set(null);
        this.toast.error('Error al actualizar plan: ' + (err.error?.message || err.message));
      },
    });
  }

  getBadgeClasses(color: string): string {
    const map: Record<string, string> = {
      zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return map[color] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }

  getPlanBadgeClass(plan: TenantPlan): string {
    const map: Record<string, string> = {
      FREE_TRIAL: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      BASIC: 'bg-blue-50 text-blue-700 border-blue-200',
      PRO: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      ENTERPRISE: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return map[plan] || 'bg-zinc-100 text-zinc-600 border-zinc-200';
  }

  getStatusBadgeClass(status: TenantStatus): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700',
      SUSPENDED: 'bg-rose-50 text-rose-700',
      PENDING_PAYMENT: 'bg-amber-50 text-amber-700',
    };
    return map[status] || 'bg-zinc-100 text-zinc-600';
  }

  getProgressPercent(used: number, max: number): number {
    if (max === -1) return 20; // Visual para ilimitado
    if (max <= 0) return 100;
    return Math.min(100, Math.round((used / max) * 100));
  }

  getProgressBarClass(used: number, max: number): string {
    if (max === -1) return 'bg-indigo-400';
    const pct = (used / max) * 100;
    if (pct >= 100) return 'bg-rose-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  }
}
