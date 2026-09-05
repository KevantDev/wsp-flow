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
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-xl shadow-emerald-500/20 mb-4">
          <i class="ri-store-3-fill text-2xl text-white"></i>
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Crea tu Tienda WhatsApp
        </h2>
        <p class="mt-2 text-sm text-slate-400">
          Únete a la plataforma SaaS de comercio conversacional y automatiza tus ventas con IA.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        <div class="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-3xl p-8 sm:p-10">
          
          <div *ngIf="errorMessage()" class="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <i class="ri-error-warning-line text-lg flex-shrink-0"></i>
            <span>{{ errorMessage() }}</span>
          </div>

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="border-b border-slate-800 pb-5">
              <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                <i class="ri-building-line"></i> Identidad de tu Negocio
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">Nombre de la Tienda / Marca *</label>
                  <input
                    type="text"
                    [(ngModel)]="storeName"
                    name="storeName"
                    (input)="onStoreNameChange()"
                    required
                    placeholder="Ej: Urban Style Shoes"
                    class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">Tu Enlace Público de Tienda</label>
                  <div class="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400">
                    <span class="text-slate-500">wspflow.com/tienda/</span>
                    <input
                      type="text"
                      [(ngModel)]="slug"
                      name="slug"
                      placeholder="urban-style-shoes"
                      class="bg-transparent border-none text-emerald-400 font-semibold focus:outline-none flex-1 pl-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="border-b border-slate-800 pb-5">
              <h3 class="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
                <i class="ri-user-line"></i> Datos del Administrador
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    [(ngModel)]="ownerName"
                    name="ownerName"
                    required
                    placeholder="Carlos Mendoza"
                    class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">WhatsApp del Negocio *</label>
                  <input
                    type="text"
                    [(ngModel)]="phoneNumber"
                    name="phoneNumber"
                    required
                    placeholder="51987654321"
                    class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    placeholder="carlos@urbanstyle.com"
                    class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    [(ngModel)]="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Selecciona tu Plan Inicial</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  (click)="setPlan('FREE_TRIAL')"
                  [ngClass]="plan === 'FREE_TRIAL' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/50'"
                  class="p-3.5 rounded-2xl border text-left transition-all hover:border-slate-700"
                >
                  <div class="text-xs font-bold text-white">Prueba Gratis</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">14 días</div>
                  <div class="text-xs font-semibold text-emerald-400 mt-2">S/ 0</div>
                </button>

                <button
                  type="button"
                  (click)="setPlan('PRO')"
                  [ngClass]="plan === 'PRO' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/50'"
                  class="p-3.5 rounded-2xl border text-left transition-all hover:border-slate-700 relative overflow-hidden"
                >
                  <span class="absolute top-0 right-0 bg-indigo-500 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-bl text-white">Popular</span>
                  <div class="text-xs font-bold text-white">Plan PRO</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">Hasta 100 prods</div>
                  <div class="text-xs font-semibold text-indigo-400 mt-2">S/ 79 /mes</div>
                </button>

                <button
                  type="button"
                  (click)="setPlan('ENTERPRISE')"
                  [ngClass]="plan === 'ENTERPRISE' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 bg-slate-950/50'"
                  class="p-3.5 rounded-2xl border text-left transition-all hover:border-slate-700"
                >
                  <div class="text-xs font-bold text-white">Enterprise</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">Ilimitado + IA</div>
                  <div class="text-xs font-semibold text-purple-400 mt-2">S/ 149 /mes</div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <span>{{ loading() ? 'Configurando tu espacio...' : '🚀 Crear Mi Tienda y Comenzar' }}</span>
            </button>
          </form>

          <div class="mt-8 text-center text-xs text-slate-400">
            ¿Ya tienes una cuenta registrada?
            <a routerLink="/login" class="text-emerald-400 font-semibold hover:underline ml-1">Inicia sesión</a>
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
  ownerName = '';
  email = '';
  password = '';
  phoneNumber = '';
  plan: 'FREE_TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' = 'PRO';

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  setPlan(p: 'FREE_TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE') {
    this.plan = p;
  }

  onStoreNameChange() {
    this.slug = this.storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  onSubmit() {
    if (!this.storeName || !this.ownerName || !this.email || !this.password) {
      this.errorMessage.set('Por favor completa todos los campos obligatorios');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .registerStore({
        storeName: this.storeName,
        slug: this.slug || undefined,
        ownerName: this.ownerName,
        email: this.email,
        password: this.password,
        phoneNumber: this.phoneNumber || undefined,
        plan: this.plan as TenantPlan,
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
