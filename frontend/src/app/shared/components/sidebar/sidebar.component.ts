import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Backdrop Overlay -->
    @if (isOpen) {
      <div
        (click)="close.emit()"
        class="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-sm lg:hidden transition-opacity animate-fade-in"
      ></div>
    }

    <!-- Sidebar Container -->
    <aside
      [class]="'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-xl border-r border-zinc-200/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out ' + (isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0')"
    >
      <div>
        <!-- Brand Logo & Mobile Close -->
        <div class="flex items-center justify-between px-2 py-2 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-base">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 class="font-bold text-zinc-900 text-sm tracking-tight leading-tight">WSP FLOW</h1>
              <p class="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-600">Bento Commerce</p>
            </div>
          </div>

          <!-- Close button on mobile -->
          <button
            (click)="close.emit()"
            aria-label="Cerrar menú"
            class="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 lg:hidden transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Impersonation Active Banner -->
        @if (authService.isImpersonating()) {
          <div class="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 animate-pulse">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-xs font-bold">👤 Modo Soporte Tienda</span>
            </div>
            <p class="text-[11px] text-amber-800 font-semibold truncate">{{ authService.impersonatedStoreName() }}</p>
            <button
              (click)="authService.exitImpersonation()"
              class="mt-2 w-full py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
            >
              <span>↩️ Salir a Super Admin</span>
            </button>
          </div>
        }

        <!-- Public Store Preview Button (SOLO para Tiendas/Tenants o cuando Super Admin impersona tienda) -->
        @if (!authService.isSuperAdmin() || authService.isImpersonating()) {
          <div class="mb-4 px-1">
            <a
              [routerLink]="storeUrl()"
              target="_blank"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold hover:bg-emerald-100/70 transition-all shadow-sm group"
            >
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Mi Tienda Web
              </span>
              <svg class="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        }

        <!-- Navigation Links -->
        <nav class="space-y-1.5" aria-label="Navegación principal">

          <!-- ================================================ -->
          <!-- SUPER ADMIN SaaS — Solo cuando NO está impersonando -->
          <!-- ================================================ -->
          @if (authService.isSuperAdmin() && !authService.isImpersonating()) {
            <div class="pt-1 pb-2">
              <span class="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600">
                Plataforma SaaS
              </span>
            </div>

            <!-- Dashboard Global -->
            <a
              routerLink="/admin"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Dashboard Global</span>
            </a>

            <!-- Gestión de Tiendas -->
            <a
              routerLink="/admin/tenants"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Gestión de Tiendas</span>
            </a>

            <!-- Monitor WA -->
            <a
              routerLink="/admin/sessions"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div class="flex-1 flex items-center justify-between">
                <span>Monitor WhatsApp</span>
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </a>

            <!-- Planes & Límites -->
            <a
              routerLink="/admin/plans"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-amber-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Planes & Límites</span>
            </a>

            <!-- Estado del Sistema -->
            <a
              routerLink="/admin/system"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
              <span>Estado del Sistema</span>
            </a>
          }

          <!-- ================================================ -->
          <!-- TENANT MENU — Admin, Subadmin, o SA en impersonation -->
          <!-- ================================================ -->
          @if (!authService.isSuperAdmin() || authService.isImpersonating()) {

            @if (authService.isImpersonating()) {
              <!-- Label contexto tienda cuando super admin impersona -->
              <div class="pt-1 pb-1">
                <span class="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600">
                  Tienda Local
                </span>
              </div>
            }

            <!-- Dashboard -->
            <a
              routerLink="/dashboard"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Dashboard</span>
            </a>

            <!-- Productos & Stock -->
            <a
              routerLink="/products"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Productos & Stock</span>
            </a>

            <!-- Pedidos & Ventas -->
            <a
              routerLink="/orders"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Pedidos & Ventas</span>
            </a>

            <!-- Live Chat -->
            <a
              routerLink="/live-chat"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div class="flex-1 flex items-center justify-between">
                <span>Live Chat</span>
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="WhatsApp Online"></span>
              </div>
            </a>

            <!-- Difusión & CRM -->
            <a
              routerLink="/broadcasts"
              (click)="close.emit()"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
            >
              <svg class="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span>Difusión & CRM</span>
            </a>

            <!-- Admin-only items -->
            @if (authService.isAdmin()) {
              <a
                routerLink="/users"
                (click)="close.emit()"
                routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
                class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
              >
                <svg class="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Subadministradores</span>
              </a>

              <a
                routerLink="/settings"
                (click)="close.emit()"
                routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-sm"
                class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border border-transparent transition-all font-medium text-sm group"
              >
                <svg class="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Configuración IA</span>
              </a>
            }
          }
        </nav>
      </div>

      <!-- User Profile Card in Sidebar -->
      <div class="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 shadow-sm">
        <div class="flex items-center gap-3">
          <img
            [src]="authService.currentUser()?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'"
            alt="Avatar"
            class="w-9 h-9 rounded-xl object-cover border border-zinc-200"
          />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-zinc-900 truncate">{{ authService.currentUser()?.fullName }}</p>
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-600">
              {{ authService.currentUser()?.role }}
            </span>
          </div>
          <button
            (click)="authService.logout()"
            title="Cerrar sesión"
            class="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  authService = inject(AuthService);

  storeUrl = computed(() => {
    if (this.authService.isImpersonating()) {
      const impSlug = this.authService.impersonatedStoreSlug();
      if (impSlug) return `/tienda/${impSlug}`;
    }
    const user = this.authService.currentUser();
    const slug = user?.tenantSlug || 'wsp-tech';
    return `/tienda/${slug}`;
  });
}
