import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IOrderRepository } from '../../../../domain/repositories/order.repository.interface';
import { OrderEntity, OrderStatus, OrderSource } from '../../../../domain/entities/order.entity';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(o: any): OrderEntity {
    return new OrderEntity({
      id: o.id,
      orderNumber: o.orderNumber,
      chatSessionId: o.chatSessionId,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerAddress: o.customerAddress,
      status: o.status as OrderStatus,
      source: o.source as OrderSource,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      total: o.total,
      paymentMethod: o.paymentMethod,
      culqiChargeId: o.culqiChargeId,
      culqiRefundId: o.culqiRefundId,
      paidAt: o.paidAt,
      refundedAt: o.refundedAt,
      notes: o.notes,
      handledById: o.handledById,
      handledByName: o.handledBy?.fullName,
      items: o.items?.map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    });
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, handledBy: true },
    });
    if (!order) return null;
    return this.mapToEntity(order);
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, handledBy: true },
    });
    if (!order) return null;
    return this.mapToEntity(order);
  }

  async findAll(filters?: { status?: OrderStatus; customerPhone?: string; limit?: number }): Promise<OrderEntity[]> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.customerPhone) where.customerPhone = { contains: filters.customerPhone };

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true, handledBy: true },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
    });
    return orders.map((o) => this.mapToEntity(o));
  }

  async create(
    order: Partial<OrderEntity>,
    items: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[],
  ): Promise<OrderEntity> {
    const count = await this.prisma.order.count();
    const orderNumber = order.orderNumber || `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const created = await this.prisma.order.create({
      data: {
        orderNumber,
        chatSessionId: order.chatSessionId,
        customerName: order.customerName || 'Cliente WhatsApp',
        customerPhone: order.customerPhone!,
        customerAddress: order.customerAddress,
        status: (order.status as any) || 'PENDING',
        source: (order.source as any) || 'WHATSAPP_BOT',
        subtotal: order.subtotal || 0,
        deliveryFee: order.deliveryFee || 0,
        total: order.total || 0,
        paymentMethod: order.paymentMethod || 'CULQI_PENDING',
        culqiChargeId: order.culqiChargeId,
        culqiRefundId: order.culqiRefundId,
        paidAt: order.paidAt,
        notes: order.notes,
        handledById: order.handledById,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            subtotal: i.subtotal,
          })),
        },
      },
      include: { items: true, handledBy: true },
    });
    return this.mapToEntity(created);
  }

  async updateStatus(id: string, status: OrderStatus, handledById?: string): Promise<OrderEntity> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: status as any,
        ...(handledById && { handledById }),
      },
      include: { items: true, handledBy: true },
    });
    return this.mapToEntity(updated);
  }

  async updatePayment(
    id: string,
    data: {
      paymentMethod?: string;
      culqiChargeId?: string;
      culqiRefundId?: string;
      status?: OrderStatus;
      paidAt?: Date;
      refundedAt?: Date;
      notes?: string;
    },
  ): Promise<OrderEntity> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.culqiChargeId && { culqiChargeId: data.culqiChargeId }),
        ...(data.culqiRefundId && { culqiRefundId: data.culqiRefundId }),
        ...(data.status && { status: data.status as any }),
        ...(data.paidAt && { paidAt: data.paidAt }),
        ...(data.refundedAt && { refundedAt: data.refundedAt }),
        ...(data.notes && { notes: data.notes }),
      },
      include: { items: true, handledBy: true },
    });
    return this.mapToEntity(updated);
  }

  async getMetrics(): Promise<{ totalRevenue: number; totalOrders: number; pendingOrders: number; completedOrders: number }> {
    const orders = await this.prisma.order.findMany();
    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((acc, curr) => acc + curr.total, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'SHIPPED').length;

    return { totalRevenue, totalOrders, pendingOrders, completedOrders };
  }
}
