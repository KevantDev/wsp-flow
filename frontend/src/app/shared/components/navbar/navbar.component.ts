import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 md:h-18 border-b border-zinc-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-30 transition-all">
      
      <!-- Left: Mobile Menu Toggle & Title -->
      <div class="flex items-center gap-3">
        <!-- Hamburger Button (Mobile only) -->
        <button
          (click)="layoutService.toggleMenu()"
          aria-label="Abrir menú de navegación"
          class="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden shadow-sm active:scale-95 transition-all"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h2 class="text-base sm:text-lg md:text-xl font-bold text-zinc-900 tracking-tight leading-tight">{{ title }}</h2>
          @if (subtitle) {
            <p class="hidden sm:block text-xs text-zinc-500 font-normal mt-0.5">{{ subtitle }}</p>
          }
        </div>
      </div>

      <!-- Right: Search & System Status -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- Quick search pill with KBD badge (Tablet/Desktop) -->
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-500 shadow-sm hover:border-zinc-300 transition-colors">
          <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="hidden md:inline font-normal">Buscar en catálogo</span>
          <kbd class="kbd-badge ml-1">⌘K</kbd>
        </div>

        <!-- Connection Status Badge -->
        <div class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-[11px] sm:text-xs font-semibold text-emerald-800">Sistema Online</span>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  @Input() title = 'Dashboard';
  @Input() subtitle = 'Panel de Control Bento Grid';
  authService = inject(AuthService);
  layoutService = inject(LayoutService);
}
