import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TenantPlan } from '../../../core/models/models';

@Component({
  selector: 'app-register-store',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-[#F8F9FB]">
      <!-- Ambient Glow Accents (Matching Login Page) -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-100/70 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-100/60 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-50/40 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Main Register Bento Card -->
      <div class="relative w-full max-w-2xl rounded-3xl bg-white border border-zinc-200/90 p-6 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)]">
        
        <!-- Header Section (Matching Login Bento) -->
        <div class="text-center mb-6">
          <div class="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3 transition-transform hover:scale-105">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">WSP FLOW</h1>
          <p class="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-sm mx-auto">
            Crea tu Tienda Virtual & Automatiza tus Ventas con Inteligencia Artificial
          </p>
        </div>


        <!-- Error Message Alert -->
        @if (errorMessage()) {
          <div class="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-shake">
            <svg class="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-6">

          <!-- ══════════════════════════════════════════════════════ -->
          <!-- SECCIÓN 1: IDENTIDAD DE TU NEGOCIO                     -->
          <!-- ══════════════════════════════════════════════════════ -->
          <div class="bg-zinc-50/70 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 space-y-4">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</span>
              <h3 class="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">
                Identidad de tu Negocio
              </h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nombre de la Tienda -->
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                  Nombre de la Marca / Tienda *
                </label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="storeName"
                    name="storeName"
                    (input)="onStoreNameChange()"
                    required
                    placeholder="Ej: Urban Style Shoes"
                    class="input-bento pl-10"
                  />
                  <svg class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>

              <!-- Rubro / Categoría Comercial -->
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                  Rubro Comercial *
                </label>
                <div class="relative">
                  <select
                    [(ngModel)]="businessCategory"
                    name="businessCategory"
                    class="input-bento pl-10 appearance-none cursor-pointer"
                  >
                    <option value="Moda y Calzado">👗 Moda, Ropa & Calzado</option>
                    <option value="Tecnología y Electrónica">📱 Tecnología, Celulares & Gaming</option>
                    <option value="Gastronomía y Bebidas">🍔 Comida, Restaurante & Bebidas</option>
                    <option value="Belleza y Cuidado Personal">💄 Belleza, Cosméticos & Salud</option>
                    <option value="Hogar y Decoración">🛋️ Hogar, Muebles & Decoración</option>
                    <option value="Joyería y Accesorios">💍 Joyería, Relojes & Regalos</option>
                    <option value="Comercio General">📦 Comercio General / Otro</option>
                  </select>
                  <svg class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <svg class="w-4 h-4 text-zinc-400 absolute right-3.5 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Enlace Público de la Tienda -->
            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                Enlace Web Público (Slug)
              </label>
              <div class="flex items-center rounded-xl bg-white border border-zinc-200 px-3.5 py-2 text-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/15 transition-all">
                <span class="text-zinc-400 font-mono text-xs select-none">wspflow.com/store/</span>
                <input
                  type="text"
                  [(ngModel)]="slug"
                  name="slug"
                  placeholder="urban-style-shoes"
                  class="bg-transparent border-none text-indigo-600 font-bold font-mono focus:outline-none flex-1 pl-1 text-xs sm:text-sm"
                />
              </div>
              <p class="text-[11px] text-zinc-400 mt-1">Este será el link con el que tus clientes verán tu catálogo y harán pedidos.</p>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════ -->
          <!-- SECCIÓN 2: DATOS DEL ADMINISTRADOR                     -->
          <!-- ══════════════════════════════════════════════════════ -->
          <div class="bg-zinc-50/70 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 space-y-4">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
              <h3 class="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">
                Datos del Administrador / Dueño
              </h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nombre Completo -->
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                  Nombre Completo *
                </label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="ownerName"
                    name="ownerName"
                    required
                    placeholder="Carlos Mendoza"
                    class="input-bento pl-10"
                  />
                  <svg class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <!-- WhatsApp -->
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                  WhatsApp del Negocio *
                </label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="phoneNumber"
                    name="phoneNumber"
                    required
                    placeholder="51987654321"
                    class="input-bento pl-10 font-mono text-xs sm:text-sm"
                  />
                  <svg class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Correo Electrónico -->
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                  Correo Electrónico *
                </label>
                <div class="relative">
                  <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    autocomplete="email"
                    placeholder="carlos@urbanstyle.com"
                    class="input-bento pl-10"
                  />
                  <svg class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>

              <!-- Contraseña -->
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                  Contraseña *
                </label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    required
                    autocomplete="new-password"
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
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════ -->
          <!-- INFORMACIÓN DEL PLAN (Siempre Free Trial Inicial)       -->
          <!-- ══════════════════════════════════════════════════════ -->
          <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5 text-xs text-emerald-900">
            <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-base shadow-sm mt-0.5">
              🎁
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="font-extrabold text-emerald-950 text-sm">Plan Free Trial (100% Gratuito)</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-xs">
                  S/ 0 • Sin Tarjeta
                </span>
              </div>
              <p class="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                Tu tienda se aprovisionará de inmediato con <strong>hasta 20 productos</strong> en catálogo, <strong>50 difusiones CRM</strong> al mes y tu <strong>Asistente IA de WhatsApp (Luna)</strong> conectado 24/7. Podrás escalar de plan en cualquier momento desde tu panel de control.
              </p>
            </div>
          </div>

          <!-- Botón de Envío Principal -->
          <button
            type="submit"
            [disabled]="loading()"
            class="btn-primary w-full py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            @if (loading()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Aprovisionando tienda y asistente IA...</span>
            } @else {
              <span>🚀 Crear Mi Tienda Gratis</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            }
          </button>
        </form>

        <!-- Footer Links (Matching Login Page) -->
        <div class="mt-8 pt-6 border-t border-zinc-100 text-center space-y-2">
          <p class="text-xs text-zinc-500">
            ¿Ya tienes una cuenta registrada en la plataforma?
            <a routerLink="/login" class="text-indigo-600 font-bold hover:underline ml-1">Inicia sesión</a>
          </p>
          <div>
            <a routerLink="/" class="text-xs text-zinc-400 hover:text-zinc-600 transition-colors inline-flex items-center gap-1">
              ← Volver a la página principal
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class RegisterStoreComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  storeName = '';
  slug = '';
  businessCategory = 'Moda y Calzado';
  ownerName = '';
  email = '';
  password = '';
  phoneNumber = '';

  // El plan inicial siempre es FREE_TRIAL
  readonly plan: TenantPlan = TenantPlan.FREE_TRIAL;

  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  onStoreNameChange() {
    this.slug = this.storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  onSubmit() {
    if (!this.storeName || !this.ownerName || !this.email || !this.password) {
      this.errorMessage.set('Por favor completa todos los campos obligatorios (*)');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .registerStore({
        storeName: this.storeName,
        storeSlug: this.slug || undefined,
        slug: this.slug || undefined,
        adminFullName: this.ownerName,
        ownerName: this.ownerName,
        adminEmail: this.email,
        email: this.email,
        adminPassword: this.password,
        password: this.password,
        phoneNumber: this.phoneNumber || undefined,
        plan: this.plan as TenantPlan,
        businessCategory: this.businessCategory,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Error al registrar la tienda. Intenta nuevamente.');
        },
      });
  }
}
