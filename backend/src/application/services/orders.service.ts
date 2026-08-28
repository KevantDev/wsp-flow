import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaOrderRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/order.dto';
import { OrderStatus, OrderSource } from '../../domain/entities/order.entity';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepo: PrismaOrderRepository,
    private readonly productRepo: PrismaProductRepository,
    private readonly wsGateway: WhatsAppGateway,
    private readonly baileysService: BaileysService,
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
        let msg = `🔔 *Actualización de tu Pedido #${updated.orderNumber}*\n\n`;
        switch (dto.status) {
          case OrderStatus.CONFIRMED:
            msg += `✅ Tu pedido ha sido *CONFIRMADO* y está siendo preparado por nuestro equipo.`;
            break;
          case OrderStatus.PROCESSING:
            msg += `📦 Tu pedido está *EN PREPARACIÓN* para su despacho.`;
            break;
          case OrderStatus.SHIPPED:
            msg += `🚚 ¡Buenas noticias! Tu pedido ha sido *ENVIADO* con nuestro repartidor.`;
            break;
          case OrderStatus.DELIVERED:
            msg += `🎉 Tu pedido ha sido *ENTREGADO*. ¡Muchas gracias por tu compra!`;
            break;
          case OrderStatus.CANCELLED:
            msg += `❌ Tu pedido ha sido *CANCELADO*. Por favor comunícate con un asesor si tienes dudas.`;
            break;
        }

        await this.baileysService.sendManualMessage(updated.customerPhone, msg, 'Sistema WSP');
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
}
