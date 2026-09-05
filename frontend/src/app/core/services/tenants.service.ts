import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Tenant,
  EnrichedTenant,
  AdminMetrics,
  TenantPlan,
  TenantStatus,
  Category,
  Product,
  CompanyConfig,
  SaaSPlan,
  TenantQuota,
} from '../models/models';

export interface PublicStoreData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    plan: string;
    culqiPublicKey?: string;
  };
  config: CompanyConfig;
  categories: Category[];
  products: Product[];
}

@Injectable({
  providedIn: 'root',
})
export class TenantsService {
  private readonly apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la vista pública de una tienda
   */
  getPublicStore(slug: string): Observable<PublicStoreData> {
    return this.http.get<PublicStoreData>(`${this.apiUrl}/public/${slug}`);
  }

  /**
   * Obtiene la información del tenant autenticado actual
   */
  getCurrentTenant(): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/me`);
  }

  /**
   * Actualiza la información del tenant autenticado actual
   */
  updateCurrentTenant(data: Partial<Tenant>): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.apiUrl}/me`, data);
  }

  /**
   * Obtiene la URL de OAuth Connect para vincular la cuenta de Mercado Pago del tenant
   */
  getMercadoPagoConnectUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>(`${environment.apiUrl}/payments/mercadopago/connect`);
  }

  /**
   * Desvincula la cuenta de Mercado Pago del tenant
   */
  disconnectMercadoPago(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/payments/mercadopago/disconnect`, {});
  }

  /**
   * ==========================================
   * MÉTODOS SUPER_ADMIN SAAS
   * ==========================================
   */

  /**
   * Métricas agregadas de la plataforma SaaS (MRR, GMV, Sockets, Planes)
   */
  getAdminMetrics(): Observable<AdminMetrics> {
    return this.http.get<AdminMetrics>(`${this.apiUrl}/admin/metrics`);
  }

  /**
   * Listado enriquecido de todos los tenants con detalles de dueño, métricas y estado Baileys
   */
  getEnrichedTenants(): Observable<EnrichedTenant[]> {
    return this.http.get<EnrichedTenant[]>(this.apiUrl);
  }

  /**
   * Actualiza el plan de un tenant (FREE_TRIAL, PRO, ENTERPRISE)
   */
  updateTenantPlan(id: string, plan: TenantPlan): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/plan`, { plan });
  }

  /**
   * Actualiza el estado de un tenant (ACTIVE, SUSPENDED, TRIAL_EXPIRED, CANCELLED)
   */
  updateTenantStatus(id: string, status: TenantStatus): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status });
  }

  /**
   * Suplanta la identidad de una tienda para soporte técnico
   */
  impersonateTenant(id: string): Observable<{
    success: boolean;
    message: string;
    impersonationToken: string;
    tenant: { id: string; name: string; slug: string };
  }> {
    return this.http.post<any>(`${this.apiUrl}/${id}/impersonate`, {});
  }

  /**
   * Reinicia forzosamente el socket de WhatsApp (Baileys) de un tenant
   */
  resetTenantWhatsApp(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reset-whatsapp`, {});
  }

  /**
   * Elimina un tenant y todos sus registros vinculados
   */
  deleteTenant(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * ==========================================
   * MÉTODOS DE PLANES SAAS & CUOTAS
   * ==========================================
   */

  /**
   * Obtiene la lista pública de planes activos
   */
  getPublicPlans(): Observable<SaaSPlan[]> {
    return this.http.get<SaaSPlan[]>(`${environment.apiUrl}/plans`);
  }

  /**
   * Obtiene todos los planes con conteo de tiendas para el Super Admin
   */
  getAdminPlans(): Observable<SaaSPlan[]> {
    return this.http.get<SaaSPlan[]>(`${environment.apiUrl}/plans/admin`);
  }

  /**
   * Actualiza la configuración de un plan en caliente
   */
  updatePlan(code: TenantPlan, data: Partial<SaaSPlan>): Observable<SaaSPlan> {
    return this.http.patch<SaaSPlan>(`${environment.apiUrl}/plans/${code}`, data);
  }

  /**
   * Obtiene la cuota y consumo del tenant autenticado actual
   */
  getMyQuota(): Observable<TenantQuota> {
    return this.http.get<TenantQuota>(`${environment.apiUrl}/plans/my-quota`);
  }
}
