import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { SettingsService } from '../../core/services/settings.service';
import { CompanyConfig } from '../../core/models/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BentoCardComponent],
  template: `
    <app-navbar title="Configuración de IA & Negocio" subtitle="Contexto empresarial, tarifas de delivery y protección Anti-Ban"></app-navbar>

    <div class="space-y-6 mt-6 pb-12 max-w-6xl">
      
      <!-- Top Overview Banner -->
      <div class="p-5 sm:p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-zinc-900 leading-tight">Ajustes de Inteligencia Artificial & Tarifas de Delivery</h3>
            <p class="text-xs text-zinc-500 font-normal mt-0.5">Define cómo Luna atiende a tus clientes, las tarifas de envío oficiales para Perú y la protección Anti-Ban.</p>
          </div>
        </div>

        <button
          (click)="saveSettings()"
          [disabled]="isSaving()"
          class="btn-primary self-stretch sm:self-auto text-xs py-2.5 px-5 font-semibold shrink-0"
        >
          @if (isSaving()) {
            <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Guardando...</span>
          } @else {
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Guardar Configuración</span>
          }
        </button>
      </div>

      <!-- Feedback Success Toast -->
      @if (showSuccessToast()) {
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-sm">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>¡Configuración y tarifas de delivery guardadas con éxito!</span>
          </div>
          <button (click)="showSuccessToast.set(false)" class="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left Column: Business Context & Delivery Pricing (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- 1. Contexto Oficial de la Empresa -->
          <app-bento-card>
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
              <span class="text-base">🏢</span>
              <h4 class="font-bold text-zinc-900 text-sm">Contexto Oficial de la Empresa</h4>
            </div>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Nombre Comercial de la Tienda</label>
                <input type="text" [(ngModel)]="config.companyName" class="input-bento text-xs" placeholder="Ej: WSP Flow Commerce" />
              </div>

              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Rubro y Descripción del Negocio</label>
                <textarea rows="2" [(ngModel)]="config.businessDescription" class="input-bento text-xs" placeholder="Describe qué productos vendes y a quién van dirigidos..."></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Horario de Atención General</label>
                  <input type="text" [(ngModel)]="config.workingHours" class="input-bento text-xs" placeholder="Lunes a Sábado de 09:00 a 20:00" />
                </div>
                <div>
                  <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Dirección / Sede Principal</label>
                  <input type="text" [(ngModel)]="config.address" class="input-bento text-xs" placeholder="Av. Principal 1234, Centro" />
                </div>
              </div>

              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Políticas de Envío y Despacho</label>
                <input type="text" [(ngModel)]="config.shippingPolicy" class="input-bento text-xs" placeholder="Envíos express en 24 a 48 hs hábiles a todo el país..." />
              </div>

              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Métodos de Pago Aceptados</label>
                <input type="text" [(ngModel)]="config.paymentMethods" class="input-bento text-xs" placeholder="Yape, Tarjetas Culqi, transferencia, efectivo contra entrega..." />
              </div>
            </div>
          </app-bento-card>

          <!-- 2. TARIFAS DE DELIVERY & RECOJO EN TIENDA (CONFIGURABLES) -->
          <app-bento-card>
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div class="flex items-center gap-2">
                <span class="text-base">🛵</span>
                <h4 class="font-bold text-zinc-900 text-sm">Tarifas de Delivery & Recojo en Tienda (Soles PEN)</h4>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-100">
                Estrategia Perú
              </span>
            </div>

            <div class="space-y-4 text-xs">
              
              <!-- Recojo en Tienda -->
              <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div class="flex items-center justify-between text-emerald-950 font-bold">
                  <span>🏪 Local de Recojo en Tienda (S/ 0.00 / Gratis)</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label class="block text-zinc-600 font-mono text-[10px] uppercase font-semibold mb-1">Dirección del Local</label>
                    <input type="text" [(ngModel)]="config.pickupStoreAddress" class="input-bento text-xs bg-white" placeholder="Av. Larco 743, Miraflores, Lima" />
                  </div>
                  <div>
                    <label class="block text-zinc-600 font-mono text-[10px] uppercase font-semibold mb-1">Horario de Retiro</label>
                    <input type="text" [(ngModel)]="config.pickupStoreHours" class="input-bento text-xs bg-white" placeholder="Lun a Sáb de 09:00 a 20:00" />
                  </div>
                </div>
              </div>

              <!-- Zonas de Lima & Provincias -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Lima Zona 1: Centro / Moderna (S/.)
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      [(ngModel)]="config.deliveryZone1Price"
                      class="input-bento pl-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <p class="text-[10px] text-zinc-400 mt-1">Miraflores, San Isidro, Surco, San Borja, etc.</p>
                </div>

                <div>
                  <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Lima Zona 2: Norte / Sur / Este (S/.)
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      [(ngModel)]="config.deliveryZone2Price"
                      class="input-bento pl-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <p class="text-[10px] text-zinc-400 mt-1">Los Olivos, SMP, Comas, Chorrillos, SJL, etc.</p>
                </div>

                <div>
                  <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Lima Zona 3 & Callao: Periferia (S/.)
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      [(ngModel)]="config.deliveryZone3Price"
                      class="input-bento pl-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <p class="text-[10px] text-zinc-400 mt-1">Callao, Ventanilla, VES, Lurín, Chosica, etc.</p>
                </div>

                <div>
                  <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Provincias: Agencia Shalom / Marvisur (S/.)
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-zinc-400 font-mono font-bold text-xs">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      [(ngModel)]="config.deliveryProvincePrice"
                      class="input-bento pl-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <p class="text-[10px] text-zinc-400 mt-1">Despacho a agencia con guía de remisión.</p>
                </div>
              </div>

            </div>
          </app-bento-card>

          <!-- 3. System Prompt Editor -->
          <app-bento-card>
            <div class="flex items-center justify-between mb-3 pb-3 border-b border-zinc-100">
              <div class="flex items-center gap-2">
                <span class="text-base">🧠</span>
                <h4 class="font-bold text-zinc-900 text-sm">System Prompt Maestro de Luna</h4>
              </div>
              <button (click)="restoreDefaultPrompt()" class="btn-ghost text-[11px]">
                Restaurar Predeterminado
              </button>
            </div>

            <p class="text-xs text-zinc-500 mb-3 leading-relaxed">
              Estas instrucciones definen la personalidad, tono de voz y directrices de la IA al responder por WhatsApp.
            </p>

            <textarea
              rows="6"
              [(ngModel)]="config.systemPrompt"
              class="input-bento text-xs font-mono leading-relaxed"
              placeholder="Instrucciones del sistema para el modelo de IA..."
            ></textarea>
          </app-bento-card>

        </div>

        <!-- Right Column: AI Model & Anti-Ban Protection (5 cols) -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- AI Engine Tuning -->
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

          <!-- Baileys Anti-Ban Protection Engine -->
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

      </div>

    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  isSaving = signal(false);
  showSuccessToast = signal(false);

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

  saveSettings() {
    this.isSaving.set(true);
    const { id, createdAt, updatedAt, ...cleanPayload } = this.config;

    this.settingsService.updateConfig(cleanPayload).subscribe({
      next: (updated) => {
        this.config = { ...this.config, ...updated };
        this.isSaving.set(false);
        this.showSuccessToast.set(true);
        setTimeout(() => this.showSuccessToast.set(false), 4000);
      },
      error: (err) => {
        this.isSaving.set(false);
        alert(err.error?.message || 'Error al guardar la configuración.');
      },
    });
  }

  restoreDefaultPrompt() {
    this.config.systemPrompt =
      'Eres Luna, la asesora comercial y asistente virtual de ventas experta de WSP Flow. Tu objetivo es atender a los clientes con calidez y precisión, responder dudas sobre productos, verificar stock real, enviar fotos o videos cuando lo soliciten y concretar pedidos de compra de forma fluida.';
  }
}
