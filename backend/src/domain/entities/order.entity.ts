export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum OrderSource {
  WHATSAPP_BOT = 'WHATSAPP_BOT',
  MANUAL_DASHBOARD = 'MANUAL_DASHBOARD',
}

export class OrderItemEntity {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export class OrderEntity {
  id: string;
  orderNumber: string;
  chatSessionId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  status: OrderStatus;
  source: OrderSource;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  handledById?: string;
  handledByName?: string;
  items?: OrderItemEntity[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<OrderEntity>) {
    Object.assign(this, partial);
  }
}
