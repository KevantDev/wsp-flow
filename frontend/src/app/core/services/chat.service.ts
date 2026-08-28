import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSession, ChatMessage } from '../models/models';

export interface PaginatedMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  getSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.apiUrl}/sessions`);
  }

  getSessionMessages(
    sessionId: string,
    limit = 30,
    offset = 0,
  ): Observable<PaginatedMessagesResponse> {
    return this.http.get<PaginatedMessagesResponse>(
      `${this.apiUrl}/sessions/${sessionId}/messages`,
      {
        params: { limit: limit.toString(), offset: offset.toString() },
      },
    );
  }

  toggleBot(customerPhone: string, isBotActive: boolean): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.apiUrl}/toggle-bot`, { customerPhone, isBotActive });
  }

  createSession(customerPhone: string, customerName?: string): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.apiUrl}/sessions`, { customerPhone, customerName });
  }

  sendMessage(customerPhone: string, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/send`, { customerPhone, content });
  }
}
