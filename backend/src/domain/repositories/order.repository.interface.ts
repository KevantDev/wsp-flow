import { OrderEntity, OrderStatus } from '../entities/order.entity';

export interface IOrderRepository {
  findById(id: string): Promise<OrderEntity | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderEntity | null>;
  findAll(filters?: { status?: OrderStatus; customerPhone?: string; chatSessionId?: string; limit?: number }): Promise<OrderEntity[]>;
  create(order: Partial<OrderEntity>, items: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[]): Promise<OrderEntity>;
  updateStatus(id: string, status: OrderStatus, handledById?: string): Promise<OrderEntity>;
  getMetrics(): Promise<{ totalRevenue: number; totalOrders: number; pendingOrders: number; completedOrders: number }>;
}

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
