import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class WhatsAppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WhatsAppGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`⚡ Cliente WebSocket conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente WebSocket desconectado: ${client.id}`);
  }

  // Emisores hacia el Frontend (Angular) con aislamiento Multi-Tenant (Rooms)
  emitQrCode(qrDataUrl: string, tenantId?: string) {
    const payload = { qr: qrDataUrl, tenantId, timestamp: new Date() };
    if (tenantId) {
      this.server?.to(`tenant:${tenantId}`).emit('whatsapp:qr', payload);
    } else {
      this.server?.emit('whatsapp:qr', payload);
    }
  }

  emitConnectionStatus(status: string, phoneNumber?: string | null, tenantId?: string) {
    const payload = { status, phoneNumber, tenantId, timestamp: new Date() };
    if (tenantId) {
      this.server?.to(`tenant:${tenantId}`).emit('whatsapp:status', payload);
    } else {
      this.server?.emit('whatsapp:status', payload);
    }
  }

  emitNewChatMessage(message: any) {
    const tenantId = message?.tenantId;
    if (tenantId) {
      this.server?.to(`tenant:${tenantId}`).emit('chat:message', message);
    } else {
      this.server?.emit('chat:message', message);
    }
  }

  emitNewOrder(order: any) {
    const tenantId = order?.tenantId;
    if (tenantId) {
      this.server?.to(`tenant:${tenantId}`).emit('orders:new', order);
    } else {
      this.server?.emit('orders:new', order);
    }
  }

  emitOrderStatusUpdate(order: any) {
    const tenantId = order?.tenantId;
    if (tenantId) {
      this.server?.to(`tenant:${tenantId}`).emit('orders:updated', order);
    } else {
      this.server?.emit('orders:updated', order);
    }
  }

  emitStockAlert(product: any) {
    const tenantId = product?.tenantId;
    if (tenantId) {
      this.server?.to(`tenant:${tenantId}`).emit('products:low_stock', product);
    } else {
      this.server?.emit('products:low_stock', product);
    }
  }

  // Mensajes recibidos desde el Frontend
  @SubscribeMessage('join:tenant')
  handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId?: string },
  ) {
    const tenantId = data?.tenantId;
    if (tenantId) {
      client.join(`tenant:${tenantId}`);
      this.logger.log(`🏢 Cliente [${client.id}] se unió a la sala privada tenant:${tenantId}`);
      client.emit('tenant:joined', { tenantId, success: true });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { message: 'Servidor WebSocket activo' });
  }
}
