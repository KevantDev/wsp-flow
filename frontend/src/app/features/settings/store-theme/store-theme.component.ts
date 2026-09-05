import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { TenantsService } from '../../../core/services/tenants.service';
import { ToastService } from '../../../core/services/toast.service';
import { StoreThemeConfig } from '../../../core/models/models';

interface TemplateDefinition {
  id: 'dark-tech' | 'light-minimal' | 'warm-brand';
  name: string;
  tagline: string;
  category: string;
  idealFor: string;
  badge: string;
  preview: { bg: string; header: string; card: string; accent: string; text: string; subtext: string };
  defaultHeroImage: string;
  defaultPromoImage: string;
  accentOptions: { label: string; value: string; tw: string }[];
  fontOptions: { label: string; value: string }[];
  heroBadgeDefault: string;
  heroTitleDefault: string;
  heroSubtitleDefault: string;
  announcementDefault: string;
}

interface ImagePreset {
  label: string;
  url: string;
  category: string;
}

@Component({
  selector: 'app-store-theme',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">

      <!-- Section Header with Live Store Link -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 class="text-base font-bold text-zinc-900">Diseño de Tienda Web (E-Commerce Landing)</h3>
          </div>
          <p class="text-xs text-zinc-500 mt-1">
            Personaliza la arquitectura de tu tienda online: 3 plantillas de alto impacto, portadas, imágenes, textos y banners.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            (click)="openPreview.emit()"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 text-xs font-bold transition-all shadow-2xs"
          >
            <span>👁️</span>
            <span>Simulador de Vista Previa</span>
          </button>

          @if (tenantSlug()) {
            <a
              [href]="'/tienda/' + tenantSlug()"
              target="_blank"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5"
            >
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Ver Tienda en Vivo ↗</span>
            </a>
          }
        </div>
      </div>

      <!-- Toast Feedback -->
      @if (saveSuccess()) {
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span>¡Diseño y estructura de tienda guardados con éxito! Los cambios ya están activos en tu tienda pública.</span>
          </div>
          <button (click)="saveSuccess.set(false)" class="text-emerald-700 hover:text-emerald-950 font-bold p-1">✕</button>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- 1. SELECTOR DE 3 PLANTILLAS E-COMMERCE                                     -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label class="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
              1. Selecciona el Tipo de Plantilla E-Commerce
            </label>
            <span class="text-[11px] text-zinc-500 font-medium">Al seleccionar una plantilla se activa y aplica automáticamente en tu tienda web</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Activa: {{ activeTemplate().name }}</span>
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          @for (tpl of templates; track tpl.id) {
            <div
              (click)="selectTemplate(tpl.id)"
              class="cursor-pointer rounded-2xl md:rounded-3xl border-2 overflow-hidden transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5"
              [class]="currentTheme().templateId === tpl.id
                ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-600/10 ring-2 ring-indigo-500/25'
                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg'"
            >
              <!-- Mini Mockup Header -->
              <div class="relative h-48 sm:h-52 overflow-hidden p-4 flex flex-col justify-between" [style.background]="tpl.preview.bg">
                <!-- Badges top -->
                <div class="flex items-center justify-between z-10">
                  <span class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide text-white shadow-xs"
                        [style.background]="tpl.preview.accent">
                    {{ tpl.badge }}
                  </span>
                  @if (currentTheme().templateId === tpl.id) {
                    <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  }
                </div>

                <!-- Realistic Mockup Graphic -->
                <div class="my-auto space-y-2.5 z-10">
                  <!-- Navbar wireframe -->
                  <div class="h-6 rounded-xl px-2.5 flex items-center justify-between shadow-xs" [style.background]="tpl.preview.header">
                    <div class="w-2.5 h-2.5 rounded-full" [style.background]="tpl.preview.accent"></div>
                    <div class="w-14 h-1.5 rounded-full opacity-60" [style.background]="tpl.preview.text"></div>
                    <div class="w-5 h-2.5 rounded" [style.background]="tpl.preview.accent"></div>
                  </div>

                  <!-- Hero wireframe -->
                  <div class="p-2.5 rounded-xl border flex items-center gap-2.5"
                       [style.background]="tpl.preview.card"
                       [style.border-color]="tpl.preview.accent + '33'">
                    <div class="flex-1 space-y-1.5">
                      <div class="h-2 w-3/4 rounded-full" [style.background]="tpl.preview.text"></div>
                      <div class="h-1.5 w-1/2 rounded-full opacity-60" [style.background]="tpl.preview.subtext"></div>
                      <div class="h-3.5 w-14 rounded-md mt-1" [style.background]="tpl.preview.accent"></div>
                    </div>
                    <div class="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/10"
                         [style.background]="tpl.preview.accent + '22'">
                      <img [src]="tpl.defaultHeroImage" class="w-full h-full object-cover opacity-85" />
                    </div>
                  </div>

                  <!-- Product grid wireframe -->
                  <div class="grid grid-cols-3 gap-1.5">
                    @for (item of [1, 2, 3]; track item) {
                      <div class="h-9 rounded-lg p-1.5 flex flex-col justify-between" [style.background]="tpl.preview.card">
                        <div class="h-3 w-full rounded" [style.background]="tpl.preview.accent + '25'"></div>
                        <div class="h-1 w-2/3 rounded-full opacity-70" [style.background]="tpl.preview.text"></div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Subtle Decorative Gradient -->
                <div class="absolute inset-0 opacity-10 bg-radial from-white to-transparent pointer-events-none"></div>
              </div>

              <!-- Template Info Footer -->
              <div class="p-5 bg-white border-t border-zinc-100 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div class="flex items-center justify-between">
                    <h4 class="font-bold text-sm text-zinc-900 leading-tight">{{ tpl.name }}</h4>
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                      {{ tpl.category }}
                    </span>
                  </div>
                  <p class="text-xs text-zinc-500 font-normal mt-1 leading-relaxed">{{ tpl.tagline }}</p>
                </div>
                <div class="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <span class="text-zinc-400">Ideal: <strong class="text-zinc-600">{{ tpl.idealFor }}</strong></span>
                  @if (currentTheme().templateId === tpl.id) {
                    <div class="flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="openPreview.emit(); $event.stopPropagation()"
                        class="text-[10px] font-bold text-zinc-600 hover:text-indigo-600 px-2 py-0.5 rounded-md hover:bg-zinc-100 flex items-center gap-1 border border-zinc-200 transition-colors"
                        title="Ver en simulador interactivo"
                      >
                        <span>👁️</span>
                        <span>Ver</span>
                      </button>
                      <span class="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
                        <span>✓</span>
                        <span>Activa</span>
                      </span>
                    </div>
                  } @else {
                    <span class="text-indigo-600 group-hover:text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 group-hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1 rounded-lg transition-all">
                      <span>Activar Plantilla →</span>
                    </span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- 2. PESTAÑAS DE CONFIGURACIÓN AVANZADA (Landing, Textos, Imágenes, Estilos)   -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div class="space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label class="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
              2. Personalización Visual de la Plantilla
            </label>
            <span class="text-[11px] text-zinc-500 font-medium">Ajusta la paleta de colores, tipografías, banners y beneficios de tu tienda</span>
          </div>
        </div>

        <!-- Modern Segmented Tabs Bar -->
        <div class="p-1.5 bg-zinc-100/90 rounded-2xl flex items-center gap-1.5 overflow-x-auto border border-zinc-200/60">
          <button
            (click)="activeTab.set('style')"
            type="button"
            class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
            [class]="activeTab() === 'style'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'"
          >
            <span>🎨</span>
            <span>Estilo & Tipografía</span>
          </button>

          <button
            (click)="activeTab.set('hero')"
            type="button"
            class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
            [class]="activeTab() === 'hero'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'"
          >
            <span>🖼️</span>
            <span>Portada & Hero</span>
          </button>

          <button
            (click)="activeTab.set('banners')"
            type="button"
            class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
            [class]="activeTab() === 'banners'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'"
          >
            <span>📢</span>
            <span>Beneficios & FAQ</span>
          </button>

          <button
            (click)="activeTab.set('preview')"
            type="button"
            class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ml-auto"
            [class]="activeTab() === 'preview'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'"
          >
            <span>👁️</span>
            <span>Previsualizador</span>
          </button>
        </div>

        <div class="rounded-2xl md:rounded-3xl border border-zinc-200/90 bg-white overflow-hidden shadow-xs">
          <!-- Tab 1: Estilo, Colores & Tipografía -->
          @if (activeTab() === 'style') {
            <div class="p-6 sm:p-8 space-y-7">
            <!-- Accent Color -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold text-zinc-700 uppercase tracking-wide">Color de Acento de Marca</label>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono text-zinc-500">{{ currentTheme().accentColor }}</span>
                  <input
                    type="color"
                    [value]="currentTheme().accentColor"
                    (input)="onCustomColorChange($event)"
                    class="w-6 h-6 p-0 border border-zinc-300 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div class="flex flex-wrap gap-2.5">
                @for (opt of activeTemplate().accentOptions; track opt.value) {
                  <button
                    (click)="setAccentColor(opt.value)"
                    type="button"
                    class="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all"
                    [class]="currentTheme().accentColor === opt.value
                      ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'"
                  >
                    <span class="w-4 h-4 rounded-full ring-2 ring-white shadow-xs" [style.background]="opt.value"></span>
                    <span class="text-zinc-800">{{ opt.label }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Typography & Product Layout -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <!-- Font Family -->
              <div>
                <label class="text-xs font-bold text-zinc-700 uppercase tracking-wide block mb-2">Tipografía Principal</label>
                <div class="grid grid-cols-2 gap-2">
                  @for (font of fontFamilies; track font.value) {
                    <button
                      (click)="setFont(font.value)"
                      type="button"
                      class="px-3.5 py-2.5 rounded-xl border text-xs text-left transition-all"
                      [class]="currentTheme().fontFamily === font.value
                        ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'"
                    >
                      <div class="font-bold text-xs" [style.font-family]="font.font">{{ font.label }}</div>
                      <div class="text-[10px] text-zinc-400 mt-0.5">{{ font.desc }}</div>
                    </button>
                  }
                </div>
              </div>

              <!-- Product Grid Layout -->
              <div>
                <label class="text-xs font-bold text-zinc-700 uppercase tracking-wide block mb-2">Distribución de Productos</label>
                <div class="grid grid-cols-2 gap-2">
                  @for (layout of productLayouts; track layout.value) {
                    <button
                      (click)="setLayout(layout.value)"
                      type="button"
                      class="p-2.5 rounded-xl border text-xs text-left transition-all"
                      [class]="currentTheme().productLayout === layout.value
                        ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'"
                    >
                      <div class="font-bold text-xs flex items-center gap-1.5">
                        <span>{{ layout.icon }}</span>
                        <span>{{ layout.label }}</span>
                      </div>
                      <div class="text-[10px] text-zinc-400 mt-0.5">{{ layout.desc }}</div>
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Buying Mode -->
            <div class="pt-4 border-t border-zinc-100">
              <label class="text-xs font-bold text-zinc-700 uppercase tracking-wide block mb-2">Modo de Compra & Experiencia</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  (click)="setPurchaseMode('both')"
                  class="p-3 rounded-xl border text-left transition-all"
                  [class]="(currentTheme().purchaseMode || 'both') === 'both'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'"
                >
                  <div class="text-xs font-bold text-zinc-900">Híbrido (Recomendado)</div>
                  <div class="text-[11px] text-zinc-500 mt-0.5">Carrito web + botón directo de WhatsApp en cada producto.</div>
                </button>
                <button
                  type="button"
                  (click)="setPurchaseMode('whatsapp')"
                  class="p-3 rounded-xl border text-left transition-all"
                  [class]="currentTheme().purchaseMode === 'whatsapp'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'"
                >
                  <div class="text-xs font-bold text-zinc-900">Directo a WhatsApp</div>
                  <div class="text-[11px] text-zinc-500 mt-0.5">Todas las compras abren chat con mensaje prearmado.</div>
                </button>
                <button
                  type="button"
                  (click)="setPurchaseMode('cart')"
                  class="p-3 rounded-xl border text-left transition-all"
                  [class]="currentTheme().purchaseMode === 'cart'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'"
                >
                  <div class="text-xs font-bold text-zinc-900">Carrito E-Commerce</div>
                  <div class="text-[11px] text-zinc-500 mt-0.5">Los clientes arman pedido multi-item y luego despachan.</div>
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Tab 2: Portada, Textos & Hero -->
        @if (activeTab() === 'hero') {
          <div class="p-6 space-y-6">
            <!-- Announcement Bar -->
            <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-sm">📢</span>
                  <span class="text-xs font-bold text-zinc-800">Barra Superior de Anuncios (Ticker Bar)</span>
                </div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    [checked]="currentTheme().showAnnouncement !== false"
                    (change)="toggleAnnouncement($event)"
                    class="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span class="text-xs text-zinc-600 font-medium">Mostrar Barra</span>
                </label>
              </div>
              <input
                type="text"
                [(ngModel)]="themeAnnouncementText"
                (ngModelChange)="onFieldChange('announcementText', $event)"
                class="input-bento text-xs"
                placeholder="Ej: 🚚 ¡Envíos a todo el Perú en 24h! • 💬 Atención y pedidos automáticos por WhatsApp"
              />
            </div>

            <!-- Hero Texts -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-zinc-700 uppercase tracking-wide">Textos Principales del Hero Landing</h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-zinc-600 mb-1">Insignia / Badge Superior</label>
                  <input
                    type="text"
                    [(ngModel)]="themeHeroBadge"
                    (ngModelChange)="onFieldChange('heroBadge', $event)"
                    class="input-bento text-xs"
                    placeholder="Ej: ⚡ Catálogo Oficial 2026 / Edición Limitada"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-600 mb-1">Título Principal (Headline)</label>
                  <input
                    type="text"
                    [(ngModel)]="themeHeroTitle"
                    (ngModelChange)="onFieldChange('heroTitle', $event)"
                    class="input-bento text-xs font-bold"
                    placeholder="Ej: Lo Mejor en Tecnología Directo a tu Puerta"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-zinc-600 mb-1">Subtítulo / Propuesta de Valor</label>
                <textarea
                  rows="2"
                  [(ngModel)]="themeHeroSubtitle"
                  (ngModelChange)="onFieldChange('heroSubtitle', $event)"
                  class="input-bento text-xs leading-relaxed"
                  placeholder="Ej: Descubre nuestros productos con garantía oficial, despacho express y asesoría 24/7 por WhatsApp."
                ></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-zinc-600 mb-1">Texto Botón Primario (CTA)</label>
                  <input
                    type="text"
                    [(ngModel)]="themeHeroCtaText"
                    (ngModelChange)="onFieldChange('heroCtaText', $event)"
                    class="input-bento text-xs"
                    placeholder="Ej: Explorar Catálogo"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-600 mb-1">Texto Botón Secundario (WhatsApp)</label>
                  <input
                    type="text"
                    [(ngModel)]="themeHeroSecondaryCtaText"
                    (ngModelChange)="onFieldChange('heroSecondaryCtaText', $event)"
                    class="input-bento text-xs"
                    placeholder="Ej: Hablar con Asistente IA"
                  />
                </div>
              </div>
            </div>

            <!-- Hero Banner Image -->
            <div class="pt-4 border-t border-zinc-100 space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-zinc-700 uppercase tracking-wide">Imagen de Portada / Banner Hero</label>
                <span class="text-[11px] text-zinc-500">Usa URL o elige un preset</span>
              </div>

              <div class="flex items-center gap-3">
                <input
                  type="text"
                  [(ngModel)]="themeHeroBannerUrl"
                  (ngModelChange)="onFieldChange('heroBannerUrl', $event)"
                  class="input-bento text-xs flex-1"
                  placeholder="https://images.unsplash.com/..."
                />
                @if (themeHeroBannerUrl) {
                  <div class="w-10 h-10 rounded-xl overflow-hidden border border-zinc-200 shrink-0">
                    <img [src]="themeHeroBannerUrl" class="w-full h-full object-cover" />
                  </div>
                }
              </div>

              <!-- Presets Gallery -->
              <div>
                <p class="text-[11px] font-semibold text-zinc-500 mb-2">Banners Profesionales de Alta Resolución (1-Clic):</p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  @for (preset of heroImagePresets; track preset.url) {
                    <button
                      type="button"
                      (click)="setHeroImage(preset.url)"
                      class="group relative h-16 rounded-xl overflow-hidden border-2 text-left transition-all"
                      [class]="currentTheme().heroBannerUrl === preset.url ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-zinc-200 hover:border-zinc-400'"
                    >
                      <img [src]="preset.url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-1.5">
                        <span class="text-[10px] font-bold text-white leading-tight drop-shadow">{{ preset.label }}</span>
                      </div>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Tab 3: Banners, Beneficios & FAQ -->
        @if (activeTab() === 'banners') {
          <div class="p-6 space-y-6">
            <!-- 4 Trust Badges -->
            <div>
              <h4 class="text-xs font-bold text-zinc-700 uppercase tracking-wide mb-3">
                4 Pilares de Confianza (Trust Strip de E-Commerce)
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <!-- Pillar 1 -->
                <div class="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
                  <div class="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                    <span>🚚</span> <span>Beneficio 1: Despacho</span>
                  </div>
                  <input
                    type="text"
                    [(ngModel)]="themeTrustBadge1Title"
                    (ngModelChange)="onFieldChange('trustBadge1Title', $event)"
                    class="input-bento text-xs font-bold"
                    placeholder="Ej: Despacho Express 24h"
                  />
                  <input
                    type="text"
                    [(ngModel)]="themeTrustBadge1Desc"
                    (ngModelChange)="onFieldChange('trustBadge1Desc', $event)"
                    class="input-bento text-[11px]"
                    placeholder="Ej: Entregas rápidas a Lima y provincias"
                  />
                </div>

                <!-- Pillar 2 -->
                <div class="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
                  <div class="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                    <span>🛡️</span> <span>Beneficio 2: Garantía</span>
                  </div>
                  <input
                    type="text"
                    [(ngModel)]="themeTrustBadge2Title"
                    (ngModelChange)="onFieldChange('trustBadge2Title', $event)"
                    class="input-bento text-xs font-bold"
                    placeholder="Ej: Garantía Oficial 100%"
                  />
                  <input
                    type="text"
                    [(ngModel)]="themeTrustBadge2Desc"
                    (ngModelChange)="onFieldChange('trustBadge2Desc', $event)"
                    class="input-bento text-[11px]"
                    placeholder="Ej: Productos nuevos y certificados"
                  />
                </div>

                <!-- Pillar 3 -->
                <div class="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
                  <div class="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                    <span>💬</span> <span>Beneficio 3: Atención WhatsApp</span>
                  </div>
                  <input
                    type="text"
                    [(ngModel)]="themeTrustBadge3Title"
                    (ngModelChange)="onFieldChange('trustBadge3Title', $event)"
                    class="input-bento text-xs font-bold"
                    placeholder="Ej: Atención IA 24/7"
                  />
                  <input
                    type="text"
                    [(ngModel)]="themeTrustBadge3Desc"
                    (ngModelChange)="onFieldChange('trustBadge3Desc', $event)"
                    class="input-bento text-[11px]"
                    placeholder="Ej: Asistente virtual y equipo humano"
                  />
                </div>

                <!-- Pillar 4 -->
                <div class="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
                  <div class="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                    <span>💳</span> <span>Beneficio 4: Pagos</span>
                  </div>
                  <input
                    type="text"
                    [(ngModel)]="themeTrustBadge4Title"
                    (ngModelChange)="onFieldChange('trustBadge4Title', $event)"
                    class="input-bento text-xs font-bold"
                    placeholder="Ej: Pagos 100% Seguros"
                  />
                  <input
                    type="text"
                    [(ngModel)]="themeTrustBadge4Desc"
                    (ngModelChange)="onFieldChange('trustBadge4Desc', $event)"
                    class="input-bento text-[11px]"
                    placeholder="Ej: Yape, Plin, Tarjetas y contra entrega"
                  />
                </div>
              </div>
            </div>

            <!-- Promotional Banner -->
            <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-sm">🎯</span>
                  <h4 class="text-xs font-bold text-zinc-800">Banner Promocional Intermedio</h4>
                </div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    [checked]="currentTheme().promoBannerActive !== false"
                    (change)="togglePromoBanner($event)"
                    class="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span class="text-xs text-zinc-600 font-medium">Activar Banner</span>
                </label>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-600 mb-1">Badge / Descuento</label>
                  <input
                    type="text"
                    [(ngModel)]="themePromoBadge"
                    (ngModelChange)="onFieldChange('promoBadge', $event)"
                    class="input-bento text-xs"
                    placeholder="Ej: ⚡ OFERTA LIMITADA"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-600 mb-1">Título de la Promo</label>
                  <input
                    type="text"
                    [(ngModel)]="themePromoTitle"
                    (ngModelChange)="onFieldChange('promoTitle', $event)"
                    class="input-bento text-xs font-bold"
                    placeholder="Ej: Hasta 30% OFF en Combos Seleccionados"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-600 mb-1">Texto del Botón</label>
                  <input
                    type="text"
                    [(ngModel)]="themePromoCtaText"
                    (ngModelChange)="onFieldChange('promoCtaText', $event)"
                    class="input-bento text-xs"
                    placeholder="Ej: Aprovechar Oferta"
                  />
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-600 mb-1">Descripción de la Promo</label>
                <input
                  type="text"
                  [(ngModel)]="themePromoSubtitle"
                  (ngModelChange)="onFieldChange('promoSubtitle', $event)"
                  class="input-bento text-xs"
                  placeholder="Ej: Pide directamente por WhatsApp y llévate envío gratis con tu compra hoy."
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-600 mb-1">Imagen del Banner Promocional</label>
                <input
                  type="text"
                  [(ngModel)]="themePromoImageUrl"
                  (ngModelChange)="onFieldChange('promoImageUrl', $event)"
                  class="input-bento text-xs"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <!-- Toggles for Social Proof & FAQ -->
            <div class="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label class="p-3.5 rounded-xl border border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-50">
                <div>
                  <div class="text-xs font-bold text-zinc-800">Sección de Reseñas / Testimonios</div>
                  <div class="text-[11px] text-zinc-500">Muestra opiniones verificadas de clientes con 5 estrellas.</div>
                </div>
                <input
                  type="checkbox"
                  [checked]="currentTheme().showReviews !== false"
                  (change)="toggleField('showReviews', $event)"
                  class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>

              <label class="p-3.5 rounded-xl border border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-50">
                <div>
                  <div class="text-xs font-bold text-zinc-800">Preguntas Frecuentes (FAQ)</div>
                  <div class="text-[11px] text-zinc-500">Acordeón interactivo con dudas de envíos, pagos y compras.</div>
                </div>
                <input
                  type="checkbox"
                  [checked]="currentTheme().showFaq !== false"
                  (change)="toggleField('showFaq', $event)"
                  class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        }

        <!-- Tab 4: Vista Previa en Vivo -->
        @if (activeTab() === 'preview') {
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 class="text-xs font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Previsualizador en Tiempo Real</span>
                </h4>
                <p class="text-[11px] text-zinc-500">Así es exactamente como los clientes verán la portada de tu tienda online</p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="openPreview.emit()"
                  class="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
                >
                  <span>📱</span>
                  <span>Abrir en Simulador Móvil / PC</span>
                </button>

                @if (tenantSlug()) {
                  <a
                    [href]="'/tienda/' + tenantSlug()"
                    target="_blank"
                    class="btn-secondary text-xs py-2 px-3 flex items-center gap-1 border border-zinc-200"
                  >
                    <span>Pantalla completa</span>
                    <span>↗</span>
                  </a>
                }
              </div>
            </div>

            <!-- Live Mockup Container -->
            <div class="rounded-2xl border border-zinc-300 overflow-hidden shadow-md text-slate-800 transition-all duration-300"
                 [style.background]="getPreviewBackground()">

              <!-- Mini Announcement -->
              @if (currentTheme().showAnnouncement !== false) {
                <div class="py-1.5 px-4 text-center text-[10px] font-bold text-white"
                     [style.background]="currentTheme().accentColor">
                  {{ currentTheme().announcementText || activeTemplate().announcementDefault }}
                </div>
              }

              <!-- Mini Header -->
              <div class="px-5 py-3 border-b flex items-center justify-between"
                   [style.background]="activeTemplate().preview.header"
                   [style.border-color]="currentTheme().templateId === 'dark-tech' ? '#1e293b' : '#f1f5f9'">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs"
                       [style.background]="currentTheme().accentColor">
                    W
                  </div>
                  <div>
                    <div class="text-xs font-bold leading-none"
                         [style.color]="activeTemplate().preview.text">
                      Mi Tienda Oficial
                    </div>
                    <div class="text-[9px] mt-0.5 flex items-center gap-1" [style.color]="currentTheme().accentColor">
                      <span class="w-1.5 h-1.5 rounded-full animate-pulse" [style.background]="currentTheme().accentColor"></span>
                      En línea • WhatsApp Bot IA
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <div class="px-3 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5"
                       [style.border-color]="currentTheme().templateId === 'dark-tech' ? '#334155' : '#e2e8f0'"
                       [style.color]="activeTemplate().preview.text">
                    🛒 Carrito (2)
                  </div>
                </div>
              </div>

              <!-- Mini Hero -->
              <div class="p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="max-w-md space-y-2 z-10 text-center md:text-left">
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white"
                        [style.background]="currentTheme().accentColor">
                    {{ currentTheme().heroBadge || activeTemplate().heroBadgeDefault }}
                  </span>
                  <h3 class="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight"
                      [style.color]="activeTemplate().preview.text">
                    {{ currentTheme().heroTitle || activeTemplate().heroTitleDefault }}
                  </h3>
                  <p class="text-xs leading-relaxed opacity-80"
                     [style.color]="activeTemplate().preview.subtext">
                    {{ currentTheme().heroSubtitle || activeTemplate().heroSubtitleDefault }}
                  </p>
                  <div class="flex items-center gap-2 pt-2 justify-center md:justify-start">
                    <button class="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-sm"
                            [style.background]="currentTheme().accentColor">
                      {{ currentTheme().heroCtaText || 'Explorar Catálogo' }}
                    </button>
                    <button class="px-3.5 py-2 rounded-xl font-semibold text-xs border"
                            [style.border-color]="currentTheme().templateId === 'dark-tech' ? '#334155' : '#d4d4d8'"
                            [style.color]="activeTemplate().preview.text">
                      {{ currentTheme().heroSecondaryCtaText || 'WhatsApp' }}
                    </button>
                  </div>
                </div>

                <!-- Mini Hero Image -->
                <div class="w-full md:w-56 h-36 rounded-2xl overflow-hidden shadow-lg shrink-0 border"
                     [style.border-color]="currentTheme().templateId === 'dark-tech' ? '#334155' : '#e2e8f0'">
                  <img [src]="getHeroImageUrl()" class="w-full h-full object-cover" />
                </div>
              </div>

              <!-- Mini Trust Strip -->
              <div class="px-6 py-3 border-y grid grid-cols-2 sm:grid-cols-4 gap-3 text-center"
                   [style.background]="activeTemplate().preview.card"
                   [style.border-color]="currentTheme().templateId === 'dark-tech' ? '#1e293b' : '#f1f5f9'">
                <div>
                  <div class="text-[11px] font-bold" [style.color]="activeTemplate().preview.text">
                    {{ currentTheme().trustBadge1Title || '🚚 Despacho Express' }}
                  </div>
                  <div class="text-[9px] opacity-70" [style.color]="activeTemplate().preview.subtext">En 24h a todo el país</div>
                </div>
                <div>
                  <div class="text-[11px] font-bold" [style.color]="activeTemplate().preview.text">
                    {{ currentTheme().trustBadge2Title || '🛡️ Garantía Oficial' }}
                  </div>
                  <div class="text-[9px] opacity-70" [style.color]="activeTemplate().preview.subtext">100% Calidad probada</div>
                </div>
                <div>
                  <div class="text-[11px] font-bold" [style.color]="activeTemplate().preview.text">
                    {{ currentTheme().trustBadge3Title || '💬 Soporte WhatsApp' }}
                  </div>
                  <div class="text-[9px] opacity-70" [style.color]="activeTemplate().preview.subtext">Asistente IA 24/7</div>
                </div>
                <div>
                  <div class="text-[11px] font-bold" [style.color]="activeTemplate().preview.text">
                    {{ currentTheme().trustBadge4Title || '💳 Pagos Seguros' }}
                  </div>
                  <div class="text-[9px] opacity-70" [style.color]="activeTemplate().preview.subtext">Yape, Plin y Tarjetas</div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Bottom Action Bar -->
        <div class="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs text-zinc-500">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Plantilla activa: <strong class="text-zinc-800">{{ activeTemplate().name }}</strong></span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-[11px] text-zinc-400 font-medium hidden sm:inline-flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Los cambios de diseño se guardan con el botón principal superior</span>
            </span>

            @if (tenantSlug()) {
              <a
                [href]="'/tienda/' + tenantSlug()"
                target="_blank"
                class="btn-secondary text-xs py-2 px-3.5"
              >
                Abrir Tienda en Vivo ↗
              </a>
            }
          </div>
        </div>
      </div>
    </div>

  </div>
  `,
})
export class StoreThemeComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private tenantsService = inject(TenantsService);
  private toast = inject(ToastService);

  @Input() set themeJson(value: string | undefined) {
    if (value) {
      try {
        const parsed = JSON.parse(value) as StoreThemeConfig;
        this.currentTheme.set({
          ...this.currentTheme(),
          ...parsed,
        });
        this.syncModelBindings();
      } catch (e) {
        console.error('Error al sincronizar themeJson en StoreThemeComponent:', e);
      }
    }
  }

  @Output() themeSaved = new EventEmitter<StoreThemeConfig>();
  @Output() openPreview = new EventEmitter<void>();

  isSaving = signal(false);
  saveSuccess = signal(false);
  activeTab = signal<'style' | 'hero' | 'banners' | 'preview'>('style');
  tenantSlug = signal<string>('wsp-tech');

  // Form model bindings
  themeAnnouncementText = '';
  themeHeroBadge = '';
  themeHeroTitle = '';
  themeHeroSubtitle = '';
  themeHeroBannerUrl = '';
  themeHeroCtaText = '';
  themeHeroSecondaryCtaText = '';

  themeTrustBadge1Title = '';
  themeTrustBadge1Desc = '';
  themeTrustBadge2Title = '';
  themeTrustBadge2Desc = '';
  themeTrustBadge3Title = '';
  themeTrustBadge3Desc = '';
  themeTrustBadge4Title = '';
  themeTrustBadge4Desc = '';

  themePromoBadge = '';
  themePromoTitle = '';
  themePromoSubtitle = '';
  themePromoImageUrl = '';
  themePromoCtaText = '';

  currentTheme = signal<StoreThemeConfig>({
    templateId: 'dark-tech',
    accentColor: '#10b981',
    fontFamily: 'outfit',
    productLayout: 'grid-3',
    showAnnouncement: true,
    announcementText: '🚚 ¡Envíos a todo el Perú en 24h! • 💬 Pide directo por WhatsApp',
    heroBadge: '⚡ Lanzamiento 2026',
    heroTitle: 'Catálogo de Tecnología & Accesorios Gaming',
    heroSubtitle: 'Encuentra los mejores productos con garantía oficial y atención automatizada 24/7.',
    heroBannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    heroCtaText: 'Explorar Catálogo',
    heroSecondaryCtaText: 'Hablar con Asistente IA',
    trustBadge1Title: '🚚 Despacho Express',
    trustBadge1Desc: 'Envíos en 24 a 48 horas hábiles',
    trustBadge2Title: '🛡️ Garantía Oficial',
    trustBadge2Desc: '100% Productos certificados',
    trustBadge3Title: '💬 Soporte WhatsApp 24/7',
    trustBadge3Desc: 'Asesoría y pedidos con IA',
    trustBadge4Title: '💳 Pagos Seguros',
    trustBadge4Desc: 'Yape, Plin, Tarjetas y contra entrega',
    promoBannerActive: true,
    promoBadge: '⚡ OFERTA LIMITADA',
    promoTitle: 'Hasta 30% OFF en Combos Seleccionados',
    promoSubtitle: 'Aprovecha nuestras ofertas exclusivas con entrega express.',
    promoImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    promoCtaText: 'Aprovechar Oferta',
    showReviews: true,
    showFaq: true,
    purchaseMode: 'both',
  });

  templates: TemplateDefinition[] = [
    {
      id: 'dark-tech',
      name: 'Cyber Tech & Gaming',
      tagline: 'Inmersivo, futurista y de alto impacto visual',
      category: 'Tecnología & Gadgets',
      idealFor: 'Gaming, audio, hardware, periféricos y electrónica',
      badge: 'Cyber Dark UI',
      preview: {
        bg: '#090d16',
        header: '#0f172a',
        card: '#131d31',
        accent: '#10b981',
        text: '#f8fafc',
        subtext: '#94a3b8',
      },
      defaultHeroImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
      defaultPromoImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      heroBadgeDefault: '⚡ Cyber Deals 2026',
      heroTitleDefault: 'Tecnología de Punta & Accesorios Gaming',
      heroSubtitleDefault: 'Periféricos de alto rendimiento, sonido Hi-Res y dispositivos inteligentes con garantía oficial.',
      announcementDefault: '🚀 Despacho Express en 24h • 💬 Pide directo con Asistente WhatsApp 24/7',
      accentOptions: [
        { label: 'Emerald Neón', value: '#10b981', tw: 'bg-emerald-500' },
        { label: 'Cyan Cyber', value: '#06b6d4', tw: 'bg-cyan-500' },
        { label: 'Indigo Tech', value: '#6366f1', tw: 'bg-indigo-500' },
        { label: 'Rose Acid', value: '#f43f5e', tw: 'bg-rose-500' },
        { label: 'Amber Gold', value: '#f59e0b', tw: 'bg-amber-500' },
      ],
      fontOptions: [
        { label: 'Outfit (Moderno)', value: 'outfit' },
        { label: 'Inter (Técnico)', value: 'inter' },
        { label: 'Plus Jakarta Sans', value: 'jakarta' },
      ],
    },
    {
      id: 'light-minimal',
      name: 'Minimal Boutique & Luxury',
      tagline: 'Editorial, limpio, sofisticado y de autor',
      category: 'Moda, Estilo & Belleza',
      idealFor: 'Moda, calzado, joyas, cosmética y diseño de autor',
      badge: 'Editorial Clean',
      preview: {
        bg: '#fcfcfd',
        header: '#ffffff',
        card: '#ffffff',
        accent: '#0f172a',
        text: '#090d16',
        subtext: '#64748b',
      },
      defaultHeroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      defaultPromoImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
      heroBadgeDefault: '✨ Colección de Temporada 2026',
      heroTitleDefault: 'Curaduría Exclusiva para tu Estilo de Vida',
      heroSubtitleDefault: 'Piezas seleccionadas con materiales premium, empaque de lujo y atención personalizada.',
      announcementDefault: '✨ Envíos gratuitos en compras seleccionadas • 🎁 Empaque de regalo incluido',
      accentOptions: [
        { label: 'Black Obsidian', value: '#0f172a', tw: 'bg-slate-900' },
        { label: 'Indigo Royal', value: '#4f46e5', tw: 'bg-indigo-600' },
        { label: 'Rose Gold', value: '#e11d48', tw: 'bg-rose-600' },
        { label: 'Warm Bronze', value: '#b45309', tw: 'bg-amber-700' },
        { label: 'Forest Green', value: '#047857', tw: 'bg-emerald-700' },
      ],
      fontOptions: [
        { label: 'Playfair Display (Editorial)', value: 'playfair' },
        { label: 'Plus Jakarta Sans (Limpio)', value: 'jakarta' },
        { label: 'Inter (Minimal)', value: 'inter' },
      ],
    },
    {
      id: 'warm-brand',
      name: 'Fresh Market & Bento Brand',
      tagline: 'Cálido, apetitoso, cercano y lúdico',
      category: 'Gourmet, Café & Market',
      idealFor: 'Alimentos, cafeterías, repostería, regalos y hogar',
      badge: 'Fresh & Friendly',
      preview: {
        bg: '#fffbf5',
        header: '#fff7ed',
        card: '#ffffff',
        accent: '#ea580c',
        text: '#1c1917',
        subtext: '#78716c',
      },
      defaultHeroImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
      defaultPromoImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      heroBadgeDefault: '🥑 100% Fresco y Artesanal',
      heroTitleDefault: 'Lo Mejor de Nuestro Taller a tu Mesa',
      heroSubtitleDefault: 'Selección fresca preparada cada día con amor. Pide fácil y rápido directo a tu WhatsApp.',
      announcementDefault: '🥑 ¡Frescura diaria garantizada! • 🛵 Envíos express en tu distrito',
      accentOptions: [
        { label: 'Orange Citrus', value: '#ea580c', tw: 'bg-orange-600' },
        { label: 'Emerald Fresh', value: '#059669', tw: 'bg-emerald-600' },
        { label: 'Amber Honey', value: '#d97706', tw: 'bg-amber-600' },
        { label: 'Berry Red', value: '#dc2626', tw: 'bg-red-600' },
        { label: 'Warm Caramel', value: '#78350f', tw: 'bg-amber-900' },
      ],
      fontOptions: [
        { label: 'Plus Jakarta Sans', value: 'jakarta' },
        { label: 'Outfit', value: 'outfit' },
        { label: 'Inter', value: 'inter' },
      ],
    },
  ];

  fontFamilies = [
    { label: 'Outfit', value: 'outfit', font: "'Outfit', sans-serif", desc: 'Moderno, geométrico y audaz' },
    { label: 'Plus Jakarta Sans', value: 'jakarta', font: "'Plus Jakarta Sans', sans-serif", desc: 'Profesional, balanceado y limpio' },
    { label: 'Inter', value: 'inter', font: "'Inter', sans-serif", desc: 'Técnico, neutral y ultra legible' },
    { label: 'Playfair Display', value: 'playfair', font: "'Playfair Display', serif", desc: 'Elegante, editorial y de lujo' },
  ];

  productLayouts = [
    { label: 'Grid 3 Col', value: 'grid-3' as const, icon: '⚏', desc: 'Equilibrado para la mayoría de tiendas' },
    { label: 'Grid 2 Col', value: 'grid-2' as const, icon: '⚎', desc: 'Tarjetas grandes con fotos destacadas' },
    { label: 'Grid 4 Col', value: 'grid-4' as const, icon: '▦', desc: 'Ideal para catálogos con muchos ítems' },
    { label: 'Lista Detallada', value: 'list' as const, icon: '☰', desc: 'Fila horizontal con specs y compra rápida' },
  ];

  heroImagePresets: ImagePreset[] = [
    { label: 'Tech & Gaming', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80', category: 'Tech' },
    { label: 'Audio Hi-Res', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80', category: 'Tech' },
    { label: 'Moda & Boutique', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80', category: 'Fashion' },
    { label: 'Sneakers & Streetwear', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&auto=format&fit=crop&q=80', category: 'Fashion' },
    { label: 'Gourmet & Market', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80', category: 'Food' },
    { label: 'Café & Repostería', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80', category: 'Food' },
    { label: 'Joyería & Lujo', url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80', category: 'Luxury' },
    { label: 'Hogar & Deco', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80', category: 'Home' },
  ];

  activeTemplate = () => this.templates.find((t) => t.id === this.currentTheme().templateId) ?? this.templates[0];

  ngOnInit() {
    // 1. Obtener tenant actual para el botón de tienda en vivo
    this.tenantsService.getCurrentTenant().subscribe({
      next: (tenant) => {
        if (tenant?.slug) {
          this.tenantSlug.set(tenant.slug);
        }
      },
      error: () => {},
    });

    // 2. Cargar configuración existente
    this.settingsService.getConfig().subscribe({
      next: (config) => {
        if (config?.storeTheme) {
          try {
            const parsed = JSON.parse(config.storeTheme) as StoreThemeConfig;
            this.currentTheme.set({
              ...this.currentTheme(),
              ...parsed,
            });
            this.syncModelBindings();
          } catch {
            this.syncModelBindings();
          }
        } else {
          this.syncModelBindings();
        }
      },
      error: () => {
        this.syncModelBindings();
      },
    });
  }

  private syncModelBindings() {
    const t = this.currentTheme();
    const activeTpl = this.activeTemplate();

    this.themeAnnouncementText = t.announcementText || activeTpl.announcementDefault;
    this.themeHeroBadge = t.heroBadge || activeTpl.heroBadgeDefault;
    this.themeHeroTitle = t.heroTitle || activeTpl.heroTitleDefault;
    this.themeHeroSubtitle = t.heroSubtitle || activeTpl.heroSubtitleDefault;
    this.themeHeroBannerUrl = t.heroBannerUrl || activeTpl.defaultHeroImage;
    this.themeHeroCtaText = t.heroCtaText || 'Explorar Catálogo';
    this.themeHeroSecondaryCtaText = t.heroSecondaryCtaText || 'Hablar con Asistente IA';

    this.themeTrustBadge1Title = t.trustBadge1Title || '🚚 Despacho Express';
    this.themeTrustBadge1Desc = t.trustBadge1Desc || 'Envíos en 24 a 48 horas hábiles';
    this.themeTrustBadge2Title = t.trustBadge2Title || '🛡️ Garantía Oficial';
    this.themeTrustBadge2Desc = t.trustBadge2Desc || '100% Productos certificados';
    this.themeTrustBadge3Title = t.trustBadge3Title || '💬 Soporte WhatsApp 24/7';
    this.themeTrustBadge3Desc = t.trustBadge3Desc || 'Asesoría y pedidos con IA';
    this.themeTrustBadge4Title = t.trustBadge4Title || '💳 Pagos Seguros';
    this.themeTrustBadge4Desc = t.trustBadge4Desc || 'Yape, Plin, Tarjetas y contra entrega';

    this.themePromoBadge = t.promoBadge || '⚡ OFERTA LIMITADA';
    this.themePromoTitle = t.promoTitle || 'Hasta 30% OFF en Combos Seleccionados';
    this.themePromoSubtitle = t.promoSubtitle || 'Aprovecha nuestras ofertas exclusivas con entrega express.';
    this.themePromoImageUrl = t.promoImageUrl || activeTpl.defaultPromoImage;
    this.themePromoCtaText = t.promoCtaText || 'Aprovechar Oferta';
  }

  selectTemplate(id: 'dark-tech' | 'light-minimal' | 'warm-brand') {
    const tpl = this.templates.find((t) => t.id === id)!;
    this.currentTheme.update((prev) => ({
      ...prev,
      templateId: id,
      accentColor: tpl.accentOptions[0].value,
      fontFamily: tpl.fontOptions[0].value,
      heroBannerUrl: tpl.defaultHeroImage,
      promoImageUrl: tpl.defaultPromoImage,
      heroBadge: tpl.heroBadgeDefault,
      heroTitle: tpl.heroTitleDefault,
      heroSubtitle: tpl.heroSubtitleDefault,
      announcementText: tpl.announcementDefault,
    }));
    this.syncModelBindings();
    // Publicar y activar inmediatamente la plantilla en la tienda web
    this.saveTheme();
  }

  setAccentColor(color: string) {
    this.currentTheme.update((t) => ({ ...t, accentColor: color }));
  }

  onCustomColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target?.value) {
      this.setAccentColor(target.value);
    }
  }

  setFont(font: string) {
    this.currentTheme.update((t) => ({ ...t, fontFamily: font }));
  }

  setLayout(layout: 'grid-2' | 'grid-3' | 'grid-4' | 'list') {
    this.currentTheme.update((t) => ({ ...t, productLayout: layout }));
  }

  setPurchaseMode(mode: 'both' | 'whatsapp' | 'cart') {
    this.currentTheme.update((t) => ({ ...t, purchaseMode: mode }));
  }

  setHeroImage(url: string) {
    this.themeHeroBannerUrl = url;
    this.currentTheme.update((t) => ({ ...t, heroBannerUrl: url }));
  }

  toggleAnnouncement(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.currentTheme.update((t) => ({ ...t, showAnnouncement: checked }));
  }

  togglePromoBanner(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.currentTheme.update((t) => ({ ...t, promoBannerActive: checked }));
  }

  toggleField(field: 'showReviews' | 'showFaq', event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.currentTheme.update((t) => ({ ...t, [field]: checked }));
  }

  onFieldChange(field: keyof StoreThemeConfig, value: any) {
    this.currentTheme.update((t) => ({ ...t, [field]: value }));
  }

  getPreviewBackground(): string {
    const tpl = this.activeTemplate();
    return tpl.preview.bg;
  }

  getHeroImageUrl(): string {
    return this.currentTheme().heroBannerUrl || this.activeTemplate()?.defaultHeroImage;
  }

  getCurrentThemeConfig(): StoreThemeConfig {
    return {
      ...this.currentTheme(),
      announcementText: this.themeAnnouncementText,
      heroBadge: this.themeHeroBadge,
      heroTitle: this.themeHeroTitle,
      heroSubtitle: this.themeHeroSubtitle,
      heroBannerUrl: this.themeHeroBannerUrl,
      heroCtaText: this.themeHeroCtaText,
      heroSecondaryCtaText: this.themeHeroSecondaryCtaText,
      trustBadge1Title: this.themeTrustBadge1Title,
      trustBadge1Desc: this.themeTrustBadge1Desc,
      trustBadge2Title: this.themeTrustBadge2Title,
      trustBadge2Desc: this.themeTrustBadge2Desc,
      trustBadge3Title: this.themeTrustBadge3Title,
      trustBadge3Desc: this.themeTrustBadge3Desc,
      trustBadge4Title: this.themeTrustBadge4Title,
      trustBadge4Desc: this.themeTrustBadge4Desc,
      promoBadge: this.themePromoBadge,
      promoTitle: this.themePromoTitle,
      promoSubtitle: this.themePromoSubtitle,
      promoImageUrl: this.themePromoImageUrl,
      promoCtaText: this.themePromoCtaText,
    };
  }

  markAsSaved(savedConfig?: StoreThemeConfig) {
    this.saveSuccess.set(true);
    if (savedConfig) {
      this.currentTheme.set(savedConfig);
      this.themeSaved.emit(savedConfig);
    }
    setTimeout(() => this.saveSuccess.set(false), 4000);
  }

  saveTheme() {
    this.isSaving.set(true);
    const finalConfig = this.getCurrentThemeConfig();
    const themeJson = JSON.stringify(finalConfig);

    this.settingsService.updateConfig({ storeTheme: themeJson }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.markAsSaved(finalConfig);
        this.toast.success(`Plantilla "${this.activeTemplate().name}" activada y guardada en tu tienda en vivo.`, 'Diseño Web');
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('Error al guardar el diseño. Intenta nuevamente.');
      },
    });
  }
}
