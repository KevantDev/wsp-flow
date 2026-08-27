export enum SessionStatus {
  DISCONNECTED = 'DISCONNECTED',
  SCAN_QR = 'SCAN_QR',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export class WhatsAppSessionEntity {
  id: string;
  sessionName: string;
  phoneNumber?: string;
  status: SessionStatus;
  qrCode?: string;
  isAutoReplyActive: boolean;
  welcomeMessage?: string;
  outOfStockMessage?: string;
  updatedAt: Date;
  createdAt: Date;

  constructor(partial: Partial<WhatsAppSessionEntity>) {
    Object.assign(this, partial);
  }
}
