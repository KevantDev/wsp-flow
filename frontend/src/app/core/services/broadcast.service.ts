import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BroadcastCampaign, CreateBroadcastCampaignDto } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/broadcasts`;

  estimateAudience(targetSegment: string): Observable<{ count: number; members: Array<{ customerPhone: string; customerName: string }> }> {
    return this.http.post<{ count: number; members: Array<{ customerPhone: string; customerName: string }> }>(
      `${this.apiUrl}/estimate`,
      { targetSegment },
    );
  }

  createCampaign(dto: CreateBroadcastCampaignDto): Observable<BroadcastCampaign> {
    return this.http.post<BroadcastCampaign>(this.apiUrl, dto);
  }

  getCampaigns(): Observable<BroadcastCampaign[]> {
    return this.http.get<BroadcastCampaign[]>(this.apiUrl);
  }

  getCampaignById(id: string): Observable<BroadcastCampaign> {
    return this.http.get<BroadcastCampaign>(`${this.apiUrl}/${id}`);
  }

  startCampaign(id: string): Observable<BroadcastCampaign> {
    return this.http.post<BroadcastCampaign>(`${this.apiUrl}/${id}/start`, {});
  }

  pauseCampaign(id: string): Observable<BroadcastCampaign> {
    return this.http.post<BroadcastCampaign>(`${this.apiUrl}/${id}/pause`, {});
  }

  cancelCampaign(id: string): Observable<BroadcastCampaign> {
    return this.http.post<BroadcastCampaign>(`${this.apiUrl}/${id}/cancel`, {});
  }

  deleteCampaign(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Cartera de Clientes CRM
  getCustomerPortfolio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/customers/portfolio`);
  }

  addManualCustomer(data: { customerPhone: string; customerName: string; sendGreeting?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customers`, data);
  }

  deleteCustomer(idOrPhone: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/customers/${idOrPhone}`);
  }
}
