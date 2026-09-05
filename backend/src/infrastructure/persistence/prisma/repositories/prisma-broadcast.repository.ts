import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateCampaignDto {
  tenantId: string;
  title: string;
  messageTemplate: string;
  mediaUrl?: string;
  attachPdfCatalog?: boolean;
  targetSegment: string;
}

@Injectable()
export class PrismaBroadcastRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCampaign(data: CreateCampaignDto) {
    return this.prisma.broadcastCampaign.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        messageTemplate: data.messageTemplate,
        mediaUrl: data.mediaUrl,
        attachPdfCatalog: data.attachPdfCatalog ?? false,
        targetSegment: data.targetSegment,
        status: 'DRAFT',
      },
    });
  }

  async findCampaignById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.broadcastCampaign.findFirst({
      where,
      include: {
        recipients: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findAllCampaigns(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.broadcastCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        recipients: {
          take: 5,
        },
      },
    });
  }

  async updateCampaign(id: string, data: any) {
    return this.prisma.broadcastCampaign.update({
      where: { id },
      data,
    });
  }

  async deleteCampaign(id: string) {
    return this.prisma.broadcastCampaign.delete({
      where: { id },
    });
  }

  async createRecipients(
    campaignId: string,
    recipients: Array<{ customerPhone: string; customerName?: string; renderedText: string }>,
  ) {
    // 1. Eliminar anteriores si existían
    await this.prisma.broadcastRecipient.deleteMany({
      where: { campaignId },
    });

    // 2. Crear lote
    await this.prisma.broadcastRecipient.createMany({
      data: recipients.map((r) => ({
        campaignId,
        customerPhone: r.customerPhone,
        customerName: r.customerName || null,
        renderedText: r.renderedText,
        status: 'QUEUED',
      })),
    });

    // 3. Actualizar totalRecipients en la campaña
    return this.prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: {
        totalRecipients: recipients.length,
      },
    });
  }

  async findQueuedRecipients(campaignId: string) {
    return this.prisma.broadcastRecipient.findMany({
      where: {
        campaignId,
        status: 'QUEUED',
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateRecipientStatus(id: string, status: string, errorMessage?: string) {
    return this.prisma.broadcastRecipient.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage || null,
        sentAt: status === 'SENT' ? new Date() : undefined,
      },
    });
  }

  async incrementCampaignSent(campaignId: string) {
    return this.prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: {
        sentCount: { increment: 1 },
        deliveredCount: { increment: 1 },
      },
    });
  }

  async incrementCampaignFailed(campaignId: string) {
    return this.prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: {
        failedCount: { increment: 1 },
      },
    });
  }
}
