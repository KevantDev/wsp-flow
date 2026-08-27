import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSession, ChatMessage } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  getSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.apiUrl}/sessions`);
  }

  getSessionMessages(sessionId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/sessions/${sessionId}/messages`);
  }

  toggleBot(customerPhone: string, isBotActive: boolean): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.apiUrl}/toggle-bot`, { customerPhone, isBotActive });
  }

  sendMessage(customerPhone: string, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/send`, { customerPhone, content });
  }
}
