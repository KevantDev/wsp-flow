import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#F8F9FB]">
      <!-- Ambient Glow Accents (Subtle Light Mode) -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-100/70 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-100/60 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-50/40 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Main Login Bento Card -->
      <div class="relative w-full max-w-md rounded-3xl bg-white border border-zinc-200/90 p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)]">
        
        <!-- Header Section -->
        <div class="text-center mb-7">
          <div class="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3.5 transition-transform hover:scale-105">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="text-2xl font-extrabold text-zinc-900 tracking-tight">WSP FLOW</h1>
          <p class="text-xs text-zinc-500 font-normal mt-1 max-w-xs mx-auto">
            Plataforma de Ventas, Catálogo & Bot de WhatsApp con Bento Grid
          </p>
        </div>

        

        @if (errorMessage()) {
          <div class="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-shake">
            <svg class="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
              Correo Electrónico
            </label>
            <div class="relative">
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
                placeholder="admin@wspflow.com"
                class="input-bento pl-10"
              />
              <svg class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">
                Contraseña
              </label>
            </div>
            <div class="relative">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="input-bento pl-10 pr-10"
              />
              <svg class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="absolute right-3 top-2.5 p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                title="Mostrar u ocultar contraseña"
              >
                @if (showPassword()) {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="isLoading()"
            class="btn-primary w-full py-3 mt-3 text-sm font-semibold tracking-wide"
          >
            @if (isLoading()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Iniciando sesión...</span>
            } @else {
              <span>Acceder al Panel</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            }
          </button>
        </form>

        <!-- Quick 1-Click Demo Credentials -->
        <div class="mt-8 pt-6 border-t border-zinc-100">
          <div class="flex items-center justify-between mb-3">
            <p class="text-zinc-400 font-mono text-[10px] uppercase tracking-wider font-semibold">
              Acceso Rápido Demostrativo
            </p>
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
              Clave: <strong class="text-indigo-600 font-bold">Admin123456!</strong>
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              (click)="fillCredentials('superadmin@wspflow.com', 'Admin123456!')"
              class="p-2.5 rounded-2xl bg-zinc-50 hover:bg-purple-50/60 hover:border-purple-200 border border-zinc-200/80 text-left transition-all active:scale-[0.98] group"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-purple-700 group-hover:text-purple-800">👑 Super Admin</span>
              </div>
              <span class="block text-[10px] text-zinc-500 truncate mt-0.5">superadmin&#64;wspflow.com</span>
            </button>

            <button
              type="button"
              (click)="fillCredentials('admin@wspflow.com', 'Admin123456!')"
              class="p-2.5 rounded-2xl bg-zinc-50 hover:bg-indigo-50/60 hover:border-indigo-200 border border-zinc-200/80 text-left transition-all active:scale-[0.98] group"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-indigo-700 group-hover:text-indigo-800">🏢 Admin Tech</span>
              </div>
              <span class="block text-[10px] text-zinc-500 truncate mt-0.5">admin&#64;wspflow.com</span>
            </button>

            <button
              type="button"
              (click)="fillCredentials('subadmin@wspflow.com', 'Admin123456!')"
              class="p-2.5 rounded-2xl bg-zinc-50 hover:bg-emerald-50/60 hover:border-emerald-200 border border-zinc-200/80 text-left transition-all active:scale-[0.98] group"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-700 group-hover:text-emerald-800">👤 Asesor</span>
              </div>
              <span class="block text-[10px] text-zinc-500 truncate mt-0.5">subadmin&#64;wspflow.com</span>
            </button>
          </div>

          <div class="mt-6 text-center text-xs text-zinc-500">
            ¿Eres emprendedor y quieres tu propia tienda?
            <a href="/register-store" class="text-indigo-600 font-bold hover:underline ml-1">Crear Tienda SaaS</a>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = 'admin@wspflow.com';
  password = 'Admin123456!';
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  fillCredentials(e: string, p: string) {
    this.email = e;
    this.password = p;
  }

  onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Super Admin va a su panel de plataforma SaaS; el resto al dashboard de tienda
        const destination = this.authService.isSuperAdmin() ? '/admin' : '/dashboard';
        this.router.navigate([destination]);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Credenciales inválidas. Por favor intenta de nuevo.');
      },
    });
  }
}
