import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaOrderRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { PrismaTenantRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-tenant.repository';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/order.dto';
import { OrderStatus, OrderSource, PaymentMethod, PaymentStatus } from '../../domain/entities/order.entity';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { ReceiptPdfService } from '../../infrastructure/pdf/receipt-pdf.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCreatedEvent, OrderStatusUpdatedEvent } from '../events/order.events';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly orderRepo: PrismaOrderRepository,
    private readonly productRepo: PrismaProductRepository,
    private readonly tenantRepo: PrismaTenantRepository,
    private readonly wsGateway: WhatsAppGateway,
    private readonly baileysService: BaileysService,
    private readonly receiptPdfService: ReceiptPdfService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAll(tenantId?: string, status?: OrderStatus, customerPhone?: string) {
    return this.orderRepo.findAll({ tenantId, status, customerPhone });
  }

  async getById(id: string, tenantId?: string) {
    const order = await this.orderRepo.findById(id, tenantId);
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async create(dto: CreateOrderDto, tenantId: string, handledById?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El pedido debe tener al menos un producto');
    }

    // 1. Obtener todos los productos en paralelo
    const products = await Promise.all(
      dto.items.map((itemDto) => this.productRepo.findById(itemDto.productId, tenantId)),
    );

    const orderItemsData: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[] = [];
    let subtotal = 0;

    for (let i = 0; i < dto.items.length; i++) {
      const itemDto = dto.items[i];
      const product = products[i];
      if (!product) {
        throw new NotFoundException(`Producto con ID ${itemDto.productId} no encontrado`);
      }
      if (product.stock < itemDto.quantity) {
        throw new BadRequestException(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}`);
      }

      const itemSubtotal = product.price * itemDto.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: itemDto.quantity,
        subtotal: itemSubtotal,
      });
    }

    // 2. Descontar inventario en paralelo
    await Promise.all(
      dto.items.map((itemDto) => this.productRepo.decrementStock(itemDto.productId, itemDto.quantity)),
    );

    const deliveryFee = dto.deliveryFee || 0;
    const total = subtotal + deliveryFee;
    const paymentMethod = dto.paymentMethod || PaymentMethod.CULQI_PENDING;

    let cleanPhone = dto.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
      cleanPhone = `51${cleanPhone}`;
    }

    const order = await this.orderRepo.create(
      {
        tenantId,
        customerName: dto.customerName,
        customerPhone: cleanPhone,
        customerAddress: dto.customerAddress,
        status: OrderStatus.PENDING,
        source: dto.source || OrderSource.MANUAL_DASHBOARD,
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        notes: dto.notes,
        handledById,
      },
      orderItemsData,
    );

    this.eventEmitter.emit('order.created', new OrderCreatedEvent(order, tenantId));
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, tenantId?: string, handledById?: string) {
    const existing = await this.getById(id, tenantId);

    // Si la orden se cancela, reponer el stock automáticamente en paralelo
    if (dto.status === OrderStatus.CANCELLED && existing.status !== OrderStatus.CANCELLED) {
      if (existing.items && existing.items.length > 0) {
        await Promise.all(
          existing.items.map((item) =>
            this.productRepo.incrementStock(item.productId, item.quantity),
          ),
        );
      }
    }

    const updated = await this.orderRepo.updateStatus(id, dto.status, handledById);

    // ⚡ Desacoplado: Notificación en WebSockets y WhatsApp vía Event Emitter
    this.eventEmitter.emit(
      'order.status_updated',
      new OrderStatusUpdatedEvent(updated, existing.status, updated.tenantId, dto.customMessage),
    );

    return updated;
  }

  /**
   * Crea una orden generada directamente desde el Carrito de Compras de la Tienda Web
   */
  async createPublicCheckoutOrder(dto: {
    tenantId?: string;
    storeSlug?: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    deliveryType?: 'PICKUP' | 'HOME_DELIVERY' | 'PROVINCE_AGENCY';
    district?: string;
    items: { productId: string; quantity: number }[];
    notes?: string;
  }) {
    let resolvedTenantId = dto.tenantId;
    if (!resolvedTenantId && dto.storeSlug) {
      const tenant = await this.tenantRepo.findBySlug(dto.storeSlug);
      if (tenant) resolvedTenantId = tenant.id;
    }
    if (!resolvedTenantId) {
      const firstTenant = (await this.tenantRepo.findAll())[0];
      if (firstTenant) resolvedTenantId = firstTenant.id;
    }
    if (!resolvedTenantId) {
      throw new BadRequestException('Tienda no identificada para el checkout');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // 1. Obtener productos en paralelo
    const products = await Promise.all(
      dto.items.map((item) => this.productRepo.findById(item.productId, resolvedTenantId)),
    );

    const orderItemsData = [];
    let subtotal = 0;

    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      const product = products[i];
      if (!product) {
        throw new NotFoundException(`Producto ${item.productId} no encontrado`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`,
        );
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // 2. Descontar stock en paralelo
    await Promise.all(
      dto.items.map((item) => this.productRepo.decrementStock(item.productId, item.quantity)),
    );

    let deliveryFee = 0;
    let targetAddress = dto.customerAddress || 'Entrega a coordinar';

    if (dto.deliveryType === 'PICKUP') {
      deliveryFee = 0;
      targetAddress = '🏪 Recojo en Tienda Física (Gratis)';
    } else if (dto.deliveryType === 'PROVINCE_AGENCY') {
      deliveryFee = 15;
      targetAddress = `📦 Envío a Provincia (Agencia Shalom / Olva) - ${dto.customerAddress || ''}`;
    } else {
      const d = (dto.district || '').toLowerCase();
      if (d.includes('miraflores') || d.includes('san isidro') || d.includes('surco') || d.includes('san borja')) {
        deliveryFee = 10;
      } else if (d.includes('lima') || d.includes('lince') || d.includes('jesus maria') || d.includes('magdalena')) {
        deliveryFee = 12;
      } else {
        deliveryFee = 15;
      }
      targetAddress = `📍 ${dto.customerAddress || ''} (Distrito: ${dto.district || 'Lima'})`;
    }

    const total = subtotal + deliveryFee;

    let cleanCustomerPhone = dto.customerPhone.replace(/\D/g, '') || '51900000000';
    if (cleanCustomerPhone.length === 9 && cleanCustomerPhone.startsWith('9')) {
      cleanCustomerPhone = `51${cleanCustomerPhone}`;
    }

    const order = await this.orderRepo.create(
      {
        tenantId: resolvedTenantId,
        customerName: dto.customerName || 'Cliente Web Carrito',
        customerPhone: cleanCustomerPhone,
        customerAddress: targetAddress,
        status: OrderStatus.PENDING,
        source: OrderSource.WHATSAPP_BOT,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: PaymentMethod.CULQI_PENDING,
        notes: `Generado desde Carrito Web ${dto.notes ? '| ' + dto.notes : ''}`,
      },
      orderItemsData,
    );

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const paymentUrl = `${baseUrl}/pay/${order.orderNumber}`;

    this.eventEmitter.emit('order.created', new OrderCreatedEvent(order, resolvedTenantId));

    return {
      success: true,
      orderNumber: order.orderNumber,
      subtotal,
      deliveryFee,
      total,
      paymentUrl,
      order,
    };
  }

  async getMetrics(tenantId?: string) {
    return this.orderRepo.getMetrics(tenantId);
  }

  async generateReceiptPdf(idOrOrderNumber: string, tenantId?: string) {
    let order = await this.orderRepo.findByOrderNumber(idOrOrderNumber.trim().toUpperCase(), tenantId);
    if (!order) {
      order = await this.orderRepo.findById(idOrOrderNumber, tenantId);
    }
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    return this.receiptPdfService.generateReceiptPdf(order);
  }

  async markCashCollected(id: string, collectedById: string, tenantId?: string) {
    const order = await this.getById(id, tenantId);

    if (order.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      throw new BadRequestException('Esta acción solo aplica a pedidos con método de pago "Efectivo contra entrega".');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Solo se puede marcar como cobrado un pedido en estado ENTREGADO.');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Este pedido ya fue marcado como cobrado.');
    }

    const updated = await this.orderRepo.markCashCollected(id, collectedById);
    this.wsGateway.emitOrderStatusUpdate(updated);

    if (updated.customerPhone) {
      try {
        const msg =
          `✅ *¡Pago Recibido! Pedido #${updated.orderNumber}* 🎉\n\n` +
          `Hola ${updated.customerName}, confirmamos que recibimos el pago en *efectivo* de *S/ ${updated.total.toFixed(2)} PEN*.\n\n` +
          `¡Muchas gracias por tu compra y confianza en nosotros! ⭐ Escríbenos si necesitas algo más.`;
        await this.baileysService.sendManualMessage(updated.tenantId, updated.customerPhone, msg, 'Sistema WSP');
      } catch (err: any) {
        this.logger.error(`Error enviando confirmación de cobro por WhatsApp: ${err.message}`);
      }
    }

    return updated;
  }

  async getPendingCashOrders(tenantId?: string) {
    return this.orderRepo.findAll({
      tenantId,
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      paymentStatus: PaymentStatus.AWAITING_CASH,
    });
  }
}
