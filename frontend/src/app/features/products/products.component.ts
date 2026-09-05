import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ProductsService } from '../../core/services/products.service';
import { UploadService } from '../../core/services/upload.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TenantsService } from '../../core/services/tenants.service';
import { Product, Category, ProductImage, TenantQuota } from '../../core/models/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BentoCardComponent, BadgeComponent],
  template: `
    <app-navbar title="Catálogo & Inventario" subtitle="Gestión de productos, fotos, videos demostrativos y stock"></app-navbar>

    <div class="space-y-6 mt-6 pb-12">
      
      <!-- Top Action Bar -->
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <!-- Search and Category Filters -->
        <div class="flex-1 flex flex-wrap items-center gap-3">
          <div class="relative min-w-[240px] flex-1 sm:flex-initial">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Buscar por nombre, SKU..."
              class="input-bento pl-9"
            />
            <svg class="w-4 h-4 text-zinc-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Category Pills -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              (click)="selectCategory('')"
              [class]="'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ' + (selectedCategory() === '' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')"
            >
              Todas
            </button>
            @for (cat of categories(); track cat.id) {
              <button
                (click)="selectCategory(cat.id)"
                [class]="'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ' + (selectedCategory() === cat.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')"
              >
                {{ cat.name }}
              </button>
            }
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5 self-end sm:self-auto">
          <!-- Quota Badge -->
          @if (quota()) {
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white text-xs font-semibold shadow-2xs"
                 [class]="quota()!.products.isUnlimited ? 'border-zinc-200 text-zinc-600' : (quota()!.products.used >= quota()!.products.max ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-zinc-200 text-zinc-700')">
              <span class="w-2 h-2 rounded-full" [class]="quota()!.products.used >= quota()!.products.max && !quota()!.products.isUnlimited ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'"></span>
              <span>{{ quota()!.products.used }} / {{ quota()!.products.isUnlimited ? '∞' : quota()!.products.max }} prod.</span>
              <span class="text-[10px] text-zinc-400 font-normal">({{ quota()!.planName }})</span>
            </div>
          }

          <button
            (click)="downloadPdf()"
            [disabled]="isGeneratingPdf()"
            class="btn-secondary whitespace-nowrap text-xs"
            title="Generar y descargar catálogo en PDF profesional"
          >
            @if (isGeneratingPdf()) {
              <span class="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Generando PDF...</span>
            } @else {
              <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Catálogo PDF</span>
            }
          </button>

          <button (click)="openCreateModal()" class="btn-primary whitespace-nowrap text-xs">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <!-- Bento Product Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        @if (isLoading()) {
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <app-bento-card customClass="flex flex-col justify-between animate-pulse">
              <div>
                <div class="w-full h-44 rounded-2xl bg-zinc-200/70 mb-4"></div>
                <div class="space-y-2">
                  <div class="h-3 bg-zinc-200 rounded w-16"></div>
                  <div class="h-4 bg-zinc-200 rounded w-3/4"></div>
                  <div class="h-5 bg-zinc-200 rounded w-24 mt-2"></div>
                </div>
              </div>
            </app-bento-card>
          }
        } @else {
          @for (product of filteredProducts(); track product.id) {
            <app-bento-card customClass="flex flex-col justify-between group hover:border-indigo-300/80">
              <div>
                <!-- Product Image Frame -->
                <div class="relative w-full h-44 rounded-2xl overflow-hidden bg-zinc-100 mb-4 border border-zinc-200/80">
                  <img
                    [src]="getPrimaryImage(product)"
                    [alt]="product.name"
                    loading="lazy"
                    decoding="async"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                
                <!-- SKU & Media Badges -->
                <div class="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                  <span class="px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-sm text-[10px] font-mono font-bold text-zinc-800 border border-zinc-200 shadow-sm">
                    {{ product.sku }}
                  </span>
                  @if (product.videoUrl) {
                    <span class="px-2 py-0.5 rounded-lg bg-indigo-600/90 backdrop-blur-sm text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      Video Demo
                    </span>
                  }
                  @if ((product.images?.length || 0) > 1) {
                    <span class="px-2 py-0.5 rounded-lg bg-zinc-900/80 backdrop-blur-sm text-[10px] font-semibold text-white shadow-sm">
                      📸 {{ product.images?.length }} fotos
                    </span>
                  }
                </div>

                <!-- Stock status badge -->
                <div class="absolute top-2.5 right-2.5">
                  @if (product.stock <= product.minStockAlert) {
                    <span class="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold shadow-sm">
                      Bajo Stock ({{ product.stock }})
                    </span>
                  } @else {
                    <span class="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
                      Stock: {{ product.stock }}
                    </span>
                  }
                </div>
              </div>

              <!-- Product Info -->
              <div class="space-y-1">
                <span class="text-zinc-500 font-mono text-[10px] uppercase tracking-wider font-semibold block">
                  {{ product.categoryName || 'General' }}
                </span>
                <h4 class="font-bold text-zinc-900 text-sm leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {{ product.name }}
                </h4>
                <p class="text-xs text-zinc-500 font-normal line-clamp-2 mt-1 leading-relaxed">
                  {{ product.description }}
                </p>
              </div>

              <!-- Price & Stock Quick Adjust -->
              <div class="mt-4 pt-3 border-t border-zinc-100 flex items-baseline justify-between">
                <div>
                  <span class="text-[10px] uppercase font-mono text-zinc-400 font-semibold block">Precio</span>
                  <p class="text-xl font-extrabold tracking-tight text-zinc-900 font-mono">S/ {{ product.price | number: '1.2-2' }}</p>
                </div>
                
                <!-- Quick Stock Adjuster -->
                <div class="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200 shadow-sm">
                  <button
                    (click)="adjustStock(product, -1)"
                    class="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-lg text-sm font-bold transition-all"
                  >
                    -
                  </button>
                  <span class="font-mono text-xs font-bold px-2 text-zinc-800">{{ product.stock }}</span>
                  <button
                    (click)="adjustStock(product, 1)"
                    class="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-lg text-sm font-bold transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
              <button
                (click)="openEditModal(product)"
                class="btn-secondary flex-1 py-1.5 text-xs font-semibold"
              >
                <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Editar</span>
              </button>
              
              @if (authService.isAdmin()) {
                <button
                  (click)="deleteProduct(product)"
                  class="btn-danger p-2 text-xs"
                  title="Eliminar producto"
                >
                  <svg class="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              }
            </div>
          </app-bento-card>
        } @empty {
          <div class="col-span-full py-16 text-center">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 class="text-base font-bold text-zinc-800">No se encontraron productos</h4>
            <p class="text-xs text-zinc-500 mt-1">Prueba con otra búsqueda o añade un nuevo producto.</p>
          </div>
        }
      }
      </div>

    </div>

    <!-- Product Create/Edit Modal with Multi-Images (3 max) and Video (10MB max) -->
    @if (isModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div class="relative w-full max-w-xl max-h-[94vh] overflow-y-auto rounded-3xl bg-white border border-zinc-200 shadow-2xl p-5 sm:p-7">
          
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-lg font-bold text-zinc-900">
                {{ editingProduct() ? 'Editar Producto' : 'Crear Nuevo Producto' }}
              </h3>
              <p class="text-xs text-zinc-500 mt-0.5">Configura detalles, fotos (hasta 3) y video demostrativo (&lt; 10MB)</p>
            </div>
            <button (click)="isModalOpen.set(false)" class="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form (ngSubmit)="saveProduct()" class="space-y-4">
            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Nombre del Producto</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required placeholder="Ej: Auriculares Bluetooth Pro" class="input-bento text-xs" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Código / SKU</label>
                <input type="text" [(ngModel)]="formData.sku" name="sku" required class="input-bento font-mono uppercase text-xs" />
              </div>
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Categoría</label>
                <select [(ngModel)]="formData.categoryId" name="categoryId" required class="input-bento text-xs">
                  @for (c of categories(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Precio (S/.)</label>
                <input type="number" step="0.01" [(ngModel)]="formData.price" name="price" required class="input-bento font-mono text-xs" />
              </div>
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Stock</label>
                <input type="number" [(ngModel)]="formData.stock" name="stock" required class="input-bento font-mono text-xs" />
              </div>
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Alerta Mín.</label>
                <input type="number" [(ngModel)]="formData.minStockAlert" name="minStockAlert" class="input-bento font-mono text-xs" />
              </div>
            </div>

            <!-- Multi-Image Upload (Up to 3 Images) -->
            <div class="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-zinc-700 font-bold text-xs">
                    📸 Fotografías del Producto (Hasta 3)
                  </label>
                  <span class="text-[10px] text-zinc-400">La foto con estrella ⭐ es la principal para el catálogo.</span>
                </div>
                <span class="text-[11px] font-mono font-bold" [class.text-indigo-600]="formData.images.length < 3" [class.text-rose-500]="formData.images.length >= 3">
                  {{ formData.images.length }} / 3
                </span>
              </div>

              <!-- Thumbnails Grid -->
              @if (formData.images.length > 0) {
                <div class="grid grid-cols-3 gap-2.5">
                  @for (img of formData.images; track $index) {
                    <div class="relative group rounded-xl overflow-hidden border border-zinc-200 bg-white aspect-square shadow-sm">
                      <img [src]="img.imageUrl" alt="Preview" class="w-full h-full object-cover" />
                      
                      <!-- Action Overlay -->
                      <div class="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          (click)="setPrimaryImage($index)"
                          [class]="'p-1.5 rounded-lg text-xs font-bold ' + (img.isPrimary ? 'bg-amber-400 text-zinc-900' : 'bg-white/80 text-zinc-800 hover:bg-white')"
                          title="Establecer como foto principal"
                        >
                          ⭐
                        </button>
                        <button
                          type="button"
                          (click)="removeImage($index)"
                          class="p-1.5 rounded-lg bg-rose-500 text-white text-xs hover:bg-rose-600"
                          title="Eliminar foto"
                        >
                          ✕
                        </button>
                      </div>

                      @if (img.isPrimary) {
                        <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-400 text-[9px] font-bold text-zinc-900 shadow-sm">
                          Principal
                        </span>
                      }
                    </div>
                  }
                </div>
              }

              <!-- Upload trigger if < 3 -->
              @if (formData.images.length < 3) {
                <div
                  (click)="imageFileInput.click()"
                  class="border-2 border-dashed border-zinc-300 rounded-xl p-3 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                >
                  <input
                    #imageFileInput
                    type="file"
                    accept="image/*"
                    (change)="onImageSelected($event)"
                    class="hidden"
                  />
                  @if (isUploadingImage()) {
                    <div class="flex items-center justify-center gap-2 text-xs text-indigo-600 font-semibold py-1">
                      <span class="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>Subiendo imagen...</span>
                    </div>
                  } @else {
                    <div class="flex items-center justify-center gap-1.5 text-xs text-zinc-600 font-semibold py-1">
                      <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Agregar Foto (+{{ 3 - formData.images.length }} disponibles)</span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Single Video Upload (Up to 1 Video, Max 10MB) -->
            <div class="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-zinc-700 font-bold text-xs">
                    🎥 Video Demostrativo del Producto (Máx. 10MB)
                  </label>
                  <span class="text-[10px] text-zinc-400">Luna enviará este video cuando un cliente pregunte por video o funcionamiento.</span>
                </div>
              </div>

              @if (formData.videoUrl) {
                <div class="relative rounded-xl overflow-hidden border border-zinc-200 bg-black/5 p-2 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-zinc-900 block truncate">Video Cargado</span>
                      <a [href]="formData.videoUrl" target="_blank" class="text-[10px] text-indigo-600 hover:underline block truncate">Ver video en pestaña nueva</a>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="formData.videoUrl = ''"
                    class="btn-danger p-2 text-xs shrink-0"
                    title="Eliminar video"
                  >
                    ✕
                  </button>
                </div>
              } @else {
                <div
                  (click)="videoFileInput.click()"
                  class="border-2 border-dashed border-zinc-300 rounded-xl p-3 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                >
                  <input
                    #videoFileInput
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/mov"
                    (change)="onVideoSelected($event)"
                    class="hidden"
                  />
                  @if (isUploadingVideo()) {
                    <div class="flex items-center justify-center gap-2 text-xs text-indigo-600 font-semibold py-1">
                      <span class="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>Subiendo video (&lt; 10MB)...</span>
                    </div>
                  } @else {
                    <div class="flex flex-col items-center gap-0.5 py-1">
                      <div class="flex items-center gap-1.5 text-xs text-zinc-700 font-semibold">
                        <svg class="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <span>Subir Video Demostrativo</span>
                      </div>
                      <span class="text-[10px] text-zinc-400">MP4, WEBM o MOV (Máximo estricto: 10MB)</span>
                    </div>
                  }
                </div>
              }
            </div>

            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Descripción & Ficha Técnica</label>
              <textarea [(ngModel)]="formData.description" name="description" rows="2" placeholder="Detalles y características para que Luna responda a las dudas del cliente..." class="input-bento text-xs resize-none"></textarea>
            </div>

            <div class="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button type="button" (click)="isModalOpen.set(false)" class="btn-secondary text-xs">Cancelar</button>
              <button type="submit" [disabled]="isUploadingImage() || isUploadingVideo()" class="btn-primary text-xs">
                Guardar Producto
              </button>
            </div>
          </form>

        </div>
      </div>
    }
  `,
})
export class ProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private uploadService = inject(UploadService);
  private tenantsService = inject(TenantsService);
  private toast = inject(ToastService);
  authService = inject(AuthService);

  quota = signal<TenantQuota | null>(null);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedCategory = signal<string>('');
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(true);

  filteredProducts = computed<Product[]>(() => {
    let result = Array.isArray(this.products()) ? this.products() : [];
    const cat = this.selectedCategory();
    if (cat) {
      result = result.filter((p) => p.categoryId === cat);
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }
    return result;
  });

  isModalOpen = signal(false);
  editingProduct = signal<Product | null>(null);

  isUploadingImage = signal(false);
  isUploadingVideo = signal(false);
  isGeneratingPdf = signal(false);

  formData = {
    name: '',
    sku: '',
    categoryId: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStockAlert: 5,
    description: '',
    videoUrl: '',
    images: [] as { imageUrl: string; isPrimary: boolean }[],
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    // Cargar cuota actual del plan del tenant
    this.tenantsService.getMyQuota().subscribe({
      next: (q) => this.quota.set(q),
      error: () => {},
    });

    forkJoin({
      cats: this.productsService.getCategories(),
      prods: this.productsService.getProducts(),
    }).subscribe({
      next: ({ cats, prods }: any) => {
        this.isLoading.set(false);
        this.categories.set(
          Array.isArray(cats)
            ? cats
            : cats?.categories && Array.isArray(cats.categories)
            ? cats.categories
            : [],
        );
        this.products.set(
          Array.isArray(prods)
            ? prods
            : prods?.products && Array.isArray(prods.products)
            ? prods.products
            : [],
        );
      },
      error: () => {
        this.isLoading.set(false);
        this.categories.set([]);
        this.products.set([]);
      },
    });
  }

  selectCategory(id: string) {
    this.selectedCategory.set(id);
  }

  getPrimaryImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      const primary = product.images.find((img) => img.isPrimary);
      return primary ? primary.imageUrl : product.images[0].imageUrl;
    }
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80';
  }

  adjustStock(product: Product, delta: number) {
    const newStock = Math.max(0, product.stock + delta);
    this.productsService.updateStock(product.id, newStock).subscribe({
      next: (updated) => {
        this.products.update((list) =>
          list.map((p) => (p.id === updated.id ? { ...p, stock: updated.stock } : p)),
        );
      },
    });
  }

  onImageSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.isUploadingImage.set(true);
      this.uploadService.uploadImage(file).subscribe({
        next: (res) => {
          const isFirst = this.formData.images.length === 0;
          this.formData.images.push({
            imageUrl: res.url,
            isPrimary: isFirst,
          });
          this.isUploadingImage.set(false);
          target.value = '';
        },
        error: () => {
          this.isUploadingImage.set(false);
          this.toast.error('Verifica el formato (JPG, PNG, WEBP).', 'Error al subir imagen');
          target.value = '';
        },
      });
    }
  }

  onVideoSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      
      // Validación de peso máximo estricto de 10MB
      if (file.size > 10 * 1024 * 1024) {
        this.toast.warning('El archivo de video seleccionado supera el límite de 10MB.', 'Límite de Video');
        target.value = '';
        return;
      }

      this.isUploadingVideo.set(true);
      this.uploadService.uploadVideo(file).subscribe({
        next: (res) => {
          this.formData.videoUrl = res.url;
          this.isUploadingVideo.set(false);
          this.toast.success('Video subido correctamente', 'Multimedia');
          target.value = '';
        },
        error: () => {
          this.isUploadingVideo.set(false);
          this.toast.error('Verifica que sea formato MP4, WEBM o MOV de menos de 10MB.', 'Error al subir video');
          target.value = '';
        },
      });
    }
  }

  setPrimaryImage(index: number) {
    this.formData.images.forEach((img, idx) => {
      img.isPrimary = idx === index;
    });
  }

  removeImage(index: number) {
    this.formData.images.splice(index, 1);
    if (this.formData.images.length > 0 && !this.formData.images.some((img) => img.isPrimary)) {
      this.formData.images[0].isPrimary = true;
    }
  }

  openCreateModal() {
    // Validar si el tenant alcanzó el límite de productos de su plan
    const q = this.quota();
    if (q && !q.products.isUnlimited && q.products.used >= q.products.max) {
      this.toast.warning(
        `Has alcanzado el límite de ${q.products.max} productos permitidos para tu plan actual (${q.planName}). Actualiza tu plan en Configuración para registrar más productos.`,
        'Límite de Plan Alcanzado',
      );
      return;
    }

    this.editingProduct.set(null);
    this.formData = {
      name: '',
      sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: this.categories()[0]?.id || '',
      price: 0,
      costPrice: 0,
      stock: 10,
      minStockAlert: 3,
      description: '',
      videoUrl: '',
      images: [],
    };
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product) {
    this.editingProduct.set(product);
    this.formData = {
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      price: product.price,
      costPrice: product.costPrice || 0,
      stock: product.stock,
      minStockAlert: product.minStockAlert,
      description: product.description,
      videoUrl: product.videoUrl || '',
      images: product.images ? product.images.map((img) => ({ imageUrl: img.imageUrl, isPrimary: !!img.isPrimary })) : [],
    };
    this.isModalOpen.set(true);
  }

  saveProduct() {
    const payload: any = {
      name: this.formData.name,
      sku: this.formData.sku,
      categoryId: this.formData.categoryId,
      price: Number(this.formData.price),
      costPrice: Number(this.formData.costPrice),
      stock: Number(this.formData.stock),
      minStockAlert: Number(this.formData.minStockAlert),
      description: this.formData.description,
      videoUrl: this.formData.videoUrl || undefined,
      images: this.formData.images,
    };

    if (this.editingProduct()) {
      this.productsService.updateProduct(this.editingProduct()!.id, payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.toast.success('Producto actualizado exitosamente.');
          this.loadData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error al actualizar producto.'),
      });
    } else {
      this.productsService.createProduct(payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.toast.success('Producto creado exitosamente.');
          this.loadData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error al crear producto.'),
      });
    }
  }

  async deleteProduct(product: Product) {
    const confirmed = await this.toast.confirm({
      title: 'Eliminar Producto',
      message: `¿Estás seguro de eliminar permanentemente "${product.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });

    if (confirmed) {
      this.productsService.deleteProduct(product.id).subscribe({
        next: () => {
          this.toast.success(`Producto "${product.name}" eliminado.`);
          this.loadData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error al eliminar producto.'),
      });
    }
  }

  downloadPdf() {
    this.isGeneratingPdf.set(true);
    this.productsService.downloadCatalogPdf().subscribe({
      next: (blob) => {
        this.isGeneratingPdf.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Catalogo_WSP_Flow_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toast.success('Catálogo PDF descargado con éxito.');
      },
      error: () => {
        this.isGeneratingPdf.set(false);
        this.toast.error('Error al generar el catálogo en PDF.');
      },
    });
  }
}
