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
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { PrismaWhatsAppSessionRepository } from '../persistence/prisma/repositories/prisma-whatsapp-session.repository';
import { PrismaChatRepository } from '../persistence/prisma/repositories/prisma-chat.repository';
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
    private readonly flowHandler: BaileysFlowHandler,
  ) {}

  async onModuleInit() {
    // Si existe sesión previa en disco, intentar autoconectar
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

          this.logger.warn(`🔌 Conexión Baileys cerrada. Código: ${statusCode}, Reintentar: ${shouldReconnect}`);
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

      // Manejo de mensajes entrantes
      this.socket.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (msg.key.fromMe || !msg.message) continue;

          // Ignorar mensajes de grupos y estados/broadcast
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

          // Notificar mensaje al frontend en vivo
          this.wsGateway.emitNewChatMessage({
            ...savedMsg,
            customerPhone,
            customerName,
          });

          // 3. Si el bot está activo para este chat, procesar respuesta automática
          if (chatSession.isBotActive) {
            // Breve retardo natural de escritura
            await this.socket.presenceSubscribe(remoteJid);
            await this.socket.sendPresenceUpdate('composing', remoteJid);

            const result = await this.flowHandler.handleIncomingMessage(customerPhone, customerName, textContent);

            await new Promise((r) => setTimeout(r, 1000));
            await this.socket.sendPresenceUpdate('paused', remoteJid);

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
            } else if (result?.replyText) {
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
