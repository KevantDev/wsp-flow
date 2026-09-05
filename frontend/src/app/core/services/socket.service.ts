import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage, Order, WhatsAppStatus } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  private qrSubject = new Subject<{ qr: string }>();
  private statusSubject = new Subject<WhatsAppStatus>();
  private chatSubject = new Subject<ChatMessage>();
  private newOrderSubject = new Subject<Order>();
  private orderUpdatedSubject = new Subject<Order>();
  private lowStockSubject = new Subject<any>();

  onQrCode$ = this.qrSubject.asObservable();
  onStatusChange$ = this.statusSubject.asObservable();
  onNewChatMessage$ = this.chatSubject.asObservable();
  onNewOrder$ = this.newOrderSubject.asObservable();
  onOrderUpdated$ = this.orderUpdatedSubject.asObservable();
  onStockAlert$ = this.lowStockSubject.asObservable();

  private currentTenantId: string | null = null;

  constructor() {
    this.socket = io(environment.wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.registerListeners();
  }

  private registerListeners() {
    this.socket.on('connect', () => {
      if (this.currentTenantId) {
        this.socket.emit('join:tenant', { tenantId: this.currentTenantId });
      }
    });

    this.socket.on('whatsapp:qr', (data: { qr: string }) => {
      this.qrSubject.next(data);
    });

    this.socket.on('whatsapp:status', (data: WhatsAppStatus) => {
      this.statusSubject.next(data);
    });

    this.socket.on('chat:message', (data: ChatMessage) => {
      this.chatSubject.next(data);
    });

    this.socket.on('orders:new', (data: Order) => {
      this.newOrderSubject.next(data);
    });

    this.socket.on('orders:updated', (data: Order) => {
      this.orderUpdatedSubject.next(data);
    });

    this.socket.on('products:low_stock', (data: any) => {
      this.lowStockSubject.next(data);
    });
  }

  joinTenant(tenantId: string) {
    if (!tenantId) return;
    this.currentTenantId = tenantId;
    if (this.socket.connected) {
      this.socket.emit('join:tenant', { tenantId });
    }
  }

  listen<T = any>(eventName: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });
      return () => {
        this.socket.off(eventName);
      };
    });
  }

  ping() {
    this.socket.emit('ping');
  }
}
