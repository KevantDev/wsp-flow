import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import pino from 'pino';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import axios from 'axios';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { PrismaWhatsAppSessionRepository } from '../persistence/prisma/repositories/prisma-whatsapp-session.repository';
import { PrismaChatRepository } from '../persistence/prisma/repositories/prisma-chat.repository';
import { PrismaCompanyConfigRepository } from '../persistence/prisma/repositories/prisma-company-config.repository';
import { PrismaTenantRepository } from '../persistence/prisma/repositories/prisma-tenant.repository';
import { BaileysFlowHandler } from './baileys-flow.handler';
import { DeliveryService } from '../../application/services/delivery.service';
import { AiService } from '../ai/ai.service';
import { SessionStatus } from '../../domain/entities/whatsapp-session.entity';
import { MessageSender } from '../../domain/entities/chat-session.entity';

interface DebounceBuffer {
  timer: NodeJS.Timeout;
  messages: string[];
  tenantId: string;
  customerPhone: string;
  customerName: string;
  chatSessionId: string;
  remoteJid: string;
  lastMessageKey: any;
  rawMessage?: any;
}

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaileysService.name);

  // Pool de conexiones multi-tenant
  private sockets = new Map<string, WASocket>();
  private qrCodeDataUrls = new Map<string, string | null>();
  private connectionStatuses = new Map<string, SessionStatus>();
  private botPhoneNumbers = new Map<string, string | null>();
  private isConnectingMap = new Map<string, boolean>();

  // Buffer de mensajes entrantes con debounce de 10 segundos (Key: `${tenantId}:${customerPhone}`)
  private messageBuffers = new Map<string, DebounceBuffer>();

  constructor(
    private readonly wsGateway: WhatsAppGateway,
    private readonly sessionRepo: PrismaWhatsAppSessionRepository,
    private readonly chatRepo: PrismaChatRepository,
    private readonly configRepo: PrismaCompanyConfigRepository,
    private readonly tenantRepo: PrismaTenantRepository,
    private readonly flowHandler: BaileysFlowHandler,
    private readonly deliveryService: DeliveryService,
    private readonly aiService: AiService,
  ) {}

  async onModuleInit() {
    this.logger.log('📂 Inicializando servicio Multi-Tenant de WhatsApp (Baileys)...');
    setTimeout(async () => {
      try {
        const tenants = await this.tenantRepo.findAll();
        this.logger.log(`📱 Encontrados ${tenants.length} tenants registrados.`);
        for (const tenant of tenants) {
          if (tenant.status === 'ACTIVE') {
            this.initializeSocket(tenant.id).catch((err) => {
              this.logger.error(`Error iniciando socket para tenant ${tenant.name} (${tenant.id}): ${err.message}`);
            });
          }
        }
      } catch (err: any) {
        this.logger.error('Error cargando tenants en Baileys onModuleInit:', err.message);
      }
    }, 2000);
  }

  async onModuleDestroy() {
    for (const buffer of this.messageBuffers.values()) {
      clearTimeout(buffer.timer);
    }
    this.messageBuffers.clear();

    for (const [tenantId] of this.sockets) {
      await this.disconnect(tenantId);
    }
  }

  private getAuthFolder(tenantId: string): string {
    return path.resolve(process.cwd(), 'auth_info_baileys', tenantId);
  }

  async initializeSocket(tenantId: string): Promise<void> {
    const isConnecting = this.isConnectingMap.get(tenantId) || false;
    const currentStatus = this.connectionStatuses.get(tenantId) || SessionStatus.DISCONNECTED;

    if (isConnecting || currentStatus === SessionStatus.CONNECTED) {
      return;
    }

    this.isConnectingMap.set(tenantId, true);
    this.connectionStatuses.set(tenantId, SessionStatus.CONNECTING);
    this.wsGateway.emitConnectionStatus(SessionStatus.CONNECTING, null, tenantId);
    await this.sessionRepo.updateStatus(tenantId, SessionStatus.CONNECTING);

    const authFolder = this.getAuthFolder(tenantId);

    try {
      await fsPromises.mkdir(authFolder, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(authFolder);
      const pinoLogger = pino({ level: 'silent' });

      const socket = makeWASocket({
        auth: state,
        logger: pinoLogger as any,
        printQRInTerminal: false,
        browser: ['WSP Flow SaaS', 'Chrome', '124.0.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
      });

      this.sockets.set(tenantId, socket);
      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(qr);
            this.qrCodeDataUrls.set(tenantId, qrCodeDataUrl);
            this.connectionStatuses.set(tenantId, SessionStatus.SCAN_QR);
            this.wsGateway.emitQrCode(qrCodeDataUrl, tenantId);
            this.wsGateway.emitConnectionStatus(SessionStatus.SCAN_QR, null, tenantId);
            await this.sessionRepo.updateStatus(tenantId, SessionStatus.SCAN_QR, qrCodeDataUrl);
            this.logger.log(`📲 [Tenant: ${tenantId}] Nuevo código QR emitido vía WebSocket.`);
          } catch (qrErr) {
            this.logger.error(`[Tenant: ${tenantId}] Error generando DataURL del QR:`, qrErr);
          }
        }

        if (connection === 'close') {
          this.isConnectingMap.set(tenantId, false);
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          this.logger.warn(
            `🔌 [Tenant: ${tenantId}] Conexión Baileys cerrada. Código: ${statusCode}, Reintentar: ${shouldReconnect}`,
          );
          this.connectionStatuses.set(tenantId, SessionStatus.DISCONNECTED);
          this.qrCodeDataUrls.set(tenantId, null);
          this.botPhoneNumbers.set(tenantId, null);
          this.wsGateway.emitConnectionStatus(SessionStatus.DISCONNECTED, null, tenantId);
          await this.sessionRepo.updateStatus(tenantId, SessionStatus.DISCONNECTED, null, null);

          if (shouldReconnect) {
            this.logger.log(`🔄 [Tenant: ${tenantId}] Reintentando reconexión en 5 segundos...`);
            setTimeout(() => this.initializeSocket(tenantId), 5000);
          } else {
            this.logger.warn(`🚫 [Tenant: ${tenantId}] Sesión cerrada permanentemente (Logged out).`);
            this.clearAuthData(tenantId);
          }
        } else if (connection === 'open') {
          this.isConnectingMap.set(tenantId, false);
          this.connectionStatuses.set(tenantId, SessionStatus.CONNECTED);
          this.qrCodeDataUrls.set(tenantId, null);

          const rawUser = socket?.user?.id || '';
          const botPhoneNumber = rawUser.split(':')[0] || rawUser.split('@')[0];
          this.botPhoneNumbers.set(tenantId, botPhoneNumber);

          this.logger.log(`✅ [Tenant: ${tenantId}] ¡WhatsApp Conectado! Número: ${botPhoneNumber}`);
          this.wsGateway.emitConnectionStatus(SessionStatus.CONNECTED, botPhoneNumber, tenantId);
          await this.sessionRepo.updateStatus(tenantId, SessionStatus.CONNECTED, null, botPhoneNumber);
        }
      });

      // Manejo de mensajes entrantes
      socket.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (msg.key.fromMe || !msg.message) continue;

          const rawRemoteJid = msg.key.remoteJid || '';
          if (rawRemoteJid.endsWith('@g.us') || rawRemoteJid === 'status@broadcast') continue;

          const senderPn = (msg.key as any)?.senderPn || (msg.key as any)?.participantPn || '';
          let remoteJid = rawRemoteJid;
          let customerPhone = rawRemoteJid.replace('@s.whatsapp.net', '').replace('@lid', '');

          if (senderPn) {
            const cleanPn = senderPn.replace('@s.whatsapp.net', '').replace(/\D/g, '');
            if (cleanPn.length >= 8) {
              customerPhone = cleanPn;
              remoteJid = `${cleanPn}@s.whatsapp.net`;
            }
          }

          const customerName = msg.pushName || 'Cliente WhatsApp';

          const location = msg.message.locationMessage || msg.message.liveLocationMessage;
          const audio = msg.message.audioMessage;
          let textContent =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

          // Transcripción de Audio con Whisper AI
          if (audio) {
            try {
              const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                {
                  logger: pino({ level: 'silent' }),
                  reuploadRequest: socket.updateMediaMessage,
                },
              );

              if (buffer && buffer.length > 0) {
                const transcribed = await this.aiService.transcribeAudio(
                  buffer,
                  audio.mimetype || undefined,
                );
                if (transcribed) {
                  textContent = `🎙️ [Nota de voz]: "${transcribed}"`;
                } else {
                  textContent = '🎙️ [Nota de voz recibida]';
                }
              }
            } catch (audioErr: any) {
              this.logger.error(`[Tenant: ${tenantId}] Error audio: ${audioErr.message}`);
              textContent = '🎙️ [Nota de voz recibida]';
            }
          }

          if (location && location.degreesLatitude && location.degreesLongitude) {
            try {
              const locResult = await this.deliveryService.resolveLocationFromCoords(
                location.degreesLatitude,
                location.degreesLongitude,
                (location as any).address || undefined,
                (location as any).name || undefined,
              );
              textContent = `📍 [Ubicación GPS: ${locResult.formattedAddress} | Distrito: ${locResult.district} | Tarifa Delivery: S/ ${locResult.deliveryFee.toFixed(2)}]`;
            } catch (e) {
              const fallbackAddr =
                (location as any).name || (location as any).address
                  ? `${(location as any).name || ''} ${(location as any).address || ''}`.trim()
                  : `Lat ${location.degreesLatitude}, Lng ${location.degreesLongitude}`;
              textContent = `📍 [Ubicación GPS: ${fallbackAddr}]`;
            }
          }

          if (!textContent) continue;

          // 1. Guardar o recuperar chat session del tenant
          const chatSession = await this.chatRepo.findOrCreateSession(
            tenantId,
            customerPhone,
            customerName,
          );

          // 2. Guardar mensaje
          const savedMsg = await this.chatRepo.saveMessage({
            chatSessionId: chatSession.id,
            sender: MessageSender.CUSTOMER,
            senderName: customerName,
            content: textContent,
            whatsappMsgId: msg.key.id || undefined,
          });

          this.wsGateway.emitNewChatMessage({
            ...savedMsg,
            tenantId,
            customerPhone,
            customerName,
          });

          // 3. Debounce para respuesta del Bot
          if (chatSession.isBotActive && this.sockets.has(tenantId)) {
            this.scheduleDebouncedResponse(
              tenantId,
              customerPhone,
              customerName,
              textContent,
              chatSession.id,
              remoteJid,
              msg.key,
              msg,
            );
          }
        }
      });
    } catch (error) {
      this.isConnectingMap.set(tenantId, false);
      this.connectionStatuses.set(tenantId, SessionStatus.DISCONNECTED);
      this.logger.error(`[Tenant: ${tenantId}] Error inicializando Baileys:`, error);
      this.wsGateway.emitConnectionStatus(SessionStatus.DISCONNECTED, null, tenantId);
      await this.sessionRepo.updateStatus(tenantId, SessionStatus.DISCONNECTED);
    }
  }

  private scheduleDebouncedResponse(
    tenantId: string,
    customerPhone: string,
    customerName: string,
    messageText: string,
    chatSessionId: string,
    remoteJid: string,
    messageKey: any,
    rawMessage?: any,
  ) {
    const bufferKey = `${tenantId}:${customerPhone}`;
    const existing = this.messageBuffers.get(bufferKey);

    if (existing) {
      clearTimeout(existing.timer);
      existing.messages.push(messageText);
      existing.lastMessageKey = messageKey;
      if (rawMessage) existing.rawMessage = rawMessage;

      existing.timer = setTimeout(() => {
        this.processBufferedMessages(bufferKey);
      }, 10000);
    } else {
      const timer = setTimeout(() => {
        this.processBufferedMessages(bufferKey);
      }, 10000);

      this.messageBuffers.set(bufferKey, {
        timer,
        messages: [messageText],
        tenantId,
        customerPhone,
        customerName,
        chatSessionId,
        remoteJid,
        lastMessageKey: messageKey,
        rawMessage,
      });
    }
  }

  private async processBufferedMessages(bufferKey: string) {
    const buffer = this.messageBuffers.get(bufferKey);
    if (!buffer) return;

    const socket = this.sockets.get(buffer.tenantId);
    if (!socket) return;

    this.messageBuffers.delete(bufferKey);
    const fullText = buffer.messages.join(' \n ');

    try {
      if (buffer.lastMessageKey) {
        try {
          await socket.readMessages([buffer.lastMessageKey]);
        } catch (e) {}
      }

      const config = await this.configRepo.getConfig(buffer.tenantId);
      const minDelay = config.antiBanDelayMinMs || 1500;
      const maxDelay = config.antiBanDelayMaxMs || 3500;
      const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      try {
        await socket.presenceSubscribe(buffer.remoteJid);
        await socket.sendPresenceUpdate('composing', buffer.remoteJid);
      } catch (e) {}

      const result = await this.flowHandler.handleIncomingMessage(
        buffer.tenantId,
        buffer.customerPhone,
        buffer.customerName,
        fullText,
        buffer.chatSessionId,
      );

      await new Promise((r) => setTimeout(r, randomDelay));
      try {
        await socket.sendPresenceUpdate('paused', buffer.remoteJid);
      } catch (e) {}

      if (result?.documentPath && fs.existsSync(result.documentPath)) {
        try {
          const pdfBuffer = await fsPromises.readFile(result.documentPath);
          const sent = await socket.sendMessage(buffer.remoteJid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: result.documentFileName || 'Catalogo_Productos.pdf',
            caption: result.replyText || '📄 *Catálogo Oficial de Productos*',
          });
        } catch (pdfErr: any) {
          this.logger.error(`Error enviando PDF: ${pdfErr.message}`);
        }

        await this.chatRepo.saveMessage({
          chatSessionId: buffer.chatSessionId,
          sender: MessageSender.BOT,
          senderName: 'Bot WSP',
          content: `[Archivo PDF enviado: ${result.documentFileName || 'Catalogo_Productos.pdf'}] - ${result.replyText || ''}`,
        });
      } else if (result?.mediaUrl) {
        await this.dispatchMediaMessage(
          buffer.tenantId,
          buffer.remoteJid,
          result.mediaUrl,
          result.mediaType || 'image',
          result.caption || result.replyText,
          buffer.chatSessionId,
        );
      } else if (result?.replyText) {
        await this.sendMessageDirect(
          buffer.tenantId,
          buffer.remoteJid,
          result.replyText,
          MessageSender.BOT,
          buffer.chatSessionId,
        );
      }
    } catch (err: any) {
      this.logger.error(`Error procesando bloque para [${buffer.customerPhone}]:`, err.message);
    }
  }

  async dispatchMediaMessage(
    tenantId: string,
    remoteJid: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'document',
    caption: string = '',
    chatSessionId: string,
  ) {
    const socket = this.sockets.get(tenantId);
    if (!socket) {
      this.logger.warn(`⚠️ Socket no disponible para tenant ${tenantId}`);
      return;
    }

    try {
      let buffer: Buffer;
      if (mediaUrl.includes('/uploads/')) {
        const relativePath = mediaUrl.split('/uploads/')[1];
        const localPath = path.resolve(process.cwd(), 'uploads', relativePath);
        if (fs.existsSync(localPath)) {
          buffer = await fsPromises.readFile(localPath);
        } else {
          const resp = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
          buffer = Buffer.from(resp.data);
        }
      } else {
        const resp = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        buffer = Buffer.from(resp.data);
      }

      let sent: any;
      if (mediaType === 'video') {
        sent = await socket.sendMessage(remoteJid, {
          video: buffer,
          caption,
          mimetype: 'video/mp4',
        });
      } else {
        sent = await socket.sendMessage(remoteJid, {
          image: buffer,
          caption,
        });
      }

      const savedMsg = await this.chatRepo.saveMessage({
        chatSessionId,
        sender: MessageSender.BOT,
        senderName: 'Bot WSP',
        content: `[${mediaType === 'video' ? 'Video' : 'Imagen'} enviada] ${caption}`,
        mediaUrl,
        mediaType,
      });

      const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '');
      this.wsGateway.emitNewChatMessage({
        ...savedMsg,
        tenantId,
        customerPhone: phone,
      });
    } catch (err: any) {
      this.logger.error(`Error enviando multimedia (${mediaUrl}): ${err.message}`);
      await this.sendMessageDirect(tenantId, remoteJid, caption, MessageSender.BOT, chatSessionId);
    }
  }

  private formatWhatsAppText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/`\s*(https?:\/\/[^\s`]+)\s*`/g, '$1')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1: $2')
      .replace(/\$(\s*\d+(\.\d+)?)/g, 'S/ $1');
  }

  async sendManualMessage(
    tenantId: string,
    customerPhone: string,
    text: string,
    senderName = 'Agente',
  ): Promise<any> {
    let remoteJid: string;
    let formattedPhone: string;

    if (customerPhone.includes('@')) {
      remoteJid = customerPhone;
      formattedPhone = customerPhone.split('@')[0];
    } else if (customerPhone.length >= 13 && !customerPhone.startsWith('51')) {
      remoteJid = `${customerPhone}@lid`;
      formattedPhone = customerPhone;
    } else {
      formattedPhone = customerPhone.replace(/\D/g, '');
      if (formattedPhone.length === 9 && formattedPhone.startsWith('9')) {
        formattedPhone = `51${formattedPhone}`;
      }
      remoteJid = `${formattedPhone}@s.whatsapp.net`;
    }
    const cleanText = this.formatWhatsAppText(text);

    const chatSession = await this.chatRepo.findOrCreateSession(tenantId, formattedPhone);
    const socket = this.sockets.get(tenantId);
    const status = this.connectionStatuses.get(tenantId);

    if (socket && status === SessionStatus.CONNECTED) {
      try {
        await socket.sendMessage(remoteJid, { text: cleanText });
      } catch (err: any) {
        this.logger.error(`Error enviando mensaje manual a ${formattedPhone}: ${err.message}`);
      }
    }

    const savedMsg = await this.chatRepo.saveMessage({
      chatSessionId: chatSession.id,
      sender: MessageSender.AGENT,
      senderName,
      content: cleanText,
    });

    this.wsGateway.emitNewChatMessage({
      ...savedMsg,
      tenantId,
      customerPhone: formattedPhone,
      customerName: chatSession.customerName,
    });

    return savedMsg;
  }

  private async sendMessageDirect(
    tenantId: string,
    remoteJid: string,
    text: string,
    sender: MessageSender,
    chatSessionId: string,
  ) {
    const socket = this.sockets.get(tenantId);
    if (!socket) return;

    const cleanText = this.formatWhatsAppText(text);

    try {
      await socket.sendMessage(remoteJid, { text: cleanText });
    } catch (err: any) {
      this.logger.error(`Error en socket.sendMessage a [${remoteJid}]: ${err.message}`);
    }

    const savedMsg = await this.chatRepo.saveMessage({
      chatSessionId,
      sender,
      senderName: sender === MessageSender.BOT ? 'Bot WSP' : 'Agente',
      content: cleanText,
    });

    const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '');
    this.wsGateway.emitNewChatMessage({
      ...savedMsg,
      tenantId,
      customerPhone: phone,
    });
  }

  async disconnect(tenantId: string): Promise<void> {
    const socket = this.sockets.get(tenantId);
    if (socket) {
      try {
        await socket.end(undefined);
      } catch (e) {}
      this.sockets.delete(tenantId);
    }
    this.connectionStatuses.set(tenantId, SessionStatus.DISCONNECTED);
    this.qrCodeDataUrls.set(tenantId, null);
    this.botPhoneNumbers.set(tenantId, null);
    this.wsGateway.emitConnectionStatus(SessionStatus.DISCONNECTED, null, tenantId);
    await this.sessionRepo.updateStatus(tenantId, SessionStatus.DISCONNECTED, null, null);
  }

  async logout(tenantId: string): Promise<void> {
    await this.disconnect(tenantId);
    this.clearAuthData(tenantId);
  }

  getStatus(tenantId: string) {
    return {
      status: this.connectionStatuses.get(tenantId) || SessionStatus.DISCONNECTED,
      qrCode: this.qrCodeDataUrls.get(tenantId) || null,
      phoneNumber: this.botPhoneNumbers.get(tenantId) || null,
    };
  }

  async restartTenantSocket(tenantId: string): Promise<void> {
    this.logger.log(`🔄 [SuperAdmin] Forzando reinicio de socket para tenant: ${tenantId}`);
    await this.disconnect(tenantId);
    this.clearAuthData(tenantId);
    setTimeout(() => {
      this.initializeSocket(tenantId);
    }, 1500);
  }

  getAllSocketsStatus() {
    const list: Array<{ tenantId: string; status: SessionStatus; phoneNumber: string | null }> = [];
    for (const [tenantId, status] of this.connectionStatuses.entries()) {
      list.push({
        tenantId,
        status,
        phoneNumber: this.botPhoneNumbers.get(tenantId) || null,
      });
    }
    return list;
  }

  private clearAuthData(tenantId: string) {
    const authFolder = this.getAuthFolder(tenantId);
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
      this.logger.log(`🧹 Directorio de auth para tenant ${tenantId} limpiado.`);
    }
  }
}
