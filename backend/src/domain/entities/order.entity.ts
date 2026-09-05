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

export enum PaymentMethod {
  CULQI_CARD = 'CULQI_CARD',
  CULQI_YAPE = 'CULQI_YAPE',
  MERCADOPAGO = 'MERCADOPAGO',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CULQI_PENDING = 'CULQI_PENDING',
  PENDING = 'PENDING',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AWAITING_CASH = 'AWAITING_CASH',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
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
  tenantId: string;
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
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  culqiChargeId?: string;
  culqiRefundId?: string;
  mercadoPagoPaymentId?: string;
  mercadoPagoPreferenceId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  cashCollectedById?: string;
  cashCollectedByName?: string;
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
