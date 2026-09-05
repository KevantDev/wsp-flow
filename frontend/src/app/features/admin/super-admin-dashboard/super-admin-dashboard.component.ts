import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TenantsService } from '../../../core/services/tenants.service';
import { AdminMetrics, EnrichedTenant, TenantStatus, TenantPlan } from '../../../core/models/models';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar
      title="Panel de Control SaaS"
      subtitle="Métricas globales de la plataforma WSP Flow"
    ></app-navbar>

    <div class="space-y-6 mt-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">

      <!-- Hero Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 shadow-2xl p-6 sm:p-8">
        <!-- Glow orb -->
        <div class="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-violet-600/15 blur-3xl pointer-events-none"></div>

        <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-3 flex-wrap">
                <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">WSP Flow — Control Center</h2>
                <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold uppercase tracking-widest">
                  Super Admin
                </span>
              </div>
              <p class="text-sm text-slate-400 mt-1 font-normal">
                Vista centralizada de toda la plataforma SaaS multi-tenant
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <a
              routerLink="/admin/tenants"
              class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all backdrop-blur-sm"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
              </svg>
              Gestión de Tiendas
            </a>
            <a
              routerLink="/admin/sessions"
              class="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Monitor WA
            </a>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse">
              <div class="h-3 w-20 bg-zinc-200 rounded mb-4"></div>
              <div class="h-8 w-32 bg-zinc-200 rounded mb-2"></div>
              <div class="h-3 w-24 bg-zinc-100 rounded"></div>
            </div>
          }
        </div>
      }

      <!-- KPI Metrics Grid -->
      @if (metrics(); as m) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <!-- MRR -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
            <div class="flex items-start justify-between mb-3">
              <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Ingresos MRR</span>
              <div class="w-9 h-9 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center transition-colors">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              S/ {{ m.financials.mrr | number:'1.2-2' }}
            </div>
            <p class="text-[11px] text-zinc-500 mt-1.5 font-medium">
              ARR estimado:
              <span class="text-zinc-700 font-bold">S/ {{ m.financials.arr | number:'1.0-0' }}</span>
            </p>
          </div>

          <!-- GMV -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
            <div class="flex items-start justify-between mb-3">
              <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">GMV Total</span>
              <div class="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-100 border border-blue-100 flex items-center justify-center transition-colors">
                <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              S/ {{ m.financials.totalGmv | number:'1.2-2' }}
            </div>
            <p class="text-[11px] text-zinc-500 mt-1.5 font-medium">
              En <span class="text-zinc-700 font-bold">{{ m.stats.totalOrders }}</span> pedidos procesados
            </p>
          </div>

          <!-- Tiendas Activas -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group">
            <div class="flex items-start justify-between mb-3">
              <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Tiendas Activas</span>
              <div class="w-9 h-9 rounded-xl bg-violet-50 group-hover:bg-violet-100 border border-violet-100 flex items-center justify-center transition-colors">
                <svg class="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              {{ m.activeTenants }}
              <span class="text-base font-semibold text-zinc-400">/ {{ m.totalTenants }}</span>
            </div>
            <p class="text-[11px] text-zinc-500 mt-1.5 font-medium">
              <span class="text-amber-600 font-bold">{{ m.trialTenants }}</span> en trial ·
              <span class="text-rose-600 font-bold">{{ m.suspendedTenants }}</span> suspendidas
            </p>
          </div>

          <!-- Sesiones WA -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
            <div class="flex items-start justify-between mb-3">
              <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Sesiones WhatsApp</span>
              <div class="w-9 h-9 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center transition-colors">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              {{ m.stats.connectedWhatsAppSessions }}
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p class="text-[11px] text-zinc-500 mt-1.5 font-medium">
              Sesiones en vivo · <span class="text-zinc-700 font-bold">{{ m.stats.totalUsers }}</span> usuarios registrados
            </p>
          </div>
        </div>

        <!-- Row 2: Plan Distribution + Alerts -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <!-- Plan Distribution -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm">
            <h3 class="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
              </svg>
              Distribución de Planes
            </h3>
            <div class="space-y-3">
              <!-- Free Trial -->
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-zinc-400 flex-shrink-0"></span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-semibold text-zinc-700">FREE TRIAL</span>
                    <span class="text-xs font-bold text-zinc-900">{{ m.planDistribution.freeTrial }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-zinc-400 transition-all duration-700"
                      [style.width.%]="m.totalTenants > 0 ? (m.planDistribution.freeTrial / m.totalTenants * 100) : 0"
                    ></div>
                  </div>
                </div>
              </div>
              <!-- Basic -->
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-semibold text-zinc-700">BASIC</span>
                    <span class="text-xs font-bold text-zinc-900">{{ m.planDistribution.basic || 0 }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-blue-500 transition-all duration-700"
                      [style.width.%]="m.totalTenants > 0 ? ((m.planDistribution.basic || 0) / m.totalTenants * 100) : 0"
                    ></div>
                  </div>
                </div>
              </div>
              <!-- PRO -->
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-semibold text-zinc-700">PRO</span>
                    <span class="text-xs font-bold text-zinc-900">{{ m.planDistribution.pro }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-indigo-500 transition-all duration-700"
                      [style.width.%]="m.totalTenants > 0 ? (m.planDistribution.pro / m.totalTenants * 100) : 0"
                    ></div>
                  </div>
                </div>
              </div>
              <!-- Enterprise -->
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-semibold text-zinc-700">ENTERPRISE</span>
                    <span class="text-xs font-bold text-zinc-900">{{ m.planDistribution.enterprise }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-amber-500 transition-all duration-700"
                      [style.width.%]="m.totalTenants > 0 ? (m.planDistribution.enterprise / m.totalTenants * 100) : 0"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary stats row -->
            <div class="mt-5 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-3">
              <div class="text-center">
                <div class="text-lg font-extrabold text-zinc-900">{{ m.totalTenants }}</div>
                <div class="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">Total tiendas</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-extrabold text-zinc-900">{{ m.stats.totalProducts }}</div>
                <div class="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">Productos</div>
              </div>
            </div>
          </div>

          <!-- Alertas del Sistema -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm">
            <h3 class="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              Alertas del Sistema
            </h3>

            @if (m.suspendedTenants > 0) {
              <div class="p-3 rounded-xl bg-rose-50 border border-rose-200/70 mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span class="text-xs font-bold text-rose-800">{{ m.suspendedTenants }} tienda(s) suspendida(s)</span>
                </div>
                <p class="text-[11px] text-rose-700 mt-1 ml-4">Requieren revisión o pago pendiente</p>
              </div>
            }

            @if (m.trialTenants > 0) {
              <div class="p-3 rounded-xl bg-amber-50 border border-amber-200/70 mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span class="text-xs font-bold text-amber-800">{{ m.trialTenants }} tienda(s) en trial</span>
                </div>
                <p class="text-[11px] text-amber-700 mt-1 ml-4">Considerar conversión a plan de pago</p>
              </div>
            }

            @if (m.suspendedTenants === 0 && m.trialTenants === 0) {
              <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200/70 mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span class="text-xs font-bold text-emerald-800">Sin alertas críticas</span>
                </div>
                <p class="text-[11px] text-emerald-700 mt-1 ml-4">Todos los tenants operativos</p>
              </div>
            }

            <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200/70">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span class="text-xs font-bold text-indigo-800">{{ m.stats.connectedWhatsAppSessions }} sesiones WA activas</span>
              </div>
              <p class="text-[11px] text-indigo-700 mt-1 ml-4">Baileys conectado y operativo</p>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm">
            <h3 class="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Acciones Rápidas
            </h3>
            <div class="space-y-2.5">
              <a
                routerLink="/admin/tenants"
                class="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-indigo-50 border border-zinc-200 hover:border-indigo-200 text-zinc-700 hover:text-indigo-700 transition-all group"
              >
                <svg class="w-4 h-4 text-zinc-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                </svg>
                <span class="text-xs font-semibold">Gestionar Tiendas</span>
                <svg class="w-3.5 h-3.5 ml-auto text-zinc-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </a>

              <a
                routerLink="/admin/sessions"
                class="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-emerald-50 border border-zinc-200 hover:border-emerald-200 text-zinc-700 hover:text-emerald-700 transition-all group"
              >
                <svg class="w-4 h-4 text-zinc-500 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span class="text-xs font-semibold">Monitor de WhatsApp</span>
                <svg class="w-3.5 h-3.5 ml-auto text-zinc-300 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </a>

              <a
                routerLink="/admin/plans"
                class="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-amber-50 border border-zinc-200 hover:border-amber-200 text-zinc-700 hover:text-amber-700 transition-all group"
              >
                <svg class="w-4 h-4 text-zinc-500 group-hover:text-amber-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
                <span class="text-xs font-semibold">Gestión de Planes</span>
                <svg class="w-3.5 h-3.5 ml-auto text-zinc-300 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </a>

              <a
                routerLink="/admin/system"
                class="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-slate-100 border border-zinc-200 hover:border-slate-300 text-zinc-700 transition-all group"
              >
                <svg class="w-4 h-4 text-zinc-500 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
                </svg>
                <span class="text-xs font-semibold">Estado del Sistema</span>
                <svg class="w-3.5 h-3.5 ml-auto text-zinc-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      }

      <!-- Recent Tenants Table -->
      @if (tenants().length > 0) {
        <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <svg class="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Últimas Tiendas Registradas
            </h3>
            <a
              routerLink="/admin/tenants"
              class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Ver todas →
            </a>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[600px]">
              <thead>
                <tr class="border-b border-zinc-100 bg-zinc-50/70">
                  <th class="text-left text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 px-5 py-3">Tienda</th>
                  <th class="text-left text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 px-4 py-3">Plan</th>
                  <th class="text-left text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 px-4 py-3">Estado</th>
                  <th class="text-left text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 px-4 py-3">WhatsApp</th>
                  <th class="text-right text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 px-5 py-3">GMV</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-50">
                @for (tenant of recentTenants(); track tenant.id) {
                  <tr class="hover:bg-zinc-50/50 transition-colors">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                          {{ tenant.name.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <p class="text-xs font-bold text-zinc-900">{{ tenant.name }}</p>
                          <p class="text-[10px] text-zinc-400 font-mono">/{{ tenant.slug }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3.5">
                      <span [class]="getPlanBadgeClass(tenant.plan)" class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">
                        {{ tenant.plan }}
                      </span>
                    </td>
                    <td class="px-4 py-3.5">
                      <span [class]="getStatusBadgeClass(tenant.status)" class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">
                        {{ tenant.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-1.5">
                        <span [class]="tenant.whatsapp.status === 'CONNECTED' ? 'bg-emerald-500' : tenant.whatsapp.status === 'QR_READY' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-300'"
                              class="w-2 h-2 rounded-full">
                        </span>
                        <span class="text-[11px] font-medium text-zinc-600">{{ tenant.whatsapp.status }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-3.5 text-right">
                      <span class="text-xs font-bold text-zinc-900">S/ {{ tenant.metrics.totalGmv | number:'1.2-2' }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class SuperAdminDashboardComponent implements OnInit {
  private tenantsService = inject(TenantsService);

  loading = signal(true);
  metrics = signal<AdminMetrics | null>(null);
  tenants = signal<EnrichedTenant[]>([]);

  recentTenants = () => this.tenants().slice(0, 6);

  ngOnInit() {
    this.tenantsService.getAdminMetrics().subscribe({
      next: (m) => {
        this.metrics.set(m);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.tenantsService.getEnrichedTenants().subscribe({
      next: (t) => this.tenants.set(t),
    });
  }

  getPlanBadgeClass(plan: TenantPlan): string {
    const map: Record<string, string> = {
      FREE_TRIAL: 'bg-zinc-100 text-zinc-600',
      BASIC: 'bg-blue-50 text-blue-700',
      PRO: 'bg-indigo-50 text-indigo-700',
      ENTERPRISE: 'bg-amber-50 text-amber-700',
    };
    return map[plan] || 'bg-zinc-100 text-zinc-600';
  }

  getStatusBadgeClass(status: TenantStatus): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700',
      SUSPENDED: 'bg-rose-50 text-rose-700',
      PENDING_PAYMENT: 'bg-amber-50 text-amber-700',
    };
    return map[status] || 'bg-zinc-100 text-zinc-600';
  }
}
