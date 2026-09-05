import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantsService, PublicStoreData } from '../../core/services/tenants.service';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, Category } from '../../core/models/models';
import { StoreThemeConfig } from '../../core/models/models';

interface CartItem {
  product: Product;
  quantity: number;
}

const DEFAULT_THEME: StoreThemeConfig = {
  templateId: 'dark-tech',
  accentColor: '#10b981',
  fontFamily: 'outfit',
  productLayout: 'grid-3',
  showAnnouncement: true,
  announcementText: '🚚 ¡Envíos a todo el Perú en 24h! • 💬 Pide directo por WhatsApp',
  heroBadge: '⚡ Lanzamiento Oficial 2026',
  heroTitle: 'Catálogo de Productos & Novedades',
  heroSubtitle: 'Encuentra los mejores productos con garantía oficial, despacho express y atención automatizada 24/7.',
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
  promoSubtitle: 'Aprovecha nuestras promociones exclusivas de la semana con entrega express.',
  promoImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
  promoCtaText: 'Aprovechar Oferta',
  showReviews: true,
  showFaq: true,
  purchaseMode: 'both',
};

@Component({
  selector: 'app-store-front',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ─── Loading Skeleton UI (Instant First Paint) ────────────────────────── -->
    <div *ngIf="loading()" class="min-h-screen bg-slate-950 text-slate-300 animate-pulse">
      <!-- Top Ticker Skeleton -->
      <div class="h-8 bg-slate-900 border-b border-slate-800"></div>

      <!-- Header Skeleton -->
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between border-b border-slate-800/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-800"></div>
          <div class="space-y-1.5">
            <div class="h-4 bg-slate-800 rounded w-28"></div>
            <div class="h-2.5 bg-slate-850 rounded w-20"></div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="h-9 w-24 bg-slate-800 rounded-xl hidden sm:block"></div>
          <div class="h-9 w-20 bg-slate-800 rounded-xl"></div>
        </div>
      </div>

      <!-- Hero Skeleton -->
      <div class="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div class="max-w-2xl space-y-4">
          <div class="h-6 bg-slate-800 rounded-full w-40"></div>
          <div class="h-10 bg-slate-800 rounded-xl w-4/5"></div>
          <div class="h-4 bg-slate-800/60 rounded-lg w-full"></div>
          <div class="h-4 bg-slate-800/60 rounded-lg w-3/4"></div>
          <div class="flex items-center gap-3 pt-2">
            <div class="h-11 w-36 bg-emerald-950/60 border border-emerald-500/20 rounded-xl"></div>
            <div class="h-11 w-36 bg-slate-850 rounded-xl"></div>
          </div>
        </div>
      </div>

      <!-- Product Grid Skeleton -->
      <div class="max-w-7xl mx-auto px-4 pb-20">
        <div class="h-7 bg-slate-800 rounded-lg w-48 mb-6"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div class="w-full h-44 rounded-xl bg-slate-800"></div>
            <div class="h-3 bg-slate-800 rounded w-16"></div>
            <div class="h-4 bg-slate-800 rounded w-3/4"></div>
            <div class="h-5 bg-slate-800 rounded w-24 pt-1"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Not Found ─────────────────────────────────────────────────────────── -->
    <div *ngIf="notFound()" class="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 px-4 text-center">
      <div class="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-2xl mb-4 font-bold">✕</div>
      <h1 class="text-2xl font-bold text-white mb-2">Tienda no encontrada</h1>
      <p class="text-sm text-slate-400 max-w-sm mb-6">El enlace ingresado no corresponde a ninguna tienda activa en WSP Flow.</p>
      <a href="/" class="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition-colors">Ir a la página principal</a>
    </div>

    <!-- ─── STORE WRAPPER ─────────────────────────────────────────────────────── -->
    <div *ngIf="storeData()" [style.font-family]="fontFamilyStyle()">

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!--  PLANTILLA 1: CYBER TECH & ELECTRONICS (DARK MODE NEO-GLASS)          -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      @if (theme().templateId === 'dark-tech') {
        <div class="min-h-screen text-slate-100 pb-24" style="background:#090d16">

          <!-- 1. Top Ticker / Announcement Bar -->
          @if (theme().showAnnouncement !== false) {
            <div class="py-2 px-4 text-center text-xs font-bold text-slate-950 flex items-center justify-center gap-2 tracking-wide"
                 [style.background]="theme().accentColor">
              <span class="w-2 h-2 rounded-full bg-slate-950/40 animate-ping"></span>
              <span>{{ theme().announcementText || '🚀 Despacho Express en 24h • 💬 Pide directo con Asistente WhatsApp 24/7' }}</span>
            </div>
          }

          <!-- 2. Sticky Cyber Header -->
          <header class="sticky top-0 z-40 backdrop-blur-xl border-b" style="background:rgba(9,13,22,0.88);border-color:#1e293b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <img *ngIf="storeData()?.tenant?.logoUrl" [src]="storeData()?.tenant?.logoUrl" class="w-10 h-10 rounded-xl object-cover border border-slate-700"/>
                <div *ngIf="!storeData()?.tenant?.logoUrl" class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg" [style.background]="theme().accentColor">
                  {{ storeData()?.tenant?.name?.charAt(0) }}
                </div>
                <div>
                  <h1 class="font-black text-base text-white leading-tight tracking-tight">{{ storeData()?.tenant?.name || 'Cyber Store' }}</h1>
                  <p class="text-[11px] flex items-center gap-1.5 font-medium" [style.color]="theme().accentColor">
                    <span class="w-1.5 h-1.5 rounded-full animate-pulse" [style.background]="theme().accentColor"></span>
                    Atención IA & WhatsApp 24/7
                  </p>
                </div>
              </div>

              <!-- Header Actions -->
              <div class="flex items-center gap-3">
                <a [href]="whatsappDirectUrl()" target="_blank" class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-200 hover:border-slate-500 transition-all" style="background:rgba(30,41,59,0.7)">
                  <span>💬 Chat WhatsApp</span>
                </a>

                <button (click)="openCartDrawer.set(true)" class="relative p-2.5 rounded-xl border flex items-center gap-2 text-slate-200 transition-all hover:scale-105 active:scale-95" style="background:rgba(30,41,59,0.8);border-color:#334155">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  <span class="hidden sm:inline text-xs font-bold">Carrito</span>
                  <span *ngIf="totalCartCount() > 0" class="absolute -top-1.5 -right-1.5 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg text-slate-950" [style.background]="theme().accentColor">{{ totalCartCount() }}</span>
                </button>
              </div>
            </div>
          </header>

          <!-- 3. High-Impact Tech Landing Hero -->
          <section class="py-12 sm:py-16 px-4 border-b relative overflow-hidden" style="background:linear-gradient(180deg,#0f172a 0%,#090d16 100%);border-color:#1e293b">
            <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div class="lg:col-span-7 text-center lg:text-left space-y-4">
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-slate-950 shadow-md"
                      [style.background]="theme().accentColor">
                  {{ theme().heroBadge || '⚡ Cyber Deals 2026' }}
                </span>

                <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  {{ theme().heroTitle || 'Tecnología de Punta & Accesorios Gaming' }}
                </h2>

                <p class="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  {{ theme().heroSubtitle || storeData()?.config?.businessDescription || 'Periféricos de alto rendimiento, audio Hi-Res y dispositivos inteligentes.' }}
                </p>

                <div class="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-3">
                  <button (click)="scrollToCatalog()" class="px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 text-slate-950 flex items-center gap-2"
                          [style.background]="theme().accentColor">
                    <span>{{ theme().heroCtaText || 'Explorar Catálogo' }}</span>
                    <span>↓</span>
                  </button>

                  <a [href]="whatsappDirectUrl()" target="_blank" class="px-5 py-3.5 rounded-2xl font-bold text-sm border border-slate-700 hover:border-slate-500 bg-slate-900/80 text-white transition-all active:scale-95 flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span>{{ theme().heroSecondaryCtaText || 'Hablar con Asistente IA' }}</span>
                  </a>
                </div>
              </div>

              <!-- Hero Visual / Showcase Banner -->
              <div class="lg:col-span-5 relative">
                <div class="rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative group" style="background:#131d31">
                  <img [src]="getHeroImageUrl()" class="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>

                  <!-- Floating Tech Badges -->
                  <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                    <div class="p-2.5 rounded-xl backdrop-blur-md bg-slate-900/80 border border-slate-700/80 text-xs">
                      <div class="text-[10px] text-slate-400">Stock Garantizado</div>
                      <div class="font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <span class="w-2 h-2 rounded-full" [style.background]="theme().accentColor"></span>
                        Despacho Inmediato
                      </div>
                    </div>
                    <div class="p-2.5 rounded-xl backdrop-blur-md bg-slate-900/80 border border-slate-700/80 text-xs text-right">
                      <div class="text-[10px] text-slate-400">Garantía</div>
                      <div class="font-bold text-emerald-400">100% Oficial</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 4. 4 Bento Trust Pillars -->
          <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div class="p-4 rounded-2xl border border-slate-800 backdrop-blur-lg flex items-center gap-3.5 shadow-lg" style="background:rgba(19,29,49,0.85)">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-slate-950 font-bold shrink-0" [style.background]="theme().accentColor">
                  🚚
                </div>
                <div>
                  <h4 class="text-xs font-bold text-white">{{ theme().trustBadge1Title || 'Despacho Express 24h' }}</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">{{ theme().trustBadge1Desc || 'Envíos en 24 a 48 horas hábiles' }}</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl border border-slate-800 backdrop-blur-lg flex items-center gap-3.5 shadow-lg" style="background:rgba(19,29,49,0.85)">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-slate-950 font-bold shrink-0" [style.background]="theme().accentColor">
                  🛡️
                </div>
                <div>
                  <h4 class="text-xs font-bold text-white">{{ theme().trustBadge2Title || 'Garantía Oficial' }}</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">{{ theme().trustBadge2Desc || '100% Productos certificados' }}</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl border border-slate-800 backdrop-blur-lg flex items-center gap-3.5 shadow-lg" style="background:rgba(19,29,49,0.85)">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-slate-950 font-bold shrink-0" [style.background]="theme().accentColor">
                  💬
                </div>
                <div>
                  <h4 class="text-xs font-bold text-white">{{ theme().trustBadge3Title || 'Soporte WhatsApp 24/7' }}</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">{{ theme().trustBadge3Desc || 'Asesoría y pedidos con IA' }}</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl border border-slate-800 backdrop-blur-lg flex items-center gap-3.5 shadow-lg" style="background:rgba(19,29,49,0.85)">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-slate-950 font-bold shrink-0" [style.background]="theme().accentColor">
                  💳
                </div>
                <div>
                  <h4 class="text-xs font-bold text-white">{{ theme().trustBadge4Title || 'Pagos Seguros' }}</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">{{ theme().trustBadge4Desc || 'Yape, Plin, Tarjetas y contra entrega' }}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- 5. Promotional Spotlight Banner -->
          @if (theme().promoBannerActive !== false) {
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
              <div class="rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                   style="background:linear-gradient(135deg,#131d31 0%,#0f172a 100%)">
                <div class="space-y-3 max-w-xl text-center md:text-left z-10">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-950" [style.background]="theme().accentColor">
                    {{ theme().promoBadge || '⚡ OFERTA LIMITADA' }}
                  </span>
                  <h3 class="text-2xl sm:text-3xl font-black text-white">
                    {{ theme().promoTitle || 'Hasta 30% OFF en Combos Seleccionados' }}
                  </h3>
                  <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {{ theme().promoSubtitle || 'Aprovecha nuestras ofertas exclusivas con entrega express.' }}
                  </p>
                  <button (click)="scrollToCatalog()" class="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 inline-flex items-center gap-2" [style.background]="theme().accentColor">
                    {{ theme().promoCtaText || 'Aprovechar Oferta' }} →
                  </button>
                </div>
                <div class="w-full md:w-80 h-44 rounded-2xl overflow-hidden border border-slate-700 shrink-0">
                  <img [src]="theme().promoImageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'" class="w-full h-full object-cover" />
                </div>
              </div>
            </section>
          }

          <!-- 6. Catalog Core Showcase -->
          <main id="catalog-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
            <div class="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-xl font-black text-white tracking-tight">Catálogo de Productos</h3>
                <p class="text-xs text-slate-400 mt-0.5">Explora nuestras categorías y pide con entrega a domicilio.</p>
              </div>
            </div>

            <ng-container *ngTemplateOutlet="filterBar; context: { darkMode: true }"></ng-container>
            <ng-container *ngTemplateOutlet="productGrid; context: { darkMode: true }"></ng-container>
          </main>

          <!-- 7. Customer Reviews / Social Proof -->
          @if (theme().showReviews !== false) {
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-slate-800">
              <div class="text-center max-w-xl mx-auto mb-8">
                <span class="text-xs font-bold uppercase tracking-widest" [style.color]="theme().accentColor">✦ Opiniones Verificadas</span>
                <h3 class="text-2xl font-black text-white mt-1">Lo que dicen nuestros clientes</h3>
                <p class="text-xs text-slate-400 mt-1">Más de 1,200 pedidos entregados con satisfacción garantizada.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                @for (rev of techReviews; track rev.name) {
                  <div class="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1 text-amber-400 text-sm">
                        ★★★★★
                      </div>
                      <span class="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Compra Verificada</span>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">"{{ rev.comment }}"</p>
                    <div class="pt-2 border-t border-slate-800 flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                        {{ rev.name.charAt(0) }}
                      </div>
                      <div>
                        <div class="text-xs font-bold text-white">{{ rev.name }}</div>
                        <div class="text-[10px] text-slate-400">{{ rev.city }}</div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- 8. Interactive FAQ Accordion -->
          @if (theme().showFaq !== false) {
            <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-slate-800">
              <div class="text-center mb-8">
                <span class="text-xs font-bold uppercase tracking-widest" [style.color]="theme().accentColor">✦ Ayuda & Preguntas</span>
                <h3 class="text-2xl font-black text-white mt-1">Preguntas Frecuentes</h3>
              </div>

              <div class="space-y-3">
                @for (faq of faqs; track faq.q; let i = $index) {
                  <div class="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                    <button
                      (click)="toggleFaq(i)"
                      class="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:bg-slate-800/40 transition-colors"
                    >
                      <span>{{ faq.q }}</span>
                      <span class="text-base text-slate-400 ml-3">{{ expandedFaq() === i ? '−' : '+' }}</span>
                    </button>
                    @if (expandedFaq() === i) {
                      <div class="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-fade-in">
                        {{ faq.a }}
                      </div>
                    }
                  </div>
                }
              </div>
            </section>
          }

          <!-- 9. Tech Footer -->
          <footer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-10 border-t border-slate-800 text-xs text-slate-400">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
              <div class="md:col-span-2 space-y-3">
                <div class="flex items-center gap-2 font-bold text-white text-sm">
                  <span class="w-3 h-3 rounded-full" [style.background]="theme().accentColor"></span>
                  <span>{{ storeData()?.tenant?.name }}</span>
                </div>
                <p class="text-slate-400 max-w-sm leading-relaxed">{{ storeData()?.config?.businessDescription }}</p>
                <div class="pt-2 text-[11px] text-slate-400">
                  📍 {{ storeData()?.config?.address || 'Lima, Perú' }}
                </div>
              </div>

              <div>
                <h5 class="font-bold text-white mb-2">Horario & Atención</h5>
                <p class="text-[11px] text-slate-400">{{ storeData()?.config?.workingHours || 'Lunes a Sábado de 09:00 a 20:00' }}</p>
                <p class="text-[11px] text-emerald-400 font-semibold mt-2">Bot WhatsApp Activo 24/7</p>
              </div>

              <div>
                <h5 class="font-bold text-white mb-2">Medios de Pago</h5>
                <p class="text-[11px] text-slate-400">{{ storeData()?.config?.paymentMethods || 'Yape, Plin, Tarjetas de crédito/débito y efectivo contra entrega' }}</p>
                <div class="flex items-center gap-2 mt-3 text-lg">
                  <span>💳</span> <span>📱</span> <span>💵</span>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
              <div>© 2026 {{ storeData()?.tenant?.name }}. Impulsado por WSP Flow SaaS.</div>
              <div class="flex items-center gap-4">
                <a [href]="whatsappDirectUrl()" target="_blank" class="hover:text-white" [style.color]="theme().accentColor">Soporte WhatsApp</a>
              </div>
            </div>
          </footer>

          <ng-container *ngTemplateOutlet="cartDrawer; context: { darkMode: true }"></ng-container>
          <ng-container *ngTemplateOutlet="floatingWaButton; context: { darkMode: true }"></ng-container>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!--  PLANTILLA 2: MINIMAL BOUTIQUE & LUXURY (EDITORIAL LIGHT & CLEAN)      -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      @if (theme().templateId === 'light-minimal') {
        <div class="min-h-screen pb-24" style="background:#fcfcfd;color:#090d16">

          <!-- 1. Top Luxury Announcement Bar -->
          @if (theme().showAnnouncement !== false) {
            <div class="py-2 px-4 text-center text-xs font-medium text-slate-600 border-b border-slate-200/80 tracking-widest uppercase"
                 style="background:#f8fafc">
              {{ theme().announcementText || '✨ Envíos gratuitos en compras seleccionadas • 🎁 Empaque de regalo incluido' }}
            </div>
          }

          <!-- 2. Refined Editorial Header -->
          <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xs">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img *ngIf="storeData()?.tenant?.logoUrl" [src]="storeData()?.tenant?.logoUrl" class="w-10 h-10 rounded-full object-cover border border-slate-200"/>
                <div *ngIf="!storeData()?.tenant?.logoUrl" class="w-10 h-10 rounded-full flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm" [style.background]="theme().accentColor">
                  {{ storeData()?.tenant?.name?.charAt(0) }}
                </div>
                <div>
                  <h1 class="font-serif font-extrabold text-lg text-slate-900 tracking-wide">{{ storeData()?.tenant?.name || 'Boutique' }}</h1>
                  <span class="text-[10px] tracking-widest uppercase text-slate-400">Colección Oficial</span>
                </div>
              </div>

              <!-- Header Actions -->
              <div class="flex items-center gap-3">
                <button (click)="openCartDrawer.set(true)" class="relative flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold tracking-wide transition-all shadow-xs">
                  <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                  <span>Bolsa</span>
                  <span *ngIf="totalCartCount() > 0" class="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" [style.background]="theme().accentColor">{{ totalCartCount() }}</span>
                </button>
              </div>
            </div>
          </header>

          <!-- 3. Lookbook Split Landing Hero -->
          <section class="py-14 sm:py-20 px-4 border-b border-slate-200/80 bg-white">
            <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div class="lg:col-span-6 space-y-5 text-center lg:text-left">
                <span class="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-slate-200 text-slate-700" style="background:#f8fafc">
                  {{ theme().heroBadge || '✨ Colección de Temporada 2026' }}
                </span>

                <h2 class="text-3xl sm:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
                  {{ theme().heroTitle || 'Curaduría Exclusiva para tu Estilo de Vida' }}
                </h2>

                <p class="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-light">
                  {{ theme().heroSubtitle || storeData()?.config?.businessDescription || 'Piezas seleccionadas con materiales premium, empaque de lujo y atención personalizada.' }}
                </p>

                <div class="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-4">
                  <button (click)="scrollToCatalog()" class="px-7 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all active:scale-95"
                          [style.background]="theme().accentColor">
                    {{ theme().heroCtaText || 'Ver Colección' }}
                  </button>

                  <a [href]="whatsappDirectUrl()" target="_blank" class="px-6 py-3.5 rounded-full font-semibold text-xs tracking-wider uppercase border border-slate-300 hover:border-slate-800 text-slate-800 transition-all active:scale-95">
                    {{ theme().heroSecondaryCtaText || 'Atención Personalizada' }}
                  </a>
                </div>
              </div>

              <!-- Lookbook Visual -->
              <div class="lg:col-span-6 relative">
                <div class="rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative aspect-4/3 sm:aspect-16/10">
                  <img [src]="getHeroImageUrl()" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  <div class="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-900 text-xs font-serif font-bold shadow-sm">
                    Edición Limitada ✦
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 4. Brand Values Ribbon -->
          <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-slate-200/80">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div class="text-sm mb-1">✦</div>
                <div class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ theme().trustBadge1Title || 'Despacho Express' }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{{ theme().trustBadge1Desc || 'Envíos en 24 a 48 horas hábiles' }}</div>
              </div>
              <div>
                <div class="text-sm mb-1">✦</div>
                <div class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ theme().trustBadge2Title || 'Calidad Garantizada' }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{{ theme().trustBadge2Desc || 'Materiales seleccionados' }}</div>
              </div>
              <div>
                <div class="text-sm mb-1">✦</div>
                <div class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ theme().trustBadge3Title || 'Asesoría 1 a 1' }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{{ theme().trustBadge3Desc || 'WhatsApp Concierge' }}</div>
              </div>
              <div>
                <div class="text-sm mb-1">✦</div>
                <div class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ theme().trustBadge4Title || 'Pago Seguro' }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{{ theme().trustBadge4Desc || 'Tarjetas y transferencias' }}</div>
              </div>
            </div>
          </section>

          <!-- 5. Promotional Showcase -->
          @if (theme().promoBannerActive !== false) {
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
              <div class="rounded-3xl border border-slate-200 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50">
                <div class="space-y-4 max-w-lg text-center md:text-left">
                  <span class="text-xs font-serif font-bold text-slate-500 uppercase tracking-widest">
                    {{ theme().promoBadge || 'Colección Especial' }}
                  </span>
                  <h3 class="text-2xl sm:text-4xl font-serif font-bold text-slate-900">
                    {{ theme().promoTitle || 'Hasta 30% OFF en Selección Exclusiva' }}
                  </h3>
                  <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
                    {{ theme().promoSubtitle || 'Descubre piezas únicas con acabados impecables.' }}
                  </p>
                  <button (click)="scrollToCatalog()" class="px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-sm" [style.background]="theme().accentColor">
                    {{ theme().promoCtaText || 'Ver Selección' }}
                  </button>
                </div>
                <div class="w-full md:w-80 h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                  <img [src]="theme().promoImageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'" class="w-full h-full object-cover" />
                </div>
              </div>
            </section>
          }

          <!-- 6. Catalog Gallery -->
          <main id="catalog-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
            <div class="text-center max-w-lg mx-auto mb-8">
              <span class="text-xs font-bold uppercase tracking-widest text-slate-400">Catálogo</span>
              <h3 class="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">Nuestra Selección</h3>
            </div>

            <ng-container *ngTemplateOutlet="filterBar; context: { darkMode: false }"></ng-container>
            <ng-container *ngTemplateOutlet="productGrid; context: { darkMode: false }"></ng-container>
          </main>

          <!-- 7. Client Testimonials -->
          @if (theme().showReviews !== false) {
            <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-12 border-t border-slate-200">
              <div class="text-center mb-10">
                <span class="text-xs font-serif italic text-slate-500">Testimonios de Clientes</span>
                <h3 class="text-2xl font-serif font-bold text-slate-900 mt-1">Experiencias Reales</h3>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                @for (rev of boutiqueReviews; track rev.name) {
                  <div class="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 text-center">
                    <div class="text-amber-500 text-sm">★★★★★</div>
                    <p class="text-xs text-slate-600 font-serif italic leading-relaxed">"{{ rev.comment }}"</p>
                    <div class="text-xs font-bold text-slate-900 tracking-wide pt-2 border-t border-slate-100">{{ rev.name }}</div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- 8. Interactive Boutique FAQ -->
          @if (theme().showFaq !== false) {
            <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
              <div class="text-center mb-8">
                <h3 class="text-xl font-serif font-bold text-slate-900">Preguntas & Políticas de Compra</h3>
              </div>

              <div class="space-y-3">
                @for (faq of faqs; track faq.q; let i = $index) {
                  <div class="border-b border-slate-200 pb-3">
                    <button
                      (click)="toggleFaq(i)"
                      class="w-full text-left py-2 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      <span>{{ faq.q }}</span>
                      <span class="text-slate-400 text-lg">{{ expandedFaq() === i ? '−' : '+' }}</span>
                    </button>
                    @if (expandedFaq() === i) {
                      <p class="text-xs text-slate-600 pt-1 pb-2 leading-relaxed animate-fade-in font-light">
                        {{ faq.a }}
                      </p>
                    }
                  </div>
                }
              </div>
            </section>
          }

          <!-- 9. Sophisticated Minimalist Footer -->
          <footer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-12 border-t border-slate-200 text-xs text-slate-500">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
              <div class="md:col-span-2 space-y-3">
                <h4 class="font-serif font-bold text-slate-900 text-base">{{ storeData()?.tenant?.name }}</h4>
                <p class="text-slate-500 leading-relaxed font-light max-w-sm">{{ storeData()?.config?.businessDescription }}</p>
                <div class="text-[11px] text-slate-400">📍 {{ storeData()?.config?.address }}</div>
              </div>
              <div>
                <h5 class="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-3">Atención & Envíos</h5>
                <p class="text-[11px] leading-relaxed">{{ storeData()?.config?.workingHours }}</p>
                <p class="text-[11px] text-slate-600 mt-2">{{ storeData()?.config?.shippingPolicy }}</p>
              </div>
              <div>
                <h5 class="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-3">Métodos de Pago</h5>
                <p class="text-[11px] leading-relaxed">{{ storeData()?.config?.paymentMethods }}</p>
              </div>
            </div>
            <div class="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400">
              © 2026 {{ storeData()?.tenant?.name }}. Todos los derechos reservados.
            </div>
          </footer>

          <ng-container *ngTemplateOutlet="cartDrawer; context: { darkMode: false }"></ng-container>
          <ng-container *ngTemplateOutlet="floatingWaButton; context: { darkMode: false }"></ng-container>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!--  PLANTILLA 3: FRESH MARKET & BENTO BRAND (VIBRANT & ARTISANAL)         -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      @if (theme().templateId === 'warm-brand') {
        <div class="min-h-screen pb-24" style="background:#fffbf5;color:#1c1917">

          <!-- 1. Animated Fresh Ticker -->
          @if (theme().showAnnouncement !== false) {
            <div class="py-2.5 px-4 text-center text-xs font-black tracking-wide text-white shadow-xs"
                 [style.background]="theme().accentColor">
              <span>{{ theme().announcementText || '🥑 ¡Frescura diaria garantizada! • 🛵 Envíos express en tu distrito • 🎁 Regalo en tu primer pedido' }}</span>
            </div>
          }

          <!-- 2. Fresh Header -->
          <header class="sticky top-0 z-40 backdrop-blur-xl border-b border-amber-200/70" style="background:rgba(255,251,245,0.92)">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <img *ngIf="storeData()?.tenant?.logoUrl" [src]="storeData()?.tenant?.logoUrl" class="w-11 h-11 rounded-2xl object-cover border-2 border-amber-300 shadow-sm"/>
                <div *ngIf="!storeData()?.tenant?.logoUrl" class="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md" [style.background]="theme().accentColor">
                  {{ storeData()?.tenant?.name?.charAt(0) }}
                </div>
                <div>
                  <h1 class="font-black text-base sm:text-lg text-stone-900 leading-tight">{{ storeData()?.tenant?.name || 'Fresh Market' }}</h1>
                  <p class="text-[11px] font-bold flex items-center gap-1.5" [style.color]="theme().accentColor">
                    <span class="w-2 h-2 rounded-full animate-bounce" [style.background]="theme().accentColor"></span>
                    Atención Inmediata por WhatsApp
                  </p>
                </div>
              </div>

              <!-- Header Actions -->
              <div class="flex items-center gap-2 sm:gap-3">
                <a [href]="whatsappDirectUrl()" target="_blank" class="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black text-white shadow-md transition-all active:scale-95" [style.background]="theme().accentColor">
                  <span>💬 Pedir por WhatsApp</span>
                </a>

                <button (click)="openCartDrawer.set(true)" class="relative p-2.5 rounded-2xl border border-amber-200 bg-white hover:bg-amber-50 text-stone-800 transition-all active:scale-95 shadow-xs flex items-center gap-2">
                  <span class="text-base">🛒</span>
                  <span class="hidden sm:inline text-xs font-black">Mi Pedido</span>
                  <span *ngIf="totalCartCount() > 0" class="px-2 py-0.5 rounded-full text-[10px] font-black text-white" [style.background]="theme().accentColor">{{ totalCartCount() }}</span>
                </button>
              </div>
            </div>
          </header>

          <!-- 3. Interactive Bento Landing Hero -->
          <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-5">

              <!-- Main Bento Hero Card (Spans 8 cols) -->
              <div class="md:col-span-8 rounded-3xl p-6 sm:p-10 border border-amber-200 relative overflow-hidden flex flex-col justify-between shadow-lg"
                   style="background:linear-gradient(135deg,#fef3e2 0%,#fff7ed 60%,#fef9f0 100%)">
                <div class="space-y-4 max-w-xl z-10">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-white shadow-xs"
                        [style.background]="theme().accentColor">
                    {{ theme().heroBadge || '🥑 100% Fresco y Artesanal' }}
                  </span>

                  <h2 class="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                    {{ theme().heroTitle || 'Lo Mejor de Nuestro Taller Directo a tu Mesa' }}
                  </h2>

                  <p class="text-sm sm:text-base text-stone-700 leading-relaxed font-medium">
                    {{ theme().heroSubtitle || storeData()?.config?.businessDescription || 'Selección fresca preparada cada día con amor. Pide fácil y rápido directo a tu WhatsApp.' }}
                  </p>

                  <div class="flex flex-wrap items-center gap-3 pt-2">
                    <button (click)="scrollToCatalog()" class="px-6 py-3.5 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95 flex items-center gap-2"
                            [style.background]="theme().accentColor">
                      <span>{{ theme().heroCtaText || 'Hacer Mi Pedido' }}</span>
                      <span>🛒</span>
                    </button>

                    <a [href]="whatsappDirectUrl()" target="_blank" class="px-5 py-3.5 rounded-2xl font-bold text-sm bg-white border-2 border-stone-200 hover:border-stone-400 text-stone-900 transition-all active:scale-95 shadow-sm">
                      {{ theme().heroSecondaryCtaText || 'Chatear con Nosotros' }}
                    </a>
                  </div>
                </div>

                <div class="mt-6 pt-4 border-t border-amber-200/80 flex items-center gap-4 text-xs font-bold text-stone-700 z-10">
                  <span>🛵 Despacho Inmediato</span>
                  <span>•</span>
                  <span>💳 Aceptamos Yape y Plin</span>
                  <span>•</span>
                  <span>⭐ 100% Garantizado</span>
                </div>
              </div>

              <!-- Side Bento Card 1: Featured Image & Deal (Spans 4 cols) -->
              <div class="md:col-span-4 rounded-3xl overflow-hidden border border-amber-200 relative shadow-md group h-72 md:h-auto min-h-[260px]">
                <img [src]="getHeroImageUrl()" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full w-fit mb-1" [style.background]="theme().accentColor">Destacado del Día</span>
                  <h4 class="font-black text-lg">Frescura & Calidad</h4>
                  <p class="text-xs text-stone-200 mt-0.5">Preparado para ti con la mejor selección.</p>
                </div>
              </div>

            </div>
          </section>

          <!-- 4. 4 Fresh Illustrated Benefits -->
          <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style="background:#fef3e2">🥑</div>
                <div>
                  <h4 class="text-xs font-black text-stone-900">{{ theme().trustBadge1Title || '100% Fresco' }}</h4>
                  <p class="text-[11px] text-stone-500">{{ theme().trustBadge1Desc || 'Selección diaria' }}</p>
                </div>
              </div>
              <div class="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style="background:#fef3e2">🛵</div>
                <div>
                  <h4 class="text-xs font-black text-stone-900">{{ theme().trustBadge2Title || 'Entrega Rápida' }}</h4>
                  <p class="text-[11px] text-stone-500">{{ theme().trustBadge2Desc || 'Directo a tu hogar' }}</p>
                </div>
              </div>
              <div class="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style="background:#fef3e2">💳</div>
                <div>
                  <h4 class="text-xs font-black text-stone-900">{{ theme().trustBadge3Title || 'Paga Fácil' }}</h4>
                  <p class="text-[11px] text-stone-500">{{ theme().trustBadge3Desc || 'Yape, Plin y Tarjetas' }}</p>
                </div>
              </div>
              <div class="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style="background:#fef3e2">💚</div>
                <div>
                  <h4 class="text-xs font-black text-stone-900">{{ theme().trustBadge4Title || 'Con Cariño' }}</h4>
                  <p class="text-[11px] text-stone-500">{{ theme().trustBadge4Desc || 'Atención personalizada' }}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- 5. Promotional Bento Spotlight -->
          @if (theme().promoBannerActive !== false) {
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
              <div class="rounded-3xl border border-amber-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md"
                   style="background:linear-gradient(135deg,#ffedd5 0%,#fef3c7 100%)">
                <div class="space-y-3 max-w-xl text-center md:text-left">
                  <span class="px-3 py-1 rounded-full text-xs font-black text-white" [style.background]="theme().accentColor">
                    {{ theme().promoBadge || '🎉 COMBO DE LA SEMANA' }}
                  </span>
                  <h3 class="text-2xl sm:text-3xl font-black text-stone-900">
                    {{ theme().promoTitle || 'Hasta 30% OFF en Packs Familiares' }}
                  </h3>
                  <p class="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                    {{ theme().promoSubtitle || 'Llévate tus favoritos a precio especial con envío gratis hoy mismo.' }}
                  </p>
                  <button (click)="scrollToCatalog()" class="px-6 py-3 rounded-2xl font-black text-xs text-white shadow-md" [style.background]="theme().accentColor">
                    {{ theme().promoCtaText || 'Pedir Combo Ahora' }}
                  </button>
                </div>
                <div class="w-full md:w-80 h-48 rounded-2xl overflow-hidden border border-amber-200 shadow-md shrink-0">
                  <img [src]="theme().promoImageUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80'" class="w-full h-full object-cover" />
                </div>
              </div>
            </section>
          }

          <!-- 6. Fresh Product Catalog in Bento Grid -->
          <main id="catalog-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
            <div class="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-2xl font-black text-stone-900 tracking-tight">Catálogo de Productos</h3>
                <p class="text-xs text-stone-600 mt-0.5">Selecciona tus favoritos y añádelos a tu pedido en 1 clic.</p>
              </div>
            </div>

            <ng-container *ngTemplateOutlet="filterBar; context: { darkMode: false }"></ng-container>
            <ng-container *ngTemplateOutlet="productGrid; context: { darkMode: false }"></ng-container>
          </main>

          <!-- 7. Customer Love Wall -->
          @if (theme().showReviews !== false) {
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-amber-200/80">
              <div class="text-center max-w-lg mx-auto mb-8">
                <span class="text-xs font-black uppercase tracking-widest text-amber-700">✦ Clientes Felices</span>
                <h3 class="text-2xl font-black text-stone-900 mt-1">Muro de Agradecimientos</h3>
                <p class="text-xs text-stone-600 mt-1">Lo que opinan quienes ya recibieron su pedido en casa.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                @for (rev of warmReviews; track rev.name) {
                  <div class="p-5 rounded-3xl bg-white border border-amber-200/80 shadow-xs space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="text-amber-500 text-sm">★★★★★</div>
                      <span class="text-lg">💖</span>
                    </div>
                    <p class="text-xs text-stone-700 leading-relaxed">"{{ rev.comment }}"</p>
                    <div class="pt-2 border-t border-stone-100 flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                        {{ rev.name.charAt(0) }}
                      </div>
                      <div>
                        <div class="text-xs font-black text-stone-900">{{ rev.name }}</div>
                        <div class="text-[10px] text-stone-500">{{ rev.dish }}</div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- 8. Friendly FAQ -->
          @if (theme().showFaq !== false) {
            <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
              <div class="text-center mb-8">
                <h3 class="text-xl font-black text-stone-900">Preguntas Frecuentes sobre Envíos</h3>
              </div>

              <div class="space-y-3">
                @for (faq of faqs; track faq.q; let i = $index) {
                  <div class="rounded-2xl border border-amber-200/90 bg-white overflow-hidden shadow-xs">
                    <button
                      (click)="toggleFaq(i)"
                      class="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-stone-900 hover:bg-amber-50/50 transition-colors"
                    >
                      <span>{{ faq.q }}</span>
                      <span class="text-amber-600 text-base ml-2">{{ expandedFaq() === i ? '−' : '+' }}</span>
                    </button>
                    @if (expandedFaq() === i) {
                      <div class="px-4 pb-4 text-xs text-stone-600 leading-relaxed border-t border-amber-100 pt-2 animate-fade-in">
                        {{ faq.a }}
                      </div>
                    }
                  </div>
                }
              </div>
            </section>
          }

          <!-- 9. Warm Artisanal Footer -->
          <footer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-10 border-t border-amber-200 text-xs text-stone-600">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
              <div class="md:col-span-2 space-y-3">
                <h4 class="font-black text-stone-900 text-base">{{ storeData()?.tenant?.name }}</h4>
                <p class="text-stone-600 leading-relaxed max-w-sm">{{ storeData()?.config?.businessDescription }}</p>
                <div class="text-[11px]">📍 {{ storeData()?.config?.address }}</div>
              </div>
              <div>
                <h5 class="font-black text-stone-900 text-xs mb-2">Horarios de Entrega</h5>
                <p class="text-[11px]">{{ storeData()?.config?.workingHours }}</p>
                <p class="text-[11px] font-bold text-amber-800 mt-2">🛵 Despacho diario</p>
              </div>
              <div>
                <h5 class="font-black text-stone-900 text-xs mb-2">Formas de Pago</h5>
                <p class="text-[11px]">{{ storeData()?.config?.paymentMethods }}</p>
              </div>
            </div>
            <div class="pt-6 border-t border-amber-200/80 text-center text-[11px] text-stone-500">
              © 2026 {{ storeData()?.tenant?.name }}. Preparado con cariño.
            </div>
          </footer>

          <ng-container *ngTemplateOutlet="cartDrawer; context: { darkMode: false }"></ng-container>
          <ng-container *ngTemplateOutlet="floatingWaButton; context: { darkMode: false }"></ng-container>
        </div>
      }

    </div>

    <!-- ─── SHARED TEMPLATES ──────────────────────────────────────────────────── -->

    <!-- Filter Bar template -->
    <ng-template #filterBar let-darkMode="darkMode">
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-8">
        <!-- Category Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            (click)="selectedCategory.set(null)"
            class="px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap active:scale-95 shadow-xs"
            [style.background]="selectedCategory() === null ? theme().accentColor : (darkMode ? '#131d31' : 'white')"
            [style.color]="selectedCategory() === null ? (darkMode ? '#090d16' : 'white') : (darkMode ? '#94a3b8' : '#475569')"
            [style.border-color]="selectedCategory() === null ? theme().accentColor : (darkMode ? '#334155' : '#e2e8f0')"
          >
            Todos ({{ storeData()?.products?.length || 0 }})
          </button>
          <button
            *ngFor="let cat of storeData()?.categories"
            (click)="selectedCategory.set(cat.id)"
            class="px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap active:scale-95 shadow-xs"
            [style.background]="selectedCategory() === cat.id ? theme().accentColor : (darkMode ? '#131d31' : 'white')"
            [style.color]="selectedCategory() === cat.id ? (darkMode ? '#090d16' : 'white') : (darkMode ? '#94a3b8' : '#475569')"
            [style.border-color]="selectedCategory() === cat.id ? theme().accentColor : (darkMode ? '#334155' : '#e2e8f0')"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Search & Layout Select -->
        <div class="flex items-center gap-2 min-w-[240px]">
          <div class="relative flex-1">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" [style.color]="darkMode ? '#64748b' : '#94a3b8'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar productos..."
              class="w-full rounded-xl pl-9 pr-4 py-2 text-xs border focus:outline-none transition-colors"
              [style.background]="darkMode ? '#131d31' : 'white'"
              [style.border-color]="darkMode ? '#334155' : '#e2e8f0'"
              [style.color]="darkMode ? '#f1f5f9' : '#1e293b'"
            />
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Product Grid template — adapts to layout and dark/light mode -->
    <ng-template #productGrid let-darkMode="darkMode">
      <div *ngIf="filteredProducts().length === 0" class="py-16 text-center" [style.color]="darkMode ? '#475569' : '#94a3b8'">
        <div class="text-3xl mb-2">🔍</div>
        <p class="text-sm font-medium">No se encontraron productos en esta categoría o búsqueda.</p>
      </div>

      <!-- Grid layout -->
      <div *ngIf="theme().productLayout !== 'list'"
           class="gap-5"
           [class]="getProductGridClasses()">
        <div
          *ngFor="let prod of filteredProducts()"
          class="rounded-3xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl border"
          [style.background]="darkMode ? '#131d31' : 'white'"
          [style.border-color]="darkMode ? '#1e293b' : '#f1f5f9'"
        >
          <!-- Image Container -->
          <div class="relative aspect-square overflow-hidden" [style.background]="darkMode ? '#090d16' : '#f8fafc'">
            <img *ngIf="prod.images && prod.images.length > 0" [src]="prod.images[0].imageUrl" [alt]="prod.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            <div *ngIf="!prod.images || prod.images.length === 0" class="w-full h-full flex items-center justify-center" [style.color]="darkMode ? '#334155' : '#cbd5e1'">
              <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>

            <!-- Badges -->
            <span *ngIf="prod.stock > 0" class="absolute top-3 left-3 px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider text-white shadow-sm" [style.background]="theme().accentColor">
              Stock: {{ prod.stock }}
            </span>
            <span *ngIf="prod.stock <= 0" class="absolute top-3 left-3 px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider text-white bg-rose-500">
              Agotado
            </span>
          </div>

          <!-- Product Details -->
          <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider block mb-1" [style.color]="theme().accentColor">
                {{ prod.categoryName || 'General' }}
              </span>
              <h3 class="text-sm font-black line-clamp-2 leading-snug" [style.color]="darkMode ? 'white' : '#0f172a'">
                {{ prod.name }}
              </h3>
              <p class="text-xs mt-1.5 line-clamp-2 leading-relaxed" [style.color]="darkMode ? '#94a3b8' : '#64748b'">
                {{ prod.description }}
              </p>
            </div>

            <div class="mt-4 pt-3 border-t flex flex-col gap-2.5" [style.border-color]="darkMode ? '#1e293b' : '#f1f5f9'">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold" [style.color]="darkMode ? '#64748b' : '#94a3b8'">Precio</span>
                  <div class="text-lg font-black" [style.color]="darkMode ? 'white' : '#0f172a'">
                    S/ {{ prod.price.toFixed(2) }}
                  </div>
                </div>

                <!-- WhatsApp Quick Order Button -->
                <a
                  [href]="productWhatsappUrl(prod)"
                  target="_blank"
                  class="p-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 text-emerald-500 hover:bg-emerald-500/10"
                  [style.border-color]="darkMode ? '#334155' : '#e2e8f0'"
                  title="Pedir por WhatsApp"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>

              <!-- Cart Add Button -->
              @if ((theme().purchaseMode || 'both') !== 'whatsapp') {
                <button
                  (click)="addToCart(prod)"
                  [disabled]="prod.stock <= 0"
                  class="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white shadow-xs"
                  [style.background]="theme().accentColor"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                  Añadir al Carrito
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- List layout -->
      <div *ngIf="theme().productLayout === 'list'" class="space-y-3">
        <div
          *ngFor="let prod of filteredProducts()"
          class="rounded-2xl overflow-hidden flex flex-col sm:flex-row gap-4 p-4 border transition-all hover:shadow-md group"
          [style.background]="darkMode ? '#131d31' : 'white'"
          [style.border-color]="darkMode ? '#1e293b' : '#f1f5f9'"
        >
          <div class="w-full sm:w-28 h-28 rounded-xl overflow-hidden shrink-0" [style.background]="darkMode ? '#090d16' : '#f8fafc'">
            <img *ngIf="prod.images && prod.images.length > 0" [src]="prod.images[0].imageUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          </div>

          <div class="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider" [style.color]="theme().accentColor">
                {{ prod.categoryName || 'General' }}
              </span>
              <h3 class="text-sm font-black line-clamp-1" [style.color]="darkMode ? 'white' : '#0f172a'">
                {{ prod.name }}
              </h3>
              <p class="text-xs line-clamp-2 mt-0.5" [style.color]="darkMode ? '#94a3b8' : '#64748b'">
                {{ prod.description }}
              </p>
            </div>

            <div class="flex items-center justify-between mt-3 pt-2 border-t" [style.border-color]="darkMode ? '#1e293b' : '#f1f5f9'">
              <div>
                <span class="text-[10px] uppercase font-bold" [style.color]="darkMode ? '#64748b' : '#94a3b8'">Precio: </span>
                <span class="text-sm font-black" [style.color]="darkMode ? 'white' : '#0f172a'">S/ {{ prod.price.toFixed(2) }}</span>
              </div>

              <div class="flex items-center gap-2">
                <a [href]="productWhatsappUrl(prod)" target="_blank" class="p-2 rounded-xl text-xs font-bold border text-emerald-500 hover:bg-emerald-500/10 transition-colors" [style.border-color]="darkMode ? '#334155' : '#e2e8f0'">
                  WhatsApp
                </a>
                <button
                  (click)="addToCart(prod)"
                  [disabled]="prod.stock <= 0"
                  class="px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-40 text-white"
                  [style.background]="theme().accentColor"
                >
                  + Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- ─── Cart Drawer (shared across all templates) ─────────────────────────── -->
    <ng-template #cartDrawer let-darkMode="darkMode">
      <div *ngIf="openCartDrawer()" class="fixed inset-0 z-50 overflow-hidden font-sans">
        <div (click)="openCartDrawer.set(false)" class="absolute inset-0 backdrop-blur-sm" [style.background]="darkMode ? 'rgba(2,6,23,0.75)' : 'rgba(15,23,42,0.4)'"></div>
        <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div class="w-screen max-w-md border-l shadow-2xl flex flex-col"
               [style.background]="darkMode ? '#090d16' : 'white'"
               [style.border-color]="darkMode ? '#1e293b' : '#e2e8f0'">

            <!-- Drawer Header -->
            <div class="p-5 border-b flex items-center justify-between" [style.border-color]="darkMode ? '#1e293b' : '#f1f5f9'">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" [style.color]="theme().accentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                <h2 class="text-base font-bold" [style.color]="darkMode ? 'white' : '#1e293b'">Tu Carrito de Compras</h2>
              </div>
              <button (click)="openCartDrawer.set(false)" class="p-1 rounded-lg hover:bg-slate-500/10 text-slate-400">✕</button>
            </div>

            <!-- Drawer Body / Item List -->
            <div class="flex-1 overflow-y-auto p-5 space-y-4">
              <div *ngIf="cart().length === 0" class="py-12 text-center text-slate-400">
                <div class="text-4xl mb-3">🛒</div>
                <p class="text-sm font-semibold">Tu carrito está vacío</p>
                <p class="text-xs mt-1 text-slate-500">Agrega productos desde la tienda para iniciar tu compra.</p>
              </div>

              <div *ngFor="let item of cart()" class="flex gap-3 pb-4 border-b" [style.border-color]="darkMode ? '#1e293b' : '#f1f5f9'">
                <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 border" [style.border-color]="darkMode ? '#334155' : '#e2e8f0'" [style.background]="darkMode ? '#1e293b' : '#f8fafc'">
                  <img *ngIf="item.product.images && item.product.images.length > 0" [src]="item.product.images[0].imageUrl" class="w-full h-full object-cover"/>
                </div>
                <div class="flex-1 min-w-0 flex flex-col justify-between">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="text-xs font-bold truncate" [style.color]="darkMode ? 'white' : '#1e293b'">{{ item.product.name }}</h4>
                    <button (click)="removeItem(item)" class="text-[11px] text-rose-500 hover:text-rose-700">✕</button>
                  </div>
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-xs font-black" [style.color]="theme().accentColor">S/ {{ (item.product.price * item.quantity).toFixed(2) }}</span>
                    <div class="flex items-center border rounded-lg overflow-hidden text-xs" [style.border-color]="darkMode ? '#334155' : '#cbd5e1'">
                      <button (click)="decrementItem(item)" class="px-2 py-0.5 hover:bg-slate-500/10">−</button>
                      <span class="px-2 font-bold">{{ item.quantity }}</span>
                      <button (click)="incrementItem(item)" class="px-2 py-0.5 hover:bg-slate-500/10">+</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Checkout Form -->
              <div *ngIf="cart().length > 0" class="pt-4 space-y-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Datos para la Entrega</h4>
                <input type="text" [(ngModel)]="checkoutName" placeholder="Tu Nombre Completo" class="w-full text-xs rounded-xl p-2.5 border bg-transparent" [style.border-color]="darkMode ? '#334155' : '#e2e8f0'"/>
                <input type="tel" [(ngModel)]="checkoutPhone" placeholder="Tu WhatsApp (Ej: 987654321)" class="w-full text-xs rounded-xl p-2.5 border bg-transparent" [style.border-color]="darkMode ? '#334155' : '#e2e8f0'"/>
                <input type="text" [(ngModel)]="checkoutAddress" placeholder="Dirección de Envío / Distrito" class="w-full text-xs rounded-xl p-2.5 border bg-transparent" [style.border-color]="darkMode ? '#334155' : '#e2e8f0'"/>
              </div>
            </div>

            <!-- Drawer Footer -->
            <div *ngIf="cart().length > 0" class="p-5 border-t space-y-3" [style.border-color]="darkMode ? '#1e293b' : '#f1f5f9'">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">Subtotal:</span>
                <span class="text-base font-black" [style.color]="darkMode ? 'white' : '#0f172a'">S/ {{ cartSubtotal().toFixed(2) }}</span>
              </div>

              <button
                (click)="onProcessCheckout()"
                [disabled]="processingCheckout()"
                class="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
                [style.background]="theme().accentColor"
              >
                @if (processingCheckout()) {
                  <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Procesando pedido...</span>
                } @else {
                  <span>Continuar al Pago / Confirmación →</span>
                }
              </button>

              <button
                (click)="sendCartOrderToWhatsApp()"
                class="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95"
              >
                <span>💬 Despachar vía WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </ng-template>

    <!-- Floating WhatsApp Action -->
    <ng-template #floatingWaButton let-darkMode="darkMode">
      <a [href]="whatsappDirectUrl()" target="_blank"
         class="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-transform hover:scale-110 active:scale-95 text-white"
         [style.background]="theme().accentColor"
         title="Chatear con el Asistente WhatsApp">
        <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </ng-template>
  `,
})
export class StoreFrontComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tenantsService = inject(TenantsService);
  private orderService = inject(OrdersService);
  private toast = inject(ToastService);

  storeSlug = signal<string>('');
  loading = signal<boolean>(true);
  notFound = signal<boolean>(false);
  storeData = signal<PublicStoreData | null>(null);

  selectedCategory = signal<string | null>(null);
  searchQuery = '';
  cart = signal<CartItem[]>([]);
  openCartDrawer = signal<boolean>(false);
  processingCheckout = signal<boolean>(false);
  expandedFaq = signal<number | null>(null);

  checkoutName = '';
  checkoutPhone = '';
  checkoutAddress = '';
  checkoutDeliveryType = 'EXPRESS_ZONE1';

  techReviews = [
    { name: 'Carlos Mendoza', city: 'Lima', comment: 'Excelente atención por WhatsApp. Pedí el teclado mecánico y me llegó al día siguiente impecable con su garantía.' },
    { name: 'Valeria Rivas', city: 'Miraflores', comment: 'El asistente responde al instante las dudas de stock y especificaciones técnicas. Muy recomendada la tienda.' },
    { name: 'Rodrigo Flores', city: 'Arequipa', comment: 'Compré los auriculares con cancelación de ruido. Sonido de primer nivel y seguimiento en todo momento.' },
  ];

  boutiqueReviews = [
    { name: 'Camila Sotomayor', comment: 'El empaque llegó hermoso, con una presentación impecable. La atención personalizada fue exquisita.' },
    { name: 'Luciana Benavides', comment: 'Prendas de autor con un calce y textura de ensueño. Ya es mi boutique favorita de compras online.' },
    { name: 'Sofía Larco', comment: 'Compré un set para regalo y causó sensación. La curaduría y delicadeza se notan en cada detalle.' },
  ];

  warmReviews = [
    { name: 'María Elena Gómez', dish: 'Pack Desayuno Familiar', comment: '¡Todo fresquísimo y delicioso! El pan y café llegaron calientitos a casa en minutos.' },
    { name: 'Jorge Huamán', dish: 'Canasta Orgánica', comment: 'Atención súper amable y cariñosa. Pagamos con Yape al recibir. Definitivamente volveremos a pedir.' },
    { name: 'Ana Torres', dish: 'Postres Artesanales', comment: 'Los mejores postres de la zona. Se nota el cariño y la calidad en cada bocado.' },
  ];

  faqs = [
    {
      q: '¿Cómo realizo mi compra?',
      a: 'Puedes agregar los productos que desees a la bolsa o carrito y procesar tu pedido directamente en la web, o hacer clic en "Pedir por WhatsApp" para ser atendido de inmediato por nuestro Asistente Inteligente.',
    },
    {
      q: '¿Cuáles son los métodos de pago aceptados?',
      a: 'Aceptamos transferencias bancarias, Yape, tarjetas de crédito/débito (Visa, Mastercard, Amex vía Mercado Pago) y pago en efectivo contra entrega según tu distrito.',
    },
    {
      q: '¿Cuánto demora el despacho y envío?',
      a: 'Envíos express en Lima dentro de las 24 a 48 horas hábiles. Para provincias coordinamos despachos vía agencias certificadas con código de seguimiento en tiempo real.',
    },
    {
      q: '¿Los productos cuentan con garantía?',
      a: 'Sí, todos nuestros productos son nuevos, certificados y cuentan con garantía oficial de tienda para cambios o devoluciones por defectos de fábrica.',
    },
  ];

  theme = computed<StoreThemeConfig>(() => {
    const raw = this.storeData()?.config?.storeTheme;
    if (!raw) return DEFAULT_THEME;
    try {
      const parsed = JSON.parse(raw);
      const validTemplate = ['dark-tech', 'light-minimal', 'warm-brand'].includes(parsed.templateId)
        ? parsed.templateId
        : DEFAULT_THEME.templateId;
      return { ...DEFAULT_THEME, ...parsed, templateId: validTemplate };
    } catch {
      return DEFAULT_THEME;
    }
  });

  fontFamilyStyle = computed(() => {
    const f = this.theme().fontFamily;
    if (f === 'outfit') return "'Outfit', sans-serif";
    if (f === 'jakarta') return "'Plus Jakarta Sans', sans-serif";
    if (f === 'inter') return "'Inter', sans-serif";
    if (f === 'playfair') return "'Playfair Display', serif";
    return "'Plus Jakarta Sans', sans-serif";
  });

  filteredProducts = computed(() => {
    const data = this.storeData();
    if (!data) return [];
    let list: Product[] = data.products || [];
    if (this.selectedCategory()) {
      list = list.filter((p: Product) => p.categoryId === this.selectedCategory());
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter((p: Product) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)),
      );
    }
    return list;
  });

  totalCartCount = computed(() => this.cart().reduce((sum: number, i: CartItem) => sum + i.quantity, 0));
  cartSubtotal = computed(() => this.cart().reduce((sum: number, i: CartItem) => sum + i.product.price * i.quantity, 0));

  whatsappDirectUrl = computed(() => {
    const data = this.storeData();
    const phone = data?.config?.phone?.replace(/\D/g, '') || '51987654321';
    const storeName = data?.tenant?.name || 'la tienda';
    const msg = encodeURIComponent(`¡Hola! 👋 Vengo de la tienda web de *${storeName}* y me gustaría hacer una consulta o pedido.`);
    return `https://wa.me/${phone}?text=${msg}`;
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.storeSlug.set(slug);
        this.loadStore(slug);
      }
    });
  }

  @HostListener('window:focus')
  onWindowFocus() {
    const slug = this.storeSlug();
    if (slug) {
      this.loadStore(slug, false);
    }
  }

  loadStore(slug: string, showLoader: boolean = true) {
    if (showLoader && !this.storeData()) {
      this.loading.set(true);
    }
    this.notFound.set(false);
    this.tenantsService.getPublicStore(slug).subscribe({
      next: (data) => {
        this.storeData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!this.storeData()) {
          this.notFound.set(true);
        }
      },
    });
  }

  getHeroImageUrl(): string {
    return this.theme().heroBannerUrl || DEFAULT_THEME.heroBannerUrl!;
  }

  getProductGridClasses(): string {
    const layout = this.theme().productLayout;
    if (layout === 'grid-4') {
      return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
    if (layout === 'grid-2') {
      return 'grid grid-cols-1 sm:grid-cols-2';
    }
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }

  productWhatsappUrl(prod: Product): string {
    const data = this.storeData();
    const phone = data?.config?.phone?.replace(/\D/g, '') || '51987654321';
    const storeName = data?.tenant?.name || 'la tienda';
    const msg = encodeURIComponent(
      `¡Hola! 👋 Estoy en la tienda web de *${storeName}* y me gustaría comprar el producto:\n\n` +
      `📦 *${prod.name}*\n` +
      `💰 Precio: S/ ${prod.price.toFixed(2)}\n` +
      (prod.sku ? `🔖 SKU: ${prod.sku}\n\n` : '\n') +
      `¿Tienen disponibilidad para envío inmediato?`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  }

  toggleFaq(index: number) {
    this.expandedFaq.update((curr) => (curr === index ? null : index));
  }

  scrollToCatalog() {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  addToCart(product: Product) {
    this.cart.update((items: CartItem[]) => {
      const existing = items.find((i) => i.product.id === product.id);
      if (existing) return items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...items, { product, quantity: 1 }];
    });
    this.openCartDrawer.set(true);
  }

  incrementItem(item: CartItem) {
    this.cart.update((items: CartItem[]) =>
      items.map((i) => (i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i)),
    );
  }

  decrementItem(item: CartItem) {
    this.cart.update((items: CartItem[]) => {
      if (item.quantity <= 1) return items.filter((i) => i.product.id !== item.product.id);
      return items.map((i) => (i.product.id === item.product.id ? { ...i, quantity: i.quantity - 1 } : i));
    });
  }

  removeItem(item: CartItem) {
    this.cart.update((items: CartItem[]) => items.filter((i) => i.product.id !== item.product.id));
  }

  sendCartOrderToWhatsApp() {
    const data = this.storeData();
    const phone = data?.config?.phone?.replace(/\D/g, '') || '51987654321';
    const storeName = data?.tenant?.name || 'la tienda';

    const itemsText = this.cart()
      .map((i) => `• ${i.quantity}x ${i.product.name} (S/ ${(i.product.price * i.quantity).toFixed(2)})`)
      .join('\n');

    const customerDetails =
      (this.checkoutName ? `👤 *Cliente:* ${this.checkoutName}\n` : '') +
      (this.checkoutPhone ? `📱 *Teléfono:* ${this.checkoutPhone}\n` : '') +
      (this.checkoutAddress ? `📍 *Dirección:* ${this.checkoutAddress}\n` : '');

    const message = encodeURIComponent(
      `¡Hola *${storeName}*! 👋 Deseo realizar el siguiente pedido desde su tienda web:\n\n` +
      `${itemsText}\n\n` +
      `💰 *Total:* S/ ${this.cartSubtotal().toFixed(2)}\n\n` +
      (customerDetails ? `${customerDetails}\n` : '') +
      `¿Podrían confirmarme la disponibilidad y tiempo de entrega? ¡Gracias!`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  }

  onProcessCheckout() {
    if (!this.checkoutName || !this.checkoutPhone) {
      this.toast.warning('Por favor ingresa tu nombre y número de WhatsApp para procesar la entrega.', 'Datos Incompletos');
      return;
    }
    this.processingCheckout.set(true);
    const tenantId = this.storeData()?.tenant?.id;
    this.orderService
      .createPublicCheckoutOrder({
        tenantId,
        storeSlug: this.storeSlug(),
        customerName: this.checkoutName,
        customerPhone: this.checkoutPhone,
        customerAddress: this.checkoutAddress || 'Recojo en Tienda',
        deliveryType: this.checkoutDeliveryType,
        items: this.cart().map((i: CartItem) => ({ productId: i.product.id, quantity: i.quantity })),
      })
      .subscribe({
        next: (res: any) => {
          this.processingCheckout.set(false);
          this.cart.set([]);
          this.openCartDrawer.set(false);
          this.toast.success('¡Pedido creado con éxito! Redirigiendo a la pasarela...');
          this.router.navigate([`/pay/${res.orderNumber}`]);
        },
        error: (err: any) => {
          this.processingCheckout.set(false);
          this.toast.error(err.error?.message || 'Error al procesar el pedido. Intenta nuevamente.');
        },
      });
  }
}
