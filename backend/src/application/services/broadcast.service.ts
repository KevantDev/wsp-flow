import { Injectable, Logger } from '@nestjs/common';
import { PrismaBroadcastRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-broadcast.repository';
import { PrismaChatRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-chat.repository';
import { PrismaOrderRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { CatalogPdfService } from '../../infrastructure/pdf/catalog-pdf.service';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { PlansService } from './plans.service';

export interface AudienceMember {
  customerPhone: string;
  customerName: string;
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

export interface AddManualCustomerDto {
  customerPhone: string;
  customerName: string;
  sendGreeting?: boolean;
}

export interface CreateCampaignInputDto {
  title: string;
  messageTemplate: string;
  mediaUrl?: string;
  attachPdfCatalog?: boolean;
  targetSegment: string;
}

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);
  private activeWorkers = new Set<string>();

  constructor(
    private readonly broadcastRepo: PrismaBroadcastRepository,
    private readonly chatRepo: PrismaChatRepository,
    private readonly orderRepo: PrismaOrderRepository,
    private readonly baileysService: BaileysService,
    private readonly catalogPdfService: CatalogPdfService,
    private readonly wsGateway: WhatsAppGateway,
    private readonly plansService: PlansService,
  ) {}

  /**
   * Obtiene la cartera completa de clientes con métricas consolidadas (CRM)
   */
  async getCustomerPortfolio(tenantId?: string): Promise<CustomerPortfolioItem[]> {
    const [allSessions, allOrders] = await Promise.all([
      this.chatRepo.findAllSessions(tenantId),
      this.orderRepo.findAll({ tenantId }),
    ]);

    const customerMap = new Map<string, CustomerPortfolioItem>();

    // 1. Indexar sesiones de chat
    for (const session of allSessions) {
      if (!session.customerPhone) continue;
      const phone = session.customerPhone;
      customerMap.set(phone, {
        id: session.id,
        customerPhone: phone,
        customerName: session.customerName || 'Cliente WhatsApp',
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null,
        lastInteraction: session.lastInteraction.toISOString(),
        isBotActive: session.isBotActive,
        source: 'CHAT',
      });
    }

    // 2. Indexar órdenes y sumar métricas LTV
    for (const order of allOrders) {
      if (!order.customerPhone) continue;
      const phone = order.customerPhone.replace(/\D/g, '');
      const existing = customerMap.get(phone);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += order.total;
        if (!existing.lastOrderDate || new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt.toISOString();
        }
        if (order.customerName && existing.customerName === 'Cliente WhatsApp') {
          existing.customerName = order.customerName;
        }
      } else {
        customerMap.set(phone, {
          id: order.id,
          customerPhone: phone,
          customerName: order.customerName || 'Cliente',
          totalOrders: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt.toISOString(),
          lastInteraction: order.createdAt.toISOString(),
          isBotActive: true,
          source: 'ORDER',
        });
      }
    }

    return Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime(),
    );
  }

  /**
   * Agrega un nuevo cliente manualmente a la cartera
   */
  async addCustomerManually(dto: AddManualCustomerDto, tenantId: string): Promise<CustomerPortfolioItem> {
    const cleanPhone = dto.customerPhone.replace(/\D/g, '');
    const session = await this.chatRepo.findOrCreateSession(tenantId, cleanPhone, dto.customerName);

    if (dto.sendGreeting) {
      try {
        await this.baileysService.sendManualMessage(
          tenantId,
          cleanPhone,
          `¡Hola ${dto.customerName}! 👋 Te saludamos de la tienda. Registramos tu número para mantenerte al tanto de nuestras novedades y ofertas. ¡Escríbenos si deseas ver nuestro catálogo! ✨`,
          'Sistema WSP',
        );
      } catch (err: any) {
        this.logger.error(`Error enviando saludo manual a ${cleanPhone}: ${err.message}`);
      }
    }

    return {
      id: session.id,
      customerPhone: cleanPhone,
      customerName: dto.customerName,
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      lastInteraction: session.lastInteraction.toISOString(),
      isBotActive: session.isBotActive,
      source: 'MANUAL',
    };
  }

  async deleteCustomer(idOrPhone: string, tenantId: string): Promise<boolean> {
    const cleanPhone = idOrPhone.replace(/\D/g, '');
    const session = await this.chatRepo.findSessionByPhone(tenantId, cleanPhone);
    if (session) {
      await this.chatRepo.deleteSession(session.id);
      return true;
    }
    return false;
  }

  async estimateAudience(segment: string, tenantId?: string): Promise<{ count: number; members: AudienceMember[] }> {
    const [allSessions, allOrders] = await Promise.all([
      this.chatRepo.findAllSessions(tenantId),
      this.orderRepo.findAll({ tenantId }),
    ]);

    const phoneMap = new Map<string, string>();

    switch (segment) {
      case 'FREQUENT_BUYERS': {
        const orderCounts = new Map<string, number>();
        for (const o of allOrders) {
          if (o.customerPhone) {
            orderCounts.set(o.customerPhone, (orderCounts.get(o.customerPhone) || 0) + 1);
          }
        }
        for (const [phone, count] of orderCounts.entries()) {
          if (count >= 2) {
            const ord = allOrders.find((o) => o.customerPhone === phone);
            phoneMap.set(phone, ord?.customerName || 'Cliente');
          }
        }
        break;
      }

      case 'PENDING_ORDERS': {
        for (const o of allOrders) {
          if (o.status === 'PENDING' && o.customerPhone) {
            phoneMap.set(o.customerPhone, o.customerName || 'Cliente');
          }
        }
        break;
      }

      case 'RECENT_CONTACTS': {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        for (const s of allSessions) {
          if (s.customerPhone && new Date(s.lastInteraction).getTime() >= thirtyDaysAgo) {
            phoneMap.set(s.customerPhone, s.customerName || 'Cliente');
          }
        }
        break;
      }

      case 'ALL_CUSTOMERS':
      default: {
        for (const s of allSessions) {
          if (s.customerPhone) {
            phoneMap.set(s.customerPhone, s.customerName || 'Cliente');
          }
        }
        for (const o of allOrders) {
          if (o.customerPhone && !phoneMap.has(o.customerPhone)) {
            phoneMap.set(o.customerPhone, o.customerName || 'Cliente');
          }
        }
        break;
      }
    }

    const members: AudienceMember[] = Array.from(phoneMap.entries()).map(([customerPhone, customerName]) => ({
      customerPhone,
      customerName,
    }));

    return { count: members.length, members };
  }

  async createCampaign(dto: CreateCampaignInputDto, tenantId: string) {
    this.logger.log(`📢 Creando campaña de difusión: "${dto.title}" para segmento [${dto.targetSegment}]`);

    const audience = await this.estimateAudience(dto.targetSegment, tenantId);

    // Validar cuota mensual de difusiones según el plan
    await this.plansService.checkTenantQuota(tenantId, 'BROADCAST', { audienceSize: audience.count });

    const campaign = await this.broadcastRepo.createCampaign({
      ...dto,
      tenantId,
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const catalogUrl = `${baseUrl}/catalog`;

    const recipients = audience.members.map((m) => {
      const renderedText = dto.messageTemplate
        .replace(/{{nombre}}/gi, m.customerName || 'Cliente')
        .replace(/{{telefono}}/gi, m.customerPhone)
        .replace(/{{catalogo_link}}/gi, catalogUrl);

      return {
        customerPhone: m.customerPhone,
        customerName: m.customerName,
        renderedText,
      };
    });

    const updated = await this.broadcastRepo.createRecipients(campaign.id, recipients);
    return this.broadcastRepo.findCampaignById(updated.id, tenantId);
  }

  async getAllCampaigns(tenantId?: string) {
    return this.broadcastRepo.findAllCampaigns(tenantId);
  }

  async getCampaignById(id: string, tenantId?: string) {
    return this.broadcastRepo.findCampaignById(id, tenantId);
  }

  async startCampaign(id: string, tenantId: string) {
    const campaign = await this.broadcastRepo.findCampaignById(id, tenantId);
    if (!campaign) throw new Error('Campaña no encontrada');
    if (campaign.status === 'SENDING') return campaign;

    await this.broadcastRepo.updateCampaign(id, {
      status: 'SENDING',
      startedAt: campaign.startedAt || new Date(),
    });

    this.logger.log(`🚀 Iniciando motor de envío para campaña [${id}] - "${campaign.title}"`);
    this.runQueueWorker(id, tenantId);

    return this.broadcastRepo.findCampaignById(id, tenantId);
  }

  async pauseCampaign(id: string) {
    this.logger.log(`⏸️ Pausando campaña [${id}]`);
    await this.broadcastRepo.updateCampaign(id, { status: 'PAUSED' });
    this.activeWorkers.delete(id);
    return this.broadcastRepo.findCampaignById(id);
  }

  async cancelCampaign(id: string) {
    this.logger.log(`🛑 Cancelando campaña [${id}]`);
    await this.broadcastRepo.updateCampaign(id, { status: 'CANCELLED' });
    this.activeWorkers.delete(id);
    return this.broadcastRepo.findCampaignById(id);
  }

  async deleteCampaign(id: string) {
    this.activeWorkers.delete(id);
    return this.broadcastRepo.deleteCampaign(id);
  }

  private async runQueueWorker(campaignId: string, tenantId: string) {
    if (this.activeWorkers.has(campaignId)) return;
    this.activeWorkers.add(campaignId);

    try {
      let catalogPdfPath: string | null = null;
      const initialCampaign = await this.broadcastRepo.findCampaignById(campaignId, tenantId);

      if (initialCampaign?.attachPdfCatalog) {
        try {
          const generated = await this.catalogPdfService.generateCatalogPdf(tenantId);
          catalogPdfPath = generated.filePath;
        } catch (e: any) {
          this.logger.error(`Error generando PDF para difusión: ${e.message}`);
        }
      }

      while (this.activeWorkers.has(campaignId)) {
        const campaign = await this.broadcastRepo.findCampaignById(campaignId, tenantId);
        if (!campaign || campaign.status !== 'SENDING') {
          break;
        }

        const queuedList = await this.broadcastRepo.findQueuedRecipients(campaignId);
        if (!queuedList || queuedList.length === 0) {
          await this.broadcastRepo.updateCampaign(campaignId, {
            status: 'COMPLETED',
            completedAt: new Date(),
          });

          this.wsGateway.server?.emit('BROADCAST_COMPLETED', {
            campaignId,
            tenantId,
            sentCount: campaign.sentCount,
            totalRecipients: campaign.totalRecipients,
          });
          break;
        }

        const recipient = queuedList[0];

        try {
          const typingDelay = Math.floor(Math.random() * 1500) + 2000;
          await new Promise((r) => setTimeout(r, typingDelay));

          if (catalogPdfPath) {
            await this.baileysService.sendManualMessage(
              tenantId,
              recipient.customerPhone,
              recipient.renderedText,
              'Difusión WSP',
            );
          } else if (campaign.mediaUrl) {
            await this.baileysService.dispatchMediaMessage(
              tenantId,
              `${recipient.customerPhone.replace(/\D/g, '')}@s.whatsapp.net`,
              campaign.mediaUrl,
              'image',
              recipient.renderedText,
              '',
            );
          } else {
            await this.baileysService.sendManualMessage(
              tenantId,
              recipient.customerPhone,
              recipient.renderedText,
              'Difusión WSP',
            );
          }

          await this.broadcastRepo.updateRecipientStatus(recipient.id, 'SENT');
          await this.broadcastRepo.incrementCampaignSent(campaignId);

          this.wsGateway.server?.emit('BROADCAST_PROGRESS', {
            campaignId,
            tenantId,
            sentCount: campaign.sentCount + 1,
            totalRecipients: campaign.totalRecipients,
          });

          const antiBanDelay = Math.floor(Math.random() * 3000) + 4000;
          await new Promise((r) => setTimeout(r, antiBanDelay));
        } catch (err: any) {
          await this.broadcastRepo.updateRecipientStatus(recipient.id, 'FAILED', err.message);
          await this.broadcastRepo.incrementCampaignFailed(campaignId);
        }
      }
    } finally {
      this.activeWorkers.delete(campaignId);
    }
  }
}
