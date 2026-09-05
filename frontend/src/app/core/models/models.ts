export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUBADMIN = 'SUBADMIN',
}

export enum TenantPlan {
  FREE_TRIAL = 'FREE_TRIAL',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
}

export interface SaaSPlan {
  id: string;
  code: TenantPlan;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingPeriod: string;
  maxProducts: number;
  maxBroadcasts: number;
  maxUsers: number;
  hasMercadoPago: boolean;
  hasAiBot: boolean;
  hasCustomThemes: boolean;
  hasPdfCatalog: boolean;
  features: string[];
  badgeColor: string;
  isPopular: boolean;
  isActive: boolean;
  tenantsCount?: number;
}

export interface TenantQuota {
  tenantId: string;
  planCode: TenantPlan;
  planName: string;
  products: {
    used: number;
    max: number;
    isUnlimited: boolean;
  };
  broadcasts: {
    max: number;
    isUnlimited: boolean;
  };
  users: {
    used: number;
    max: number;
    isUnlimited: boolean;
  };
  features: {
    hasMercadoPago: boolean;
    hasAiBot: boolean;
    hasCustomThemes: boolean;
    hasPdfCatalog: boolean;
  };
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: TenantPlan;
  status: TenantStatus;
  maxProducts: number;
  maxBroadcasts: number;
  culqiPublicKey?: string;
  mpPublicKey?: string;
  mpAccessToken?: string;
  mpRefreshToken?: string;
  mpUserId?: string;
  mpConnectedAt?: string;
  createdAt: string;
}

export interface EnrichedTenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  metrics: {
    productCount: number;
    maxProducts: number;
    orderCount: number;
    chatCount: number;
    userCount: number;
    totalGmv: number;
  };
  whatsapp: {
    status: 'CONNECTED' | 'QR_READY' | 'DISCONNECTED';
    phoneNumber?: string | null;
    lastActivity?: string | null;
  };
}

export interface AdminMetrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  planDistribution: {
    freeTrial: number;
    pro: number;
    enterprise: number;
  };
  financials: {
    mrr: number;
    arr: number;
    totalGmv: number;
    currency: string;
  };
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    connectedWhatsAppSessions: number;
  };
}

export interface User {
  id: string;
  tenantId?: string;
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

export interface RegisterStoreDto {
  storeName: string;
  slug?: string;
  ownerName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  plan?: TenantPlan;
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

export interface StoreThemeConfig {
  templateId: 'dark-tech' | 'light-minimal' | 'warm-brand';
  accentColor: string;   // CSS color value e.g. '#10b981'
  fontFamily: string;    // 'geist' | 'outfit' | 'inter' | 'playfair' | 'jakarta'
  productLayout: 'grid-2' | 'grid-3' | 'grid-4' | 'list';

  // Landing Page Header & Announcement Bar
  announcementText?: string;
  showAnnouncement?: boolean;

  // Landing Page Hero Section
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBannerUrl?: string;
  heroCtaText?: string;
  heroSecondaryCtaText?: string;

  // Trust / Value Props Strip (4 items)
  trustBadge1Title?: string;
  trustBadge1Desc?: string;
  trustBadge2Title?: string;
  trustBadge2Desc?: string;
  trustBadge3Title?: string;
  trustBadge3Desc?: string;
  trustBadge4Title?: string;
  trustBadge4Desc?: string;

  // Featured Promotional Banner Section
  promoBannerActive?: boolean;
  promoBadge?: string;
  promoTitle?: string;
  promoSubtitle?: string;
  promoImageUrl?: string;
  promoCtaText?: string;

  // Social Proof & FAQ
  showReviews?: boolean;
  showFaq?: boolean;

  // Checkout & Buying Experience
  purchaseMode?: 'both' | 'whatsapp' | 'cart';
  whatsappCustomMessage?: string;
}

export interface CompanyConfig {
  id?: string;
  tenantId?: string;
  companyName: string;
  businessDescription: string;
  phone?: string;
  email?: string;
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
  pickupStoreAddress?: string;
  pickupStoreHours?: string;
  deliveryZone1Price?: number;
  deliveryZone2Price?: number;
  deliveryZone3Price?: number;
  deliveryProvincePrice?: number;
  freeShippingThreshold?: number;
  storeTheme?: string;  // JSON-serialized StoreThemeConfig
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
  paymentMethod?: 'MERCADOPAGO' | 'CULQI' | 'CASH_ON_DELIVERY' | 'YAPE_DIRECT' | 'PLIN_DIRECT' | 'PENDING';
  mercadoPagoPaymentId?: string;
  mercadoPagoPreferenceId?: string;
  culqiChargeId?: string;
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
    totalCost?: number;
    grossProfit?: number;
    marginPercentage?: number;
    topProfitableProducts?: Array<{
      id?: string;
      name: string;
      unitsSold: number;
      revenue: number;
      profit: number;
      margin: number;
    }>;
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

export interface BroadcastRecipient {
  id: string;
  campaignId: string;
  customerPhone: string;
  customerName?: string;
  renderedText: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  messageTemplate: string;
  mediaUrl?: string;
  attachPdfCatalog: boolean;
  status: 'DRAFT' | 'SENDING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  targetSegment: 'ALL_CUSTOMERS' | 'FREQUENT_BUYERS' | 'PENDING_ORDERS' | 'RECENT_CONTACTS';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  deliveredCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  recipients?: BroadcastRecipient[];
}

export interface CreateBroadcastCampaignDto {
  title: string;
  messageTemplate: string;
  mediaUrl?: string;
  attachPdfCatalog?: boolean;
  targetSegment: string;
}

export interface CustomerPortfolioItem {
  id: string;
  customerPhone: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  lastInteraction: string;
  isBotActive: boolean;
  source: 'CHAT' | 'ORDER' | 'MANUAL';
}

