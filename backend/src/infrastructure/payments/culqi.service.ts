import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface CulqiChargeResponse {
  success: boolean;
  chargeId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  rawResponse?: any;
  message?: string;
}

export interface CulqiRefundResponse {
  success: boolean;
  refundId: string;
  chargeId: string;
  amount: number;
  rawResponse?: any;
  message?: string;
}

@Injectable()
export class CulqiService {
  private readonly logger = new Logger(CulqiService.name);
  private readonly secretKey = process.env.CULQI_SECRET_KEY || 'sk_test_sample_culqi_dev_key';
  private readonly publicKey = process.env.CULQI_PUBLIC_KEY || 'pk_test_sample_culqi_dev_key';
  private readonly baseUrl = 'https://api.culqi.com/v2';

  constructor() {
    this.logger.log(`💳 CulqiService inicializado en Modo Desarrollo / Sandbox.`);
  }

  isConfigured(): boolean {
    return (
      !!process.env.CULQI_SECRET_KEY &&
      !process.env.CULQI_SECRET_KEY.includes('sample') &&
      !process.env.CULQI_SECRET_KEY.includes('dev')
    );
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Procesa un pago con Tarjeta de Crédito o Débito vía Culqi Token
   */
  async processCardPayment(
    tokenId: string,
    orderNumber: string,
    amount: number,
    email: string,
    phone: string,
  ): Promise<CulqiChargeResponse> {
    const amountInCents = Math.round(amount * 100);
    this.logger.log(`💳 Procesando pago con Tarjeta (Token: ${tokenId}) para Orden #${orderNumber} por S/. ${amount}`);

    if (!this.isConfigured()) {
      this.logger.warn(`⚠️ Culqi en modo simulador (Dev Sandbox). Aprobando cargo automático...`);
      return {
        success: true,
        chargeId: `chr_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        amount,
        currency: 'USD',
        paymentMethod: 'TARJETA_CREDITO_DEBITO',
        message: 'Pago con tarjeta simulado exitosamente en entorno de desarrollo.',
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/charges`,
        {
          amount: amountInCents,
          currency_code: 'USD',
          email,
          source_id: tokenId,
          description: `Compra WSP Flow Orden #${orderNumber}`,
          antifraud_details: {
            phone,
          },
          metadata: {
            orderNumber,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;
      return {
        success: true,
        chargeId: data.id,
        amount: data.amount / 100,
        currency: data.currency_code,
        paymentMethod: data.source?.type || 'TARJETA',
        rawResponse: data,
        message: 'Cargo procesado con éxito en Culqi.',
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.user_message || error.response?.data?.merchant_message || error.message;
      this.logger.error(`Error procesando cargo en Culqi: ${errMsg}`);
      throw new Error(`Error en Culqi: ${errMsg}`);
    }
  }

  /**
   * Procesa un pago con Yape mediante Código de Aprobación (OTP de 6 dígitos)
   */
  async processYapePayment(
    yapeOtp: string,
    yapePhone: string,
    orderNumber: string,
    amount: number,
    email: string,
  ): Promise<CulqiChargeResponse> {
    const amountInCents = Math.round(amount * 100);
    const cleanPhone = yapePhone.replace(/\D/g, '').slice(-9);
    this.logger.log(`📱 Procesando pago con YAPE (Cel: ${cleanPhone}, OTP: ${yapeOtp}) para Orden #${orderNumber}`);

    if (!this.isConfigured()) {
      this.logger.warn(`⚠️ Culqi en modo simulador Yape (Dev Sandbox). Aprobando pago de Yape...`);
      return {
        success: true,
        chargeId: `chr_yape_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        amount,
        currency: 'PEN',
        paymentMethod: 'YAPE',
        message: 'Pago con Yape validado y aprobado exitosamente en modo desarrollo.',
      };
    }

    try {
      // 1. Crear Token Yape en Culqi con el parámetro oficial number_phone
      const tokenResp = await axios.post(
        'https://secure.culqi.com/v2/tokens/yape',
        {
          otp: yapeOtp.trim(),
          number_phone: cleanPhone,
          amount: amountInCents,
        },
        {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const yapeTokenId = tokenResp.data.id;

      // 2. Crear el cargo con el token de Yape
      const chargeResp = await axios.post(
        `${this.baseUrl}/charges`,
        {
          amount: amountInCents,
          currency_code: 'PEN',
          email: email || 'cliente@wspflow.com',
          source_id: yapeTokenId,
          description: `Pago Yape WSP Flow Orden #${orderNumber}`,
          metadata: {
            orderNumber,
            yapePhone: cleanPhone,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = chargeResp.data;
      return {
        success: true,
        chargeId: data.id,
        amount: data.amount / 100,
        currency: data.currency_code,
        paymentMethod: 'YAPE',
        rawResponse: data,
        message: 'Pago con Yape completado con éxito.',
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.user_message || error.response?.data?.merchant_message || error.message;
      this.logger.error(`Error procesando pago con Yape en Culqi: ${errMsg}`);
      throw new Error(`Error en Yape / Culqi: ${errMsg}`);
    }
  }

  /**
   * Procesa un reembolso parcial o total vía API de Culqi
   */
  async processRefund(chargeId: string, reason: string, amount?: number): Promise<CulqiRefundResponse> {
    this.logger.log(`💸 Solicitando reembolso a Culqi para Cargo [${chargeId}], Motivo: "${reason}"`);

    if (!this.isConfigured()) {
      this.logger.warn(`⚠️ Culqi en modo simulador (Dev Sandbox). Simulando reembolso exitoso...`);
      return {
        success: true,
        refundId: `ref_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        chargeId,
        amount: amount || 0,
        message: 'Reembolso simulado exitosamente en entorno de desarrollo.',
      };
    }

    try {
      const payload: any = {
        charge_id: chargeId,
        reason: reason || 'solicitud_del_cliente',
      };
      if (amount) {
        payload.amount = Math.round(amount * 100);
      }

      const response = await axios.post(`${this.baseUrl}/refunds`, payload, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;
      return {
        success: true,
        refundId: data.id,
        chargeId: data.charge_id,
        amount: data.amount / 100,
        rawResponse: data,
        message: 'Reembolso procesado con éxito en Culqi.',
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.user_message || error.response?.data?.merchant_message || error.message;
      this.logger.error(`Error procesando reembolso en Culqi: ${errMsg}`);
      throw new Error(`Error al procesar reembolso: ${errMsg}`);
    }
  }
}
