import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WhatsAppStatus } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class WhatsAppService {
  private readonly apiUrl = `${environment.apiUrl}/whatsapp`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<WhatsAppStatus> {
    return this.http.get<WhatsAppStatus>(`${this.apiUrl}/status`);
  }

  connect(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/connect`, {});
  }

  disconnect(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/disconnect`, {});
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {});
  }
}
