export enum Role {
  ADMIN = 'ADMIN',
  SUBADMIN = 'SUBADMIN',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  orderIndex: number;
}

export interface ProductImage {
  id?: string;
  imageUrl: string;
  isPrimary?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStockAlert: number;
  isAvailable: boolean;
  videoUrl?: string;
  categoryId: string;
  categoryName?: string;
  images?: ProductImage[];
  createdAt?: string;
}

export interface CompanyConfig {
  id?: string;
  companyName: string;
  businessDescription: string;
  systemPrompt: string;
  shippingPolicy: string;
  paymentMethods: string;
  workingHours: string;
  address: string;
  aiModel: string;
  aiTemperature: number;
  antiBanDelayMinMs: number;
  antiBanDelayMaxMs: number;
  historyMessageLimit: number;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  status: OrderStatus;
  source: OrderSource;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  handledByName?: string;
  items?: OrderItem[];
  createdAt: string;
}

export enum SessionStatus {
  DISCONNECTED = 'DISCONNECTED',
  SCAN_QR = 'SCAN_QR',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export interface WhatsAppStatus {
  status: SessionStatus;
  qrCode?: string | null;
  phoneNumber?: string | null;
}

export enum MessageSender {
  CUSTOMER = 'CUSTOMER',
  BOT = 'BOT',
  AGENT = 'AGENT',
}

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  sender: MessageSender;
  senderName?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  isRead: boolean;
  createdAt: string;
  customerPhone?: string;
  customerName?: string;
}

export interface ChatSession {
  id: string;
  customerPhone: string;
  customerName?: string;
  isBotActive: boolean;
  lastInteraction: string;
  unreadCount: number;
  assignedUserName?: string;
  messages?: ChatMessage[];
}

export interface DashboardMetrics {
  financial: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    lowStockProducts: Product[];
  };
  chats: {
    totalChats: number;
    recentSessions: ChatSession[];
  };
  recentOrders: Order[];
  whatsappStatus: WhatsAppStatus;
}
