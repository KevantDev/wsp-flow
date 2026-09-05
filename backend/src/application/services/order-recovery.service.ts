import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaOrderRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { OrderStatus } from '../../domain/entities/order.entity';

@Injectable()
export class OrderRecoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderRecoveryService.name);
  private intervalTimer: NodeJS.Timeout | null = null;

  // Umbral de recordatorio: 30 minutos (1800000 ms)
  private readonly REMINDER_THRESHOLD_MS = 30 * 60 * 1000;
  // Umbral de expiración y liberación de stock: 6 horas (21600000 ms)
  private readonly EXPIRATION_THRESHOLD_MS = 6 * 60 * 60 * 1000;

  constructor(
    private readonly orderRepo: PrismaOrderRepository,
    private readonly productRepo: PrismaProductRepository,
    private readonly wsGateway: WhatsAppGateway,
    private readonly baileysService: BaileysService,
  ) {}

  onModuleInit() {
    this.logger.log('🛒 OrderRecoveryService inicializado (Auditoría cada 3 minutos, Expiración de stock: 6h).');
    // Ejecutar una primera revisión 10 segundos después del arranque
    setTimeout(() => this.auditPendingOrders(), 10000);
    // Ejecutar periódicamente cada 3 minutos
    this.intervalTimer = setInterval(() => this.auditPendingOrders(), 3 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Revisa todas las órdenes en estado PENDING y aplica:
   * 1. Recordatorio de recuperación (si tiene >= 30 min y no se ha enviado aún).
   * 2. Cancelación y liberación automática de stock (si tiene >= 6 horas).
   */
  async auditPendingOrders() {
    try {
      const pendingOrders = await this.orderRepo.findAll({ status: OrderStatus.PENDING });
      if (!pendingOrders || pendingOrders.length === 0) return;

      const now = Date.now();

      for (const order of pendingOrders) {
        const createdAtTime = new Date(order.createdAt).getTime();
        const ageMs = now - createdAtTime;

        // CASO 1: Expiración de 6 Horas -> Cancelación y Liberación de Stock
        if (ageMs >= this.EXPIRATION_THRESHOLD_MS) {
          await this.expireAndReleaseStock(order);
          continue;
        }

        // CASO 2: Recordatorio de Recuperación de Carrito (30 min - 6 horas)
        if (ageMs >= this.REMINDER_THRESHOLD_MS) {
          const notes = order.notes || '';
          if (!notes.includes('[RECOVERY_REMINDER_SENT]')) {
            await this.sendRecoveryReminder(order);
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error en auditoría de pedidos pendientes: ${err.message}`);
    }
  }

  /**
   * Cancela la orden vencida, repone el inventario en PostgreSQL y notifica
   */
  private async expireAndReleaseStock(order: any) {
    try {
      this.logger.warn(`⏳ [Auto-Expiración] Orden #${order.orderNumber} superó las 6 horas en PENDING. Liberando stock...`);

      // 1. Restaurar existencias en base de datos en paralelo
      if (order.items && order.items.length > 0) {
        await Promise.all(
          order.items
            .filter((item: any) => !!item.productId)
            .map((item: any) => this.productRepo.incrementStock(item.productId, item.quantity)),
        );
        this.logger.log(`📦 Stock restaurado en paralelo para orden #${order.orderNumber}`);
      }

      // 2. Actualizar estado a CANCELLED y registrar nota de auditoría
      const updatedNotes = `${order.notes || ''} [AUTO_EXPIRED_6H: Cancelado y stock restaurado automáticamente tras 6 horas sin pago]`.trim();
      const updated = await this.orderRepo.updateStatus(order.id, OrderStatus.CANCELLED);

      // 3. Emitir actualización a todos los clientes WebSocket (Kanban se mueve a Cancelados en vivo)
      this.wsGateway.emitOrderStatusUpdate(updated);

      // 4. Notificar cordialmente al cliente por WhatsApp
      if (order.customerPhone) {
        const msg =
          `⌛ *Aviso de Expiración: Pedido #${order.orderNumber}* 📦\n\n` +
          `Hola ${order.customerName || 'Estimado(a) Cliente'}, te informamos que el tiempo límite de reserva (6 horas) para tu pedido por *S/ ${order.total.toFixed(2)} PEN* ha vencido y los artículos han sido devueltos al inventario disponible.\n\n` +
          `Si aún deseas concretar tu compra o coordinar un nuevo pedido, ¡con gusto te atendemos nuevamente por este chat! ⭐`;

        await this.baileysService.sendManualMessage(order.tenantId, order.customerPhone, msg, 'Sistema WSP');
      }
    } catch (err: any) {
      this.logger.error(`Error al expirar orden #${order.orderNumber}: ${err.message}`);
    }
  }

  /**
   * Envía recordatorio amigable por WhatsApp con el enlace de pago
   */
  private async sendRecoveryReminder(order: any) {
    try {
      this.logger.log(`🛒 [Recuperación] Enviando recordatorio para orden #${order.orderNumber} a [${order.customerPhone}]`);

      // Marcar en notas para no enviar duplicados
      const updatedNotes = `${order.notes || ''} [RECOVERY_REMINDER_SENT]`.trim();
      await this.orderRepo.updateDelivery(order.id, {
        deliveryFee: order.deliveryFee,
        total: order.total,
        notes: updatedNotes,
      });

      if (order.customerPhone) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const payUrl = `${baseUrl}/pay/${order.orderNumber}`;

        let itemsText = (order.items || [])
          .map((i: any) => `• ${i.quantity}x ${i.productName}`)
          .join('\n');

        const msg =
          `🛒 *¡Tu Pedido #${order.orderNumber} te está esperando!* ✨\n\n` +
          `Hola ${order.customerName || 'Estimado(a) Cliente'}, notamos que dejaste tu pedido pendiente por *S/ ${order.total.toFixed(2)} PEN*:\n\n` +
          `📋 *Artículos reservados:*\n${itemsText || '• Productos seleccionados'}\n\n` +
          `⏳ *Tu stock sigue reservado temporalmente.*\n\n` +
          `💳 *Puedes completar tu pago en línea con Yape o Tarjeta aquí:*\n${payUrl}\n\n` +
          `¿Tienes alguna consulta o prefieres pagar por transferencia? Escríbenos y un asesor te ayudará de inmediato.`;

        await this.baileysService.sendManualMessage(order.tenantId, order.customerPhone, msg, 'Sistema WSP');
      }
    } catch (err: any) {
      this.logger.error(`Error al enviar recordatorio para orden #${order.orderNumber}: ${err.message}`);
    }
  }
}
