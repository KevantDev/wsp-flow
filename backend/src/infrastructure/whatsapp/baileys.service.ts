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
import { DeliveryService } from '../../application/services/delivery.service';
import { SessionStatus } from '../../domain/entities/whatsapp-session.entity';
import { MessageSender } from '../../domain/entities/chat-session.entity';

interface DebounceBuffer {
  timer: NodeJS.Timeout;
  messages: string[];
  customerPhone: string;
  customerName: string;
  chatSessionId: string;
  remoteJid: string;
  lastMessageKey: any;
}

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaileysService.name);
  private socket: WASocket | null = null;
  private qrCodeDataUrl: string | null = null;
  private connectionStatus: SessionStatus = SessionStatus.DISCONNECTED;
  private botPhoneNumber: string | null = null;
  private isConnecting = false;
  private readonly authFolder = path.resolve(process.cwd(), 'auth_info_baileys');

  // Buffer de mensajes entrantes con debounce de 10 segundos
  private messageBuffers = new Map<string, DebounceBuffer>();

  constructor(
    private readonly wsGateway: WhatsAppGateway,
    private readonly sessionRepo: PrismaWhatsAppSessionRepository,
    private readonly chatRepo: PrismaChatRepository,
    private readonly configRepo: PrismaCompanyConfigRepository,
    private readonly flowHandler: BaileysFlowHandler,
    private readonly deliveryService: DeliveryService,
  ) {}

  async onModuleInit() {
    if (fs.existsSync(this.authFolder) && fs.readdirSync(this.authFolder).length > 0) {
      this.logger.log('📂 Sesión previa de Baileys detectada. Iniciando autoconexión...');
      setTimeout(() => this.initializeSocket(), 2000);
    }
  }

  async onModuleDestroy() {
    // Limpiar temporizadores pendientes
    for (const buffer of this.messageBuffers.values()) {
      clearTimeout(buffer.timer);
    }
    this.messageBuffers.clear();
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

      // Manejo de mensajes entrantes con Buffer de Debounce (10 Segundos) y Anti-Ban
      this.socket.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (msg.key.fromMe || !msg.message) continue;

          // Ignorar mensajes de grupos y broadcasts
          const remoteJid = msg.key.remoteJid || '';
          if (remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') continue;

          const customerPhone = remoteJid.replace('@s.whatsapp.net', '');
          const customerName = msg.pushName || 'Cliente WhatsApp';

          // Extraer texto o ubicación GPS (Pin de WhatsApp)
          const location = msg.message.locationMessage || msg.message.liveLocationMessage;
          let textContent =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

          if (location && location.degreesLatitude && location.degreesLongitude) {
            try {
              const locResult = await this.deliveryService.resolveLocationFromCoords(
                location.degreesLatitude,
                location.degreesLongitude,
              );
              textContent = `📍 [Ubicación GPS: ${locResult.formattedAddress} | Distrito: ${locResult.district} | Tarifa Delivery: S/ ${locResult.deliveryFee.toFixed(2)}]`;
            } catch (e) {
              textContent = `📍 [Ubicación GPS: Lat ${location.degreesLatitude}, Lng ${location.degreesLongitude}]`;
            }
          }

          if (!textContent) continue;

          // 1. Registrar o recuperar sesión de chat
          const chatSession = await this.chatRepo.findOrCreateSession(customerPhone, customerName);

          // 2. Guardar mensaje entrante del cliente inmediatamente en base de datos
          const savedMsg = await this.chatRepo.saveMessage({
            chatSessionId: chatSession.id,
            sender: MessageSender.CUSTOMER,
            senderName: customerName,
            content: textContent,
            whatsappMsgId: msg.key.id || undefined,
          });

          // Notificar mensaje al Live Chat del panel de administración en tiempo real (0ms)
          this.wsGateway.emitNewChatMessage({
            ...savedMsg,
            customerPhone,
            customerName,
          });

          // 3. Procesar respuesta automática mediante Buffer de Debounce si el bot está activo
          if (chatSession.isBotActive && this.socket) {
            this.scheduleDebouncedResponse(customerPhone, customerName, textContent, chatSession.id, remoteJid, msg.key);
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
   * Programa la respuesta con debounce de 10 segundos. Si el usuario envía otro mensaje antes de los 10s,
   * el temporizador se reinicia para esperar a que termine de escribir.
   */
  private scheduleDebouncedResponse(
    customerPhone: string,
    customerName: string,
    messageText: string,
    chatSessionId: string,
    remoteJid: string,
    messageKey: any,
  ) {
    const existing = this.messageBuffers.get(customerPhone);

    if (existing) {
      // Si ya hay un temporizador activo, cancelarlo y acumular el nuevo texto
      clearTimeout(existing.timer);
      existing.messages.push(messageText);
      existing.lastMessageKey = messageKey;
      this.logger.log(`⏳ [Debounce] Mensaje adicional de [${customerPhone}]. Total acumulados: ${existing.messages.length}. Reiniciando espera de 10s...`);

      existing.timer = setTimeout(() => {
        this.processBufferedMessages(customerPhone);
      }, 10000); // 10 segundos
    } else {
      // Iniciar nuevo buffer con timer de 10 segundos
      this.logger.log(`⏳ [Debounce] Primer mensaje de [${customerPhone}]. Iniciando buffer de 10s...`);
      const timer = setTimeout(() => {
        this.processBufferedMessages(customerPhone);
      }, 10000); // 10 segundos

      this.messageBuffers.set(customerPhone, {
        timer,
        messages: [messageText],
        customerPhone,
        customerName,
        chatSessionId,
        remoteJid,
        lastMessageKey: messageKey,
      });
    }
  }

  /**
   * Procesa y despacha todos los mensajes acumulados en un solo bloque coherente
   */
  private async processBufferedMessages(customerPhone: string) {
    const buffer = this.messageBuffers.get(customerPhone);
    if (!buffer || !this.socket) return;

    this.messageBuffers.delete(customerPhone);

    // Concatenar todos los fragmentos acumulados
    const fullText = buffer.messages.join(' \n ');
    this.logger.log(`🚀 [Debounce Finalizado] Procesando bloque consolidado de [${customerPhone}] (${buffer.messages.length} mensajes): "${fullText}"`);

    try {
      // Anti-Ban: 1. Marcar mensaje como leído
      if (buffer.lastMessageKey) {
        try {
          await this.socket.readMessages([buffer.lastMessageKey]);
        } catch (e) {
          // ignore
        }
      }

      // Anti-Ban: 2. Calcular retardo humano aleatorio
      const config = await this.configRepo.getConfig();
      const minDelay = config.antiBanDelayMinMs || 1500;
      const maxDelay = config.antiBanDelayMaxMs || 3500;
      const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      // Anti-Ban: 3. Simular presencia "escribiendo..." (composing)
      await this.socket.presenceSubscribe(buffer.remoteJid);
      await this.socket.sendPresenceUpdate('composing', buffer.remoteJid);

      const result = await this.flowHandler.handleIncomingMessage(
        buffer.customerPhone,
        buffer.customerName,
        fullText,
        buffer.chatSessionId,
      );

      // Esperar delay humano de tipeo
      await new Promise((r) => setTimeout(r, randomDelay));
      await this.socket.sendPresenceUpdate('paused', buffer.remoteJid);

      // Despacho de documento PDF
      if (result?.documentPath && fs.existsSync(result.documentPath)) {
        await this.socket.sendMessage(buffer.remoteJid, {
          document: fs.readFileSync(result.documentPath),
          mimetype: 'application/pdf',
          fileName: result.documentFileName || 'Catalogo_WSP_Flow.pdf',
          caption: result.replyText || '📄 *Catálogo Oficial de Productos*',
        });

        await this.chatRepo.saveMessage({
          chatSessionId: buffer.chatSessionId,
          sender: MessageSender.BOT,
          senderName: 'Bot WSP',
          content: `[Archivo PDF enviado: ${result.documentFileName || 'Catalogo_WSP_Flow.pdf'}] - ${result.replyText || ''}`,
        });
      }
      // Despacho de imagen o video de producto
      else if (result?.mediaUrl) {
        await this.dispatchMediaMessage(
          buffer.remoteJid,
          result.mediaUrl,
          result.mediaType || 'image',
          result.caption || result.replyText,
          buffer.chatSessionId,
        );
      }
      // Despacho de texto estándar
      else if (result?.replyText) {
        await this.sendMessageDirect(buffer.remoteJid, result.replyText, MessageSender.BOT, buffer.chatSessionId);
      }
    } catch (err: any) {
      this.logger.error(`Error procesando bloque de mensajes para [${customerPhone}]:`, err.message);
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

      if (mediaUrl.includes('/uploads/')) {
        const relativePath = mediaUrl.split('/uploads/')[1];
        const localPath = path.resolve(process.cwd(), 'uploads', relativePath);
        if (fs.existsSync(localPath)) {
          buffer = fs.readFileSync(localPath);
        } else {
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
      await this.sendMessageDirect(remoteJid, caption, MessageSender.BOT, chatSessionId);
    }
  }

  private formatWhatsAppText(text: string): string {
    if (!text) return '';
    return text
      // Convert standard markdown bold **bold** to WhatsApp *bold*
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      // Convert stray dollar signs $99.00 to Peruvian Soles S/ 99.00
      .replace(/\$(\s*\d+(\.\d+)?)/g, 'S/ $1');
  }

  async sendManualMessage(customerPhone: string, text: string, senderName = 'Agente'): Promise<any> {
    const formattedPhone = customerPhone.replace(/\D/g, '');
    const remoteJid = `${formattedPhone}@s.whatsapp.net`;
    const cleanText = this.formatWhatsAppText(text);

    const chatSession = await this.chatRepo.findOrCreateSession(formattedPhone);

    if (this.socket && this.connectionStatus === SessionStatus.CONNECTED) {
      try {
        await this.socket.sendMessage(remoteJid, { text: cleanText });
        this.logger.log(`📤 Mensaje manual enviado por WhatsApp a [${formattedPhone}]`);
      } catch (err: any) {
        this.logger.error(`Error enviando mensaje WhatsApp a ${formattedPhone}: ${err.message}`);
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
      customerPhone: formattedPhone,
      customerName: chatSession.customerName,
    });

    return savedMsg;
  }

  private async sendMessageDirect(remoteJid: string, text: string, sender: MessageSender, chatSessionId: string) {
    if (!this.socket) return;
    const cleanText = this.formatWhatsAppText(text);
    await this.socket.sendMessage(remoteJid, { text: cleanText });

    const savedMsg = await this.chatRepo.saveMessage({
      chatSessionId,
      sender,
      senderName: sender === MessageSender.BOT ? 'Bot WSP' : 'Agente',
      content: cleanText,
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
