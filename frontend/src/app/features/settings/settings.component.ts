import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { StoreThemeComponent } from './store-theme/store-theme.component';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { TenantsService } from '../../core/services/tenants.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyConfig, StoreThemeConfig, Tenant } from '../../core/models/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BentoCardComponent, StoreThemeComponent],
  template: `
    <app-navbar title="Configuración de IA & Negocio" subtitle="Contexto empresarial, políticas de despacho y tarifas de delivery"></app-navbar>

    <div class="space-y-8 mt-6 pb-16 max-w-7xl mx-auto px-1 sm:px-2">
      
      <!-- Top Sticky Master Action Banner -->
      <div class="sticky top-2 sm:top-4 z-30 p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-all">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0 shadow-2xs">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="text-base sm:text-lg font-bold text-zinc-900 leading-tight">Configuración del Negocio & Diseño Web</h3>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">En Vivo</span>
            </div>
            <p class="text-xs text-zinc-500 font-normal mt-1">Guarda tu información corporativa, tarifas de delivery y el diseño visual de la tienda web en un solo clic.</p>
          </div>
        </div>

        <div class="flex items-center gap-3 self-stretch sm:self-auto flex-wrap">
          <button
            type="button"
            (click)="openPreview()"
            class="btn-secondary flex-1 sm:flex-initial text-xs py-3 px-4 font-bold shrink-0 shadow-2xs flex items-center justify-center gap-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] transition-all text-zinc-700"
          >
            <span class="text-sm">👁️</span>
            <span>Vista Previa de Tienda</span>
          </button>

          <button
            (click)="saveAllSettings()"
            [disabled]="isSaving()"
            class="btn-primary flex-1 sm:flex-initial text-xs py-3 px-6 font-bold shrink-0 shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            @if (isSaving()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Guardando todo...</span>
            } @else {
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Guardar Configuración & Diseño</span>
            }
          </button>
        </div>
      </div>

      <!-- Feedback Success Toast -->
      @if (showSuccessToast()) {
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-sm">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>¡Configuración de empresa, tarifas de delivery y diseño de tienda web guardados con éxito!</span>
          </div>
          <button (click)="showSuccessToast.set(false)" class="text-emerald-700 hover:text-emerald-900 font-bold p-1">✕</button>
        </div>
      }

      <!-- ===== DISEÑO DE TIENDA WEB ===== -->
      <app-bento-card customClass="p-6 sm:p-8 md:p-9">
        <app-store-theme
          (themeSaved)="onThemeSaved($event)"
          (openPreview)="openPreview()"
          [themeJson]="config.storeTheme"
        ></app-store-theme>
      </app-bento-card>

      <!-- Main Bento Content Grid (Balanced 2-Column Layout) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        
        <!-- Block 1: Contexto Oficial de la Empresa -->
        <app-bento-card customClass="h-full flex flex-col justify-between p-6 sm:p-7 md:p-8">
          <div class="space-y-5">
            <div class="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-lg font-bold shadow-2xs">
                  🏢
                </div>
                <div>
                  <h4 class="font-bold text-zinc-900 text-sm">Contexto Oficial de la Empresa</h4>
                  <p class="text-xs text-zinc-500 font-normal">Identidad comercial y políticas de atención</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 font-mono text-[10px] font-bold border border-zinc-200">
                General
              </span>
            </div>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-zinc-700 font-bold text-xs mb-1.5">Nombre Comercial de la Tienda</label>
                <input type="text" [(ngModel)]="config.companyName" class="input-bento text-xs" placeholder="Ej: WSP Flow Commerce" />
              </div>

              <div>
                <label class="block text-zinc-700 font-bold text-xs mb-1.5">Rubro y Descripción del Negocio</label>
                <textarea rows="3" [(ngModel)]="config.businessDescription" class="input-bento text-xs leading-relaxed" placeholder="Describe qué productos vendes y a quién van dirigidos..."></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-zinc-700 font-bold text-xs mb-1.5">Horario de Atención General</label>
                  <input type="text" [(ngModel)]="config.workingHours" class="input-bento text-xs" placeholder="Lunes a Sábado de 09:00 a 20:00" />
                </div>
                <div>
                  <label class="block text-zinc-700 font-bold text-xs mb-1.5">Dirección / Sede Principal</label>
                  <input type="text" [(ngModel)]="config.address" class="input-bento text-xs" placeholder="Av. Principal 1234, Centro" />
                </div>
              </div>

              <div>
                <label class="block text-zinc-700 font-bold text-xs mb-1.5">Políticas de Envío y Despacho</label>
                <input type="text" [(ngModel)]="config.shippingPolicy" class="input-bento text-xs" placeholder="Envíos express en 24 a 48 hs hábiles a todo el país..." />
              </div>

              <div>
                <label class="block text-zinc-700 font-bold text-xs mb-1.5">Métodos de Pago Aceptados</label>
                <input type="text" [(ngModel)]="config.paymentMethods" class="input-bento text-xs" placeholder="Yape, Tarjetas Mercado Pago, transferencia, efectivo contra entrega..." />
              </div>
            </div>
          </div>
        </app-bento-card>

        <!-- Block 2: Tarifas de Delivery & Recojo en Tienda -->
        <app-bento-card customClass="h-full flex flex-col justify-between p-6 sm:p-7 md:p-8">
          <div class="space-y-5">
            <div class="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-lg font-bold shadow-2xs">
                  🛵
                </div>
                <div>
                  <h4 class="font-bold text-zinc-900 text-sm">Tarifas de Delivery & Recojo</h4>
                  <p class="text-xs text-zinc-500 font-normal">Precios oficiales en Soles Peruanos (S/ PEN)</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200/70">
                Estrategia Perú
              </span>
            </div>

            <div class="space-y-4 text-xs">
              
              <!-- Recojo en Tienda -->
              <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                <div class="flex items-center justify-between text-emerald-950 font-bold">
                  <span class="text-xs">🏪 Local de Recojo en Tienda (S/ 0.00 / Gratis)</span>
                  <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">Sin Costo</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label class="block text-zinc-600 font-medium text-[11px] mb-1">Dirección del Local</label>
                    <input type="text" [(ngModel)]="config.pickupStoreAddress" class="input-bento text-xs bg-white" placeholder="Av. Larco 743, Miraflores, Lima" />
                  </div>
                  <div>
                    <label class="block text-zinc-600 font-medium text-[11px] mb-1">Horario de Retiro</label>
                    <input type="text" [(ngModel)]="config.pickupStoreHours" class="input-bento text-xs bg-white" placeholder="Lun a Sáb de 09:00 a 20:00" />
                  </div>
                </div>
              </div>

              <!-- Zonas de Lima & Provincias como Sub-Cards Bento -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <!-- Zona 1 -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 hover:border-zinc-300 hover:bg-white transition-all space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-zinc-800">Lima Zona 1</label>
                    <span class="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-200/70 text-zinc-600 font-bold">Centro / Moderna</span>
                  </div>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      [(ngModel)]="config.deliveryZone1Price"
                      class="input-bento pl-8 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <p class="text-[10px] text-zinc-400 leading-tight">Miraflores, San Isidro, Surco, San Borja, etc.</p>
                </div>

                <!-- Zona 2 -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 hover:border-zinc-300 hover:bg-white transition-all space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-zinc-800">Lima Zona 2</label>
                    <span class="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-200/70 text-zinc-600 font-bold">Norte / Sur / Este</span>
                  </div>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      [(ngModel)]="config.deliveryZone2Price"
                      class="input-bento pl-8 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <p class="text-[10px] text-zinc-400 leading-tight">Los Olivos, SMP, Comas, Chorrillos, SJL, etc.</p>
                </div>

                <!-- Zona 3 -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 hover:border-zinc-300 hover:bg-white transition-all space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-zinc-800">Lima Zona 3</label>
                    <span class="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-200/70 text-zinc-600 font-bold">Callao & Periferia</span>
                  </div>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      [(ngModel)]="config.deliveryZone3Price"
                      class="input-bento pl-8 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <p class="text-[10px] text-zinc-400 leading-tight">Callao, Ventanilla, VES, Lurín, Chosica, etc.</p>
                </div>

                <!-- Provincias -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 hover:border-zinc-300 hover:bg-white transition-all space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-zinc-800">Provincias Perú</label>
                    <span class="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-200/70 text-zinc-600 font-bold">Agencia Shalom</span>
                  </div>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      [(ngModel)]="config.deliveryProvincePrice"
                      class="input-bento pl-8 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <p class="text-[10px] text-zinc-400 leading-tight">Despacho a agencia con guía de remisión.</p>
                </div>
              </div>

              <!-- Umbral de Envío Gratis -->
              <div class="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/90 space-y-2 mt-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <span>🎁</span>
                    <span>Envío Gratuito Automático</span>
                  </div>
                  <span class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold font-mono">Incentivo</span>
                </div>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                  <input
                    type="number"
                    step="1.00"
                    min="0"
                    [(ngModel)]="config.freeShippingThreshold"
                    class="input-bento pl-8 text-xs font-mono font-bold bg-white"
                    placeholder="0.00 (0 = Desactivado)"
                  />
                </div>
                <p class="text-[10px] text-zinc-500">Monto mínimo en compras para delivery gratis (S/ 0 para desactivar).</p>
              </div>

            </div>
          </div>
        </app-bento-card>

      </div>

      <!-- Block: Pasarela de Pagos Mercado Pago (Full Width Bento Card) -->
      <app-bento-card customClass="p-6 sm:p-8 md:p-10 mt-8 sm:mt-10">
        <div class="space-y-6">
          
          <!-- Header -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center text-xl font-bold shadow-2xs shrink-0">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-zinc-900 text-base sm:text-lg">Pasarela de Pagos Mercado Pago (Perú)</h4>
                  @if (isMpConnected()) {
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Conectado
                    </span>
                  } @else {
                    <span class="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                      Sin Conectar
                    </span>
                  }
                </div>
                <p class="text-xs text-zinc-500 font-normal mt-1">
                  Cobra a tus clientes con Tarjetas de Débito/Crédito, Yape instantáneo y PagoEfectivo con acreditación directa a tu cuenta.
                </p>
              </div>
            </div>

            <!-- Header Action Button -->
            <div class="flex items-center gap-2 self-stretch sm:self-auto">
              @if (isMpConnected()) {
                <button
                  type="button"
                  (click)="disconnectMercadoPago()"
                  [disabled]="isDisconnectingMp()"
                  class="btn-secondary text-xs py-2 px-3.5 font-semibold text-rose-600 hover:bg-rose-50 border-rose-200 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  @if (isDisconnectingMp()) {
                    <span class="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
                    <span>Desvinculando...</span>
                  } @else {
                    <span>Desvincular Cuenta</span>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Banner & Benefits Strip -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5">
              <span class="text-lg">⚡</span>
              <div>
                <h5 class="text-xs font-bold text-sky-950">Aprobación Inmediata</h5>
                <p class="text-[11px] text-sky-800 leading-tight mt-0.5">Sin demoras de semanas ni requisitos de panel comercial complejo.</p>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5">
              <span class="text-lg">💜</span>
              <div>
                <h5 class="text-xs font-bold text-purple-950">Yape & Tarjetas</h5>
                <p class="text-[11px] text-purple-800 leading-tight mt-0.5">Acepta Visa, Mastercard, Diners, American Express y Yape directo.</p>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
              <span class="text-lg">🏦</span>
              <div>
                <h5 class="text-xs font-bold text-emerald-950">Tu Propio Dinero</h5>
                <p class="text-[11px] text-emerald-800 leading-tight mt-0.5">Los cobros van directo a tu cuenta bancaria asociada a Mercado Pago.</p>
              </div>
            </div>
          </div>

          <!-- Mode 1: Connect with 1-Click OAuth (Recommended) -->
          <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-white border border-sky-200/80 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold font-mono uppercase tracking-wider text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">Método 1 (Recomendado)</span>
                  <span class="text-xs font-bold text-zinc-900">Vinculación en 1 Clic (OAuth Connect)</span>
                </div>
                <p class="text-xs text-zinc-600 mt-1">
                  Autoriza a WSP Flow para crear cobros en tu nombre sin tener que copiar ni pegar claves secretas.
                </p>
              </div>

              @if (isMpConnected()) {
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Cuenta Vinculada: {{ tenantData()?.mpUserId || 'ID Registrado' }}</span>
                  </span>
                </div>
              } @else {
                <button
                  type="button"
                  (click)="connectMercadoPago()"
                  [disabled]="isConnectingMp()"
                  class="py-2.5 px-5 rounded-xl bg-[#009ee3] hover:bg-[#0089c7] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                  @if (isConnectingMp()) {
                    <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Redirigiendo a Mercado Pago...</span>
                  } @else {
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    <span>Conectar mi Mercado Pago en 1 Clic</span>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Mode 2: Manual Credentials (BYOK) -->
          <div class="space-y-4 pt-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">Método 2</span>
                <span class="text-xs font-bold text-zinc-800">Credenciales Manuales de Desarrollador (Opcional / BYOK)</span>
              </div>
              <span class="text-[11px] text-zinc-400 font-mono">Modo Avanzado</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-zinc-700 font-bold text-xs mb-1.5">
                  Public Key (Clave Pública)
                </label>
                <input
                  type="text"
                  [(ngModel)]="mpPublicKeyModel"
                  placeholder="APP_USR-xxxx-xxxx-xxxx"
                  class="input-bento text-xs font-mono"
                />
                <p class="text-[10px] text-zinc-400 mt-1">Obtenla en: mercadopago.com.pe/developers</p>
              </div>

              <div>
                <label class="block text-zinc-700 font-bold text-xs mb-1.5">
                  Access Token (Clave Secreta)
                </label>
                <input
                  type="password"
                  [(ngModel)]="mpAccessTokenModel"
                  placeholder="APP_USR-xxxx-xxxx-xxxx"
                  class="input-bento text-xs font-mono"
                />
                <p class="text-[10px] text-zinc-400 mt-1">Se almacena de forma segura y encriptada.</p>
              </div>
            </div>
          </div>

        </div>
      </app-bento-card>

      <!-- Block 3: System Prompt Maestro de Luna (Full Width Bento Card) -->
      <app-bento-card customClass="p-6 sm:p-8 md:p-10 mt-8 sm:mt-10">
        <div class="space-y-6">
          <!-- Card Header with Generous Top Breathing Room -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-xl font-bold shadow-2xs shrink-0">
                🧠
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-zinc-900 text-base sm:text-lg">System Prompt Maestro de Luna</h4>
                  <span class="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">Motor IA</span>
                </div>
                <p class="text-xs text-zinc-500 font-normal mt-1">Directrices conversacionales, personalidad y tono de voz de la asistente virtual</p>
              </div>
            </div>
            <button
              type="button"
              (click)="restoreDefaultPrompt()"
              class="btn-secondary text-xs py-2.5 px-4 font-semibold shrink-0 flex items-center gap-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 active:scale-95 transition-all self-stretch sm:self-auto justify-center"
            >
              <span>🔄</span>
              <span>Restaurar Predeterminado</span>
            </button>
          </div>

          <!-- Description Banner -->
          <div class="p-4 rounded-2xl bg-purple-50/40 border border-purple-100/70 flex items-start gap-3">
            <span class="text-base text-purple-600 shrink-0 mt-0.5">ℹ️</span>
            <p class="text-xs text-purple-950/80 leading-relaxed">
              Estas instrucciones definen el comportamiento de Luna en WhatsApp. La IA combina automáticamente este prompt maestro con los productos del catálogo, stock en tiempo real y las políticas oficiales de la empresa.
            </p>
          </div>

          <!-- Textarea Section with Live Counter -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-zinc-700 font-bold text-xs">Instrucciones del Sistema para el Modelo</label>
              <span class="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">{{ config.systemPrompt ? config.systemPrompt.length : 0 }} caracteres</span>
            </div>
            <textarea
              rows="7"
              [(ngModel)]="config.systemPrompt"
              class="input-bento text-xs font-mono leading-relaxed p-4 rounded-2xl w-full border-zinc-200 focus:border-purple-500 focus:ring-purple-500/20"
              placeholder="Instrucciones del sistema para el modelo de IA..."
            ></textarea>
          </div>

          <!-- Footer Tips -->
          <div class="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
            <span class="flex items-center gap-1.5">
              <span>💡</span>
              <span>Consejo: Mantén las directrices claras para respuestas concisas y certeras en WhatsApp.</span>
            </span>
          </div>
        </div>
      </app-bento-card>

      <!-- ========================================================================= -->
      <!-- SECCIONES COMENTADAS SEGÚN REQUERIMIENTO DEL USUARIO                      -->
      <!-- 1. Parámetros del Motor IA                                               -->
      <!-- 2. Protección Anti-Ban de Baileys                                        -->
      <!-- ========================================================================= -->

      <!--
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <app-bento-card>
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
            <span class="text-base">⚡</span>
            <h4 class="font-bold text-zinc-900 text-sm">Parámetros del Motor IA</h4>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Modelo OpenAI</label>
              <select [(ngModel)]="config.aiModel" class="input-bento text-xs font-semibold">
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Ultra Rápido & Económico - Recomendado)</option>
                <option value="gpt-4o">OpenAI GPT-4o (Máxima Capacidad & Inteligencia)</option>
                <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
              </select>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">Temperatura (Creatividad)</label>
                <span class="font-mono font-bold text-zinc-900">{{ config.aiTemperature }}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                [(ngModel)]="config.aiTemperature"
                class="w-full accent-indigo-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-zinc-400 font-mono mt-0.5">
                <span>0.0 (Preciso)</span>
                <span>0.7 (Balanceado)</span>
                <span>1.0 (Creativo)</span>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">Memoria de Conversación (Historial)</label>
                <span class="font-mono font-bold text-zinc-900">{{ config.historyMessageLimit }} mensajes</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                [(ngModel)]="config.historyMessageLimit"
                class="w-full accent-indigo-600 cursor-pointer"
              />
              <p class="text-[10px] text-zinc-400 mt-0.5">Cantidad de mensajes previos retenidos para mantener el contexto del hilo.</p>
            </div>
          </div>
        </app-bento-card>

        <app-bento-card>
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
            <span class="text-base">🛡️</span>
            <h4 class="font-bold text-zinc-900 text-sm">Protección Anti-Ban de Baileys</h4>
          </div>

          <div class="space-y-4 text-xs">
            <div class="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-900 space-y-1">
              <div class="font-bold flex items-center gap-1.5">
                <span>✨ Simulación de Comportamiento Humano</span>
              </div>
              <p class="text-[11px] text-emerald-800 leading-relaxed">
                Evita bloqueos de WhatsApp enviando eventos de presencia <i>"escribiendo..."</i> y aplicando pausas aleatorias antes de responder.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3.5">
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Delay Mínimo (ms)</label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  [(ngModel)]="config.antiBanDelayMinMs"
                  class="input-bento text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Delay Máximo (ms)</label>
                <input
                  type="number"
                  min="1000"
                  max="15000"
                  step="500"
                  [(ngModel)]="config.antiBanDelayMaxMs"
                  class="input-bento text-xs font-mono font-bold"
                />
              </div>
            </div>
            <p class="text-[10px] text-zinc-400 font-mono">Recomendado: 1500ms - 3500ms para emular digitación natural.</p>
          </div>
        </app-bento-card>

      </div>
      -->

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- MODAL SIMULADOR DE VISTA PREVIA EN VIVO                                    -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      @if (showPreviewModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-fade-in">
          <div class="w-full max-w-6xl h-[92vh] bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-white">
            
            <!-- Modal Header -->
            <div class="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-white leading-tight">Simulador de Tienda en Vivo</h3>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">
                      /tienda/{{ tenantSlug() }}
                    </span>
                  </div>
                  <p class="text-[11px] text-zinc-400 hidden sm:block">Previsualización interactiva con catálogo, carrito y pedidos</p>
                </div>
              </div>

              <!-- Device Switcher -->
              <div class="flex items-center bg-zinc-800/90 p-1 rounded-xl border border-zinc-700/80">
                <button
                  type="button"
                  (click)="previewDevice.set('mobile')"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  [class]="previewDevice() === 'mobile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'"
                >
                  <span>📱</span>
                  <span class="hidden sm:inline">Móvil (390px)</span>
                </button>
                <button
                  type="button"
                  (click)="previewDevice.set('desktop')"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  [class]="previewDevice() === 'desktop' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'"
                >
                  <span>💻</span>
                  <span class="hidden sm:inline">Escritorio</span>
                </button>
              </div>

              <!-- Action Tools -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="refreshPreview()"
                  title="Recargar vista previa"
                  class="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                <a
                  [href]="'/tienda/' + tenantSlug()"
                  target="_blank"
                  title="Abrir en pestaña nueva"
                  class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                >
                  <span>Abrir Tienda</span>
                  <span>↗</span>
                </a>

                <button
                  type="button"
                  (click)="closePreview()"
                  class="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Modal Body Simulator -->
            <div class="flex-1 bg-zinc-950 p-3 sm:p-6 overflow-hidden flex items-center justify-center">
              @if (previewDevice() === 'mobile') {
                <!-- Mobile Phone Frame -->
                <div class="w-[390px] h-full max-h-[760px] bg-zinc-900 rounded-[48px] p-3 border-4 border-zinc-700 shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-white/10">
                  <!-- Dynamic Island / Speaker Notch -->
                  <div class="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-end px-3">
                    <div class="w-2.5 h-2.5 rounded-full bg-blue-950 border border-blue-900/50"></div>
                  </div>
                  <!-- Mobile Display Screen -->
                  <div class="w-full h-full rounded-[38px] overflow-hidden bg-white">
                    <iframe
                      [src]="previewSafeUrl()"
                      class="w-full h-full border-none"
                      title="Vista previa móvil de la tienda"
                    ></iframe>
                  </div>
                </div>
              } @else {
                <!-- Desktop Frame -->
                <div class="w-full h-full rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
                  <!-- Browser Bar -->
                  <div class="px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/60 flex items-center gap-2">
                    <div class="flex items-center gap-1.5">
                      <div class="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    </div>
                    <div class="flex-1 max-w-md mx-auto px-3 py-1 rounded-lg bg-zinc-900/80 text-[11px] font-mono text-zinc-400 text-center truncate border border-zinc-700/40">
                      http://localhost:4200/tienda/{{ tenantSlug() }}
                    </div>
                  </div>
                  <div class="flex-1 w-full bg-white overflow-hidden">
                    <iframe
                      [src]="previewSafeUrl()"
                      class="w-full h-full border-none"
                      title="Vista previa desktop de la tienda"
                    ></iframe>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private tenantsService = inject(TenantsService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private toast = inject(ToastService);

  @ViewChild(StoreThemeComponent) storeThemeComponent?: StoreThemeComponent;

  isSaving = signal(false);
  showSuccessToast = signal(false);
  showPreviewModal = signal(false);
  previewDevice = signal<'mobile' | 'desktop'>('mobile');
  tenantSlug = signal<string>('wsp-tech');
  previewKey = signal<number>(Date.now());

  // Mercado Pago State
  tenantData = signal<Tenant | null>(null);
  mpPublicKeyModel = '';
  mpAccessTokenModel = '';
  isConnectingMp = signal(false);
  isDisconnectingMp = signal(false);
  isMpConnected = computed(() => !!(this.tenantData()?.mpAccessToken || this.tenantData()?.mpConnectedAt || this.mpAccessTokenModel));

  previewSafeUrl = computed<SafeResourceUrl>(() => {
    const slug = this.tenantSlug() || 'wsp-tech';
    const key = this.previewKey();
    return this.sanitizer.bypassSecurityTrustResourceUrl(`/tienda/${slug}?v=${key}`);
  });

  openPreview() {
    this.previewKey.set(Date.now());
    this.showPreviewModal.set(true);
  }

  closePreview() {
    this.showPreviewModal.set(false);
  }

  refreshPreview() {
    this.previewKey.set(Date.now());
    this.toast.info('Vista previa actualizada.');
  }

  config: CompanyConfig = {
    companyName: 'WSP Flow Commerce',
    businessDescription: 'Tienda digital multirubro de comercio electrónico con atención y ventas 24/7.',
    systemPrompt:
      'Eres Luna, la asesora comercial y asistente virtual de ventas experta de WSP Flow. Tu objetivo es atender a los clientes con calidez y precisión, responder dudas sobre productos, verificar stock real, enviar fotos o videos cuando lo soliciten y concretar pedidos de compra de forma fluida.',
    shippingPolicy: 'Envíos express a todo el país en 24 a 48 horas hábiles.',
    paymentMethods: 'Transferencia bancaria, tarjetas de crédito/débito y pago contra entrega.',
    workingHours: 'Lunes a Sábado de 09:00 a 20:00',
    address: 'Av. Principal 1234, Centro',
    pickupStoreAddress: 'Av. Larco 743, Miraflores, Lima',
    pickupStoreHours: 'Lunes a Sábados de 09:00 a 20:00',
    deliveryZone1Price: 10.0,
    deliveryZone2Price: 15.0,
    deliveryZone3Price: 20.0,
    deliveryProvincePrice: 15.0,
    freeShippingThreshold: 0.0,
    aiModel: 'gpt-4o-mini',
    aiTemperature: 0.7,
    antiBanDelayMinMs: 1500,
    antiBanDelayMaxMs: 3500,
    historyMessageLimit: 15,
  };

  ngOnInit() {
    this.loadSettings();

    // Check Mercado Pago OAuth callback query params
    const mpConnected = this.route.snapshot.queryParamMap.get('mp_connected');
    const mpError = this.route.snapshot.queryParamMap.get('mp_error');
    if (mpConnected === 'true') {
      this.toast.success('¡Tu cuenta de Mercado Pago ha sido vinculada con éxito!', 'Pasarela Conectada');
    } else if (mpError) {
      this.toast.error(`Error al vincular Mercado Pago: ${mpError}`, 'Error OAuth');
    }

    this.tenantsService.getCurrentTenant().subscribe({
      next: (t) => {
        if (t) {
          this.tenantData.set(t);
          this.mpPublicKeyModel = t.mpPublicKey || '';
          this.mpAccessTokenModel = t.mpAccessToken || '';
          if (t.slug) {
            this.tenantSlug.set(t.slug);
          }
        }
      },
      error: () => {},
    });
  }

  loadSettings() {
    this.settingsService.getConfig().subscribe({
      next: (data) => {
        if (data) {
          this.config = { ...this.config, ...data };
        }
      },
    });
  }

  connectMercadoPago() {
    this.isConnectingMp.set(true);
    this.tenantsService.getMercadoPagoConnectUrl().subscribe({
      next: (res) => {
        if (res?.authUrl) {
          window.location.href = res.authUrl;
        } else {
          this.isConnectingMp.set(false);
          this.toast.error('No se pudo generar la URL de conexión con Mercado Pago.');
        }
      },
      error: (err) => {
        this.isConnectingMp.set(false);
        this.toast.error(err.error?.message || 'Error al iniciar conexión con Mercado Pago.');
      },
    });
  }

  disconnectMercadoPago() {
    if (!confirm('¿Estás seguro de desvincular tu cuenta de Mercado Pago? Tus clientes no podrán pagar hasta que la reconectes.')) {
      return;
    }
    this.isDisconnectingMp.set(true);
    this.tenantsService.disconnectMercadoPago().subscribe({
      next: () => {
        this.isDisconnectingMp.set(false);
        this.mpPublicKeyModel = '';
        this.mpAccessTokenModel = '';
        this.tenantData.update((curr) =>
          curr
            ? {
                ...curr,
                mpPublicKey: undefined,
                mpAccessToken: undefined,
                mpRefreshToken: undefined,
                mpUserId: undefined,
                mpConnectedAt: undefined,
              }
            : null,
        );
        this.toast.success('Cuenta de Mercado Pago desvinculada.', 'Desconectado');
      },
      error: (err) => {
        this.isDisconnectingMp.set(false);
        this.toast.error(err.error?.message || 'Error al desvincular la cuenta.');
      },
    });
  }

  saveAllSettings() {
    this.isSaving.set(true);

    // 1. Obtener la configuración visual actual del componente de diseño de tienda
    if (this.storeThemeComponent) {
      const finalTheme = this.storeThemeComponent.getCurrentThemeConfig();
      this.config.storeTheme = JSON.stringify(finalTheme);
    }

    // 2. Guardar credenciales de Mercado Pago en el tenant si se modificaron manualmente
    if (
      this.mpPublicKeyModel !== (this.tenantData()?.mpPublicKey || '') ||
      this.mpAccessTokenModel !== (this.tenantData()?.mpAccessToken || '')
    ) {
      this.tenantsService
        .updateCurrentTenant({
          mpPublicKey: this.mpPublicKeyModel,
          mpAccessToken: this.mpAccessTokenModel,
        })
        .subscribe({
          next: (t) => {
            this.tenantData.set(t);
          },
          error: (err) => {
            console.error('Error guardando credenciales Mercado Pago del tenant:', err);
          },
        });
    }

    const { id, createdAt, updatedAt, ...cleanPayload } = this.config;

    this.settingsService.updateConfig(cleanPayload).subscribe({
      next: (updated) => {
        this.config = { ...this.config, ...updated };
        this.isSaving.set(false);
        this.showSuccessToast.set(true);
        if (this.storeThemeComponent && this.config.storeTheme) {
          try {
            const parsed = JSON.parse(this.config.storeTheme);
            this.storeThemeComponent.markAsSaved(parsed);
          } catch {
            this.storeThemeComponent.markAsSaved();
          }
        }
        this.toast.success('¡Configuración de empresa, pasarela y diseño de tienda guardados con éxito!', 'Ajustes Guardados');
        this.previewKey.set(Date.now());
        setTimeout(() => this.showSuccessToast.set(false), 5000);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err.error?.message || 'Error al guardar la configuración.');
      },
    });
  }

  onThemeSaved(theme: StoreThemeConfig) {
    this.config.storeTheme = JSON.stringify(theme);
    this.previewKey.set(Date.now());
  }

  saveSettings() {
    this.saveAllSettings();
  }

  restoreDefaultPrompt() {
    this.config.systemPrompt =
      'Eres Luna, la asesora comercial y asistente virtual de ventas experta de WSP Flow. Tu objetivo es atender a los clientes con calidez y precisión, responder dudas sobre productos, verificar stock real, enviar fotos o videos cuando lo soliciten y concretar pedidos de compra de forma fluida.';
  }
}
