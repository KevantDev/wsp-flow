import { ChatSessionEntity, ChatMessageEntity, MessageSender } from '../entities/chat-session.entity';

export interface IChatRepository {
  findOrCreateSession(customerPhone: string, customerName?: string): Promise<ChatSessionEntity>;
  findSessionByPhone(customerPhone: string): Promise<ChatSessionEntity | null>;
  findAllSessions(): Promise<ChatSessionEntity[]>;
  toggleBot(customerPhone: string, isBotActive: boolean): Promise<ChatSessionEntity>;
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
  markMessagesAsRead(chatSessionId: string): Promise<void>;
}

export const CHAT_REPOSITORY = 'CHAT_REPOSITORY';
