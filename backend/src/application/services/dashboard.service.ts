import { Injectable } from '@nestjs/common';
import { PrismaOrderRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { PrismaChatRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-chat.repository';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly orderRepo: PrismaOrderRepository,
    private readonly productRepo: PrismaProductRepository,
    private readonly chatRepo: PrismaChatRepository,
    private readonly baileysService: BaileysService,
  ) {}

  async getMetrics(tenantId?: string) {
    const [allOrders, allProducts, chatSessions] = await Promise.all([
      this.orderRepo.findAll({ tenantId }),
      this.productRepo.findAll({ tenantId }),
      this.chatRepo.findAllSessions(tenantId),
    ]);

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((acc, curr) => acc + curr.total, 0);
    const pendingOrders = allOrders.filter((o) => o.status === 'PENDING').length;
    const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED' || o.status === 'SHIPPED').length;

    const totalProducts = allProducts.length;
    const lowStockProducts = allProducts.filter((p) => p.isLowStock());
    const lowStockCount = lowStockProducts.length;

    const recentOrders = allOrders.slice(0, 6);
    const activeChatsCount = chatSessions.length;
    const whatsappStatus = tenantId ? this.baileysService.getStatus(tenantId) : { status: 'DISCONNECTED', qrCode: null, phoneNumber: null };

    // =========================================================================
    // ANÁLISIS DE RENTABILIDAD & MARGEN REAL (FINANCIAL BI)
    // =========================================================================
    const nonCancelledOrders = allOrders.filter((o) => o.status !== 'CANCELLED');
    const productMap = new Map<string, any>();
    for (const p of allProducts) {
      productMap.set(p.id, p);
    }

    let totalCost = 0;
    const productProfitMap = new Map<
      string,
      { id: string; name: string; unitsSold: number; revenue: number; profit: number; margin: number }
    >();

    for (const order of nonCancelledOrders) {
      for (const item of order.items || []) {
        const prod = item.productId ? productMap.get(item.productId) : null;
        const unitCost =
          prod && prod.costPrice != null && prod.costPrice > 0
            ? prod.costPrice
            : item.unitPrice * 0.6;
        const itemCost = unitCost * item.quantity;
        const itemRevenue = item.subtotal || item.unitPrice * item.quantity;
        const itemProfit = itemRevenue - itemCost;

        totalCost += itemCost;

        const prodKey = item.productId || item.productName;
        const existing = productProfitMap.get(prodKey) || {
          id: item.productId || '',
          name: item.productName,
          unitsSold: 0,
          revenue: 0,
          profit: 0,
          margin: 0,
        };

        existing.unitsSold += item.quantity;
        existing.revenue += itemRevenue;
        existing.profit += itemProfit;
        existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
        productProfitMap.set(prodKey, existing);
      }
    }

    const grossProfit = Math.max(0, totalRevenue - totalCost);
    const marginPercentage =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const topProfitableProducts = Array.from(productProfitMap.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 4);

    return {
      financial: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalCost,
        grossProfit,
        marginPercentage,
        topProfitableProducts,
      },
      inventory: {
        totalProducts,
        lowStockCount,
        lowStockProducts: lowStockProducts.slice(0, 5),
      },
      chats: {
        totalChats: activeChatsCount,
        recentSessions: chatSessions.slice(0, 5),
      },
      recentOrders,
      whatsappStatus,
    };
  }
}
