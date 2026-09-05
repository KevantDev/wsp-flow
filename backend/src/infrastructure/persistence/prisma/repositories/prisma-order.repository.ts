import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IOrderRepository } from '../../../../domain/repositories/order.repository.interface';
import {
  OrderEntity,
  OrderStatus,
  OrderSource,
  PaymentMethod,
  PaymentStatus,
} from '../../../../domain/entities/order.entity';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(o: any): OrderEntity {
    return new OrderEntity({
      id: o.id,
      tenantId: o.tenantId,
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
      paymentMethod: (o.paymentMethod as PaymentMethod) || PaymentMethod.PENDING,
      paymentStatus: (o.paymentStatus as PaymentStatus) || PaymentStatus.PENDING,
      culqiChargeId: o.culqiChargeId,
      culqiRefundId: o.culqiRefundId,
      mercadoPagoPaymentId: o.mercadoPagoPaymentId,
      mercadoPagoPreferenceId: o.mercadoPagoPreferenceId,
      paidAt: o.paidAt,
      refundedAt: o.refundedAt,
      cashCollectedById: o.cashCollectedById,
      cashCollectedByName: o.cashCollectedBy?.fullName,
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

  async findById(id: string, tenantId?: string): Promise<OrderEntity | null> {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    const order = await this.prisma.order.findFirst({
      where,
      include: { items: true, handledBy: true, cashCollectedBy: true },
    });
    if (!order) return null;
    return this.mapToEntity(order);
  }

  async findByOrderNumber(orderNumber: string, tenantId?: string): Promise<OrderEntity | null> {
    const where: any = { orderNumber };
    if (tenantId) where.tenantId = tenantId;

    const order = await this.prisma.order.findFirst({
      where,
      include: { items: true, handledBy: true, cashCollectedBy: true },
    });
    if (!order) return null;
    return this.mapToEntity(order);
  }

  async findAll(filters?: {
    tenantId?: string;
    status?: OrderStatus;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    customerPhone?: string;
    chatSessionId?: string;
    limit?: number;
  }): Promise<OrderEntity[]> {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.status) where.status = filters.status;
    if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;

    const orConditions: any[] = [];

    if (filters?.chatSessionId) {
      orConditions.push({ chatSessionId: filters.chatSessionId });
    }

    if (filters?.customerPhone) {
      const raw = filters.customerPhone.trim();
      const clean = raw.replace(/\D/g, '');

      orConditions.push({ customerPhone: { contains: raw } });
      if (clean && clean !== raw) {
        orConditions.push({ customerPhone: { contains: clean } });
      }
      if (clean.length === 9 && clean.startsWith('9')) {
        orConditions.push({ customerPhone: { contains: `51${clean}` } });
      } else if (clean.length === 11 && clean.startsWith('519')) {
        orConditions.push({ customerPhone: { contains: clean.substring(2) } });
      }
      if (clean.length > 9) {
        orConditions.push({ customerPhone: { contains: clean.slice(-9) } });
      }
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true, handledBy: true, cashCollectedBy: true },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
    });
    return orders.map((o) => this.mapToEntity(o));
  }

  async create(
    order: Partial<OrderEntity>,
    items: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[],
  ): Promise<OrderEntity> {
    const tenantId = order.tenantId!;
    const count = await this.prisma.order.count({ where: { tenantId } });
    const orderNumber =
      order.orderNumber || `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const created = await this.prisma.order.create({
      data: {
        tenantId,
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
        paymentMethod: (order.paymentMethod as any) || 'CULQI_PENDING',
        paymentStatus: (order.paymentMethod as any) === 'CASH_ON_DELIVERY' ? 'AWAITING_CASH' : 'PENDING',
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
      include: { items: true, handledBy: true, cashCollectedBy: true },
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
      include: { items: true, handledBy: true, cashCollectedBy: true },
    });
    return this.mapToEntity(updated);
  }

  async markCashCollected(id: string, cashCollectedById: string): Promise<OrderEntity> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'PAID' as any,
        paidAt: new Date(),
        cashCollectedById,
      },
      include: { items: true, handledBy: true, cashCollectedBy: true },
    });
    return this.mapToEntity(updated);
  }

  async updatePayment(
    id: string,
    data: {
      paymentMethod?: string;
      culqiChargeId?: string;
      culqiRefundId?: string;
      mercadoPagoPaymentId?: string;
      mercadoPagoPreferenceId?: string;
      status?: OrderStatus;
      paymentStatus?: string;
      paidAt?: Date;
      refundedAt?: Date;
      notes?: string;
    },
  ): Promise<OrderEntity> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod as any }),
        ...(data.culqiChargeId && { culqiChargeId: data.culqiChargeId }),
        ...(data.culqiRefundId && { culqiRefundId: data.culqiRefundId }),
        ...(data.mercadoPagoPaymentId && { mercadoPagoPaymentId: data.mercadoPagoPaymentId }),
        ...(data.mercadoPagoPreferenceId && { mercadoPagoPreferenceId: data.mercadoPagoPreferenceId }),
        ...(data.status && { status: data.status as any }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus as any }),
        ...(data.paidAt && { paidAt: data.paidAt }),
        ...(data.refundedAt && { refundedAt: data.refundedAt }),
        ...(data.notes && { notes: data.notes }),
      },
      include: { items: true, handledBy: true, cashCollectedBy: true },
    });
    return this.mapToEntity(updated);
  }

  async updateDelivery(
    id: string,
    data: {
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string;
      deliveryFee: number;
      total: number;
      notes?: string;
    },
  ): Promise<OrderEntity> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...(data.customerName && { customerName: data.customerName }),
        ...(data.customerPhone && { customerPhone: data.customerPhone }),
        ...(data.customerAddress && { customerAddress: data.customerAddress }),
        deliveryFee: data.deliveryFee,
        total: data.total,
        ...(data.notes && { notes: data.notes }),
      },
      include: { items: true, handledBy: true, cashCollectedBy: true },
    });
    return this.mapToEntity(updated);
  }

  async getMetrics(tenantId?: string): Promise<{ totalRevenue: number; totalOrders: number; pendingOrders: number; completedOrders: number }> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const orders = await this.prisma.order.findMany({ where });
    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((acc, curr) => acc + curr.total, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'SHIPPED').length;

    return { totalRevenue, totalOrders, pendingOrders, completedOrders };
  }
}
