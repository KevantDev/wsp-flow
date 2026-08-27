import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IWhatsAppSessionRepository } from '../../../../domain/repositories/whatsapp-session.repository.interface';
import { WhatsAppSessionEntity, SessionStatus } from '../../../../domain/entities/whatsapp-session.entity';

@Injectable()
export class PrismaWhatsAppSessionRepository implements IWhatsAppSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapEntity(s: any): WhatsAppSessionEntity {
    return new WhatsAppSessionEntity({
      id: s.id,
      sessionName: s.sessionName,
      phoneNumber: s.phoneNumber,
      status: s.status as SessionStatus,
      qrCode: s.qrCode,
      isAutoReplyActive: s.isAutoReplyActive,
      welcomeMessage: s.welcomeMessage,
      outOfStockMessage: s.outOfStockMessage,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
    });
  }

  async getSession(sessionName = 'default'): Promise<WhatsAppSessionEntity | null> {
    let session = await this.prisma.whatsAppSession.findUnique({
      where: { sessionName },
    });

    if (!session) {
      session = await this.prisma.whatsAppSession.create({
        data: {
          sessionName,
          status: 'DISCONNECTED',
          isAutoReplyActive: true,
          welcomeMessage: '¡Hola! 👋 Bienvenido a nuestro catálogo y tienda online.',
        },
      });
    }

    return this.mapEntity(session);
  }

  async updateStatus(status: SessionStatus, qrCode?: string | null, phoneNumber?: string | null): Promise<WhatsAppSessionEntity> {
    const updated = await this.prisma.whatsAppSession.upsert({
      where: { sessionName: 'default' },
      update: {
        status: status as any,
        qrCode: qrCode !== undefined ? qrCode : undefined,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
      },
      create: {
        sessionName: 'default',
        status: status as any,
        qrCode,
        phoneNumber,
      },
    });
    return this.mapEntity(updated);
  }

  async updateSettings(data: { isAutoReplyActive?: boolean; welcomeMessage?: string; outOfStockMessage?: string }): Promise<WhatsAppSessionEntity> {
    const updated = await this.prisma.whatsAppSession.upsert({
      where: { sessionName: 'default' },
      update: {
        ...(data.isAutoReplyActive !== undefined && { isAutoReplyActive: data.isAutoReplyActive }),
        ...(data.welcomeMessage !== undefined && { welcomeMessage: data.welcomeMessage }),
        ...(data.outOfStockMessage !== undefined && { outOfStockMessage: data.outOfStockMessage }),
      },
      create: {
        sessionName: 'default',
        ...data,
      },
    });
    return this.mapEntity(updated);
  }
}
