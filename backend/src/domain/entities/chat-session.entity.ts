export enum MessageSender {
  CUSTOMER = 'CUSTOMER',
  BOT = 'BOT',
  AGENT = 'AGENT',
}

export class ChatMessageEntity {
  id: string;
  chatSessionId: string;
  sender: MessageSender;
  senderName?: string;
  content: string;
  mediaUrl?: string;
  mediaType: string;
  whatsappMsgId?: string;
  isRead: boolean;
  createdAt: Date;

  constructor(partial: Partial<ChatMessageEntity>) {
    Object.assign(this, partial);
  }
}

export class ChatSessionEntity {
  id: string;
  tenantId: string;
  customerPhone: string;
  customerName?: string;
  isBotActive: boolean;
  isArchived: boolean;
  lastInteraction: Date;
  unreadCount: number;
  assignedUserId?: string;
  assignedUserName?: string;
  messages?: ChatMessageEntity[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ChatSessionEntity>) {
    Object.assign(this, partial);
  }
}
