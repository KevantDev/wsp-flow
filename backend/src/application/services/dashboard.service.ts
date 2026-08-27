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

  async getMetrics() {
    const orderMetrics = await this.orderRepo.getMetrics();
    const totalProducts = await this.productRepo.countTotal();
    const lowStockCount = await this.productRepo.countLowStock();
    const allProducts = await this.productRepo.findAll();
    const lowStockProducts = allProducts.filter((p) => p.isLowStock());

    const recentOrders = await this.orderRepo.findAll({ limit: 6 });
    const chatSessions = await this.chatRepo.findAllSessions();
    const activeChatsCount = chatSessions.length;
    const whatsappStatus = this.baileysService.getStatus();

    return {
      financial: {
        totalRevenue: orderMetrics.totalRevenue,
        totalOrders: orderMetrics.totalOrders,
        pendingOrders: orderMetrics.pendingOrders,
        completedOrders: orderMetrics.completedOrders,
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
