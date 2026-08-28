import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { CulqiService } from '../../infrastructure/payments/culqi.service';
import { PrismaOrderRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { WhatsAppGateway } from '../gateways/whatsapp.gateway';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { DeliveryService, DeliveryType } from '../../application/services/delivery.service';
import { OrderStatus } from '../../domain/entities/order.entity';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Role } from '../../domain/entities/user.entity';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly culqiService: CulqiService,
    private readonly orderRepo: PrismaOrderRepository,
    private readonly productRepo: PrismaProductRepository,
    private readonly wsGateway: WhatsAppGateway,
    private readonly baileysService: BaileysService,
    private readonly deliveryService: DeliveryService,
  ) {}

  /**
   * Obtiene la lista oficial de zonas de entrega y recojo en tienda para Perú
   */
  @Public()
  @Get('delivery-zones')
  getDeliveryZones() {
    return this.deliveryService.getAllDeliveryZones();
  }

  /**
   * Obtiene los datos públicos de una orden para mostrar en la pantalla de pago /pay/:orderNumber
   */
  @Public()
  @Get('order/:orderNumber')
  async getOrderForCheckout(@Param('orderNumber') orderNumber: string) {
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundException(`No se encontró el pedido con código ${orderNumber}`);
    }

    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      items: order.items || [],
      culqiPublicKey: this.culqiService.getPublicKey(),
    };
  }

  /**
   * Actualiza el método de entrega (Recojo en tienda, Lima a domicilio, Provincias) de una orden
   */
  @Public()
  @Patch('order/:orderNumber/delivery')
  async updateOrderDelivery(
    @Param('orderNumber') orderNumber: string,
    @Body()
    body: {
      deliveryType: DeliveryType;
      district?: string;
      address?: string;
      customerName?: string;
      customerPhone?: string;
      customerDni?: string;
      notes?: string;
    },
  ) {
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede modificar una orden ya pagada');
    }

    const { deliveryType, district, address, customerName, customerPhone, customerDni, notes } = body;
    const targetAddress = deliveryType === 'PICKUP' 
      ? 'Recojo en Tienda (Av. Larco 743, Miraflores, Lima)' 
      : (address ? `${address}${district ? ', ' + district : ''}` : (district || order.customerAddress || ''));

    const { zone, deliveryFee } = this.deliveryService.calculateDelivery(deliveryType, district || address);
    const newTotal = order.subtotal + deliveryFee;

    let updatedNotes = order.notes || '';
    if (customerDni && !updatedNotes.includes(`DNI: ${customerDni}`)) {
      updatedNotes = `${updatedNotes} [DNI: ${customerDni}]`.trim();
    }
    if (notes) {
      updatedNotes = `${updatedNotes} | ${notes}`.trim();
    }

    const updated = await this.orderRepo.updateDelivery(order.id, {
      customerName: customerName || order.customerName,
      customerPhone: customerPhone ? customerPhone.replace(/\D/g, '') : order.customerPhone,
      customerAddress: targetAddress,
      deliveryFee,
      total: newTotal,
      notes: updatedNotes || undefined,
    });

    this.wsGateway.emitOrderStatusUpdate({
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    });

    return {
      success: true,
      message: 'Método de entrega actualizado con éxito',
      order: updated,
      deliveryZone: zone,
    };
  }

  /**
   * Procesa el pago con Tarjeta de Crédito/Débito
   */
  @Public()
  @Post('pay-card')
  async payWithCard(
    @Body() body: { orderNumber: string; tokenId: string; email: string; phone?: string },
  ) {
    const { orderNumber, tokenId, email, phone } = body;
    if (!orderNumber || !tokenId) {
      throw new BadRequestException('Faltan parámetros obligatorios (orderNumber, tokenId)');
    }

    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Esta orden ya se encuentra pagada y confirmada');
    }

    const result = await this.culqiService.processCardPayment(
      tokenId,
      order.orderNumber,
      order.total,
      email || 'cliente@wspflow.com',
      phone || order.customerPhone,
    );

    // Actualizar estado de la orden a CONFIRMED
    const updated = await this.orderRepo.updatePayment(order.id, {
      status: OrderStatus.CONFIRMED,
      paymentMethod: 'TARJETA_CULQI',
      culqiChargeId: result.chargeId,
      paidAt: new Date(),
      notes: `Pago exitoso con Tarjeta (ID Cargo Culqi: ${result.chargeId})`,
    });

    // Notificar al Dashboard y al Kanban To-Do en tiempo real vía WebSocket
    this.wsGateway.emitOrderStatusUpdate({
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      paymentMethod: updated.paymentMethod,
    });

    // Disparar mensaje de confirmación por WhatsApp
    const confirmationText = `✅ *¡Pago Confirmado con Éxito!* 🎉\n\n• *Orden:* \`#${updated.orderNumber}\`\n• *Monto Pagado:* S/ ${updated.total.toFixed(2)}\n• *Método:* Tarjeta de Crédito/Débito (Culqi)\n• *Transacción:* \`${result.chargeId}\`\n\nTu pedido ha pasado al área de empaque y despacho 📦. ¡Muchas gracias por tu compra!`;
    await this.baileysService.sendManualMessage(updated.customerPhone, confirmationText, 'Sistema Culqi');

    return {
      success: true,
      message: 'Pago procesado exitosamente',
      order: updated,
      chargeId: result.chargeId,
    };
  }

  /**
   * Procesa el pago con YAPE mediante OTP de 6 dígitos
   */
  @Public()
  @Post('pay-yape')
  async payWithYape(
    @Body() body: { orderNumber: string; yapeOtp: string; yapePhone: string; email?: string },
  ) {
    const { orderNumber, yapeOtp, yapePhone, email } = body;
    if (!orderNumber || !yapeOtp || !yapePhone) {
      throw new BadRequestException('Faltan parámetros obligatorios (orderNumber, yapeOtp, yapePhone)');
    }

    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Esta orden ya se encuentra pagada');
    }

    const result = await this.culqiService.processYapePayment(
      yapeOtp,
      yapePhone,
      order.orderNumber,
      order.total,
      email || 'cliente@wspflow.com',
    );

    // Actualizar estado de la orden a CONFIRMED
    const updated = await this.orderRepo.updatePayment(order.id, {
      status: OrderStatus.CONFIRMED,
      paymentMethod: 'YAPE_CULQI',
      culqiChargeId: result.chargeId,
      paidAt: new Date(),
      notes: `Pago exitoso con Yape (ID Cargo: ${result.chargeId}, Cel: ${yapePhone})`,
    });

    // Notificar al Dashboard y Kanban To-Do en tiempo real
    this.wsGateway.emitOrderStatusUpdate({
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      paymentMethod: updated.paymentMethod,
    });

    // Disparar mensaje de confirmación por WhatsApp
    const confirmationText = `💜 *¡Pago con Yape Confirmado!* 🎉\n\n• *Orden:* \`#${updated.orderNumber}\`\n• *Total Pagado:* S/ ${updated.total.toFixed(2)} PEN\n• *Método:* Yape (Culqi)\n• *Código de Transacción:* \`${result.chargeId}\`\n\nTu pedido ya está siendo preparado para el despacho 🚀.`;
    await this.baileysService.sendManualMessage(updated.customerPhone, confirmationText, 'Sistema Culqi');

    return {
      success: true,
      message: 'Pago con Yape validado y procesado exitosamente',
      order: updated,
      chargeId: result.chargeId,
    };
  }

  /**
   * Webhook oficial para recibir notificaciones asíncronas de Culqi
   */
  @Public()
  @Post('culqi-webhook')
  async handleCulqiWebhook(@Body() event: any) {
    this.logger.log(`📥 Webhook Culqi recibido: Evento [${event?.type || 'desconocido'}]`);

    if (event?.type === 'charge.creation.successful') {
      const charge = event.data;
      const orderNumber = charge.metadata?.orderNumber;

      if (orderNumber) {
        const order = await this.orderRepo.findByOrderNumber(orderNumber);
        if (order && order.status === OrderStatus.PENDING) {
          const updated = await this.orderRepo.updatePayment(order.id, {
            status: OrderStatus.CONFIRMED,
            paymentMethod: charge.source?.type || 'CULQI_WEBHOOK',
            culqiChargeId: charge.id,
            paidAt: new Date(),
          });

          this.wsGateway.emitOrderStatusUpdate({
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            status: updated.status,
          });

          await this.baileysService.sendManualMessage(
            updated.customerPhone,
            `✅ *¡Pago Confirmado vía Webhook!* Tu pedido \`#${updated.orderNumber}\` ha sido pagado con éxito.`,
            'Culqi Webhook',
          );
        }
      }
    }

    return { received: true };
  }

  /**
   * Procesa un reembolso con Culqi desde el panel de administración
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('refund/:orderId')
  async refundOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
  ) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Esta orden ya se encuentra cancelada o reembolsada');
    }

    const chargeId = order.culqiChargeId || `chr_simulated_${order.orderNumber}`;
    const refundResult = await this.culqiService.processRefund(
      chargeId,
      body.reason || 'Cancelación solicitada por el cliente',
      order.total,
    );

    // Reincorporar stock de los productos cancelados
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        await this.productRepo.incrementStock(item.productId, item.quantity);
      }
    }

    // Actualizar orden a CANCELLED y registrar refundId
    const updated = await this.orderRepo.updatePayment(order.id, {
      status: OrderStatus.CANCELLED,
      culqiRefundId: refundResult.refundId,
      refundedAt: new Date(),
      notes: `Reembolso procesado en Culqi (Refund ID: ${refundResult.refundId}) - Motivo: ${body.reason || 'Sin motivo especificado'}`,
    });

    // Notificar al Dashboard
    this.wsGateway.emitOrderStatusUpdate({
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    });

    // Enviar notificación de reembolso por WhatsApp
    const refundText = `💸 *Reembolso Procesado con Éxito*\n\n• *Orden:* \`#${updated.orderNumber}\`\n• *Monto Devuelto:* S/ ${updated.total.toFixed(2)}\n• *Código de Reembolso:* \`${refundResult.refundId}\`\n\nEl dinero ha sido reintegrado a tu cuenta/medio de pago original. Si tienes alguna duda, responde a este chat.`;
    await this.baileysService.sendManualMessage(updated.customerPhone, refundText, 'Administración');

    return {
      success: true,
      message: 'Reembolso procesado exitosamente',
      order: updated,
      refund: refundResult,
    };
  }
}
