import { WhatsAppSessionEntity, SessionStatus } from '../entities/whatsapp-session.entity';

export interface IWhatsAppSessionRepository {
  getSession(sessionName?: string): Promise<WhatsAppSessionEntity | null>;
  updateStatus(status: SessionStatus, qrCode?: string | null, phoneNumber?: string | null): Promise<WhatsAppSessionEntity>;
  updateSettings(data: { isAutoReplyActive?: boolean; welcomeMessage?: string; outOfStockMessage?: string }): Promise<WhatsAppSessionEntity>;
}

export const WHATSAPP_SESSION_REPOSITORY = 'WHATSAPP_SESSION_REPOSITORY';
