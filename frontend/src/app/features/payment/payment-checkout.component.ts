import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CheckoutOrderData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  paymentMethod?: string;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
  culqiPublicKey?: string;
}

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-zinc-50 flex flex-col justify-between text-zinc-800 antialiased selection:bg-indigo-500 selection:text-white p-4 sm:p-6 lg:p-10">
      
      <div class="max-w-4xl mx-auto w-full">
        
        <!-- Header Brand -->
        <header class="flex items-center justify-between pb-6 mb-6 border-b border-zinc-200/80">
          <a routerLink="/" class="flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-lg group-hover:scale-105 transition-transform">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span class="font-bold text-zinc-900 tracking-tight text-base block leading-tight">WSP Flow</span>
              <span class="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">Checkout Seguro Culqi</span>
            </div>
          </a>

          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Conexión Cifrada SSL
            </span>
          </div>
        </header>

        @if (isLoading()) {
          <div class="py-24 text-center">
            <div class="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-sm font-semibold text-zinc-600">Cargando detalles de tu pedido...</p>
          </div>
        } @else if (errorMessage()) {
          <div class="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-md mx-auto">
            <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 font-bold text-xl">⚠️</div>
            <h3 class="font-bold text-rose-900 text-base mb-1">No se pudo cargar la orden</h3>
            <p class="text-xs text-rose-700 mb-4">{{ errorMessage() }}</p>
            <a routerLink="/" class="btn-secondary text-xs">Volver al inicio</a>
          </div>
        } @else if (isPaidSuccess() || orderData()?.status === 'CONFIRMED' || orderData()?.status === 'PROCESSING' || orderData()?.status === 'SHIPPED' || orderData()?.status === 'DELIVERED') {
          <!-- Success Confirmed Screen -->
          <div class="max-w-lg mx-auto p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/90 shadow-xl text-center animate-fade-in">
            <div class="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-sm">
              ✓
            </div>
            
            <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold font-mono uppercase tracking-wider mb-2 inline-block border border-emerald-200">
              Pago Confirmado
            </span>
            
            <h2 class="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1">¡Gracias por tu compra!</h2>
            <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Tu pedido <span class="font-mono font-bold text-zinc-800">#{{ orderData()?.orderNumber }}</span> ha sido pagado y validado con éxito.
            </p>

            <div class="my-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-left space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-zinc-500">Comprador:</span>
                <span class="font-semibold text-zinc-800">{{ orderData()?.customerName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Destino de Entrega:</span>
                <span class="font-semibold text-zinc-800">{{ orderData()?.customerAddress || 'Coordinar con asesor' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Total Pagado:</span>
                <span class="font-bold font-mono text-zinc-900 text-sm">&#36;{{ orderData()?.total | number: '1.2-2' }} USD</span>
              </div>
              @if (lastChargeId()) {
                <div class="flex justify-between border-t border-zinc-200 pt-2 text-[11px] font-mono text-zinc-500">
                  <span>ID Transacción Culqi:</span>
                  <span class="font-bold text-indigo-600">{{ lastChargeId() }}</span>
                </div>
              }
            </div>

            <a
              [href]="'https://wa.me/?text=' + getWhatsAppShareText()"
              target="_blank"
              class="w-full btn-primary text-xs py-3 font-semibold justify-center shadow-md bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span>Ver pedido en WhatsApp</span>
            </a>
          </div>
        } @else {
          <!-- Checkout Bento Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left: Payment Form & Options (7 cols) -->
            <div class="lg:col-span-7 space-y-5">
              
              <!-- Payment Tabs -->
              <div class="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm">
                
                <h3 class="text-base font-bold text-zinc-900 mb-1">Selecciona tu método de pago</h3>
                <p class="text-xs text-zinc-500 mb-5">Procesamiento seguro e instantáneo respaldado por Culqi.</p>

                <!-- Method Switcher Pills -->
                <div class="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-2xl mb-6">
                  <button
                    type="button"
                    (click)="selectedMethod.set('yape')"
                    [class]="'py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ' + (selectedMethod() === 'yape' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900')"
                  >
                    <span>💜 Yape</span>
                  </button>
                  <button
                    type="button"
                    (click)="selectedMethod.set('card')"
                    [class]="'py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ' + (selectedMethod() === 'card' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900')"
                  >
                    <span>💳 Tarjeta Débito / Crédito</span>
                  </button>
                </div>

                <!-- TAB 1: YAPE PAYMENT -->
                @if (selectedMethod() === 'yape') {
                  <form (ngSubmit)="processYape()" class="space-y-4 animate-fade-in">
                    
                    <div class="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/70 text-purple-950 text-xs space-y-1">
                      <div class="font-bold flex items-center gap-1.5">
                        <span>📱 ¿Cómo pagar con Yape?</span>
                      </div>
                      <ol class="list-decimal list-inside text-[11px] text-purple-900 space-y-0.5">
                        <li>Abre tu app <b>Yape</b> en el teléfono.</li>
                        <li>Toca el menú lateral y pulsa <b>"Código de Aprobación"</b>.</li>
                        <li>Ingresa tu número de celular y el código de 6 dígitos aquí.</li>
                      </ol>
                    </div>

                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Número de Celular Yape
                      </label>
                      <input
                        type="tel"
                        [(ngModel)]="yapePhone"
                        name="yapePhone"
                        required
                        maxlength="9"
                        placeholder="987654321"
                        class="input-bento text-xs font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Código de Aprobación Yape (OTP 6 dígitos)
                      </label>
                      <input
                        type="password"
                        [(ngModel)]="yapeOtp"
                        name="yapeOtp"
                        required
                        maxlength="6"
                        placeholder="••••••"
                        class="input-bento text-xs font-mono font-bold tracking-widest text-center text-lg"
                      />
                    </div>

                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Correo Electrónico (para comprobante)
                      </label>
                      <input
                        type="email"
                        [(ngModel)]="customerEmail"
                        name="customerEmail"
                        placeholder="tu-correo@ejemplo.com"
                        class="input-bento text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      [disabled]="isProcessingPayment() || !yapeOtp || !yapePhone"
                      class="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      @if (isProcessingPayment()) {
                        <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Validando Yape...</span>
                      } @else {
                        <span>Pagar &#36;{{ orderData()?.total | number: '1.2-2' }} con Yape</span>
                      }
                    </button>
                  </form>
                }

                <!-- TAB 2: CREDIT / DEBIT CARD -->
                @if (selectedMethod() === 'card') {
                  <form (ngSubmit)="processCard()" class="space-y-4 animate-fade-in">
                    
                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Nombre en la Tarjeta
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="cardHolder"
                        name="cardHolder"
                        required
                        placeholder="JUAN PEREZ"
                        class="input-bento text-xs uppercase"
                      />
                    </div>

                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Número de Tarjeta (Visa, Mastercard, Amex)
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="cardNumber"
                        name="cardNumber"
                        required
                        maxlength="19"
                        placeholder="4557 8899 0011 2233"
                        class="input-bento text-xs font-mono"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                          Vencimiento (MM/AA)
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="cardExpiry"
                          name="cardExpiry"
                          required
                          maxlength="5"
                          placeholder="12/28"
                          class="input-bento text-xs font-mono text-center"
                        />
                      </div>
                      <div>
                        <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                          CVV (3-4 dígitos)
                        </label>
                        <input
                          type="password"
                          [(ngModel)]="cardCvv"
                          name="cardCvv"
                          required
                          maxlength="4"
                          placeholder="123"
                          class="input-bento text-xs font-mono text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Correo para Comprobante
                      </label>
                      <input
                        type="email"
                        [(ngModel)]="customerEmail"
                        name="customerEmail"
                        placeholder="tu-correo@ejemplo.com"
                        class="input-bento text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      [disabled]="isProcessingPayment() || !cardNumber || !cardExpiry || !cardCvv"
                      class="w-full btn-primary py-3.5 text-sm font-bold justify-center shadow-md active:scale-[0.98] disabled:opacity-50"
                    >
                      @if (isProcessingPayment()) {
                        <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Procesando Tarjeta...</span>
                      } @else {
                        <span>Pagar &#36;{{ orderData()?.total | number: '1.2-2' }} USD</span>
                      }
                    </button>
                  </form>
                }

              </div>

            </div>

            <!-- Right: Order Summary Bento Card (5 cols) -->
            <div class="lg:col-span-5 space-y-4">
              
              <div class="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h4 class="font-bold text-zinc-900 text-sm">Resumen del Pedido</h4>
                  <span class="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    #{{ orderData()?.orderNumber }}
                  </span>
                </div>

                <!-- Customer Details -->
                <div class="space-y-1 text-xs text-zinc-600">
                  <p class="font-bold text-zinc-900">{{ orderData()?.customerName }}</p>
                  <p class="text-zinc-500 text-[11px]">📱 {{ orderData()?.customerPhone }}</p>
                  <p class="text-zinc-500 text-[11px] truncate">📍 {{ orderData()?.customerAddress || 'Coordinar con asesor' }}</p>
                </div>

                <!-- Items list -->
                <div class="divide-y divide-zinc-100 max-h-48 overflow-y-auto">
                  @for (item of orderData()?.items; track item.productId) {
                    <div class="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span class="font-semibold text-zinc-800 block">{{ item.productName }}</span>
                        <span class="text-[10px] text-zinc-400 font-mono">Cant: {{ item.quantity }} × &#36;{{ item.unitPrice | number: '1.2-2' }}</span>
                      </div>
                      <span class="font-mono font-bold text-zinc-900">&#36;{{ item.subtotal | number: '1.2-2' }}</span>
                    </div>
                  }
                </div>

                <!-- Totals Breakdown -->
                <div class="pt-3 border-t border-zinc-100 space-y-1.5 text-xs">
                  <div class="flex justify-between text-zinc-500">
                    <span>Subtotal Productos:</span>
                    <span class="font-mono font-semibold">&#36;{{ orderData()?.subtotal | number: '1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-zinc-500">
                    <span>Envío / Delivery:</span>
                    @if ((orderData()?.deliveryFee || 0) === 0) {
                      <span class="font-bold text-emerald-600 text-[11px] uppercase">¡Gratis!</span>
                    } @else {
                      <span class="font-mono font-semibold">&#36;{{ orderData()?.deliveryFee | number: '1.2-2' }}</span>
                    }
                  </div>
                  <div class="flex justify-between text-zinc-900 font-bold text-base pt-2 border-t border-zinc-100">
                    <span>Total a Pagar:</span>
                    <span class="font-mono font-extrabold text-indigo-600">&#36;{{ orderData()?.total | number: '1.2-2' }} USD</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        }

      </div>

      <!-- Footer -->
      <footer class="text-center text-[11px] text-zinc-400 font-mono mt-12">
        Pagos protegidos y respaldados por la pasarela oficial Culqi & WSP Flow SaaS.
      </footer>

    </div>
  `,
})
export class PaymentCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  orderNumber = '';
  orderData = signal<CheckoutOrderData | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  selectedMethod = signal<'yape' | 'card'>('yape');
  isProcessingPayment = signal(false);
  isPaidSuccess = signal(false);
  lastChargeId = signal<string | null>(null);

  // Yape Form
  yapePhone = '';
  yapeOtp = '';
  customerEmail = '';

  // Card Form
  cardHolder = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';

  ngOnInit() {
    this.orderNumber = this.route.snapshot.paramMap.get('orderNumber') || '';
    if (this.orderNumber) {
      this.loadOrderData();
    } else {
      this.errorMessage.set('Código de orden no especificado en la URL');
      this.isLoading.set(false);
    }
  }

  loadOrderData() {
    this.isLoading.set(true);
    this.http.get<CheckoutOrderData>(`${environment.apiUrl}/payments/order/${this.orderNumber}`).subscribe({
      next: (data) => {
        this.orderData.set(data);
        this.yapePhone = data.customerPhone.replace(/\D/g, '').slice(-9);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al conectar con el servidor.');
        this.isLoading.set(false);
      },
    });
  }

  processYape() {
    if (!this.orderData()) return;
    this.isProcessingPayment.set(true);

    const payload = {
      orderNumber: this.orderData()!.orderNumber,
      yapeOtp: this.yapeOtp,
      yapePhone: this.yapePhone,
      email: this.customerEmail || 'cliente@wspflow.com',
    };

    this.http.post<any>(`${environment.apiUrl}/payments/pay-yape`, payload).subscribe({
      next: (res) => {
        this.isProcessingPayment.set(false);
        this.lastChargeId.set(res.chargeId);
        this.isPaidSuccess.set(true);
      },
      error: (err) => {
        this.isProcessingPayment.set(false);
        alert(err.error?.message || 'Error al validar el pago con Yape. Verifica tu código de aprobación.');
      },
    });
  }

  processCard() {
    if (!this.orderData()) return;
    this.isProcessingPayment.set(true);

    // En entorno Dev/Sandbox generamos un token simulado o de prueba
    const simulatedTokenId = `tkn_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const payload = {
      orderNumber: this.orderData()!.orderNumber,
      tokenId: simulatedTokenId,
      email: this.customerEmail || 'cliente@wspflow.com',
      phone: this.orderData()!.customerPhone,
    };

    this.http.post<any>(`${environment.apiUrl}/payments/pay-card`, payload).subscribe({
      next: (res) => {
        this.isProcessingPayment.set(false);
        this.lastChargeId.set(res.chargeId);
        this.isPaidSuccess.set(true);
      },
      error: (err) => {
        this.isProcessingPayment.set(false);
        alert(err.error?.message || 'Error al procesar el pago con tarjeta.');
      },
    });
  }

  getWhatsAppShareText(): string {
    const ord = this.orderData();
    if (!ord) return '';
    return encodeURIComponent(
      `¡Hola! Acabo de pagar mi pedido #${ord.orderNumber} por $${ord.total.toFixed(2)} USD. ¿Cuándo saldría mi envío?`,
    );
  }
}
