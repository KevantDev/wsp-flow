import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

export type CartDeliveryMethod = 'PICKUP' | 'HOME_DELIVERY' | 'PROVINCE_AGENCY';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Slide-over Backdrop Blur Overlay -->
    @if (cartService.isOpen()) {
      <div
        class="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        (click)="cartService.close()"
      ></div>

      <!-- Slide-over Drawer Panel -->
      <aside
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-zinc-200/90 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-out animate-slide-in-right"
      >
        
        <!-- Header -->
        <div class="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
              🛒
            </div>
            <div>
              <h3 class="text-sm font-bold text-zinc-900 leading-tight">Carrito de Compras</h3>
              <p class="text-[11px] text-zinc-500 font-mono">
                {{ cartService.itemCount() }} {{ cartService.itemCount() === 1 ? 'artículo' : 'artículos' }} seleccionados
              </p>
            </div>
          </div>

          <button
            (click)="cartService.close()"
            class="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Body / Items List -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          
          @if (cartService.items().length === 0) {
            <div class="py-16 text-center space-y-3">
              <div class="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl mx-auto text-zinc-400">
                🛍️
              </div>
              <h4 class="font-bold text-zinc-800 text-sm">Tu carrito está vacío</h4>
              <p class="text-xs text-zinc-500 max-w-xs mx-auto">
                Explora nuestro catálogo de productos y añade lo que desees comprar.
              </p>
              <button
                (click)="cartService.close()"
                class="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <span>Ver Catálogo</span>
                <span>➔</span>
              </button>
            </div>
          } @else {
            <!-- Items -->
            <div class="divide-y divide-zinc-100">
              @for (item of cartService.items(); track item.product.id) {
                <div class="py-3.5 flex items-start gap-3 group">
                  
                  <!-- Product Thumbnail -->
                  <div class="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                    @if (item.product.images && item.product.images.length > 0) {
                      <img
                        [src]="item.product.images[0].imageUrl"
                        [alt]="item.product.name"
                        class="w-full h-full object-cover"
                      />
                    } @else {
                      <span class="text-xl">📦</span>
                    }
                  </div>

                  <!-- Details & Quantity Controls -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h5 class="font-bold text-zinc-900 text-xs truncate leading-tight">{{ item.product.name }}</h5>
                        <span class="font-mono text-[10px] text-zinc-400 font-semibold">{{ item.product.sku }}</span>
                      </div>
                      <button
                        (click)="cartService.removeItem(item.product.id)"
                        class="text-zinc-400 hover:text-rose-600 text-xs p-1 transition-colors"
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>

                    <div class="flex items-center justify-between mt-2">
                      <!-- Minus / Plus Buttons -->
                      <div class="inline-flex items-center gap-1.5 p-0.5 bg-zinc-100 rounded-lg border border-zinc-200/80">
                        <button
                          type="button"
                          (click)="cartService.updateQuantity(item.product.id, item.quantity - 1)"
                          class="w-6 h-6 rounded-md bg-white text-zinc-700 hover:bg-zinc-200 flex items-center justify-center font-bold text-xs shadow-xs"
                        >
                          -
                        </button>
                        <span class="font-mono font-bold text-xs px-1.5 text-zinc-800">{{ item.quantity }}</span>
                        <button
                          type="button"
                          (click)="cartService.updateQuantity(item.product.id, item.quantity + 1)"
                          class="w-6 h-6 rounded-md bg-white text-zinc-700 hover:bg-zinc-200 flex items-center justify-center font-bold text-xs shadow-xs"
                        >
                          +
                        </button>
                      </div>

                      <!-- Subtotal Item -->
                      <div class="text-right">
                        <span class="text-[10px] text-zinc-400 block font-mono">S/ {{ item.product.price | number: '1.2-2' }} c/u</span>
                        <span class="font-mono font-bold text-xs text-zinc-900">
                          S/ {{ (item.product.price * item.quantity) | number: '1.2-2' }}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              }
            </div>

            <!-- Delivery Method Selector -->
            <div class="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2.5 text-xs">
              <span class="font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">
                Modalidad de Entrega
              </span>

              <div class="grid grid-cols-3 gap-1.5 p-1 bg-zinc-200/70 rounded-xl">
                <button
                  type="button"
                  (click)="deliveryMethod.set('PICKUP')"
                  [class]="'py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all ' + (deliveryMethod() === 'PICKUP' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900')"
                >
                  🏪 Local (S/ 0)
                </button>
                <button
                  type="button"
                  (click)="deliveryMethod.set('HOME_DELIVERY')"
                  [class]="'py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all ' + (deliveryMethod() === 'HOME_DELIVERY' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900')"
                >
                  🛵 Lima (S/ 10)
                </button>
                <button
                  type="button"
                  (click)="deliveryMethod.set('PROVINCE_AGENCY')"
                  [class]="'py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all ' + (deliveryMethod() === 'PROVINCE_AGENCY' ? 'bg-amber-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900')"
                >
                  📦 Prov (S/ 15)
                </button>
              </div>

              <!-- Customer Details inputs -->
              <div class="space-y-2 pt-1">
                <div>
                  <input
                    type="text"
                    [(ngModel)]="customerName"
                    placeholder="Tu Nombre Completo"
                    class="input-bento text-xs py-1.5"
                  />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    [(ngModel)]="customerPhone"
                    placeholder="Celular / WhatsApp"
                    maxlength="9"
                    class="input-bento text-xs py-1.5 font-mono"
                  />
                  <input
                    type="text"
                    [(ngModel)]="customerDistrict"
                    [placeholder]="deliveryMethod() === 'PICKUP' ? 'Local Miraflores' : (deliveryMethod() === 'HOME_DELIVERY' ? 'Distrito en Lima' : 'Ciudad Destino')"
                    class="input-bento text-xs py-1.5"
                  />
                </div>
              </div>
            </div>
          }

        </div>

        <!-- Footer / Checkout Actions -->
        @if (cartService.items().length > 0) {
          <div class="p-5 border-t border-zinc-100 bg-white space-y-3">
            
            <!-- Summary Lines -->
            <div class="space-y-1 text-xs">
              <div class="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span class="font-mono font-semibold">S/ {{ cartService.subtotal() | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-zinc-500">
                <span>Envío / Delivery:</span>
                @if (getDeliveryFee() === 0) {
                  <span class="font-bold text-emerald-600 uppercase text-[11px]">¡Gratis!</span>
                } @else {
                  <span class="font-mono font-semibold">S/ {{ getDeliveryFee() | number: '1.2-2' }}</span>
                }
              </div>
              <div class="flex justify-between text-zinc-900 font-extrabold text-base pt-2 border-t border-zinc-100">
                <span>Total:</span>
                <span class="font-mono text-indigo-600">S/ {{ getTotal() | number: '1.2-2' }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2">
              <button
                type="button"
                (click)="checkoutOnline()"
                [disabled]="isCheckingOut()"
                class="w-full btn-primary py-3 font-bold text-xs justify-center shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                @if (isCheckingOut()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generando pedido...</span>
                } @else {
                  <span>💳 Pagar S/ {{ getTotal() | number: '1.2-2' }} con Yape / Tarjeta</span>
                }
              </button>

              <button
                type="button"
                (click)="checkoutWhatsApp()"
                class="w-full btn-secondary py-2.5 font-bold text-xs justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 active:scale-[0.98]"
              >
                <span>💬 Pedir por WhatsApp</span>
              </button>
            </div>

          </div>
        }

      </aside>
    }
  `,
  styles: [
    `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
      .animate-slide-in-right {
        animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `,
  ],
})
export class CartDrawerComponent {
  cartService = inject(CartService);
  private http = inject(HttpClient);
  private router = inject(Router);

  deliveryMethod = signal<CartDeliveryMethod>('PICKUP');
  customerName = '';
  customerPhone = '';
  customerDistrict = '';
  isCheckingOut = signal(false);

  getDeliveryFee(): number {
    if (this.deliveryMethod() === 'PICKUP') return 0.0;
    if (this.deliveryMethod() === 'PROVINCE_AGENCY') return 15.0;
    return 10.0;
  }

  getTotal(): number {
    return this.cartService.subtotal() + this.getDeliveryFee();
  }

  checkoutOnline() {
    if (this.cartService.items().length === 0) return;
    this.isCheckingOut.set(true);

    const payload = {
      customerName: this.customerName || 'Cliente Web',
      customerPhone: this.customerPhone || '51900000000',
      customerAddress: this.deliveryMethod() === 'PICKUP' 
        ? 'Recojo en Tienda (Av. Larco 743, Miraflores, Lima)' 
        : (this.customerDistrict || 'Lima'),
      deliveryType: this.deliveryMethod(),
      district: this.customerDistrict,
      items: this.cartService.items().map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };

    this.http.post<any>(`${environment.apiUrl}/orders/public-checkout`, payload).subscribe({
      next: (res) => {
        this.isCheckingOut.set(false);
        this.cartService.clear();
        this.cartService.close();
        this.router.navigate(['/pay', res.orderNumber]);
      },
      error: (err) => {
        this.isCheckingOut.set(false);
        alert(err.error?.message || 'Error al procesar el pedido.');
      },
    });
  }

  checkoutWhatsApp() {
    const itemsText = this.cartService
      .items()
      .map(
        (i) => `• ${i.quantity}x ${i.product.name} (S/ ${(i.product.price * i.quantity).toFixed(2)})`,
      )
      .join('\n');

    const methodText =
      this.deliveryMethod() === 'PICKUP'
        ? 'Recojo en Tienda (Miraflores - Gratis)'
        : this.deliveryMethod() === 'HOME_DELIVERY'
        ? `Envío a Domicilio (${this.customerDistrict || 'Lima'} - S/ 10.00)`
        : `Envío a Provincia (${this.customerDistrict || 'Agencia'} - S/ 15.00)`;

    const msg =
      `🛒 *¡Hola! Deseo confirmar mi pedido del Carrito Web:*\n\n` +
      `${itemsText}\n\n` +
      `----------------------------------------\n` +
      `*Subtotal:* S/ ${this.cartService.subtotal().toFixed(2)}\n` +
      `*Modalidad:* ${methodText}\n` +
      `*Total a Pagar:* S/ ${this.getTotal().toFixed(2)} PEN\n\n` +
      `👤 *Cliente:* ${this.customerName || 'Cliente Web'}\n` +
      `📱 *Contacto:* ${this.customerPhone || 'WhatsApp'}\n\n` +
      `¿Me pueden brindar el link de pago o datos para coordinar?`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }
}
