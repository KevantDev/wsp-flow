import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaOrderRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/order.dto';
import { OrderStatus, OrderSource } from '../../domain/entities/order.entity';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { ReceiptPdfService } from '../../infrastructure/pdf/receipt-pdf.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepo: PrismaOrderRepository,
    private readonly productRepo: PrismaProductRepository,
    private readonly wsGateway: WhatsAppGateway,
    private readonly baileysService: BaileysService,
    private readonly receiptPdfService: ReceiptPdfService,
  ) {}

  async getAll(status?: OrderStatus, customerPhone?: string) {
    return this.orderRepo.findAll({ status, customerPhone });
  }

  async getById(id: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async create(dto: CreateOrderDto, handledById?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El pedido debe tener al menos un producto');
    }

    const orderItemsData: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[] = [];
    let subtotal = 0;

    for (const itemDto of dto.items) {
      const product = await this.productRepo.findById(itemDto.productId);
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

      // Descontar inventario
      await this.productRepo.decrementStock(product.id, itemDto.quantity);
    }

    const deliveryFee = dto.deliveryFee || 0;
    const total = subtotal + deliveryFee;

    const order = await this.orderRepo.create(
      {
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        status: OrderStatus.PENDING,
        source: dto.source || OrderSource.MANUAL_DASHBOARD,
        subtotal,
        deliveryFee,
        total,
        notes: dto.notes,
        handledById,
      },
      orderItemsData,
    );

    this.wsGateway.emitNewOrder(order);
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, handledById?: string) {
    const existing = await this.getById(id);

    // Si la orden se cancela, reponer el stock automáticamente
    if (dto.status === OrderStatus.CANCELLED && existing.status !== OrderStatus.CANCELLED) {
      if (existing.items && existing.items.length > 0) {
        for (const item of existing.items) {
          if (item.productId) {
            await this.productRepo.incrementStock(item.productId, item.quantity);
          }
        }
      }
    }

    const updated = await this.orderRepo.updateStatus(id, dto.status, handledById);

    this.wsGateway.emitOrderStatusUpdate(updated);

    // Notificar al cliente por WhatsApp sobre el cambio de estado si está conectado
    if (updated.customerPhone) {
      try {
        let itemsText = (updated.items || [])
          .map((i) => `• ${i.quantity}x ${i.productName}`)
          .join('\n');
        if (!itemsText && existing.items) {
          itemsText = existing.items.map((i) => `• ${i.quantity}x ${i.productName}`).join('\n');
        }

        let msg = '';
        const name = updated.customerName || 'Estimado(a) Cliente';
        const address = updated.customerAddress || 'Coordinar con asesor';

        switch (dto.status) {
          case OrderStatus.CONFIRMED:
            msg =
              `✅ *¡Pago Confirmado! Pedido #${updated.orderNumber}* 🎉\n\n` +
              `Hola ${name}, hemos validado tu pago por *S/ ${updated.total.toFixed(2)} PEN*.\n\n` +
              `📋 *Productos:*\n${itemsText || '• Productos seleccionados'}\n\n` +
              `Tu pedido pasa inmediatamente a nuestro equipo de preparación 📦.`;
            break;
          case OrderStatus.PROCESSING:
            msg =
              `📦 *Tu Pedido #${updated.orderNumber} está en Preparación* ⚙️\n\n` +
              `Hola ${name}, nuestro equipo de almacén está empacando tus productos cuidadosamente para su despacho:\n\n` +
              `📍 *Destino:* ${address}\n` +
              `📋 *Productos:*\n${itemsText || '• Productos en empaque'}\n\n` +
              `Te notificaremos en cuanto el repartidor o agencia reciba tu paquete.`;
            break;
          case OrderStatus.SHIPPED:
            msg =
              `🚚 *¡Tu Pedido #${updated.orderNumber} va en Camino!* 🚀\n\n` +
              `Hola ${name}, tu pedido ha sido despachado:\n` +
              `📍 *Dirección de Entrega:* ${address}\n\n` +
              `🛵 *Tiempo estimado:* Entre 2 a 4 horas (o según guía en agencia).\n` +
              `Por favor mantén tu teléfono atento para la entrega. ¡Muchas gracias!`;
            break;
          case OrderStatus.DELIVERED:
            msg =
              `🎉 *¡Pedido #${updated.orderNumber} Entregado con Éxito!* ✨\n\n` +
              `Hola ${name}, confirmamos que tu pedido ha sido entregado en ${address}.\n\n` +
              `¡Muchas gracias por tu compra y confianza en nosotros! ⭐ Si necesitas algo más, aquí estamos para ayudarte.`;
            break;
          case OrderStatus.CANCELLED:
            msg =
              `❌ *Notificación: Pedido #${updated.orderNumber} Cancelado*\n\n` +
              `Hola ${name}, te informamos que tu pedido ha sido cancelado y las unidades han sido restauradas al inventario.\n\n` +
              `Si tienes alguna duda o deseas reprogramar tu compra, un asesor te responderá por este chat.`;
            break;
          case OrderStatus.PENDING:
            msg =
              `⏳ *Pedido #${updated.orderNumber} Registrado*\n\n` +
              `Hola ${name}, tu pedido por *S/ ${updated.total.toFixed(2)} PEN* se encuentra registrado y pendiente de pago.\n\n` +
              `💳 *Paga en línea aquí:* http://localhost:4200/pay/${updated.orderNumber}\n\n` +
              `O coordina con un asesor por aquí si deseas pagar con otro método.`;
            break;
        }

        if (msg) {
          await this.baileysService.sendManualMessage(updated.customerPhone, msg, 'Sistema WSP');
        }
      } catch (err) {
        // En caso de que Baileys no esté conectado, no bloquear la respuesta
      }
    }

    return updated;
  }

  async createPublicCheckoutOrder(dto: {
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    deliveryType?: 'PICKUP' | 'HOME_DELIVERY' | 'PROVINCE_AGENCY';
    district?: string;
    items: { productId: string; quantity: number }[];
    notes?: string;
  }) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El carrito de compras no contiene productos');
    }

    const orderItemsData: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[] = [];
    let subtotal = 0;

    for (const itemDto of dto.items) {
      const product = await this.productRepo.findById(itemDto.productId);
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

      // Descontar inventario
      await this.productRepo.decrementStock(product.id, itemDto.quantity);
    }

    let deliveryFee = 0;
    let targetAddress = dto.customerAddress || 'Por coordinar';

    if (dto.deliveryType === 'PICKUP') {
      deliveryFee = 0.0;
      targetAddress = 'Recojo en Tienda (Av. Larco 743, Miraflores, Lima)';
    } else if (dto.deliveryType === 'PROVINCE_AGENCY') {
      deliveryFee = 15.0;
      targetAddress = dto.customerAddress ? `Provincia: ${dto.customerAddress}` : 'Envío a Provincia por Agencia';
    } else {
      // Home delivery Lima
      deliveryFee = 10.0;
      if (dto.district) {
        targetAddress = `${dto.customerAddress ? dto.customerAddress + ', ' : ''}${dto.district}`;
      }
    }

    const total = subtotal + deliveryFee;

    const order = await this.orderRepo.create(
      {
        customerName: dto.customerName || 'Cliente Web Carrito',
        customerPhone: dto.customerPhone.replace(/\D/g, '') || '51900000000',
        customerAddress: targetAddress,
        status: OrderStatus.PENDING,
        source: OrderSource.WHATSAPP_BOT,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: 'CULQI_PENDING',
        notes: `Generado desde Carrito Web ${dto.notes ? '| ' + dto.notes : ''}`,
      },
      orderItemsData,
    );

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const paymentUrl = `${baseUrl}/pay/${order.orderNumber}`;

    this.wsGateway.emitNewOrder(order);

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

  async getMetrics() {
    return this.orderRepo.getMetrics();
  }

  async generateReceiptPdf(idOrOrderNumber: string) {
    let order = await this.orderRepo.findByOrderNumber(idOrOrderNumber.trim().toUpperCase());
    if (!order) {
      order = await this.orderRepo.findById(idOrOrderNumber);
    }
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    return this.receiptPdfService.generateReceiptPdf(order);
  }
}
