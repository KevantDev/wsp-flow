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
    <app-navbar title="Pipeline de Pedidos & Ventas" subtitle="Gestión interactiva To-Do, emisión de boletas en PDF, cobros con Culqi y reembolsos"></app-navbar>

    <div class="space-y-5 mt-5 pb-14">
      
      <!-- TOP CONTROLS & STATS BAR -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        
        <!-- Summary Stats Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <div class="px-3 py-1.5 rounded-xl bg-zinc-100/80 border border-zinc-200 flex items-center gap-1.5 shrink-0">
            <span class="text-zinc-500 font-medium">Total:</span>
            <span class="font-bold text-zinc-900 font-mono">{{ orders().length }}</span>
          </div>
          <div class="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center gap-1.5 shrink-0">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-amber-800 font-medium">Por Atender:</span>
            <span class="font-bold text-amber-900 font-mono">{{ getOrdersByStatuses(['PENDING']).length }}</span>
          </div>
          <div class="px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/70 flex items-center gap-1.5 shrink-0">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span class="text-indigo-800 font-medium">En Preparación:</span>
            <span class="font-bold text-indigo-900 font-mono">{{ getOrdersByStatuses(['PROCESSING', 'CONFIRMED']).length }}</span>
          </div>
          <div class="px-2.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200/70 flex items-center gap-1.5 shrink-0">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span>
            <span class="text-purple-800 font-medium">En Camino:</span>
            <span class="font-bold text-purple-900 font-mono">{{ getOrdersByStatuses(['SHIPPED']).length }}</span>
          </div>
          <div class="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center gap-1.5 shrink-0">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-emerald-800 font-medium">Entregados:</span>
            <span class="font-bold text-emerald-900 font-mono">{{ getOrdersByStatuses(['DELIVERED']).length }}</span>
          </div>
          <div class="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center gap-1.5 shrink-0">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span class="text-rose-800 font-medium">Cancelados:</span>
            <span class="font-bold text-rose-900 font-mono">{{ getOrdersByStatuses(['CANCELLED']).length }}</span>
          </div>
        </div>

        <!-- Right Side Actions & View Switcher -->
        <div class="flex items-center gap-2 justify-between sm:justify-end shrink-0">
          <button
            (click)="loadOrders()"
            class="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-all border border-zinc-200 flex items-center gap-1.5 text-xs font-semibold"
            title="Recargar pedidos"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="hidden sm:inline">Actualizar</span>
          </button>

          <div class="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200">
            <button
              (click)="viewMode.set('kanban')"
              [class]="'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode() === 'kanban' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800')"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Tablero To-Do</span>
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

      </div>

      <!-- KANBAN BOARD VIEW (5 COLUMNAS EQUILIBRADAS) -->
      @if (viewMode() === 'kanban') {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
          
          @for (col of columns; track col.key) {
            <div class="bg-zinc-100/60 rounded-2xl border border-zinc-200/90 p-3 space-y-3 shadow-sm flex flex-col min-h-[580px]">
              
              <!-- Column Header -->
              <div class="flex items-center justify-between px-1">
                <div class="flex items-center gap-2">
                  <div [class]="'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono ' + col.headerBg">
                    {{ col.key === 'pending' ? '1' : col.key === 'processing' ? '2' : col.key === 'shipped' ? '3' : col.key === 'delivered' ? '4' : '✕' }}
                  </div>
                  <h3 class="font-bold text-zinc-900 text-xs tracking-tight truncate max-w-[130px]">{{ col.title }}</h3>
                </div>
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 shadow-sm">
                  {{ getOrdersByStatuses(col.statuses).length }}
                </span>
              </div>

              <!-- Cards Stream -->
              <div class="space-y-2.5 flex-1">
                @for (order of getOrdersByStatuses(col.statuses); track order.id) {
                  <div class="bg-white rounded-xl border border-zinc-200/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-indigo-200 transition-all duration-200 space-y-2 group">
                    
                    <!-- Top Line: Order Number & Payment Status Tag -->
                    <div class="flex items-center justify-between gap-1">
                      <span class="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                        {{ order.orderNumber }}
                      </span>
                      
                      @if (order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
                        <span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          ✓ Pagado
                        </span>
                      } @else if (order.status === 'CANCELLED') {
                        <span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                          ✕ Cancelado
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                          ⏳ Pendiente
                        </span>
                      }
                    </div>

                    <!-- Customer & Delivery Box -->
                    <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60 text-xs space-y-1">
                      <div class="flex items-center justify-between gap-1">
                        <span class="font-bold text-zinc-900 text-xs truncate max-w-[130px]" [title]="order.customerName">{{ order.customerName }}</span>
                        
                        <div class="flex items-center gap-1 shrink-0">
                          <a
                            [routerLink]="['/live-chat']"
                            [queryParams]="{ phone: order.customerPhone, name: order.customerName }"
                            class="text-[9px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 transition-colors"
                            title="Abrir en Live Chat del Portal"
                          >
                            Chat
                          </a>
                          <a
                            [href]="'https://wa.me/' + cleanPhone(order.customerPhone)"
                            target="_blank"
                            class="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            title="Abrir en WhatsApp Web externo"
                          >
                            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                      <p class="font-mono text-zinc-500 text-[10px]">+{{ order.customerPhone }}</p>
                      @if (order.customerAddress) {
                        <p class="text-zinc-500 text-[10px] truncate" [title]="order.customerAddress">📍 {{ order.customerAddress }}</p>
                      }
                    </div>

                    <!-- Items Preview -->
                    <div class="space-y-0.5 text-xs">
                      @for (item of (order.items || []).slice(0, 2); track item.id) {
                        <div class="flex items-center justify-between text-zinc-700 text-[10px]">
                          <span class="truncate text-zinc-800 max-w-[125px]">✓ {{ item.quantity }}x {{ item.productName }}</span>
                          <span class="font-bold text-zinc-900 font-mono">S/ {{ item.subtotal | number: '1.2-2' }}</span>
                        </div>
                      }
                      @if ((order.items || []).length > 2) {
                        <p class="text-[9px] text-zinc-400 font-medium italic">+ {{ (order.items || []).length - 2 }} producto(s) más...</p>
                      }
                    </div>

                    <!-- Total Row -->
                    <div class="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span class="text-zinc-400 font-mono text-[9px] uppercase font-semibold">Total a Pagar</span>
                      <span class="text-xs font-extrabold text-zinc-900 font-mono">S/ {{ order.total | number: '1.2-2' }}</span>
                    </div>

                    <!-- Dual Action Row: Ver Detalle Modal & Boleta PDF -->
                    <div class="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        (click)="openOrderDetail(order)"
                        class="py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-indigo-50 text-zinc-800 hover:text-indigo-700 font-bold text-[10px] border border-zinc-200 hover:border-indigo-200 transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        <span>👁️</span>
                        <span>Ver Detalle</span>
                      </button>

                      <button
                        (click)="downloadReceiptPdf(order)"
                        class="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 transition-all flex items-center justify-center gap-1 active:scale-95"
                        title="Descargar Boleta de Venta en PDF"
                      >
                        <span>📄</span>
                        <span>Boleta PDF</span>
                      </button>
                    </div>

                    <!-- Quick Status Forward Button -->
                    @if (col.nextStatus && order.status !== 'CANCELLED') {
                      <button
                        (click)="onStatusChange(order, col.nextStatus!)"
                        class="w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                      >
                        <span>{{ col.nextActionText }}</span>
                        <span>➔</span>
                      </button>
                    }

                  </div>
                } @empty {
                  <div class="h-32 flex flex-col items-center justify-center text-center p-3 border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs">
                    <span class="text-base mb-1">
                      {{ col.key === 'pending' ? '⏳' : col.key === 'processing' ? '📦' : col.key === 'shipped' ? '🚚' : col.key === 'delivered' ? '🎉' : '❌' }}
                    </span>
                    <span class="text-[10px]">Sin pedidos</span>
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
                  <th class="py-3 px-4 rounded-r-xl">Acciones / Comprobante</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                @for (order of orders(); track order.id) {
                  <tr class="hover:bg-zinc-50/70 transition-colors">
                    <td class="py-3 px-4 font-mono font-bold text-indigo-700">
                      <button (click)="openOrderDetail(order)" class="hover:underline font-bold">
                        {{ order.orderNumber }}
                      </button>
                    </td>
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
                      <button
                        (click)="openOrderDetail(order)"
                        class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors inline-flex items-center gap-1"
                        title="Ver detalle completo"
                      >
                        <span>👁️ Detalle</span>
                      </button>

                      <button
                        (click)="downloadReceiptPdf(order)"
                        class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        title="Descargar Boleta en PDF"
                      >
                        <span>📄 Boleta</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-bento-card>
      }

    </div>

    <!-- ========================================================================= -->
    <!-- MODAL DE DETALLE COMPLETO DEL PEDIDO (BENTO ORDER DETAIL MODAL)           -->
    <!-- ========================================================================= -->
    @if (selectedOrder()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div class="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 transform transition-all">
          
          <!-- Modal Top Header Banner -->
          <div class="bg-indigo-600 px-6 py-5 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl font-bold font-mono border border-white/20">
                📦
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold font-mono tracking-tight">{{ selectedOrder()!.orderNumber }}</h2>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                    {{ selectedOrder()!.source === 'WHATSAPP_BOT' ? '🤖 WhatsApp Bot' : '🖥️ Panel Web' }}
                  </span>
                </div>
                <p class="text-xs text-indigo-100">
                  Emitido el {{ selectedOrder()!.createdAt | date: 'dd/MM/yyyy, hh:mm a' }}
                </p>
              </div>
            </div>

            <!-- Close Button -->
            <button
              (click)="selectedOrder.set(null)"
              class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          <!-- Modal Body Content (Bento Grid Style) -->
          <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

            <!-- Section 1: Customer & Delivery Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              <!-- Customer Card -->
              <div class="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-wider">Datos del Cliente</span>
                  <div class="flex items-center gap-1">
                    <a
                      [routerLink]="['/live-chat']"
                      [queryParams]="{ phone: selectedOrder()!.customerPhone, name: selectedOrder()!.customerName }"
                      (click)="selectedOrder.set(null)"
                      class="text-[10px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200"
                    >
                      💬 Live Chat
                    </a>
                    <a
                      [href]="'https://wa.me/' + cleanPhone(selectedOrder()!.customerPhone)"
                      target="_blank"
                      class="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                    >
                      WhatsApp ↗
                    </a>
                  </div>
                </div>

                <div>
                  <h4 class="font-bold text-zinc-900 text-sm">{{ selectedOrder()!.customerName }}</h4>
                  <p class="font-mono text-zinc-600 text-xs">+{{ selectedOrder()!.customerPhone }}</p>
                  @if (getCustomerDni(selectedOrder()!)) {
                    <p class="text-zinc-500 text-xs mt-0.5">
                      <span class="font-semibold text-zinc-700">DNI / Doc:</span> {{ getCustomerDni(selectedOrder()!) }}
                    </p>
                  }
                </div>
              </div>

              <!-- Delivery & Address Card -->
              <div class="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <span class="text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-wider">Entrega & Despacho</span>
                <div>
                  <div class="flex items-center gap-1.5 text-xs font-bold text-zinc-800 mb-1">
                    <span>📍</span>
                    <span>{{ selectedOrder()!.customerAddress || 'Recojo en Tienda Miraflores' }}</span>
                  </div>
                  <p class="text-[11px] text-zinc-500">
                    <span class="font-semibold text-zinc-700">Costo de Envío:</span>
                    {{ selectedOrder()!.deliveryFee === 0 ? 'S/ 0.00 (Gratis / Recojo)' : ('S/ ' + (selectedOrder()!.deliveryFee | number: '1.2-2') + ' PEN') }}
                  </p>
                </div>
              </div>

            </div>

            <!-- Section 2: Products Breakdown Table -->
            <div class="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-3">
              <span class="text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-wider block">
                Artículos del Pedido ({{ (selectedOrder()!.items || []).length }} productos)
              </span>

              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                  <thead class="text-zinc-500 font-mono text-[10px] uppercase border-b border-zinc-100 bg-zinc-50">
                    <tr>
                      <th class="py-2 px-3">Cant.</th>
                      <th class="py-2 px-3">Producto</th>
                      <th class="py-2 px-3 text-right">P. Unitario</th>
                      <th class="py-2 px-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-100">
                    @for (item of selectedOrder()!.items || []; track item.id) {
                      <tr>
                        <td class="py-2.5 px-3 font-mono font-bold text-indigo-700">{{ item.quantity }}x</td>
                        <td class="py-2.5 px-3 font-semibold text-zinc-900">{{ item.productName }}</td>
                        <td class="py-2.5 px-3 text-right font-mono text-zinc-600">S/ {{ item.unitPrice | number: '1.2-2' }}</td>
                        <td class="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">S/ {{ item.subtotal | number: '1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Financial Summary Box -->
              <div class="pt-3 border-t border-zinc-100 flex flex-col items-end gap-1 text-xs">
                <div class="flex items-center justify-between w-64 text-zinc-600">
                  <span>Subtotal Productos:</span>
                  <span class="font-mono font-semibold">S/ {{ selectedOrder()!.subtotal | number: '1.2-2' }}</span>
                </div>
                <div class="flex items-center justify-between w-64 text-zinc-600">
                  <span>Costo de Delivery:</span>
                  <span class="font-mono font-semibold">S/ {{ selectedOrder()!.deliveryFee | number: '1.2-2' }}</span>
                </div>
                <div class="flex items-center justify-between w-64 pt-1.5 border-t border-zinc-200 text-sm font-extrabold text-indigo-700">
                  <span>TOTAL A PAGAR:</span>
                  <span class="font-mono text-base">S/ {{ selectedOrder()!.total | number: '1.2-2' }} PEN</span>
                </div>
              </div>
            </div>

            <!-- Section 3: Status Changer & Operational Management -->
            <div class="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <span class="text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-wider block">
                Gestión de Estado & Comprobante
              </span>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div>
                  <label class="block text-zinc-600 font-semibold text-xs mb-1">Estado de la Orden:</label>
                  <select
                    [ngModel]="selectedOrder()!.status"
                    (ngModelChange)="onStatusChange(selectedOrder()!, $event)"
                    class="w-full py-2 px-3 rounded-xl bg-white border border-zinc-300 font-bold text-xs text-zinc-900 shadow-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PENDING">⏳ Pendiente de Pago</option>
                    <option value="CONFIRMED">✓ Confirmado (Pago Verificado)</option>
                    <option value="PROCESSING">📦 En Preparación / Empaque</option>
                    <option value="SHIPPED">🚚 En Camino (Despachado)</option>
                    <option value="DELIVERED">🎉 Entregado con Éxito</option>
                    <option value="CANCELLED">❌ Cancelado</option>
                  </select>
                </div>

                <div class="flex flex-col justify-end gap-1">
                  <button
                    (click)="downloadReceiptPdf(selectedOrder()!)"
                    class="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>📄</span>
                    <span>Descargar Boleta de Venta PDF</span>
                  </button>
                </div>

              </div>

              <!-- Refund & Cancellation Buttons -->
              <div class="pt-2 border-t border-zinc-200/80 flex items-center justify-between gap-2 flex-wrap">
                @if (selectedOrder()!.status !== 'CANCELLED' && selectedOrder()!.status !== 'DELIVERED') {
                  <button
                    (click)="cancelOrder(selectedOrder()!)"
                    class="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold border border-rose-200 transition-colors"
                  >
                    ❌ Cancelar Pedido & Restaurar Stock
                  </button>
                }

                @if (authService.isAdmin() && selectedOrder()!.status !== 'CANCELLED' && (selectedOrder()!.status === 'CONFIRMED' || selectedOrder()!.status === 'PROCESSING' || selectedOrder()!.status === 'SHIPPED')) {
                  <button
                    (click)="refundOrder(selectedOrder()!)"
                    class="px-3 py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-colors"
                  >
                    💸 Emitir Reembolso en Culqi
                  </button>
                }
              </div>

            </div>

          </div>

          <!-- Modal Footer -->
          <div class="bg-zinc-50 px-6 py-4 border-t border-zinc-200 flex items-center justify-end">
            <button
              (click)="selectedOrder.set(null)"
              class="px-5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class OrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private http = inject(HttpClient);
  authService = inject(AuthService);

  orders = signal<Order[]>([]);
  viewMode = signal<'kanban' | 'list'>('kanban');
  selectedOrder = signal<Order | null>(null);

  columns: TodoColumn[] = [
    {
      key: 'pending',
      title: 'Por Atender',
      statuses: [OrderStatus.PENDING],
      headerBg: 'bg-amber-100 text-amber-800',
      badgeVariant: 'warning',
      nextActionText: 'Preparar',
      nextStatus: OrderStatus.PROCESSING,
    },
    {
      key: 'processing',
      title: 'En Preparación',
      statuses: [OrderStatus.PROCESSING, OrderStatus.CONFIRMED],
      headerBg: 'bg-indigo-100 text-indigo-800',
      badgeVariant: 'info',
      nextActionText: 'Despachar',
      nextStatus: OrderStatus.SHIPPED,
    },
    {
      key: 'shipped',
      title: 'En Camino',
      statuses: [OrderStatus.SHIPPED],
      headerBg: 'bg-purple-100 text-purple-800',
      badgeVariant: 'purple',
      nextActionText: 'Entregado',
      nextStatus: OrderStatus.DELIVERED,
    },
    {
      key: 'delivered',
      title: 'Entregados',
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
      next: (data: any) => {
        const list = Array.isArray(data)
          ? data
          : data?.orders && Array.isArray(data.orders)
          ? data.orders
          : [];
        this.orders.set(list);

        // Si hay un modal abierto, actualizar la referencia
        if (this.selectedOrder()) {
          const updated = list.find((o: Order) => o.id === this.selectedOrder()!.id);
          if (updated) this.selectedOrder.set(updated);
        }
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.orders.set([]);
      },
    });
  }

  openOrderDetail(order: Order) {
    this.selectedOrder.set(order);
  }

  downloadReceiptPdf(order: Order) {
    const url = `${environment.apiUrl}/orders/${order.orderNumber}/receipt-pdf`;
    window.open(url, '_blank');
  }

  getCustomerDni(order: Order): string {
    if (order.notes && order.notes.includes('DNI:')) {
      const match = order.notes.match(/DNI:\s*([0-9A-Za-z]+)/);
      if (match) return match[1];
    }
    return '';
  }

  getOrdersByStatuses(statuses: (OrderStatus | string)[]): Order[] {
    const list = Array.isArray(this.orders()) ? this.orders() : [];
    return list.filter((o) => o && statuses.includes(o.status as any));
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
    return phone ? phone.replace(/\D/g, '') : '';
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
