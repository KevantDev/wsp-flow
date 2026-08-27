import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import pino from 'pino';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { PrismaWhatsAppSessionRepository } from '../persistence/prisma/repositories/prisma-whatsapp-session.repository';
import { PrismaChatRepository } from '../persistence/prisma/repositories/prisma-chat.repository';
import { PrismaCompanyConfigRepository } from '../persistence/prisma/repositories/prisma-company-config.repository';
import { BaileysFlowHandler } from './baileys-flow.handler';
import { SessionStatus } from '../../domain/entities/whatsapp-session.entity';
import { MessageSender } from '../../domain/entities/chat-session.entity';

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaileysService.name);
  private socket: WASocket | null = null;
  private qrCodeDataUrl: string | null = null;
  private connectionStatus: SessionStatus = SessionStatus.DISCONNECTED;
  private botPhoneNumber: string | null = null;
  private isConnecting = false;
  private readonly authFolder = path.resolve(process.cwd(), 'auth_info_baileys');

  constructor(
    private readonly wsGateway: WhatsAppGateway,
    private readonly sessionRepo: PrismaWhatsAppSessionRepository,
    private readonly chatRepo: PrismaChatRepository,
    private readonly configRepo: PrismaCompanyConfigRepository,
    private readonly flowHandler: BaileysFlowHandler,
  ) {}

  async onModuleInit() {
    if (fs.existsSync(this.authFolder) && fs.readdirSync(this.authFolder).length > 0) {
      this.logger.log('📂 Sesión previa de Baileys detectada. Iniciando autoconexión...');
      setTimeout(() => this.initializeSocket(), 2000);
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async initializeSocket(): Promise<void> {
    if (this.isConnecting || this.connectionStatus === SessionStatus.CONNECTED) {
      return;
    }

    this.isConnecting = true;
    this.connectionStatus = SessionStatus.CONNECTING;
    this.wsGateway.emitConnectionStatus(SessionStatus.CONNECTING);
    await this.sessionRepo.updateStatus(SessionStatus.CONNECTING);

    try {
      if (!fs.existsSync(this.authFolder)) {
        fs.mkdirSync(this.authFolder, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      const pinoLogger = pino({ level: 'silent' });

      this.socket = makeWASocket({
        auth: state,
        logger: pinoLogger as any,
        printQRInTerminal: false,
        browser: ['WSP Flow', 'Chrome', '1.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr);
            this.connectionStatus = SessionStatus.SCAN_QR;
            this.wsGateway.emitQrCode(this.qrCodeDataUrl);
            this.wsGateway.emitConnectionStatus(SessionStatus.SCAN_QR);
            await this.sessionRepo.updateStatus(SessionStatus.SCAN_QR, this.qrCodeDataUrl);
            this.logger.log('📲 Nuevo código QR emitido vía WebSocket al panel de Angular.');
          } catch (qrErr) {
            this.logger.error('Error generando DataURL del QR:', qrErr);
          }
        }

        if (connection === 'close') {
          this.isConnecting = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          this.logger.warn(
            `🔌 Conexión Baileys cerrada. Código: ${statusCode}, Reintentar: ${shouldReconnect}`,
          );
          this.connectionStatus = SessionStatus.DISCONNECTED;
          this.qrCodeDataUrl = null;
          this.botPhoneNumber = null;
          this.wsGateway.emitConnectionStatus(SessionStatus.DISCONNECTED);
          await this.sessionRepo.updateStatus(SessionStatus.DISCONNECTED, null, null);

          if (shouldReconnect) {
            this.logger.log('🔄 Reintentando reconexión en 5 segundos...');
            setTimeout(() => this.initializeSocket(), 5000);
          } else {
            this.logger.warn('🚫 Sesión cerrada permanentemente (Logged out). Eliminando credenciales...');
            this.clearAuthData();
          }
        } else if (connection === 'open') {
          this.isConnecting = false;
          this.connectionStatus = SessionStatus.CONNECTED;
          this.qrCodeDataUrl = null;

          const rawUser = this.socket?.user?.id || '';
          this.botPhoneNumber = rawUser.split(':')[0] || rawUser.split('@')[0];

          this.logger.log(`✅ ¡WhatsApp Conectado exitosamente! Número: ${this.botPhoneNumber}`);
          this.wsGateway.emitConnectionStatus(SessionStatus.CONNECTED, this.botPhoneNumber);
          await this.sessionRepo.updateStatus(SessionStatus.CONNECTED, null, this.botPhoneNumber);
        }
      });

      // Manejo de mensajes entrantes con Anti-Ban
      this.socket.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (msg.key.fromMe || !msg.message) continue;

          // Ignorar mensajes de grupos y broadcasts
          const remoteJid = msg.key.remoteJid || '';
          if (remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') continue;

          const customerPhone = remoteJid.replace('@s.whatsapp.net', '');
          const customerName = msg.pushName || 'Cliente WhatsApp';

          const textContent =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

          if (!textContent) continue;

          // 1. Registrar o recuperar sesión de chat
          const chatSession = await this.chatRepo.findOrCreateSession(customerPhone, customerName);

          // 2. Guardar mensaje entrante del cliente
          const savedMsg = await this.chatRepo.saveMessage({
            chatSessionId: chatSession.id,
            sender: MessageSender.CUSTOMER,
            senderName: customerName,
            content: textContent,
            whatsappMsgId: msg.key.id || undefined,
          });

          // Notificar mensaje al frontend en tiempo real
          this.wsGateway.emitNewChatMessage({
            ...savedMsg,
            customerPhone,
            customerName,
          });

          // 3. Procesar respuesta automática si el bot está activo
          if (chatSession.isBotActive && this.socket) {
            // Anti-Ban: 1. Marcar mensaje como leído con delay sutil
            try {
              await this.socket.readMessages([msg.key]);
            } catch (e) {
              // ignore
            }

            // Anti-Ban: 2. Calcular retardo humano aleatorio configurable
            const config = await this.configRepo.getConfig();
            const minDelay = config.antiBanDelayMinMs || 1500;
            const maxDelay = config.antiBanDelayMaxMs || 3500;
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

            // Anti-Ban: 3. Simular presencia "escribiendo..." (composing)
            await this.socket.presenceSubscribe(remoteJid);
            await this.socket.sendPresenceUpdate('composing', remoteJid);

            const result = await this.flowHandler.handleIncomingMessage(
              customerPhone,
              customerName,
              textContent,
              chatSession.id,
            );

            // Esperar el delay humano aleatorio
            await new Promise((r) => setTimeout(r, randomDelay));
            await this.socket.sendPresenceUpdate('paused', remoteJid);

            // Despacho de documento PDF
            if (result?.documentPath && fs.existsSync(result.documentPath)) {
              await this.socket.sendMessage(remoteJid, {
                document: fs.readFileSync(result.documentPath),
                mimetype: 'application/pdf',
                fileName: result.documentFileName || 'Catalogo_WSP_Flow.pdf',
                caption: result.replyText || '📄 *Catálogo Oficial de Productos*',
              });

              await this.chatRepo.saveMessage({
                chatSessionId: chatSession.id,
                sender: MessageSender.BOT,
                senderName: 'Bot WSP',
                content: `[Archivo PDF enviado: ${result.documentFileName || 'Catalogo_WSP_Flow.pdf'}] - ${result.replyText || ''}`,
              });
            }
            // Despacho de imagen o video de producto
            else if (result?.mediaUrl) {
              await this.dispatchMediaMessage(
                remoteJid,
                result.mediaUrl,
                result.mediaType || 'image',
                result.caption || result.replyText,
                chatSession.id,
              );
            }
            // Despacho de texto estándar
            else if (result?.replyText) {
              await this.sendMessageDirect(remoteJid, result.replyText, MessageSender.BOT, chatSession.id);
            }
          }
        }
      });
    } catch (error) {
      this.isConnecting = false;
      this.connectionStatus = SessionStatus.DISCONNECTED;
      this.logger.error('Error inicializando Baileys:', error);
      this.wsGateway.emitConnectionStatus(SessionStatus.DISCONNECTED);
      await this.sessionRepo.updateStatus(SessionStatus.DISCONNECTED);
    }
  }

  /**
   * Despacha un archivo multimedia (imagen o video) al chat de WhatsApp
   */
  async dispatchMediaMessage(
    remoteJid: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'document',
    caption: string = '',
    chatSessionId: string,
  ) {
    if (!this.socket) return;

    try {
      let buffer: Buffer;

      // Si es un archivo local de uploads
      if (mediaUrl.includes('/uploads/')) {
        const relativePath = mediaUrl.split('/uploads/')[1];
        const localPath = path.resolve(process.cwd(), 'uploads', relativePath);
        if (fs.existsSync(localPath)) {
          buffer = fs.readFileSync(localPath);
        } else {
          // Intentar descargar vía HTTP
          const resp = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
          buffer = Buffer.from(resp.data);
        }
      } else {
        const resp = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        buffer = Buffer.from(resp.data);
      }

      if (mediaType === 'video') {
        await this.socket.sendMessage(remoteJid, {
          video: buffer,
          caption,
          mimetype: 'video/mp4',
        });
      } else {
        await this.socket.sendMessage(remoteJid, {
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

      const phone = remoteJid.replace('@s.whatsapp.net', '');
      this.wsGateway.emitNewChatMessage({
        ...savedMsg,
        customerPhone: phone,
      });
    } catch (err: any) {
      this.logger.error(`Error enviando multimedia a WhatsApp (${mediaUrl}):`, err.message);
      // Fallback: enviar como texto
      await this.sendMessageDirect(remoteJid, caption, MessageSender.BOT, chatSessionId);
    }
  }

  async sendManualMessage(customerPhone: string, text: string, senderName = 'Agente'): Promise<any> {
    const formattedPhone = customerPhone.replace(/\D/g, '');
    const remoteJid = `${formattedPhone}@s.whatsapp.net`;

    const chatSession = await this.chatRepo.findOrCreateSession(formattedPhone);

    if (this.socket && this.connectionStatus === SessionStatus.CONNECTED) {
      await this.socket.sendMessage(remoteJid, { text });
    }

    const savedMsg = await this.chatRepo.saveMessage({
      chatSessionId: chatSession.id,
      sender: MessageSender.AGENT,
      senderName,
      content: text,
    });

    this.wsGateway.emitNewChatMessage({
      ...savedMsg,
      customerPhone: formattedPhone,
      customerName: chatSession.customerName,
    });

    return savedMsg;
  }

  private async sendMessageDirect(remoteJid: string, text: string, sender: MessageSender, chatSessionId: string) {
    if (!this.socket) return;
    await this.socket.sendMessage(remoteJid, { text });

    const savedMsg = await this.chatRepo.saveMessage({
      chatSessionId,
      sender,
      senderName: sender === MessageSender.BOT ? 'Bot WSP' : 'Agente',
      content: text,
    });

    const phone = remoteJid.replace('@s.whatsapp.net', '');
    this.wsGateway.emitNewChatMessage({
      ...savedMsg,
      customerPhone: phone,
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        await this.socket.end(undefined);
      } catch (e) {
        // ignore
      }
      this.socket = null;
    }
    this.connectionStatus = SessionStatus.DISCONNECTED;
    this.qrCodeDataUrl = null;
    this.botPhoneNumber = null;
    this.wsGateway.emitConnectionStatus(SessionStatus.DISCONNECTED);
    await this.sessionRepo.updateStatus(SessionStatus.DISCONNECTED, null, null);
  }

  async logout(): Promise<void> {
    await this.disconnect();
    this.clearAuthData();
  }

  getStatus() {
    return {
      status: this.connectionStatus,
      qrCode: this.qrCodeDataUrl,
      phoneNumber: this.botPhoneNumber,
    };
  }

  private clearAuthData() {
    if (fs.existsSync(this.authFolder)) {
      fs.rmSync(this.authFolder, { recursive: true, force: true });
      this.logger.log('🧹 Directorio auth_info_baileys limpiado.');
    }
  }
}
