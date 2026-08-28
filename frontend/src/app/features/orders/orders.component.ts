import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { OrdersService } from '../../core/services/orders.service';
import { AuthService } from '../../core/services/auth.service';
import { Order, OrderStatus } from '../../core/models/models';
import { environment } from '../../../environments/environment';

interface TodoColumn {
  key: string;
  title: string;
  statuses: (OrderStatus | string)[];
  headerBg: string;
  badgeVariant: 'warning' | 'info' | 'purple' | 'success' | 'danger' | 'neutral';
  nextActionText?: string;
  nextStatus?: OrderStatus;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, BentoCardComponent, BadgeComponent],
  template: `
    <app-navbar title="Pipeline de Pedidos & Ventas" subtitle="Gestión interactiva To-Do, cobros con Culqi, cancelaciones y reembolsos"></app-navbar>

    <div class="space-y-6 mt-6 pb-12">
      
      <!-- Top Controls & View Switcher -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <!-- Summary Stats Pills (Included Cancelados) -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <div class="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center gap-2 shrink-0">
            <span class="text-zinc-500 font-medium">Total:</span>
            <span class="font-bold text-zinc-900 font-mono">{{ orders().length }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center gap-2 shrink-0">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-amber-800 font-medium">Por Atender:</span>
            <span class="font-bold text-amber-900 font-mono">{{ getOrdersByStatuses(['PENDING']).length }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/70 flex items-center gap-2 shrink-0">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span class="text-indigo-800 font-medium">En Preparación:</span>
            <span class="font-bold text-indigo-900 font-mono">{{ getOrdersByStatuses(['PROCESSING', 'CONFIRMED']).length }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/70 flex items-center gap-2 shrink-0">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span>
            <span class="text-purple-800 font-medium">En Camino:</span>
            <span class="font-bold text-purple-900 font-mono">{{ getOrdersByStatuses(['SHIPPED']).length }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center gap-2 shrink-0">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-emerald-800 font-medium">Entregados:</span>
            <span class="font-bold text-emerald-900 font-mono">{{ getOrdersByStatuses(['DELIVERED']).length }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center gap-2 shrink-0">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span class="text-rose-800 font-medium">Cancelados:</span>
            <span class="font-bold text-rose-900 font-mono">{{ getOrdersByStatuses(['CANCELLED']).length }}</span>
          </div>
        </div>

        <!-- View Toggle -->
        <div class="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200 self-start sm:self-auto shrink-0">
          <button
            (click)="viewMode.set('kanban')"
            [class]="'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode() === 'kanban' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>Tablero To-Do (5 Columnas)</span>
          </button>
          <button
            (click)="viewMode.set('list')"
            [class]="'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode() === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Lista Compacta</span>
          </button>
        </div>

      </div>

      <!-- KANBAN / TO-DO BOARD VIEW (5 COLUMNAS COMPLETAS) -->
      @if (viewMode() === 'kanban') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          
          @for (col of columns; track col.key) {
            <div class="bg-zinc-50/90 rounded-2xl md:rounded-3xl border border-zinc-200/90 p-3.5 space-y-3.5 shadow-sm flex flex-col min-h-[620px]">
              
              <!-- Column Header -->
              <div class="flex items-center justify-between px-1">
                <div class="flex items-center gap-2">
                  <div [class]="'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ' + col.headerBg">
                    {{ col.key === 'pending' ? '1' : col.key === 'processing' ? '2' : col.key === 'shipped' ? '3' : col.key === 'delivered' ? '4' : '✕' }}
                  </div>
                  <h3 class="font-bold text-zinc-900 text-xs tracking-tight">{{ col.title }}</h3>
                </div>
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 shadow-sm">
                  {{ getOrdersByStatuses(col.statuses).length }}
                </span>
              </div>

              <!-- Cards Stream inside this To-Do Column -->
              <div class="space-y-3 flex-1">
                @for (order of getOrdersByStatuses(col.statuses); track order.id) {
                  <div class="bg-white rounded-2xl border border-zinc-200/80 p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-zinc-300 transition-all duration-200 space-y-2.5 group">
                    
                    <!-- Top Line: Order Number, Origin & Payment Badge -->
                    <div class="flex items-center justify-between gap-1 flex-wrap">
                      <span class="font-mono text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                        {{ order.orderNumber }}
                      </span>
                      
                      <!-- Payment Method Status Tag -->
                      @if (order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
                        <span class="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/70">
                          ✓ Pagado Culqi
                        </span>
                      } @else if (order.status === 'CANCELLED') {
                        <span class="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/70">
                          ✕ Cancelado
                        </span>
                      } @else {
                        <a
                          [href]="'/pay/' + order.orderNumber"
                          target="_blank"
                          class="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md border border-indigo-200/70 transition-colors"
                          title="Abrir enlace de pago Culqi"
                        >
                          💳 Link Pago ↗
                        </a>
                      }
                    </div>

                    <!-- Customer Box -->
                    <div class="p-2 rounded-xl bg-zinc-50/80 border border-zinc-200/60 text-xs space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-zinc-900 text-xs truncate max-w-[120px]">{{ order.customerName }}</span>
                        
                        <div class="flex items-center gap-1">
                          <a
                            [routerLink]="['/live-chat']"
                            [queryParams]="{ phone: order.customerPhone, name: order.customerName }"
                            class="text-[9px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md border border-indigo-200 flex items-center gap-0.5 shrink-0 transition-colors"
                            title="Abrir en Live Chat del Portal"
                          >
                            <span>Live Chat</span>
                          </a>

                          <a
                            [href]="'https://wa.me/' + cleanPhone(order.customerPhone)"
                            target="_blank"
                            class="text-[9px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-1 rounded-md border border-emerald-200 flex items-center shrink-0 transition-colors"
                            title="Abrir en WhatsApp Web externo"
                          >
                            <svg class="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                      <p class="font-mono text-zinc-500 text-[10px]">+{{ order.customerPhone }}</p>
                      @if (order.customerAddress) {
                        <p class="text-zinc-500 text-[10px] truncate">📍 {{ order.customerAddress }}</p>
                      }
                    </div>

                    <!-- Items Checklist -->
                    <div class="space-y-0.5 text-xs">
                      <span class="text-zinc-400 font-mono text-[9px] uppercase font-semibold block">Productos:</span>
                      @for (item of order.items || []; track item.id) {
                        <div class="flex items-center justify-between text-zinc-700 text-[10px]">
                          <span class="truncate text-zinc-800 max-w-[130px]">✓ {{ item.quantity }}x {{ item.productName }}</span>
                          <span class="font-bold text-zinc-900 font-mono">S/ {{ item.subtotal | number: '1.2-2' }}</span>
                        </div>
                      }
                    </div>

                    <!-- Total & Delivery -->
                    <div class="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span class="text-zinc-400 font-mono text-[9px] uppercase font-semibold">
                        Total (+ Delivery)
                      </span>
                      <span class="text-xs font-extrabold text-zinc-900 font-mono">S/ {{ order.total | number: '1.2-2' }}</span>
                    </div>

                    <!-- Direct Status Selector (Dropdown) -->
                    <div class="pt-1">
                      <label class="block text-zinc-400 font-mono text-[9px] uppercase font-semibold mb-0.5">
                        Cambiar Estado:
                      </label>
                      <select
                        [ngModel]="order.status"
                        (ngModelChange)="onStatusChange(order, $event)"
                        class="w-full py-1 px-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-[11px] font-bold text-zinc-800 transition-colors focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="PENDING">⏳ Pendiente</option>
                        <option value="CONFIRMED">✓ Confirmado (Pagado)</option>
                        <option value="PROCESSING">📦 En Preparación</option>
                        <option value="SHIPPED">🚚 Enviado</option>
                        <option value="DELIVERED">🎉 Entregado</option>
                        <option value="CANCELLED">❌ Cancelado</option>
                      </select>
                    </div>

                    <!-- Quick Action Buttons -->
                    <div class="pt-1.5 border-t border-zinc-100 space-y-1">
                      
                      <!-- Forward Next Status Button -->
                      @if (col.nextStatus && order.status !== 'CANCELLED') {
                        <button
                          (click)="onStatusChange(order, col.nextStatus!)"
                          class="w-full py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                        >
                          <span>{{ col.nextActionText }}</span>
                          <span>➔</span>
                        </button>
                      }

                      <!-- Quick Cancel Button -->
                      @if (order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
                        <button
                          (click)="cancelOrder(order)"
                          class="w-full py-1 px-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <span>❌ Cancelar Pedido</span>
                        </button>
                      }

                      <!-- Admin Culqi Refund Option -->
                      @if (authService.isAdmin() && order.status !== 'CANCELLED' && (order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED')) {
                        <button
                          (click)="refundOrder(order)"
                          class="w-full py-1 px-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                          title="Emitir reembolso vía Culqi y reincorporar stock"
                        >
                          <span>💸 Reembolsar Culqi</span>
                        </button>
                      }

                    </div>

                  </div>
                } @empty {
                  <div class="h-32 flex flex-col items-center justify-center text-center p-3 border border-dashed border-zinc-200 rounded-2xl text-zinc-400 text-xs">
                    <span class="text-base mb-1">
                      {{ col.key === 'pending' ? '⏳' : col.key === 'processing' ? '📦' : col.key === 'shipped' ? '🚚' : col.key === 'delivered' ? '🎉' : '❌' }}
                    </span>
                    <span class="text-[11px]">Sin pedidos en esta etapa</span>
                  </div>
                }
              </div>

            </div>
          }

        </div>
      } @else {
        <!-- LIST COMPACT VIEW -->
        <app-bento-card>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-zinc-600">
              <thead class="text-zinc-500 font-mono text-[10px] uppercase tracking-wider font-semibold border-b border-zinc-100 bg-zinc-50/60">
                <tr>
                  <th class="py-3 px-4 rounded-l-xl">Pedido #</th>
                  <th class="py-3 px-4">Cliente</th>
                  <th class="py-3 px-4">Teléfono</th>
                  <th class="py-3 px-4">Origen</th>
                  <th class="py-3 px-4">Total</th>
                  <th class="py-3 px-4">Estado</th>
                  <th class="py-3 px-4 rounded-r-xl">Cambiar Estado / Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                @for (order of orders(); track order.id) {
                  <tr class="hover:bg-zinc-50/70 transition-colors">
                    <td class="py-3 px-4 font-mono font-bold text-zinc-900">{{ order.orderNumber }}</td>
                    <td class="py-3 px-4 font-medium text-zinc-800">{{ order.customerName }}</td>
                    <td class="py-3 px-4 font-mono text-zinc-500">
                      <a [href]="'https://wa.me/' + cleanPhone(order.customerPhone)" target="_blank" class="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1">
                        <span>+{{ order.customerPhone }}</span>
                      </a>
                    </td>
                    <td class="py-3 px-4">
                      @if (order.source === 'WHATSAPP_BOT') {
                        <span class="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                          WhatsApp Bot
                        </span>
                      } @else {
                        <span class="text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60 text-[11px]">
                          Panel Web
                        </span>
                      }
                    </td>
                    <td class="py-3 px-4 font-bold text-zinc-900 font-mono">S/ {{ order.total | number: '1.2-2' }}</td>
                    <td class="py-3 px-4">
                      <app-badge [variant]="getBadgeVariant(order.status)">{{ order.status }}</app-badge>
                    </td>
                    <td class="py-3 px-4 flex items-center gap-2">
                      <select
                        [ngModel]="order.status"
                        (ngModelChange)="onStatusChange(order, $event)"
                        class="input-bento py-1 text-xs font-semibold"
                      >
                        <option value="PENDING">⏳ Pendiente</option>
                        <option value="CONFIRMED">✓ Confirmado (Pagado)</option>
                        <option value="PROCESSING">📦 En Preparación</option>
                        <option value="SHIPPED">🚚 Enviado</option>
                        <option value="DELIVERED">🎉 Entregado</option>
                        <option value="CANCELLED">❌ Cancelado</option>
                      </select>

                      @if (order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
                        <button
                          (click)="cancelOrder(order)"
                          class="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 text-xs font-bold transition-colors"
                          title="Cancelar pedido"
                        >
                          ✕ Cancelar
                        </button>
                      }

                      @if (authService.isAdmin() && order.status !== 'CANCELLED' && (order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED')) {
                        <button
                          (click)="refundOrder(order)"
                          class="btn-danger p-1.5 text-xs whitespace-nowrap"
                          title="Reembolsar con Culqi"
                        >
                          💸 Reembolso
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-bento-card>
      }

    </div>
  `,
})
export class OrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private http = inject(HttpClient);
  authService = inject(AuthService);

  orders = signal<Order[]>([]);
  viewMode = signal<'kanban' | 'list'>('kanban');

  columns: TodoColumn[] = [
    {
      key: 'pending',
      title: 'Por Atender (Pendientes)',
      statuses: [OrderStatus.PENDING],
      headerBg: 'bg-amber-100 text-amber-800',
      badgeVariant: 'warning',
      nextActionText: 'Iniciar Preparación',
      nextStatus: OrderStatus.PROCESSING,
    },
    {
      key: 'processing',
      title: 'En Preparación / Pagados',
      statuses: [OrderStatus.PROCESSING, OrderStatus.CONFIRMED],
      headerBg: 'bg-indigo-100 text-indigo-800',
      badgeVariant: 'info',
      nextActionText: 'Despachar / Enviar',
      nextStatus: OrderStatus.SHIPPED,
    },
    {
      key: 'shipped',
      title: 'En Camino (Delivery)',
      statuses: [OrderStatus.SHIPPED],
      headerBg: 'bg-purple-100 text-purple-800',
      badgeVariant: 'purple',
      nextActionText: 'Marcar como Entregado',
      nextStatus: OrderStatus.DELIVERED,
    },
    {
      key: 'delivered',
      title: 'Entregados (Completados)',
      statuses: [OrderStatus.DELIVERED],
      headerBg: 'bg-emerald-100 text-emerald-800',
      badgeVariant: 'success',
    },
    {
      key: 'cancelled',
      title: 'Cancelados',
      statuses: [OrderStatus.CANCELLED],
      headerBg: 'bg-rose-100 text-rose-800',
      badgeVariant: 'danger',
    },
  ];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.ordersService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
      },
    });
  }

  getOrdersByStatuses(statuses: (OrderStatus | string)[]): Order[] {
    return this.orders().filter((o) => statuses.includes(o.status as any));
  }

  onStatusChange(order: Order, newStatus: OrderStatus) {
    this.ordersService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updated) => {
        order.status = updated.status;
        this.loadOrders();
      },
    });
  }

  cancelOrder(order: Order) {
    if (confirm(`¿Estás seguro de cancelar el pedido #${order.orderNumber} de ${order.customerName}? Se restaurará el stock a la base de datos.`)) {
      this.onStatusChange(order, OrderStatus.CANCELLED);
    }
  }

  refundOrder(order: Order) {
    const reason = prompt(
      `¿Deseas procesar el reembolso en Culqi para la orden #${order.orderNumber} por S/ ${order.total.toFixed(2)} PEN?\n\nIngresa el motivo del reembolso:`,
      'Cancelación solicitada por el cliente',
    );

    if (reason !== null) {
      this.http
        .post<any>(`${environment.apiUrl}/payments/refund/${order.id}`, { reason })
        .subscribe({
          next: (res) => {
            alert(`✅ Reembolso procesado con éxito en Culqi.\nID de Reembolso: ${res.refund?.refundId || 'N/A'}`);
            this.loadOrders();
          },
          error: (err) => {
            alert(err.error?.message || 'Error al procesar reembolso en Culqi.');
          },
        });
    }
  }

  cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  getBadgeVariant(status: string): any {
    switch (status) {
      case 'CONFIRMED':
      case 'DELIVERED':
        return 'success';
      case 'PENDING':
      case 'PROCESSING':
        return 'warning';
      case 'SHIPPED':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  }
}
