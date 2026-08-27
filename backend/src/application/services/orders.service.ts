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

  async getMetrics() {
    return this.orderRepo.getMetrics();
  }
}
