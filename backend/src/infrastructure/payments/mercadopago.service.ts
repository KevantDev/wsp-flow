import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface MercadoPagoPreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  isSimulated?: boolean;
}

export interface MercadoPagoOAuthResponse {
  accessToken: string;
  publicKey: string;
  refreshToken: string;
  userId: string;
}

export interface MercadoPagoRefundResponse {
  success: boolean;
  refundId: string;
  status: string;
  amount?: number;
  message?: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly baseUrl = 'https://api.mercadopago.com';

  private readonly defaultAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
  private readonly defaultPublicKey = process.env.MERCADOPAGO_PUBLIC_KEY || '';
  private readonly clientId = process.env.MERCADOPAGO_CLIENT_ID || '8746352910472619';
  private readonly clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET || '';
  private readonly redirectUri =
    process.env.MERCADOPAGO_REDIRECT_URI ||
    'http://localhost:3000/api/v1/payments/mercadopago/callback';

  constructor() {
    this.logger.log(`💳 MercadoPagoService inicializado.`);
  }

  isConfigured(customToken?: string): boolean {
    const token = customToken || this.defaultAccessToken;
    return !!token && !token.includes('sample') && !token.includes('dev') && token.startsWith('APP_USR');
  }

  getDefaultPublicKey(): string {
    return this.defaultPublicKey || 'APP_USR-sample-public-key';
  }

  /**
   * Genera la URL de autorización oficial de Mercado Pago Connect (OAuth 2.0)
   */
  getOAuthConnectUrl(tenantId: string): string {
    const authBase = 'https://auth.mercadopago.com.pe/authorization';
    return `${authBase}?client_id=${this.clientId}&response_type=code&platform_id=mp&state=${tenantId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}`;
  }

  /**
   * Intercambia el código de autorización temporal por tokens del vendedor
   */
  async exchangeOAuthCode(code: string): Promise<MercadoPagoOAuthResponse> {
    this.logger.log(`🔑 Intercambiando código OAuth de Mercado Pago: ${code.substring(0, 10)}...`);

    // Modo simulador de desarrollo si no hay clientSecret de producción
    if (!this.clientSecret || code.startsWith('test_') || code.startsWith('sim_')) {
      this.logger.warn(`⚠️ Modo Sandbox/Dev: Generando credenciales simuladas de Mercado Pago Connect.`);
      return {
        accessToken: `APP_USR-simulated-token-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        publicKey: `APP_USR-simulated-pk-${Date.now()}`,
        refreshToken: `TG-simulated-refresh-${Date.now()}`,
        userId: `mp_user_${Math.floor(Math.random() * 1000000)}`,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        {
          client_secret: this.clientSecret,
          client_id: this.clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;
      return {
        accessToken: data.access_token,
        publicKey: data.public_key,
        refreshToken: data.refresh_token,
        userId: String(data.user_id),
      };
    } catch (error: any) {
      this.logger.error(`❌ Error al intercambiar código OAuth en Mercado Pago: ${error.response?.data?.message || error.message}`);
      throw new Error(error.response?.data?.message || 'Error al conectar con Mercado Pago OAuth');
    }
  }

  /**
   * Crea una preferencia de pago para el Checkout Pro de Mercado Pago
   */
  async createPreference(params: {
    order: {
      orderNumber: string;
      tenantId: string;
      total: number;
      customerName: string;
      customerPhone: string;
      items?: any[];
    };
    tenantAccessToken?: string;
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
    webhookUrl: string;
  }): Promise<MercadoPagoPreferenceResponse> {
    const { order, tenantAccessToken, successUrl, failureUrl, pendingUrl, webhookUrl } = params;
    const tokenToUse = tenantAccessToken || this.defaultAccessToken;

    this.logger.log(`🛒 Creando Preferencia Mercado Pago para Orden #${order.orderNumber} por S/. ${order.total}`);

    // Si no está configurado un token válido, generar preferencia simulada
    if (!this.isConfigured(tokenToUse)) {
      this.logger.warn(`⚠️ Mercado Pago en modo simulador (Dev Sandbox).`);
      const prefId = `pref_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      return {
        preferenceId: prefId,
        initPoint: `${successUrl}${successUrl.includes('?') ? '&' : '?'}status=approved&collection_status=approved&preference_id=${prefId}&payment_id=pay_sim_${Date.now()}`,
        sandboxInitPoint: `${successUrl}${successUrl.includes('?') ? '&' : '?'}status=approved&collection_status=approved&preference_id=${prefId}&payment_id=pay_sim_${Date.now()}`,
        isSimulated: true,
      };
    }

    // Mapear items de la orden
    const items = (order.items && order.items.length > 0)
      ? order.items.map((i) => ({
          title: i.productName || `Producto ${i.productId}`,
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unitPrice),
          currency_id: 'PEN',
        }))
      : [
          {
            title: `Pedido #${order.orderNumber} - WSP Flow`,
            quantity: 1,
            unit_price: Number(order.total),
            currency_id: 'PEN',
          },
        ];

    try {
      const response = await axios.post(
        `${this.baseUrl}/checkout/preferences`,
        {
          items,
          payer: {
            name: order.customerName,
            phone: {
              number: order.customerPhone,
            },
          },
          back_urls: {
            success: successUrl,
            failure: failureUrl,
            pending: pendingUrl,
          },
          auto_return: 'approved',
          notification_url: webhookUrl,
          external_reference: order.orderNumber,
          metadata: {
            order_number: order.orderNumber,
            tenant_id: order.tenantId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        preferenceId: response.data.id,
        initPoint: response.data.init_point,
        sandboxInitPoint: response.data.sandbox_init_point || response.data.init_point,
        isSimulated: false,
      };
    } catch (error: any) {
      this.logger.error(`❌ Error al crear preferencia en Mercado Pago: ${error.response?.data?.message || error.message}`);
      throw new Error(error.response?.data?.message || 'Error al conectar con la pasarela Mercado Pago');
    }
  }

  /**
   * Consulta los detalles de un pago en Mercado Pago
   */
  async getPayment(paymentId: string, customToken?: string): Promise<any> {
    const tokenToUse = customToken || this.defaultAccessToken;

    if (!this.isConfigured(tokenToUse) || paymentId.startsWith('pay_sim_')) {
      return {
        id: paymentId,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'yape',
        payment_type_id: 'digital_wallet',
        transaction_amount: 100,
        date_approved: new Date().toISOString(),
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Error al obtener pago #${paymentId} en Mercado Pago: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesa un reembolso en Mercado Pago
   */
  async processRefund(
    paymentId: string,
    customToken?: string,
    amount?: number,
  ): Promise<MercadoPagoRefundResponse> {
    const tokenToUse = customToken || this.defaultAccessToken;
    this.logger.log(`💸 Solicitando reembolso para pago #${paymentId} en Mercado Pago`);

    if (!this.isConfigured(tokenToUse) || paymentId.startsWith('pay_sim_') || paymentId.startsWith('chr_')) {
      return {
        success: true,
        refundId: `ref_sim_${Date.now()}`,
        status: 'approved',
        amount: amount || 0,
        message: 'Reembolso simulado exitosamente en entorno de desarrollo.',
      };
    }

    try {
      const payload: any = {};
      if (amount && amount > 0) {
        payload.amount = amount;
      }

      const response = await axios.post(`${this.baseUrl}/v1/payments/${paymentId}/refunds`, payload, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        refundId: String(response.data.id),
        status: response.data.status,
        amount: response.data.amount,
      };
    } catch (error: any) {
      this.logger.error(`❌ Error al emitir reembolso en Mercado Pago: ${error.response?.data?.message || error.message}`);
      throw new Error(error.response?.data?.message || 'Error al procesar reembolso en Mercado Pago');
    }
  }
}
