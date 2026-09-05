import { Injectable, Logger } from '@nestjs/common';
import { PrismaProductRepository } from '../persistence/prisma/repositories/prisma-product.repository';
import { PrismaCategoryRepository } from '../persistence/prisma/repositories/prisma-category.repository';
import { PrismaOrderRepository } from '../persistence/prisma/repositories/prisma-order.repository';
import { PrismaChatRepository } from '../persistence/prisma/repositories/prisma-chat.repository';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { OrderSource, OrderStatus } from '../../domain/entities/order.entity';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { AiService } from '../ai/ai.service';
import { CatalogPdfService } from '../pdf/catalog-pdf.service';

export interface FlowResult {
  replyText?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  caption?: string;
  documentPath?: string;
  documentFileName?: string;
  actionTaken?: string;
}

@Injectable()
export class BaileysFlowHandler {
  private readonly logger = new Logger(BaileysFlowHandler.name);

  constructor(
    private readonly productRepo: PrismaProductRepository,
    private readonly categoryRepo: PrismaCategoryRepository,
    private readonly orderRepo: PrismaOrderRepository,
    private readonly chatRepo: PrismaChatRepository,
    private readonly prisma: PrismaService,
    private readonly wsGateway: WhatsAppGateway,
    private readonly aiService: AiService,
    private readonly catalogPdfService: CatalogPdfService,
  ) {}

  async handleIncomingMessage(
    tenantId: string,
    customerPhone: string,
    customerName: string,
    messageText: string,
    chatSessionId?: string,
  ): Promise<FlowResult | null> {
    const rawText = messageText.trim();
    const cleanText = rawText.toLowerCase().replace(/[.,!¡?¿]/g, '').trim();

    this.logger.log(`🤖 [Tenant: ${tenantId}] Mensaje consolidado de [${customerPhone}]: "${rawText}"`);

    // =========================================================================
    // 1. FAST-PATH 0 TOKENS: Cortesías, Agradecimientos y Despedidas
    // =========================================================================
    const courtesyPhrases = [
      'gracias',
      'muchas gracias',
      'mil gracias',
      'ok',
      'ok gracias',
      'dale',
      'vale',
      'listo',
      'perfecto',
      'genial',
      'excelente',
      'bueno',
      '👍',
      'chau',
      'adios',
      'hasta luego',
    ];

    if (courtesyPhrases.includes(cleanText)) {
      this.logger.log(`⚡ Fast-Path ejecutado (0 Tokens) para cortesía: "${cleanText}"`);
      return {
        replyText: `¡Con mucho gusto, ${customerName}! 😊 Si necesitas consultar algo más o deseas confirmar tu pedido, aquí estoy para ayudarte. ¡Que tengas un excelente día! ✨`,
        actionTaken: 'FAST_PATH_COURTESY',
      };
    }

    // =========================================================================
    // 2. FAST-PATH 0 TOKENS: Solicitud Explícita de Asesor Humano / Pausa del Bot
    // =========================================================================
    if (
      cleanText === 'asesor' ||
      cleanText === 'humano' ||
      cleanText === 'operador' ||
      cleanText.includes('hablar con una persona') ||
      cleanText.includes('hablar con asesor') ||
      cleanText.includes('atencion humana')
    ) {
      await this.chatRepo.toggleBot(tenantId, customerPhone, false);
      return {
        replyText:
          '👨‍💼 *Atención con Asesor Humano Activada*\n\nHe pausado mis respuestas automáticas para este chat. Uno de nuestros asesores de ventas revisará tu conversación y te responderá a la brevedad.\n\n_Para reactivarme en cualquier momento, escribe *bot*._',
        actionTaken: 'PAUSED_BOT',
      };
    }

    // Reactivación del Bot
    if (cleanText === 'bot' || cleanText === 'activar bot' || cleanText === 'menu') {
      await this.chatRepo.toggleBot(tenantId, customerPhone, true);
    }

    // =========================================================================
    // 3. FAST-PATH 0 TOKENS: Solicitud de Catálogo en PDF
    // =========================================================================
    const isCatalogRequest =
      cleanText === 'catalogo' ||
      cleanText === 'catálogo' ||
      cleanText.includes('catalogo') ||
      cleanText.includes('catálogo') ||
      cleanText.includes('lista de precio') ||
      cleanText.includes('lista de productos') ||
      cleanText.includes('folleto') ||
      cleanText.includes('brochure') ||
      cleanText.includes('ver productos') ||
      cleanText.includes('pasa el catalogo') ||
      cleanText.includes('pasar el catalogo') ||
      cleanText.includes('enviar el catalogo') ||
      cleanText.includes('mandar el catalogo');

    const isDirectOrderCommand =
      cleanText.startsWith('pedir') ||
      cleanText.startsWith('comprar') ||
      cleanText.startsWith('ordenar');

    if (isCatalogRequest && !isDirectOrderCommand) {
      try {
        const { filePath } = await this.catalogPdfService.generateCatalogPdf(tenantId);
        return {
          replyText: `📄 *¡Aquí tienes nuestro Catálogo Oficial de Productos en PDF!* ✨\n\nIncluye fotos en alta definición, precios en Soles (S/), códigos SKU y stock actualizado en tiempo real.\n\n🛒 *¿Cómo comprar?*\n• Escribe el nombre o código SKU del producto (ej: *pedir PROD-01*)\n• O escribe *asesor* para hablar con nuestro equipo de ventas.`,
          documentPath: filePath,
          documentFileName: 'Catalogo_Productos.pdf',
          actionTaken: 'SENT_CATALOG_PDF',
        };
      } catch (err: any) {
        this.logger.error('Error generando PDF en Baileys:', err.message);
      }
    }

    // =========================================================================
    // 4. FAST-PATH 0 TOKENS: Consulta Directa de Estado de Pedido
    // =========================================================================
    const isOrderStatusQuery =
      cleanText.includes('estado de mi pedido') ||
      cleanText.includes('estado de mi compra') ||
      cleanText.includes('estado del pedido') ||
      cleanText.includes('como va mi pedido') ||
      cleanText.includes('como va mi compra') ||
      cleanText.includes('seguimiento de mi') ||
      cleanText.includes('rastrear pedido') ||
      cleanText.startsWith('orden #') ||
      cleanText.startsWith('pedido #') ||
      cleanText.startsWith('ord-');

    if (isOrderStatusQuery) {
      const orderMatch = rawText.match(/ORD-[\d-]+/i);
      let order = null;
      if (orderMatch) {
        order = await this.orderRepo.findByOrderNumber(orderMatch[0].toUpperCase(), tenantId);
      }
      if (!order) {
        const list = await this.orderRepo.findAll({
          tenantId,
          chatSessionId,
          customerPhone,
          limit: 1,
        });
        if (list && list.length > 0) {
          order = list[0];
        }
      }

      if (order) {
        const statusMap: Record<string, string> = {
          PENDING: '⏳ *Pendiente de Pago / Confirmación*',
          CONFIRMED: '✅ *Pago Confirmado* (En cola de empaquetado)',
          PROCESSING: '📦 *En Preparación* (Empaquetando en almacén)',
          SHIPPED: '🚚 *En Camino* (Despachado con repartidor / agencia)',
          DELIVERED: '🎉 *Entregado con éxito*',
          CANCELLED: '❌ *Cancelado*',
        };

        const itemsList = (order.items || [])
          .map((i) => `• ${i.quantity}x ${i.productName} (S/ ${i.subtotal.toFixed(2)})`)
          .join('\n');

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const payUrl = `${baseUrl}/pay/${order.orderNumber}`;

        return {
          replyText:
            `📦 *Estado de tu Pedido #${order.orderNumber}*\n\n` +
            `• *Comprador:* ${order.customerName}\n` +
            `• *Estado Actual:* ${statusMap[order.status] || order.status}\n` +
            `• *Modalidad de Entrega:* ${order.customerAddress || 'Coordinar con asesor'}\n` +
            `• *Total:* S/ ${order.total.toFixed(2)} PEN\n\n` +
            `📋 *Productos:*\n${itemsList || '• Productos registrados'}\n\n` +
            (order.status === OrderStatus.PENDING
              ? `💳 *Paga tu pedido de forma segura aquí:* ${payUrl}\n\n`
              : '') +
            `Si necesitas comunicarte con un asesor, solo escribe *asesor*. ✨`,
          actionTaken: 'FAST_PATH_ORDER_STATUS',
        };
      }
    }

    // =========================================================================
    // 5. MOTOR PRINCIPAL DE IA: OpenAI GPT con Function Calling & Memoria
    // =========================================================================
    if (this.aiService.isAvailable()) {
      this.logger.log(`🧠 [Tenant: ${tenantId}] Procesando con OpenAI AI y Function Calling...`);
      const aiResult = await this.aiService.processWhatsAppMessage(
        tenantId,
        customerPhone,
        customerName,
        rawText,
        chatSessionId,
      );
      return {
        replyText: aiResult.replyText,
        mediaUrl: aiResult.mediaUrl,
        mediaType: aiResult.mediaType,
        caption: aiResult.caption,
        documentPath: aiResult.documentPath,
        documentFileName: aiResult.documentFileName,
        actionTaken: 'OPENAI_GPT',
      };
    }

    // =========================================================================
    // 6. MODO DETERMINÍSTICO DE RESPALDO OFFLINE (Sin OpenAI API Key)
    // =========================================================================

    // Saludo inicial
    if (
      cleanText === 'hola' ||
      cleanText === 'buenas' ||
      cleanText === 'buenos dias' ||
      cleanText === 'buenas tardes' ||
      cleanText === 'buenas noches'
    ) {
      try {
        const { filePath } = await this.catalogPdfService.generateCatalogPdf(tenantId);
        return {
          replyText: `👋 ¡Hola ${customerName}! Bienvenido a nuestra tienda. Te adjunto nuestro Catálogo Oficial en PDF. Revisa los productos y dime qué te gustaría ordenar.`,
          documentPath: filePath,
          documentFileName: 'Catalogo_Productos.pdf',
          actionTaken: 'SENT_CATALOG_PDF',
        };
      } catch {
        const products = await this.productRepo.findAll({ tenantId, onlyAvailable: true });
        return {
          replyText: `👋 ¡Hola ${customerName}! Bienvenido a nuestra tienda. Tenemos ${products.length} productos disponibles. Escribe *catalogo* para recibir el PDF o escribe *asesor* para ser atendido.`,
        };
      }
    }

    // Comando: Realizar Pedido Automatizado
    const isOrderIntent =
      cleanText.startsWith('pedir') ||
      cleanText.startsWith('comprar') ||
      cleanText.startsWith('ordenar') ||
      cleanText.startsWith('quiero');

    if (isOrderIntent) {
      const products = await this.productRepo.findAll({ tenantId, onlyAvailable: true });
      let selectedProduct = null;
      let quantity = 1;

      for (const prod of products) {
        if (
          cleanText.includes(prod.sku.toLowerCase()) ||
          cleanText.includes(prod.name.toLowerCase()) ||
          cleanText.includes(prod.slug.toLowerCase())
        ) {
          selectedProduct = prod;
          break;
        }
      }

      if (selectedProduct) {
        const qtyMatch = cleanText.match(/\b(\d+)\b/);
        if (qtyMatch && parseInt(qtyMatch[1], 10) > 0 && parseInt(qtyMatch[1], 10) < 100) {
          quantity = parseInt(qtyMatch[1], 10);
        }

        if (selectedProduct.stock < quantity) {
          return {
            replyText: `⚠️ *Stock insuficiente:* Solo nos quedan ${selectedProduct.stock} unidades de *${selectedProduct.name}*. ¿Deseas ordenar esa cantidad?`,
          };
        }

        const subtotal = selectedProduct.price * quantity;
        const total = subtotal;

        const newOrder = await this.orderRepo.create(
          {
            tenantId,
            chatSessionId,
            customerName,
            customerPhone,
            status: OrderStatus.PENDING,
            source: OrderSource.WHATSAPP_BOT,
            subtotal,
            deliveryFee: 0,
            total,
            paymentMethod: 'CASH_ON_DELIVERY' as any,
            notes: `Orden creada automáticamente vía WhatsApp (modo offline)`,
          },
          [
            {
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              quantity,
              unitPrice: selectedProduct.price,
              subtotal,
            },
          ],
        );

        await this.productRepo.decrementStock(selectedProduct.id, quantity);
        this.wsGateway.emitNewOrder(newOrder);

        return {
          replyText: `🎉 *¡Pedido Registrado con Éxito!*\n\n• *Orden:* \`#${newOrder.orderNumber}\`\n• *Producto:* ${selectedProduct.name} x${quantity}\n• *Total a Pagar:* S/ ${total.toFixed(2)}\n• *Estado:* Pendiente de Confirmación\n\nUno de nuestros asesores se comunicará para coordinar el pago y envío. ¡Muchas gracias!`,
          actionTaken: 'CREATED_ORDER_DETERMINISTIC',
        };
      }
    }

    // Respuesta genérica de respaldo
    return {
      replyText: `👋 ¡Hola ${customerName}! Gracias por tu mensaje. Escribe *catalogo* para recibir nuestra lista en PDF, o escribe *asesor* para hablar con nuestro equipo.`,
    };
  }
}
