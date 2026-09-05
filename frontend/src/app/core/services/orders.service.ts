import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, OrderStatus } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getOrders(status?: OrderStatus, customerPhone?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (customerPhone) params = params.set('customerPhone', customerPhone);
    return this.http.get<Order[]>(this.apiUrl, { params });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  createOrder(data: any): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, data);
  }

  createPublicCheckoutOrder(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/public-checkout`, data);
  }

  updateOrderStatus(id: string, status: OrderStatus, customMessage?: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}/status`, { status, customMessage });
  }

  markCashCollected(id: string, notes?: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}/collect-cash`, { notes });
  }

  getPendingCashOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/pending-cash`);
  }

  getMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics`);
  }
}
