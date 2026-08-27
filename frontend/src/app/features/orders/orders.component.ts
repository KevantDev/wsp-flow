import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { OrdersService } from '../../core/services/orders.service';
import { Order, OrderStatus } from '../../core/models/models';

interface TodoColumn {
  key: string;
  title: string;
  statuses: OrderStatus[];
  headerBg: string;
  badgeVariant: 'warning' | 'info' | 'purple' | 'success' | 'danger' | 'neutral';
  nextActionText?: string;
  nextStatus?: OrderStatus;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BentoCardComponent, BadgeComponent],
  template: `
    <app-navbar title="Pipeline de Pedidos & Ventas" subtitle="Gestión interactiva estilo To-Do / Tablero de Estado"></app-navbar>

    <div class="space-y-6 mt-6">
      
      <!-- Top Controls & View Switcher -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <!-- Summary Stats Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <div class="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 shadow-xs flex items-center gap-2">
            <span class="text-zinc-500 font-medium">Total Pedidos:</span>
            <span class="font-bold text-zinc-900 font-mono">{{ orders().length }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-amber-800 font-medium">Por Atender:</span>
            <span class="font-bold text-amber-900 font-mono">{{ getOrdersByStatuses(['PENDING']).length }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/70 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span class="text-indigo-800 font-medium">En Preparación:</span>
            <span class="font-bold text-indigo-900 font-mono">{{ getOrdersByStatuses(['PROCESSING', 'CONFIRMED']).length }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-emerald-800 font-medium">Entregados:</span>
            <span class="font-bold text-emerald-900 font-mono">{{ getOrdersByStatuses(['DELIVERED']).length }}</span>
          </div>
        </div>

        <!-- View Toggle -->
        <div class="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200 self-start sm:self-auto">
          <button
            (click)="viewMode.set('kanban')"
            [class]="'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode() === 'kanban' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>Tablero To-Do</span>
          </button>
          <button
            (click)="viewMode.set('list')"
            [class]="'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode() === 'list' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Lista Compacta</span>
          </button>
        </div>

      </div>

      <!-- KANBAN / TO-DO BOARD VIEW -->
      @if (viewMode() === 'kanban') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          
          @for (col of columns; track col.key) {
            <div class="bg-zinc-50/90 rounded-2xl md:rounded-3xl border border-zinc-200/90 p-4 space-y-4 shadow-xs flex flex-col min-h-[620px]">
              
              <!-- Column Header -->
              <div class="flex items-center justify-between px-1">
                <div class="flex items-center gap-2">
                  <div [class]="'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ' + col.headerBg">
                    {{ col.key === 'pending' ? '1' : col.key === 'processing' ? '2' : col.key === 'shipped' ? '3' : '4' }}
                  </div>
                  <h3 class="font-bold text-zinc-900 text-xs sm:text-sm tracking-tight">{{ col.title }}</h3>
                </div>
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 shadow-xs">
                  {{ getOrdersByStatuses(col.statuses).length }}
                </span>
              </div>

              <!-- Cards Stream inside this To-Do Column -->
              <div class="space-y-3.5 flex-1">
                @for (order of getOrdersByStatuses(col.statuses); track order.id) {
                  <div class="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-zinc-300 transition-all duration-200 space-y-3 group hover:-translate-y-0.5">
                    
                    <!-- Top Line: Order Number & Origin -->
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-[11px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                        {{ order.orderNumber }}
                      </span>
                      
                      @if (order.source === 'WHATSAPP_BOT') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <span class="w-1 h-1 rounded-full bg-emerald-500"></span>
                          Bot WSP
                        </span>
                      } @else {
                        <span class="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                          Panel Web
                        </span>
                      }
                    </div>

                    <!-- Customer Box -->
                    <div class="p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-200/60 text-xs">
                      <div class="flex items-center justify-between mb-0.5">
                        <span class="font-bold text-zinc-900 truncate">{{ order.customerName }}</span>
                        
                        <a
                          [href]="'https://wa.me/' + cleanPhone(order.customerPhone)"
                          target="_blank"
                          class="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <svg class="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Chat</span>
                        </a>
                      </div>
                      <p class="font-mono text-zinc-500 text-[10px]">+{{ order.customerPhone }}</p>
                    </div>

                    <!-- Items Checklist -->
                    <div class="space-y-1 text-xs">
                      <span class="text-zinc-500 font-mono text-[10px] uppercase font-semibold block">Productos:</span>
                      @for (item of order.items || []; track item.id) {
                        <div class="flex items-center justify-between text-zinc-700 text-[11px]">
                          <span class="truncate text-zinc-800">✓ {{ item.quantity }}x {{ item.productName }}</span>
                          <span class="font-bold text-zinc-900 font-mono">&#36;{{ item.subtotal | number: '1.2-2' }}</span>
                        </div>
                      }
                    </div>

                    <!-- Total -->
                    <div class="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <span class="text-zinc-500 font-mono text-[10px] uppercase font-semibold">Total a Cobrar</span>
                      <span class="text-sm font-extrabold text-zinc-900 font-mono">&#36;{{ order.total | number: '1.2-2' }}</span>
                    </div>

                    <!-- Next Step Action Button (To-Do Flow) -->
                    @if (col.nextStatus) {
                      <div class="pt-2 border-t border-zinc-100">
                        <button
                          (click)="onStatusChange(order, col.nextStatus!)"
                          class="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 hover:text-indigo-800 text-xs font-bold border border-indigo-200/80 transition-all flex items-center justify-center gap-1.5 shadow-sm group-hover:border-indigo-300"
                        >
                          <span>{{ col.nextActionText }}</span>
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    } @else if (order.status === 'DELIVERED') {
                      <div class="pt-2 border-t border-zinc-100 text-center">
                        <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70 inline-flex items-center gap-1">
                          <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Pedido Completado</span>
                        </span>
                      </div>
                    }

                  </div>
                } @empty {
                  <div class="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 rounded-2xl text-zinc-400 text-xs">
                    <svg class="w-6 h-6 text-zinc-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Sin tareas en esta etapa</span>
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
                  <th class="py-3 px-4">Estado Actual</th>
                  <th class="py-3 px-4 rounded-r-xl">Cambiar Estado</th>
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
                    <td class="py-3 px-4 font-bold text-zinc-900 font-mono">&#36;{{ order.total | number: '1.2-2' }}</td>
                    <td class="py-3 px-4">
                      <app-badge [variant]="getBadgeVariant(order.status)">{{ order.status }}</app-badge>
                    </td>
                    <td class="py-3 px-4">
                      <select
                        [ngModel]="order.status"
                        (ngModelChange)="onStatusChange(order, $event)"
                        class="input-bento py-1 text-xs font-semibold"
                      >
                        <option value="PENDING">⏳ Pendiente</option>
                        <option value="PROCESSING">📦 En Preparación</option>
                        <option value="SHIPPED">🚚 Enviado</option>
                        <option value="DELIVERED">🎉 Entregado</option>
                        <option value="CANCELLED">❌ Cancelado</option>
                      </select>
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

  orders = signal<Order[]>([]);
  viewMode = signal<'kanban' | 'list'>('kanban');

  columns: TodoColumn[] = [
    {
      key: 'pending',
      title: 'Por Atender',
      statuses: [OrderStatus.PENDING],
      headerBg: 'bg-amber-100 text-amber-800',
      badgeVariant: 'warning',
      nextActionText: 'Iniciar Preparación',
      nextStatus: OrderStatus.PROCESSING,
    },
    {
      key: 'processing',
      title: 'En Preparación',
      statuses: [OrderStatus.PROCESSING, OrderStatus.CONFIRMED],
      headerBg: 'bg-indigo-100 text-indigo-800',
      badgeVariant: 'info',
      nextActionText: 'Despachar / Enviar',
      nextStatus: OrderStatus.SHIPPED,
    },
    {
      key: 'shipped',
      title: 'En Camino',
      statuses: [OrderStatus.SHIPPED],
      headerBg: 'bg-purple-100 text-purple-800',
      badgeVariant: 'purple',
      nextActionText: 'Marcar como Entregado',
      nextStatus: OrderStatus.DELIVERED,
    },
    {
      key: 'delivered',
      title: 'Entregados',
      statuses: [OrderStatus.DELIVERED],
      headerBg: 'bg-emerald-100 text-emerald-800',
      badgeVariant: 'success',
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
