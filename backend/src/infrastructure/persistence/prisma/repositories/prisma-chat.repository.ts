import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IChatRepository } from '../../../../domain/repositories/chat.repository.interface';
import {
  ChatSessionEntity,
  ChatMessageEntity,
  MessageSender,
} from '../../../../domain/entities/chat-session.entity';

@Injectable()
export class PrismaChatRepository implements IChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapSession(s: any): ChatSessionEntity {
    return new ChatSessionEntity({
      id: s.id,
      tenantId: s.tenantId,
      customerPhone: s.customerPhone,
      customerName: s.customerName,
      isBotActive: s.isBotActive,
      isArchived: s.isArchived,
      lastInteraction: s.lastInteraction,
      unreadCount: s.unreadCount,
      assignedUserId: s.assignedUserId,
      assignedUserName: s.assignedUser?.fullName,
      messages: s.messages?.map((m: any) => this.mapMessage(m)),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });
  }

  private mapMessage(m: any): ChatMessageEntity {
    return new ChatMessageEntity({
      id: m.id,
      chatSessionId: m.chatSessionId,
      sender: m.sender as MessageSender,
      senderName: m.senderName,
      content: m.content,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType || 'text',
      whatsappMsgId: m.whatsappMsgId,
      isRead: m.isRead,
      createdAt: m.createdAt,
    });
  }

  async findOrCreateSession(
    tenantId: string,
    rawPhone: string,
    customerName?: string,
  ): Promise<ChatSessionEntity> {
    const customerPhone = rawPhone.replace(/\D/g, '');
    let session = await this.prisma.chatSession.findFirst({
      where: { tenantId, customerPhone, isArchived: false },
      include: { assignedUser: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: {
          tenantId,
          customerPhone,
          customerName: customerName || 'Cliente WhatsApp',
          isBotActive: true,
        },
        include: { assignedUser: true },
      });
    } else if (
      customerName &&
      customerName !== 'Cliente WhatsApp' &&
      session.customerName !== customerName
    ) {
      session = await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { customerName },
        include: { assignedUser: true },
      });
    }

    return this.mapSession(session);
  }

  async findSessionByPhone(tenantId: string, rawPhone: string): Promise<ChatSessionEntity | null> {
    const customerPhone = rawPhone.replace(/\D/g, '');
    const session = await this.prisma.chatSession.findFirst({
      where: { tenantId, customerPhone, isArchived: false },
      include: {
        assignedUser: true,
        messages: { take: 20, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!session) return null;
    return this.mapSession(session);
  }

  async findAllSessions(tenantId?: string): Promise<ChatSessionEntity[]> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const sessions = await this.prisma.chatSession.findMany({
      where,
      include: {
        assignedUser: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastInteraction: 'desc' },
    });
    return sessions.map((s) => this.mapSession(s));
  }

  async toggleBot(
    tenantId: string,
    rawPhone: string,
    isBotActive: boolean,
  ): Promise<ChatSessionEntity> {
    const customerPhone = rawPhone.replace(/\D/g, '');
    const existing = await this.prisma.chatSession.findFirst({
      where: { tenantId, customerPhone, isArchived: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!existing)
      throw new Error(`ChatSession no encontrada para el teléfono: ${customerPhone}`);
    const session = await this.prisma.chatSession.update({
      where: { id: existing.id },
      data: { isBotActive },
      include: { assignedUser: true },
    });
    return this.mapSession(session);
  }

  async saveMessage(data: {
    chatSessionId: string;
    sender: MessageSender;
    senderName?: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    whatsappMsgId?: string;
  }): Promise<ChatMessageEntity> {
    const message = await this.prisma.chatMessage.create({
      data: {
        chatSessionId: data.chatSessionId,
        sender: data.sender as any,
        senderName: data.senderName,
        content: data.content,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType || 'text',
        whatsappMsgId: data.whatsappMsgId,
        isRead: data.sender === MessageSender.AGENT || data.sender === MessageSender.BOT,
      },
    });

    await this.prisma.chatSession.update({
      where: { id: data.chatSessionId },
      data: {
        lastInteraction: new Date(),
        ...(data.sender === MessageSender.CUSTOMER && {
          unreadCount: { increment: 1 },
        }),
      },
    });

    return this.mapMessage(message);
  }

  async getMessages(chatSessionId: string, limit = 100): Promise<ChatMessageEntity[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { chatSessionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages.reverse().map((m) => this.mapMessage(m));
  }

  async getMessagesPaginated(
    chatSessionId: string,
    limit = 30,
    offset = 0,
  ): Promise<{ messages: ChatMessageEntity[]; hasMore: boolean; total: number }> {
    const [total, messages] = await Promise.all([
      this.prisma.chatMessage.count({
        where: { chatSessionId },
      }),
      this.prisma.chatMessage.findMany({
        where: { chatSessionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      messages: messages.reverse().map((m) => this.mapMessage(m)),
      hasMore: offset + messages.length < total,
      total,
    };
  }

  async markMessagesAsRead(chatSessionId: string): Promise<void> {
    await this.prisma.chatMessage.updateMany({
      where: { chatSessionId, isRead: false },
      data: { isRead: true },
    });
    await this.prisma.chatSession.update({
      where: { id: chatSessionId },
      data: { unreadCount: 0 },
    });
  }

  async deleteSession(chatSessionId: string): Promise<void> {
    await this.prisma.chatSession.delete({
      where: { id: chatSessionId },
    });
  }
}
