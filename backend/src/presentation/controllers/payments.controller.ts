import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CulqiService } from '../../infrastructure/payments/culqi.service';
import { MercadoPagoService } from '../../infrastructure/payments/mercadopago.service';
import { PrismaOrderRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { PrismaTenantRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-tenant.repository';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { WhatsAppGateway } from '../gateways/whatsapp.gateway';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { DeliveryService, DeliveryType } from '../../application/services/delivery.service';
import { PlansService } from '../../application/services/plans.service';
import { OrderStatus } from '../../domain/entities/order.entity';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { Role } from '../../domain/entities/user.entity';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly culqiService: CulqiService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly orderRepo: PrismaOrderRepository,
    private readonly tenantRepo: PrismaTenantRepository,
    private readonly productRepo: PrismaProductRepository,
    private readonly wsGateway: WhatsAppGateway,
    private readonly baileysService: BaileysService,
    private readonly deliveryService: DeliveryService,
    private readonly plansService: PlansService,
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

    const tenant = await this.tenantRepo.findById(order.tenantId);

    return {
      orderNumber: order.orderNumber,
      tenantId: order.tenantId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      items: order.items || [],
      // Información de pasarela Mercado Pago
      mercadoPagoPublicKey: tenant?.mpPublicKey || this.mercadoPagoService.getDefaultPublicKey(),
      isMercadoPagoConnected: !!(tenant?.mpAccessToken),
      // Información de pasarela Culqi (fallback)
      culqiPublicKey: tenant?.culqiPublicKey || this.culqiService.getPublicKey(),
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

    let targetPhone = order.customerPhone;
    if (customerPhone && customerPhone.trim().length >= 8) {
      const cleanInput = customerPhone.replace(/\D/g, '');
      if (cleanInput.length >= 8) {
        targetPhone = cleanInput;
      }
    }

    const updated = await this.orderRepo.updateDelivery(order.id, {
      customerName: customerName || order.customerName,
      customerPhone: targetPhone,
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
    await this.baileysService.sendManualMessage(updated.tenantId, updated.customerPhone, confirmationText, 'Sistema Culqi');

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
    await this.baileysService.sendManualMessage(updated.tenantId, updated.customerPhone, confirmationText, 'Sistema Culqi');

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
            updated.tenantId,
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
   * =========================================================================
   * MERCADO PAGO INTEGRATION (OAUTH CONNECT, CHECKOUT PRO, WEBHOOK & REFUNDS)
   * =========================================================================
   */

  /**
   * Genera la URL de autorización oficial de Mercado Pago Connect para el tenant autenticado
   */
  @Get('mercadopago/connect')
  async getMercadoPagoConnectUrl(@CurrentTenant() tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Se requiere identificar la tienda (tenantId)');
    }
    // Validar si el plan del tenant tiene acceso a pasarela Mercado Pago
    await this.plansService.checkTenantQuota(tenantId, 'MERCADOPAGO');

    const connectUrl = this.mercadoPagoService.getOAuthConnectUrl(tenantId);
    return { success: true, connectUrl };
  }

  /**
   * Endpoint de Callback oficial que recibe el código de autorización OAuth de Mercado Pago
   */
  @Public()
  @Get('mercadopago/callback')
  async handleMercadoPagoCallback(
    @Query('code') code: string,
    @Query('state') tenantId: string,
    @Res() res: Response,
  ) {
    this.logger.log(`📥 Callback de Mercado Pago Connect recibido para Tenant [${tenantId}]`);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    if (!code || !tenantId) {
      return res.redirect(`${frontendUrl}/settings?mp_error=missing_params`);
    }

    try {
      const tokens = await this.mercadoPagoService.exchangeOAuthCode(code);
      await this.tenantRepo.update(tenantId, {
        mpAccessToken: tokens.accessToken,
        mpPublicKey: tokens.publicKey,
        mpRefreshToken: tokens.refreshToken,
        mpUserId: tokens.userId,
        mpConnectedAt: new Date(),
      });

      this.logger.log(`✅ Tenant [${tenantId}] vinculado exitosamente con Mercado Pago (User ID: ${tokens.userId})`);
      return res.redirect(`${frontendUrl}/settings?mp_connected=true`);
    } catch (error: any) {
      this.logger.error(`❌ Error en callback Mercado Pago: ${error.message}`);
      return res.redirect(`${frontendUrl}/settings?mp_error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Desvincula la cuenta de Mercado Pago del tenant
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('mercadopago/disconnect')
  async disconnectMercadoPago(@CurrentTenant() tenantId: string) {
    await this.tenantRepo.update(tenantId, {
      mpAccessToken: undefined,
      mpPublicKey: undefined,
      mpRefreshToken: undefined,
      mpUserId: undefined,
      mpConnectedAt: undefined,
    });
    return { success: true, message: 'Cuenta de Mercado Pago desvinculada exitosamente' };
  }

  /**
   * Crea una preferencia de pago para el Checkout Pro de Mercado Pago
   */
  @Public()
  @Post('mercadopago/create-preference')
  async createMercadoPagoPreference(
    @Body() body: { orderNumber: string; originUrl?: string },
  ) {
    const { orderNumber, originUrl } = body;
    if (!orderNumber) {
      throw new BadRequestException('El número de orden es obligatorio');
    }

    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Esta orden ya se encuentra pagada');
    }

    const tenant = await this.tenantRepo.findById(order.tenantId);
    const origin = originUrl || process.env.FRONTEND_URL || 'http://localhost:4200';
    const baseUrl = origin.replace(/\/$/, '');
    const backendUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000';

    const preference = await this.mercadoPagoService.createPreference({
      order,
      tenantAccessToken: tenant?.mpAccessToken || undefined,
      successUrl: `${baseUrl}/checkout/${order.orderNumber}?status=approved`,
      failureUrl: `${baseUrl}/checkout/${order.orderNumber}?status=failure`,
      pendingUrl: `${baseUrl}/checkout/${order.orderNumber}?status=pending`,
      webhookUrl: `${backendUrl}/api/v1/payments/mercadopago-webhook`,
    });

    await this.orderRepo.updatePayment(order.id, {
      mercadoPagoPreferenceId: preference.preferenceId,
    });

    return {
      success: true,
      ...preference,
    };
  }

  /**
   * Webhook oficial para recibir notificaciones asíncronas de Mercado Pago
   */
  @Public()
  @Post('mercadopago-webhook')
  async handleMercadoPagoWebhook(@Query() query: any, @Body() body: any) {
    this.logger.log(`📥 Webhook Mercado Pago recibido: Query [${JSON.stringify(query)}] Body [${JSON.stringify(body)}]`);

    const topic = query.topic || query.type || body?.type || body?.topic;
    const paymentId = query['data.id'] || body?.data?.id || query.id || body?.id;

    if (topic === 'payment' && paymentId) {
      try {
        const payment = await this.mercadoPagoService.getPayment(String(paymentId));
        this.logger.log(`💳 Estado de pago #${paymentId} en Mercado Pago: [${payment?.status}]`);

        if (payment?.status === 'approved') {
          const orderNumber =
            payment.external_reference ||
            payment.metadata?.order_number;

          if (orderNumber) {
            const order = await this.orderRepo.findByOrderNumber(orderNumber);
            if (order && order.status !== OrderStatus.CONFIRMED) {
              const updated = await this.orderRepo.updatePayment(order.id, {
                status: OrderStatus.CONFIRMED,
                paymentMethod: 'MERCADOPAGO',
                paymentStatus: 'PAID',
                mercadoPagoPaymentId: String(payment.id),
                paidAt: new Date(payment.date_approved || Date.now()),
                notes: `Pago aprobado con Mercado Pago (ID: ${payment.id}, Medio: ${payment.payment_method_id || 'online'})`,
              });

              this.wsGateway.emitOrderStatusUpdate({
                orderId: updated.id,
                orderNumber: updated.orderNumber,
                status: updated.status,
                paymentMethod: updated.paymentMethod,
              });

              const confirmationText = `✅ *¡Pago Confirmado con Éxito vía Mercado Pago!* 🎉\n\n• *Orden:* \`#${updated.orderNumber}\`\n• *Monto Pagado:* S/ ${updated.total.toFixed(2)}\n• *Método:* Mercado Pago (${payment.payment_method_id || 'Tarjeta / Yape'})\n• *Transacción:* \`${payment.id}\`\n\nTu pedido ha pasado al área de empaque y despacho 📦. ¡Muchas gracias por tu compra!`;
              await this.baileysService.sendManualMessage(updated.tenantId, updated.customerPhone, confirmationText, 'Mercado Pago');
            }
          }
        }
      } catch (err: any) {
        this.logger.error(`❌ Error procesando webhook de Mercado Pago: ${err.message}`);
      }
    }

    return { received: true };
  }

  /**
   * Confirma la orden cuando el usuario regresa del checkout de Mercado Pago
   */
  @Public()
  @Post('mercadopago/confirm-return')
  async confirmMercadoPagoReturn(
    @Body() body: { orderNumber: string; paymentId?: string; status?: string },
  ) {
    const { orderNumber, paymentId, status } = body;
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.DELIVERED) {
      return { success: true, order, alreadyConfirmed: true };
    }

    if (status === 'approved' || status === 'accredited') {
      const updated = await this.orderRepo.updatePayment(order.id, {
        status: OrderStatus.CONFIRMED,
        paymentMethod: 'MERCADOPAGO',
        paymentStatus: 'PAID',
        mercadoPagoPaymentId: paymentId || `pay_mp_${Date.now()}`,
        paidAt: new Date(),
        notes: `Pago aprobado y confirmado desde retorno de Mercado Pago (ID: ${paymentId || 'N/A'})`,
      });

      this.wsGateway.emitOrderStatusUpdate({
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        paymentMethod: updated.paymentMethod,
      });

      const confirmationText = `✅ *¡Pago Confirmado con Éxito!* 🎉\n\n• *Orden:* \`#${updated.orderNumber}\`\n• *Total Pagado:* S/ ${updated.total.toFixed(2)} PEN\n• *Método:* Mercado Pago Online\n• *Transacción:* \`${paymentId || 'Aprobada'}\`\n\nTu pedido ha pasado al área de empaque 📦.`;
      await this.baileysService.sendManualMessage(updated.tenantId, updated.customerPhone, confirmationText, 'Mercado Pago');

      return { success: true, order: updated };
    }

    return { success: false, message: 'Pago no aprobado o pendiente de acreditación' };
  }

  /**
   * Procesa un reembolso desde el panel de administración (soporta Mercado Pago y Culqi)
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
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

    const tenant = await this.tenantRepo.findById(order.tenantId);
    let refundId = `ref_${Date.now()}`;
    let gatewayName = 'Pasarela';

    // 1. Reembolso con Mercado Pago si la orden tiene paymentId de Mercado Pago
    if (order.mercadoPagoPaymentId) {
      gatewayName = 'Mercado Pago';
      const mpResult = await this.mercadoPagoService.processRefund(
        order.mercadoPagoPaymentId,
        tenant?.mpAccessToken || undefined,
        order.total,
      );
      refundId = mpResult.refundId;
    } else {
      // Fallback a Culqi
      gatewayName = 'Culqi';
      const chargeId = order.culqiChargeId || `chr_simulated_${order.orderNumber}`;
      const culqiResult = await this.culqiService.processRefund(
        chargeId,
        body.reason || 'Cancelación solicitada por el cliente',
        order.total,
      );
      refundId = culqiResult.refundId;
    }

    // Reincorporar stock de los productos cancelados
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        await this.productRepo.incrementStock(item.productId, item.quantity);
      }
    }

    // Actualizar orden a CANCELLED
    const updated = await this.orderRepo.updatePayment(order.id, {
      status: OrderStatus.CANCELLED,
      culqiRefundId: refundId,
      refundedAt: new Date(),
      notes: `Reembolso procesado en ${gatewayName} (Refund ID: ${refundId}) - Motivo: ${body.reason || 'Sin motivo especificado'}`,
    });

    // Notificar al Dashboard
    this.wsGateway.emitOrderStatusUpdate({
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    });

    // Enviar notificación de reembolso por WhatsApp
    const refundText = `💸 *Reembolso Procesado con Éxito*\n\n• *Orden:* \`#${updated.orderNumber}\`\n• *Monto Devuelto:* S/ ${updated.total.toFixed(2)}\n• *Código de Reembolso:* \`${refundId}\`\n\nEl dinero ha sido reintegrado a tu cuenta/medio de pago original vía ${gatewayName}. Si tienes alguna duda, responde a este chat.`;
    await this.baileysService.sendManualMessage(updated.tenantId, updated.customerPhone, refundText, 'Administración');

    return {
      success: true,
      message: `Reembolso procesado exitosamente en ${gatewayName}`,
      order: updated,
      refundId,
    };
  }
}
