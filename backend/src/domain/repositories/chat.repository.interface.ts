import { ChatSessionEntity, ChatMessageEntity, MessageSender } from '../entities/chat-session.entity';

export interface IChatRepository {
  findOrCreateSession(tenantId: string, customerPhone: string, customerName?: string): Promise<ChatSessionEntity>;
  findSessionByPhone(tenantId: string, customerPhone: string): Promise<ChatSessionEntity | null>;
  findAllSessions(tenantId?: string): Promise<ChatSessionEntity[]>;
  toggleBot(tenantId: string, customerPhone: string, isBotActive: boolean): Promise<ChatSessionEntity>;
  saveMessage(data: {
    chatSessionId: string;
    sender: MessageSender;
    senderName?: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    whatsappMsgId?: string;
  }): Promise<ChatMessageEntity>;
  getMessages(chatSessionId: string, limit?: number): Promise<ChatMessageEntity[]>;
  getMessagesPaginated(
    chatSessionId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ messages: ChatMessageEntity[]; hasMore: boolean; total: number }>;
  markMessagesAsRead(chatSessionId: string): Promise<void>;
  deleteSession?(id: string): Promise<void>;
}

export const CHAT_REPOSITORY = 'CHAT_REPOSITORY';
