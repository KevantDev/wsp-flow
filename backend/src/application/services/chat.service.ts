import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaChatRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-chat.repository';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { SendManualMessageDto, ToggleBotDto } from '../dtos/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: PrismaChatRepository,
    private readonly baileysService: BaileysService,
  ) {}

  async getAllSessions() {
    return this.chatRepo.findAllSessions();
  }

  async getSessionMessages(chatSessionId: string) {
    const messages = await this.chatRepo.getMessages(chatSessionId, 100);
    await this.chatRepo.markMessagesAsRead(chatSessionId);
    return messages;
  }

  async toggleBot(dto: ToggleBotDto) {
    const session = await this.chatRepo.toggleBot(dto.customerPhone, dto.isBotActive);
    if (!session) throw new NotFoundException('Conversación no encontrada');
    return session;
  }

  async sendManualMessage(dto: SendManualMessageDto, senderName = 'Agente') {
    return this.baileysService.sendManualMessage(dto.customerPhone, dto.content, senderName);
  }
}
