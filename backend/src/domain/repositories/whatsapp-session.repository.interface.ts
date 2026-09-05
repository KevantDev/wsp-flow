import { WhatsAppSessionEntity, SessionStatus } from '../entities/whatsapp-session.entity';

export interface IWhatsAppSessionRepository {
  getSession(tenantId?: string, sessionName?: string): Promise<WhatsAppSessionEntity | null>;
  getAllSessions?(): Promise<WhatsAppSessionEntity[]>;
  updateStatus(tenantId: string, status: SessionStatus, qrCode?: string | null, phoneNumber?: string | null, sessionName?: string): Promise<WhatsAppSessionEntity>;
  updateSettings(tenantId: string, data: { isAutoReplyActive?: boolean; welcomeMessage?: string; outOfStockMessage?: string }, sessionName?: string): Promise<WhatsAppSessionEntity>;
}

export const WHATSAPP_SESSION_REPOSITORY = 'WHATSAPP_SESSION_REPOSITORY';
