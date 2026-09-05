import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaChatRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-chat.repository';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { SendManualMessageDto, ToggleBotDto, CreateChatSessionDto } from '../dtos/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: PrismaChatRepository,
    private readonly baileysService: BaileysService,
  ) {}

  async getAllSessions(tenantId?: string) {
    return this.chatRepo.findAllSessions(tenantId);
  }

  async createOrGetSession(dto: CreateChatSessionDto, tenantId: string) {
    return this.chatRepo.findOrCreateSession(tenantId, dto.customerPhone, dto.customerName);
  }

  async getSessionMessages(chatSessionId: string, limit = 30, offset = 0) {
    const result = await this.chatRepo.getMessagesPaginated(
      chatSessionId,
      Number(limit) || 30,
      Number(offset) || 0,
    );
    await this.chatRepo.markMessagesAsRead(chatSessionId);
    return result;
  }

  async toggleBot(dto: ToggleBotDto, tenantId: string) {
    const session = await this.chatRepo.toggleBot(tenantId, dto.customerPhone, dto.isBotActive);
    if (!session) throw new NotFoundException('Conversación no encontrada');
    return session;
  }

  async sendManualMessage(dto: SendManualMessageDto, tenantId: string, senderName = 'Agente') {
    return this.baileysService.sendManualMessage(tenantId, dto.customerPhone, dto.content, senderName);
  }
}
