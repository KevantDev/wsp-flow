import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ProductsService } from '../../core/services/products.service';
import { UploadService } from '../../core/services/upload.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, Category } from '../../core/models/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BentoCardComponent, BadgeComponent],
  template: `
    <app-navbar title="Catálogo & Inventario" subtitle="Gestión de productos, precios y control de stock"></app-navbar>

    <div class="space-y-6 mt-6">
      
      <!-- Top Action Bar -->
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <!-- Search and Category Filters -->
        <div class="flex-1 flex flex-wrap items-center gap-3">
          <div class="relative min-w-[240px] flex-1 sm:flex-initial">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="filterProducts()"
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
          <button
            (click)="downloadPdf()"
            [disabled]="isGeneratingPdf()"
            class="btn-secondary whitespace-nowrap"
            title="Generar y descargar catálogo en formato PDF profesional"
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

          <button (click)="openCreateModal()" class="btn-primary whitespace-nowrap">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <!-- Bento Product Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        @for (product of filteredProducts(); track product.id) {
          <app-bento-card customClass="flex flex-col justify-between group hover:border-indigo-300/80">
            <div>
              <!-- Product Image Frame -->
              <div class="relative w-full h-44 rounded-2xl overflow-hidden bg-zinc-100 mb-4 border border-zinc-200/80">
                <img
                  [src]="product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'"
                  [alt]="product.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                
                <!-- SKU Badge -->
                <div class="absolute top-2.5 left-2.5">
                  <span class="px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-sm text-[10px] font-mono font-bold text-zinc-800 border border-zinc-200 shadow-xs">
                    {{ product.sku }}
                  </span>
                </div>

                <!-- Stock status on image -->
                <div class="absolute top-2.5 right-2.5">
                  @if (product.stock <= product.minStockAlert) {
                    <span class="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                      Bajo Stock ({{ product.stock }})
                    </span>
                  } @else {
                    <span class="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
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
                  <p class="text-xl font-extrabold tracking-tight text-zinc-900 font-mono">&#36;{{ product.price | number: '1.2-2' }}</p>
                </div>
                
                <!-- Quick Stock Adjuster -->
                <div class="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200 shadow-xs">
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
      </div>

    </div>

    <!-- Product Create/Edit Modal with Image Uploading -->
    @if (isModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div class="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-zinc-200 shadow-2xl p-5 sm:p-7">
          
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-zinc-900">
              {{ editingProduct() ? 'Editar Producto' : 'Crear Nuevo Producto' }}
            </h3>
            <button (click)="isModalOpen.set(false)" class="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form (ngSubmit)="saveProduct()" class="space-y-4">
            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Nombre del Producto</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required placeholder="Ej: Auriculares Bluetooth Pro" class="input-bento" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Código / SKU</label>
                <input type="text" [(ngModel)]="formData.sku" name="sku" required class="input-bento font-mono uppercase" />
              </div>
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Categoría</label>
                <select [(ngModel)]="formData.categoryId" name="categoryId" required class="input-bento">
                  @for (c of categories(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Precio ($)</label>
                <input type="number" step="0.01" [(ngModel)]="formData.price" name="price" required class="input-bento font-mono" />
              </div>
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Stock</label>
                <input type="number" [(ngModel)]="formData.stock" name="stock" required class="input-bento font-mono" />
              </div>
              <div>
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Alerta Mín.</label>
                <input type="number" [(ngModel)]="formData.minStockAlert" name="minStockAlert" class="input-bento font-mono" />
              </div>
            </div>

            <!-- Image Upload & Preview Section -->
            <div class="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">
                  Fotografía del Producto
                </label>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="imageSourceMode.set('upload')"
                    [class]="'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ' + (imageSourceMode() === 'upload' ? 'bg-white text-zinc-900 border border-zinc-200 shadow-xs' : 'text-zinc-500 hover:text-zinc-800')"
                  >
                    Subir Archivo
                  </button>
                  <button
                    type="button"
                    (click)="imageSourceMode.set('url')"
                    [class]="'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ' + (imageSourceMode() === 'url' ? 'bg-white text-zinc-900 border border-zinc-200 shadow-xs' : 'text-zinc-500 hover:text-zinc-800')"
                  >
                    Enlace Web
                  </button>
                </div>
              </div>

              <!-- Upload File Mode -->
              @if (imageSourceMode() === 'upload') {
                <div
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                  (click)="fileInput.click()"
                  [class]="'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ' + (isDragging() ? 'border-indigo-500 bg-indigo-50/50' : 'border-zinc-300 bg-white hover:border-indigo-400 hover:bg-zinc-50/50')"
                >
                  <input
                    #fileInput
                    type="file"
                    accept="image/*"
                    (change)="onFileSelected($event)"
                    class="hidden"
                  />
                  
                  @if (isUploading()) {
                    <div class="flex flex-col items-center gap-2 py-2">
                      <div class="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span class="text-xs font-semibold text-indigo-600">Subiendo imagen al servidor...</span>
                    </div>
                  } @else if (formData.imageUrl) {
                    <div class="flex items-center gap-3">
                      <img [src]="formData.imageUrl" alt="Preview" class="w-14 h-14 object-cover rounded-xl border border-zinc-200 shadow-xs" />
                      <div class="text-left min-w-0 flex-1">
                        <span class="text-xs font-bold text-zinc-900 block truncate">Imagen Cargada con Éxito</span>
                        <span class="text-[11px] text-zinc-500 block truncate">Haz clic para cambiar por otra foto</span>
                      </div>
                    </div>
                  } @else {
                    <div class="py-2 text-zinc-500">
                      <svg class="w-7 h-7 mx-auto text-zinc-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span class="text-xs font-bold text-zinc-800 block">Arrastra una imagen o haz clic para buscar</span>
                      <span class="text-[10px] text-zinc-400 block mt-0.5">JPG, PNG, WEBP hasta 5MB</span>
                    </div>
                  }
                </div>
              } @else {
                <!-- URL Mode -->
                <div>
                  <input
                    type="url"
                    [(ngModel)]="formData.imageUrl"
                    name="imageUrl"
                    placeholder="https://images.unsplash.com/..."
                    class="input-bento"
                  />
                  @if (formData.imageUrl) {
                    <div class="mt-2 flex items-center gap-2">
                      <img [src]="formData.imageUrl" alt="Preview" class="w-10 h-10 object-cover rounded-lg border border-zinc-200" />
                      <span class="text-xs text-zinc-600 truncate">Vista previa cargada</span>
                    </div>
                  }
                </div>
              }
            </div>

            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Descripción</label>
              <textarea [(ngModel)]="formData.description" name="description" rows="2" placeholder="Detalles y características para WhatsApp..." class="input-bento resize-none"></textarea>
            </div>

            <div class="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button type="button" (click)="isModalOpen.set(false)" class="btn-secondary">Cancelar</button>
              <button type="submit" [disabled]="isUploading()" class="btn-primary">Guardar Producto</button>
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
  authService = inject(AuthService);

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedCategory = signal<string>('');
  searchQuery = '';

  isModalOpen = signal(false);
  editingProduct = signal<Product | null>(null);

  imageSourceMode = signal<'upload' | 'url'>('upload');
  isUploading = signal(false);
  isDragging = signal(false);
  isGeneratingPdf = signal(false);

  formData = {
    name: '',
    sku: '',
    categoryId: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStockAlert: 5,
    imageUrl: '',
    description: '',
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.productsService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
    });

    this.productsService.getProducts().subscribe({
      next: (prods) => {
        this.products.set(prods);
        this.filterProducts();
      },
    });
  }

  selectCategory(id: string) {
    this.selectedCategory.set(id);
    this.filterProducts();
  }

  filterProducts() {
    let result = this.products();

    if (this.selectedCategory()) {
      result = result.filter((p) => p.categoryId === this.selectedCategory());
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    this.filteredProducts.set(result);
  }

  adjustStock(product: Product, delta: number) {
    const newStock = Math.max(0, product.stock + delta);
    this.productsService.updateStock(product.id, newStock).subscribe({
      next: (updated) => {
        this.products.update((list) =>
          list.map((p) => (p.id === updated.id ? { ...p, stock: updated.stock } : p)),
        );
        this.filterProducts();
      },
    });
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFile(target.files[0]);
    }
  }

  private handleFile(file: File) {
    this.isUploading.set(true);
    this.uploadService.uploadImage(file).subscribe({
      next: (res: any) => {
        this.formData.imageUrl = res.url;
        this.isUploading.set(false);
      },
      error: () => {
        this.isUploading.set(false);
        alert('Error al subir la imagen. Verifica que sea un archivo válido JPG, PNG o WEBP.');
      },
    });
  }

  openCreateModal() {
    this.editingProduct.set(null);
    this.formData = {
      name: '',
      sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: this.categories()[0]?.id || '',
      price: 0,
      costPrice: 0,
      stock: 10,
      minStockAlert: 3,
      imageUrl: '',
      description: '',
    };
    this.imageSourceMode.set('upload');
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
      imageUrl: product.images?.[0]?.imageUrl || '',
      description: product.description,
    };
    this.imageSourceMode.set(product.images?.[0]?.imageUrl?.startsWith('http://localhost') ? 'upload' : 'url');
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
      images: this.formData.imageUrl ? [{ imageUrl: this.formData.imageUrl, isPrimary: true }] : [],
    };

    if (this.editingProduct()) {
      this.productsService.updateProduct(this.editingProduct()!.id, payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadData();
        },
      });
    } else {
      this.productsService.createProduct(payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadData();
        },
      });
    }
  }

  deleteProduct(product: Product) {
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      this.productsService.deleteProduct(product.id).subscribe({
        next: () => this.loadData(),
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
      },
      error: () => {
        this.isGeneratingPdf.set(false);
        alert('Error al generar el catálogo en PDF.');
      },
    });
  }
}
