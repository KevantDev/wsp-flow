import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type DeliveryType = 'PICKUP' | 'HOME_DELIVERY' | 'PROVINCE_AGENCY';

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
  notes?: string;
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
              <span class="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">Checkout Seguro en Soles (PEN)</span>
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
              Pago Confirmado en Soles
            </span>
            
            <h2 class="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1">¡Gracias por tu compra!</h2>
            <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Tu pedido <span class="font-mono font-bold text-zinc-800">#{{ orderData()?.orderNumber }}</span> ha sido pagado y validado con éxito.
            </p>

            <div class="my-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-left space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-zinc-500">Comprador:</span>
                <span class="font-semibold text-zinc-800">{{ customerName || orderData()?.customerName }}</span>
              </div>
              @if (customerDni) {
                <div class="flex justify-between">
                  <span class="text-zinc-500">DNI / Documento:</span>
                  <span class="font-mono font-semibold text-zinc-800">{{ customerDni }}</span>
                </div>
              }
              <div class="flex justify-between">
                <span class="text-zinc-500">Teléfono / WhatsApp:</span>
                <span class="font-mono font-semibold text-zinc-800">+{{ customerPhone || orderData()?.customerPhone }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Modalidad de Entrega:</span>
                <span class="font-semibold text-zinc-800 truncate max-w-[220px]">{{ orderData()?.customerAddress || 'Coordinar con asesor' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Total Pagado:</span>
                <span class="font-bold font-mono text-zinc-900 text-sm">S/ {{ orderData()?.total | number: '1.2-2' }}</span>
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
              <span>Confirmar despacho por WhatsApp</span>
            </a>
          </div>
        } @else {
          <!-- Checkout Bento Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left: Contact, Delivery & Payment Form (7 cols) -->
            <div class="lg:col-span-7 space-y-5">
              
              <!-- 1. DATOS DEL COMPRADOR & CONTACTO -->
              <div class="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-bold text-zinc-900">Datos de Contacto & Identificación</h3>
                    <p class="text-xs text-zinc-500">Información para coordinar tu entrega y emitir tu comprobante.</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold border border-indigo-100">
                    Paso 1
                  </span>
                </div>

                <div class="space-y-3">
                  <!-- Nombre Completo -->
                  <div>
                    <label class="block text-zinc-600 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                      Nombre Completo de quien recibe *
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="customerName"
                      (blur)="saveContactAndDelivery()"
                      placeholder="Ej: Juan Carlos Pérez Gómez"
                      required
                      class="input-bento text-xs font-semibold"
                    />
                  </div>

                  <!-- DNI y Celular -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-zinc-600 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        DNI / Carnet de Extranjería *
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="customerDni"
                        (blur)="saveContactAndDelivery()"
                        placeholder="Ej: 72849102"
                        maxlength="12"
                        required
                        class="input-bento text-xs font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label class="block text-zinc-600 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Celular / WhatsApp de Contacto *
                      </label>
                      <input
                        type="tel"
                        [(ngModel)]="customerPhone"
                        (blur)="saveContactAndDelivery()"
                        placeholder="Ej: 987654321"
                        maxlength="9"
                        required
                        class="input-bento text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>

                  <!-- Correo Electrónico -->
                  <div>
                    <label class="block text-zinc-600 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                      Correo Electrónico (para comprobante y tracking)
                    </label>
                    <input
                      type="email"
                      [(ngModel)]="customerEmail"
                      placeholder="tu-correo@ejemplo.com"
                      class="input-bento text-xs"
                    />
                  </div>
                </div>
              </div>

              <!-- 2. SELECCIÓN DE MÉTODO DE ENTREGA -->
              <div class="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4">
                
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-bold text-zinc-900">Modalidad de Entrega</h3>
                    <p class="text-xs text-zinc-500">Selecciona cómo deseas recibir tus productos.</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold border border-indigo-100">
                    Paso 2
                  </span>
                </div>

                <!-- 3 Botones de Tipo de Entrega -->
                <div class="grid grid-cols-3 gap-2 p-1 bg-zinc-100 rounded-2xl">
                  
                  <button
                    type="button"
                    (click)="setDeliveryType('PICKUP')"
                    [class]="'py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ' + (selectedDeliveryType() === 'PICKUP' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900')"
                  >
                    <span>🏪</span>
                    <span class="leading-tight">Recojo en Tienda</span>
                  </button>

                  <button
                    type="button"
                    (click)="setDeliveryType('HOME_DELIVERY')"
                    [class]="'py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ' + (selectedDeliveryType() === 'HOME_DELIVERY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900')"
                  >
                    <span>🛵</span>
                    <span class="leading-tight">Lima & Callao</span>
                  </button>

                  <button
                    type="button"
                    (click)="setDeliveryType('PROVINCE_AGENCY')"
                    [class]="'py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ' + (selectedDeliveryType() === 'PROVINCE_AGENCY' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900')"
                  >
                    <span>📦</span>
                    <span class="leading-tight">Provincias</span>
                  </button>

                </div>

                <!-- DETALLE SEGÚN TIPO SELECCIONADO -->

                <!-- A. RECOJO EN TIENDA -->
                @if (selectedDeliveryType() === 'PICKUP') {
                  <div class="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs space-y-2 animate-fade-in">
                    <div class="flex items-center justify-between text-emerald-950 font-bold">
                      <span class="flex items-center gap-1.5">📍 Local Oficial Miraflores</span>
                      <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] uppercase font-extrabold">
                        ¡Gratis (S/ 0.00)!
                      </span>
                    </div>
                    <p class="text-zinc-700 leading-relaxed text-[11px]">
                      <b>Dirección:</b> Av. Larco 743, Miraflores, Lima (a 2 cuadras del Parque Kennedy).<br>
                      <b>Horarios:</b> Lunes a Sábados de 09:00 a 20:00 hs.<br>
                      <b>Listo para retiro:</b> Tu pedido estará empacado y listo en aprox. 2 horas tras confirmar tu pago presentando tu DNI (<b>{{ customerDni || 'DNI Comprador' }}</b>).
                    </p>
                  </div>
                }

                <!-- B. ENVÍO A DOMICILIO EN LIMA & CALLAO (Por Zonas) -->
                @if (selectedDeliveryType() === 'HOME_DELIVERY') {
                  <div class="space-y-3 animate-fade-in">
                    
                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Distrito de Entrega en Lima / Callao
                      </label>
                      <select
                        [ngModel]="selectedDistrict()"
                        (ngModelChange)="onDistrictChanged($event)"
                        class="input-bento text-xs font-semibold"
                      >
                        <optgroup label="Zona 1: Lima Centro / Moderna (Tarifa S/ 10.00)">
                          <option value="Miraflores">Miraflores (S/ 10.00)</option>
                          <option value="San Isidro">San Isidro (S/ 10.00)</option>
                          <option value="San Borja">San Borja (S/ 10.00)</option>
                          <option value="Santiago de Surco">Santiago de Surco (S/ 10.00)</option>
                          <option value="Jesús María">Jesús María (S/ 10.00)</option>
                          <option value="Lince">Lince (S/ 10.00)</option>
                          <option value="Magdalena del Mar">Magdalena del Mar (S/ 10.00)</option>
                          <option value="Pueblo Libre">Pueblo Libre (S/ 10.00)</option>
                          <option value="Barranco">Barranco (S/ 10.00)</option>
                          <option value="Surquillo">Surquillo (S/ 10.00)</option>
                          <option value="San Miguel">San Miguel (S/ 10.00)</option>
                          <option value="Breña">Breña (S/ 10.00)</option>
                          <option value="Cercado de Lima">Cercado de Lima (S/ 10.00)</option>
                          <option value="La Victoria">La Victoria (S/ 10.00)</option>
                        </optgroup>
                        
                        <optgroup label="Zona 2: Lima Norte / Sur / Este (Tarifa S/ 15.00)">
                          <option value="Los Olivos">Los Olivos (S/ 15.00)</option>
                          <option value="San Martín de Porres">San Martín de Porres - SMP (S/ 15.00)</option>
                          <option value="Comas">Comas (S/ 15.00)</option>
                          <option value="Independencia">Independencia (S/ 15.00)</option>
                          <option value="Chorrillos">Chorrillos (S/ 15.00)</option>
                          <option value="San Juan de Miraflores">San Juan de Miraflores - SJM (S/ 15.00)</option>
                          <option value="La Molina">La Molina (S/ 15.00)</option>
                          <option value="Santa Anita">Santa Anita (S/ 15.00)</option>
                          <option value="Ate">Ate Vitarte (S/ 15.00)</option>
                          <option value="San Juan de Lurigancho">San Juan de Lurigancho - SJL (S/ 15.00)</option>
                          <option value="Rímac">Rímac (S/ 15.00)</option>
                          <option value="Villa María del Triunfo">Villa María del Triunfo - VMT (S/ 15.00)</option>
                        </optgroup>

                        <optgroup label="Zona 3: Callao & Zonas Periféricas (Tarifa S/ 20.00)">
                          <option value="Callao">Callao (S/ 20.00)</option>
                          <option value="Bellavista">Bellavista (S/ 20.00)</option>
                          <option value="La Punta">La Punta (S/ 20.00)</option>
                          <option value="Ventanilla">Ventanilla (S/ 20.00)</option>
                          <option value="Puente Piedra">Puente Piedra (S/ 20.00)</option>
                          <option value="Carabayllo">Carabayllo (S/ 20.00)</option>
                          <option value="Villa El Salvador">Villa El Salvador - VES (S/ 20.00)</option>
                          <option value="Lurín">Lurín (S/ 20.00)</option>
                          <option value="Chosica / Lurigancho">Chosica / Lurigancho (S/ 20.00)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                          Dirección Exacta (Calle / Av. / Nro)
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="deliveryAddress"
                          (blur)="saveContactAndDelivery()"
                          placeholder="Ej: Av. Benavides 1450 Dpto 302"
                          class="input-bento text-xs"
                        />
                      </div>
                      <div>
                        <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                          Referencia de Entrega
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="deliveryReference"
                          (blur)="saveContactAndDelivery()"
                          placeholder="Ej: Frente al parque, rejas blancas"
                          class="input-bento text-xs"
                        />
                      </div>
                    </div>

                  </div>
                }

                <!-- C. ENVÍO A PROVINCIA (Agencias Shalom / Marvisur / Olva) -->
                @if (selectedDeliveryType() === 'PROVINCE_AGENCY') {
                  <div class="space-y-3 animate-fade-in">
                    
                    <div class="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs">
                      <p class="font-bold mb-1">🚚 Envíos a todo el Perú por Agencia</p>
                      <p class="text-[11px] text-amber-900 leading-relaxed">
                        Llevamos tu paquete empaquetado a la agencia (Tarifa base S/ 15.00). Te enviaremos la foto del voucher con tu <b>Número de Guía y Clave de Recojo</b> por WhatsApp para retiro con tu DNI (<b>{{ customerDni || 'DNI Comprador' }}</b>).
                      </p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                          Ciudad / Departamento de Destino
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="provinceCity"
                          (blur)="saveContactAndDelivery()"
                          placeholder="Ej: Trujillo, Arequipa, Cusco, Piura..."
                          class="input-bento text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                          Agencia Preferida
                        </label>
                        <select
                          [(ngModel)]="provinceAgency"
                          (ngModelChange)="saveContactAndDelivery()"
                          class="input-bento text-xs font-semibold"
                        >
                          <option value="Shalom">Agencia Shalom (Recomendado)</option>
                          <option value="Marvisur">Agencia Marvisur</option>
                          <option value="Olva Courier">Olva Courier (Puerta a Puerta)</option>
                          <option value="Flores">Expreso Flores Hermanos</option>
                        </select>
                      </div>
                    </div>

                  </div>
                }

              </div>
              
              <!-- 3. PASARELA DE PAGO CULQI (Yape & Tarjeta) -->
              <div class="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm">
                
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-base font-bold text-zinc-900">Método de Pago</h3>
                  <span class="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-mono text-[11px] font-bold border border-purple-100">
                    Paso 3
                  </span>
                </div>
                <p class="text-xs text-zinc-500 mb-5">Procesamiento seguro e instantáneo respaldado por Culqi en Soles (PEN).</p>

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
                        <li>Abre tu app <b>Yape</b> en tu teléfono.</li>
                        <li>Toca el menú lateral y pulsa <b>"Código de Aprobación"</b>.</li>
                        <li>Ingresa tu número de celular y el código de 6 dígitos aquí.</li>
                      </ol>
                    </div>

                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Número de Celular Yape *
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
                        Código de Aprobación Yape (OTP 6 dígitos) *
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

                    <button
                      type="submit"
                      [disabled]="isProcessingPayment() || !yapeOtp || !yapePhone"
                      class="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      @if (isProcessingPayment()) {
                        <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Validando Yape...</span>
                      } @else {
                        <span>Pagar S/ {{ orderData()?.total | number: '1.2-2' }} con Yape</span>
                      }
                    </button>
                  </form>
                }

                <!-- TAB 2: CREDIT / DEBIT CARD -->
                @if (selectedMethod() === 'card') {
                  <form (ngSubmit)="processCard()" class="space-y-4 animate-fade-in">
                    
                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Nombre impreso en la Tarjeta *
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="cardHolder"
                        name="cardHolder"
                        required
                        placeholder="JUAN PEREZ"
                        class="input-bento text-xs uppercase font-semibold"
                      />
                    </div>

                    <div>
                      <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                        Número de Tarjeta (Visa, Mastercard, Amex) *
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="cardNumber"
                        name="cardNumber"
                        required
                        maxlength="19"
                        placeholder="4111 2222 3333 4444"
                        class="input-bento text-xs font-mono tracking-wider font-semibold"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                          Vencimiento (MM/AA) *
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="cardExpiry"
                          name="cardExpiry"
                          required
                          maxlength="5"
                          placeholder="12/28"
                          class="input-bento text-xs font-mono text-center font-semibold"
                        />
                      </div>
                      <div>
                        <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                          CVV / CVC (3-4 dígitos) *
                        </label>
                        <input
                          type="password"
                          [(ngModel)]="cardCvv"
                          name="cardCvv"
                          required
                          maxlength="4"
                          placeholder="•••"
                          class="input-bento text-xs font-mono text-center font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      [disabled]="isProcessingPayment() || !cardNumber || !cardExpiry || !cardCvv"
                      class="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      @if (isProcessingPayment()) {
                        <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Procesando pago con Culqi...</span>
                      } @else {
                        <span>Pagar S/ {{ orderData()?.total | number: '1.2-2' }} con Tarjeta</span>
                      }
                    </button>
                  </form>
                }

              </div>

            </div>

            <!-- Right: Order Summary Sidebar (5 cols) -->
            <div class="lg:col-span-5 space-y-4">
              
              <div class="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4 sticky top-6">
                
                <div class="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h3 class="text-sm font-bold text-zinc-900">Resumen del Pedido</h3>
                  <span class="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200">
                    #{{ orderData()?.orderNumber }}
                  </span>
                </div>

                <!-- Products Items List -->
                <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
                  @for (item of orderData()?.items || []; track item.productId) {
                    <div class="flex items-start justify-between gap-3 text-xs">
                      <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-zinc-900 truncate leading-tight">{{ item.productName }}</h4>
                        <span class="text-zinc-400 font-mono text-[10px]">{{ item.quantity }} x S/ {{ item.unitPrice | number: '1.2-2' }}</span>
                      </div>
                      <span class="font-bold text-zinc-900 font-mono">
                        S/ {{ item.subtotal | number: '1.2-2' }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Totals Breakdown -->
                <div class="pt-3 border-t border-zinc-100 space-y-2 text-xs">
                  <div class="flex justify-between text-zinc-500">
                    <span>Subtotal Productos:</span>
                    <span class="font-mono font-semibold">S/ {{ orderData()?.subtotal | number: '1.2-2' }}</span>
                  </div>

                  <div class="flex justify-between text-zinc-500">
                    <span>Costo de Entrega / Envío:</span>
                    @if (orderData()?.deliveryFee === 0) {
                      <span class="font-bold text-emerald-600 font-mono uppercase text-[11px]">¡Gratis!</span>
                    } @else {
                      <span class="font-mono font-semibold">S/ {{ orderData()?.deliveryFee | number: '1.2-2' }}</span>
                    }
                  </div>

                  <div class="flex justify-between text-zinc-900 font-extrabold text-base pt-2 border-t border-zinc-100">
                    <span>Total a Pagar:</span>
                    <span class="font-mono text-indigo-600">S/ {{ orderData()?.total | number: '1.2-2' }} PEN</span>
                  </div>
                </div>

                <!-- Contact Summary Badge -->
                <div class="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-[11px] space-y-1">
                  <div class="text-zinc-500 flex justify-between">
                    <span>Comprador:</span>
                    <span class="font-semibold text-zinc-800 truncate max-w-[140px]">{{ customerName || orderData()?.customerName }}</span>
                  </div>
                  @if (customerDni) {
                    <div class="text-zinc-500 flex justify-between">
                      <span>DNI:</span>
                      <span class="font-mono font-semibold text-zinc-800">{{ customerDni }}</span>
                    </div>
                  }
                  <div class="text-zinc-500 flex justify-between">
                    <span>Contacto:</span>
                    <span class="font-mono font-semibold text-zinc-800">+{{ customerPhone || orderData()?.customerPhone }}</span>
                  </div>
                </div>

                <!-- Security Guarantee Badge -->
                <div class="pt-2 flex items-center justify-center gap-3 text-[10px] text-zinc-400 font-mono">
                  <span>🔒 Culqi Verified</span>
                  <span>•</span>
                  <span>🛡️ Garantía WSP Flow</span>
                </div>

              </div>

            </div>

          </div>
        }

      </div>

      <!-- Footer -->
      <footer class="text-center text-[11px] text-zinc-400 font-mono mt-12">
        Pagos protegidos y respaldados por la pasarela oficial Culqi & WSP Flow SaaS en Perú.
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

  // Customer Details Form State (Nombre, DNI, Celular, Correo)
  customerName = '';
  customerDni = '';
  customerPhone = '';
  customerEmail = '';

  // Delivery State
  selectedDeliveryType = signal<DeliveryType>('HOME_DELIVERY');
  selectedDistrict = signal<string>('Miraflores');
  deliveryAddress = '';
  deliveryReference = '';
  provinceCity = '';
  provinceAgency = 'Shalom';

  // Payment Form State
  selectedMethod = signal<'yape' | 'card'>('yape');
  isProcessingPayment = signal(false);
  isPaidSuccess = signal(false);
  lastChargeId = signal<string | null>(null);

  // Yape Form
  yapePhone = '';
  yapeOtp = '';

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
        this.customerName = data.customerName || '';
        this.customerPhone = data.customerPhone ? data.customerPhone.replace(/\D/g, '').slice(-9) : '';
        this.yapePhone = this.customerPhone;
        this.cardHolder = data.customerName || '';

        // Extract DNI from notes if previously saved
        if (data.notes && data.notes.includes('DNI:')) {
          const match = data.notes.match(/DNI:\s*([0-9A-Za-z]+)/);
          if (match) {
            this.customerDni = match[1];
          }
        }

        // Infer initial delivery type
        const addr = (data.customerAddress || '').toLowerCase();
        if (addr.includes('recojo') || addr.includes('tienda') || data.deliveryFee === 0) {
          this.selectedDeliveryType.set('PICKUP');
        } else if (addr.includes('provincia') || addr.includes('shalom') || addr.includes('marvisur')) {
          this.selectedDeliveryType.set('PROVINCE_AGENCY');
        } else {
          this.selectedDeliveryType.set('HOME_DELIVERY');
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al conectar con el servidor.');
        this.isLoading.set(false);
      },
    });
  }

  setDeliveryType(type: DeliveryType) {
    this.selectedDeliveryType.set(type);
    this.saveContactAndDelivery();
  }

  onDistrictChanged(district: string) {
    this.selectedDistrict.set(district);
    this.saveContactAndDelivery();
  }

  saveContactAndDelivery() {
    if (!this.orderData()) return;

    let payload: any = {
      deliveryType: this.selectedDeliveryType(),
      customerName: this.customerName || this.orderData()!.customerName,
      customerPhone: this.customerPhone || this.orderData()!.customerPhone,
      customerDni: this.customerDni || undefined,
    };

    if (this.selectedDeliveryType() === 'PICKUP') {
      payload.address = 'Recojo en Tienda (Av. Larco 743, Miraflores, Lima)';
    } else if (this.selectedDeliveryType() === 'HOME_DELIVERY') {
      payload.district = this.selectedDistrict();
      payload.address = this.deliveryAddress || 'Dirección en Lima';
      if (this.deliveryReference) {
        payload.notes = `Ref: ${this.deliveryReference}`;
      }
    } else if (this.selectedDeliveryType() === 'PROVINCE_AGENCY') {
      payload.district = this.provinceCity || 'Provincia';
      payload.address = `Envío a Provincia (${this.provinceCity || 'Por coordinar'}) vía Agencia ${this.provinceAgency}`;
    }

    this.http.patch<any>(`${environment.apiUrl}/payments/order/${this.orderNumber}/delivery`, payload).subscribe({
      next: (res) => {
        if (res.order) {
          this.orderData.update((prev) => (prev ? {
            ...prev,
            customerName: res.order.customerName,
            customerPhone: res.order.customerPhone,
            deliveryFee: res.order.deliveryFee,
            total: res.order.total,
            customerAddress: res.order.customerAddress,
            notes: res.order.notes,
          } : null));
        }
      },
      error: (err) => {
        console.error('Error sincronizando datos de entrega y contacto:', err);
      },
    });
  }

  processYape() {
    if (!this.orderData()) return;
    this.isProcessingPayment.set(true);

    const payload = {
      orderNumber: this.orderData()!.orderNumber,
      yapeOtp: this.yapeOtp,
      yapePhone: this.yapePhone || this.customerPhone,
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

    const simulatedTokenId = `tkn_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const payload = {
      orderNumber: this.orderData()!.orderNumber,
      tokenId: simulatedTokenId,
      email: this.customerEmail || 'cliente@wspflow.com',
      phone: this.customerPhone || this.orderData()!.customerPhone,
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
      `¡Hola! Acabo de pagar mi pedido #${ord.orderNumber} por S/ ${ord.total.toFixed(2)} PEN a nombre de ${this.customerName || ord.customerName} (DNI: ${this.customerDni || 'Registrado'}). ¿Cuándo saldría mi entrega?`,
    );
  }
}
