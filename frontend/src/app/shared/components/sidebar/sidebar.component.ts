import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
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
        <div class="flex items-center justify-between px-2 py-2 mb-6">
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

        <!-- Navigation Links -->
        <nav class="space-y-1.5" aria-label="Navegación principal">
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
}
