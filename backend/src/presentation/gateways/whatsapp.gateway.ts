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

  // Emisores hacia el Frontend (Angular)
  emitQrCode(qrDataUrl: string) {
    this.server?.emit('whatsapp:qr', { qr: qrDataUrl, timestamp: new Date() });
  }

  emitConnectionStatus(status: string, phoneNumber?: string | null) {
    this.server?.emit('whatsapp:status', { status, phoneNumber, timestamp: new Date() });
  }

  emitNewChatMessage(message: any) {
    this.server?.emit('chat:message', message);
  }

  emitNewOrder(order: any) {
    this.server?.emit('orders:new', order);
  }

  emitOrderStatusUpdate(order: any) {
    this.server?.emit('orders:updated', order);
  }

  emitStockAlert(product: any) {
    this.server?.emit('products:low_stock', product);
  }

  // Mensajes recibidos desde el Frontend
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { message: 'Servidor WebSocket activo' });
  }
}
