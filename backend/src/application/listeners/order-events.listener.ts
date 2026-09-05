import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent, OrderStatusUpdatedEvent } from '../events/order.events';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';

@Injectable()
export class OrderEventsListener {
  private readonly logger = new Logger(OrderEventsListener.name);

  constructor(
    private readonly wsGateway: WhatsAppGateway,
    private readonly baileysService: BaileysService,
  ) {}

  /**
   * Reacciona a la creación de un nuevo pedido:
   * Emite el pedido en tiempo real a la sala privada del tenant en WebSockets.
   */
  @OnEvent('order.created')
  handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(
      `📦 [Evento order.created] Pedido #${event.order.orderNumber} para tenant ${event.tenantId}`,
    );

    // 1. Difundir por WebSocket a la sala privada del tenant
    this.wsGateway.emitNewOrder(event.order);
  }

  /**
   * Reacciona al cambio de estado de un pedido:
   * - Emite la actualización a la sala del tenant en WebSockets.
   * - Despacha la notificación por WhatsApp de forma asíncrona sin bloquear peticiones HTTP.
   */
  @OnEvent('order.status_updated')
  async handleOrderStatusUpdated(event: OrderStatusUpdatedEvent) {
    const { order, tenantId, customMessage } = event;

    this.logger.log(
      `🔄 [Evento order.status_updated] Pedido #${order.orderNumber} cambió a estado ${order.status} (Tenant: ${tenantId})`,
    );

    // 1. Notificar en vivo al panel del comercio
    this.wsGateway.emitOrderStatusUpdate(order);

    // 2. Notificación asíncrona al cliente por WhatsApp (en segundo plano)
    if (order.customerPhone) {
      const statusLabels: Record<string, string> = {
        CONFIRMED: '✅ *¡Pago Confirmado!* Tu pedido está listo para ser empaquetado.',
        PROCESSING: '📦 *¡En Preparación!* Tu pedido está siendo empacado en nuestro almacén.',
        SHIPPED: '🚚 *¡En Camino!* Tu pedido ha sido despachado hacia tu dirección.',
        DELIVERED: '🎉 *¡Entregado!* Confirmamos la entrega exitosa de tu pedido. ¡Muchas gracias por tu compra!',
        CANCELLED: '❌ *Pedido Cancelado:* Tu pedido ha sido cancelado.',
      };

      const msgText =
        customMessage ||
        `Hola ${order.customerName}, te informamos sobre el estado de tu pedido *#${order.orderNumber}*:\n\n${statusLabels[order.status] || order.status}\n\nTotal: *S/ ${Number(order.total || 0).toFixed(2)} PEN*\n\n¡Gracias por confiar en nosotros! ⭐`;

      try {
        await this.baileysService.sendManualMessage(
          tenantId || order.tenantId,
          order.customerPhone,
          msgText,
          'Sistema WSP',
        );
        this.logger.log(
          `📲 [WhatsApp Asíncrono] Notificación enviada con éxito al cliente (+${order.customerPhone})`,
        );
      } catch (err: any) {
        this.logger.error(
          `Error enviando notificación asíncrona por WhatsApp a (+${order.customerPhone}): ${err.message}`,
        );
      }
    }
  }
}
