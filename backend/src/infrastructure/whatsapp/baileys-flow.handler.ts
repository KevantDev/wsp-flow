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
    customerPhone: string,
    customerName: string,
    messageText: string,
    chatSessionId?: string,
  ): Promise<FlowResult | null> {
    const rawText = messageText.trim();
    const cleanText = rawText.toLowerCase();

    this.logger.log(`🤖 Mensaje entrante de [${customerPhone}]: "${rawText}"`);

    // 1. Si el cliente solicita explícitamente el catálogo o archivo PDF
    if (
      cleanText === 'catalogo' ||
      cleanText === 'catálogo' ||
      cleanText.includes('catalogo pdf') ||
      cleanText.includes('catálogo pdf') ||
      cleanText.includes('ver catalogo') ||
      cleanText.includes('ver catálogo') ||
      cleanText.includes('enviar catalogo') ||
      cleanText.includes('enviar catálogo')
    ) {
      try {
        const { filePath } = await this.catalogPdfService.generateCatalogPdf();
        return {
          replyText: `📄 *¡Aquí tienes nuestro Catálogo Oficial de Productos en PDF!* ✨\n\nIncluye fotos, precios, códigos SKU y stock actualizado.\n\n🛒 *¿Cómo comprar?*\n• Escribe el código del producto (ej: *pedir #01* o *comprar 2 PROD-01*)\n• O escribe *asesor* para hablar con nuestro equipo.`,
          documentPath: filePath,
          documentFileName: 'Catalogo_WSP_Flow.pdf',
          actionTaken: 'SENT_CATALOG_PDF',
        };
      } catch (err: any) {
        this.logger.error('Error generando PDF en Baileys:', err.message);
      }
    }

    // 2. Si OpenAI con GPT-5.6-luna está configurado y activo, usar IA con Function Calling
    if (this.aiService.isAvailable()) {
      this.logger.log(`🧠 Procesando con OpenAI GPT-5.6-luna y Function Calling...`);
      const aiResult = await this.aiService.processWhatsAppMessage(customerPhone, customerName, rawText, chatSessionId);
      return {
        replyText: aiResult.replyText,
        mediaUrl: aiResult.mediaUrl,
        mediaType: aiResult.mediaType,
        caption: aiResult.caption,
        actionTaken: 'OPENAI_GPT_LUNA',
      };
    }

    // 3. MODO DETERMINÍSTICO DE RESPALDO (Sin API Key o en modo offline)

    // Comando: Solicitar Asesor / Pausar Bot
    if (
      cleanText.includes('asesor') ||
      cleanText.includes('humano') ||
      cleanText.includes('operador') ||
      cleanText.includes('ayuda')
    ) {
      await this.chatRepo.toggleBot(customerPhone, false);
      return {
        replyText:
          '👨‍💼 *Atención Personalizada Activada*\n\nHe pausado las respuestas automáticas para este chat. Uno de nuestros asesores de ventas te responderá a la brevedad.\n\n_Para reactivar el bot en cualquier momento, escribe *bot*._',
        actionTaken: 'PAUSED_BOT',
      };
    }

    // Comando: Reactivar Bot
    if (cleanText === 'bot' || cleanText === 'activar bot' || cleanText === 'menu') {
      await this.chatRepo.toggleBot(customerPhone, true);
    }

    // Comando: Ver Catálogo de Productos / Saludo
    if (
      cleanText.includes('catalogo') ||
      cleanText.includes('catálogo') ||
      cleanText.includes('menu') ||
      cleanText.includes('menú') ||
      cleanText.includes('productos') ||
      cleanText === 'hola' ||
      cleanText === 'buenas' ||
      cleanText === 'buenos dias' ||
      cleanText === 'buenas tardes' ||
      cleanText === 'buenas noches'
    ) {
      try {
        const { filePath } = await this.catalogPdfService.generateCatalogPdf();
        return {
          replyText: `📄 *¡Hola! Aquí tienes nuestro Catálogo Oficial en PDF.* 🛍️\n\nRevisa todos nuestros productos disponibles. Para ordenar responde con *pedir #01* o escribe *asesor*.`,
          documentPath: filePath,
          documentFileName: 'Catalogo_WSP_Flow.pdf',
          actionTaken: 'SENT_CATALOG_PDF',
        };
      } catch {
        const products = await this.productRepo.findAll({ onlyAvailable: true });
        return {
          replyText: `👋 ¡Hola! Bienvenido a nuestra tienda. Tenemos ${products.length} productos disponibles. Escribe *catalogo* para recibir el PDF o escribe *asesor* para ser atendido.`,
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
      const products = await this.productRepo.findAll({ onlyAvailable: true });
      let selectedProduct = null;
      let quantity = 1;

      const qtyMatch = rawText.match(/(\d+)\s*(unidades|unidad|u|x)?/i);
      if (qtyMatch && parseInt(qtyMatch[1], 10) > 0 && parseInt(qtyMatch[1], 10) < 50) {
        quantity = parseInt(qtyMatch[1], 10);
      }

      const indexMatch = rawText.match(/#(\d+)/);
      if (indexMatch) {
        const itemIdx = parseInt(indexMatch[1], 10) - 1;
        if (itemIdx >= 0 && itemIdx < products.length) {
          selectedProduct = products[itemIdx];
        }
      }

      if (!selectedProduct) {
        for (const p of products) {
          if (cleanText.includes(p.sku.toLowerCase()) || cleanText.includes(p.name.toLowerCase())) {
            selectedProduct = p;
            break;
          }
        }
      }

      if (!selectedProduct) {
        return {
          replyText:
            '⚠️ No pude identificar el producto que deseas ordenar.\n\nPor favor consulta el catálogo escribiendo *catalogo* o indica el número (ej: *pedir #01*).',
        };
      }

      if (selectedProduct.stock < quantity) {
        return {
          replyText: `⚠️ Disculpa, solo tenemos *${selectedProduct.stock}* unidades disponibles de *${selectedProduct.name}*. Por favor indica una cantidad menor.`,
        };
      }

      const subtotal = selectedProduct.price * quantity;
      const deliveryFee = 0;
      const total = subtotal + deliveryFee;

      const newOrder = await this.orderRepo.create(
        {
          customerName: customerName || 'Cliente WhatsApp',
          customerPhone,
          status: OrderStatus.PENDING,
          source: OrderSource.WHATSAPP_BOT,
          subtotal,
          deliveryFee,
          total,
          notes: `Generado automáticamente por Bot Baileys. Producto: ${selectedProduct.name} (x${quantity})`,
        },
        [
          {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            unitPrice: selectedProduct.price,
            quantity,
            subtotal,
          },
        ],
      );

      // Descontar inventario
      await this.productRepo.decrementStock(selectedProduct.id, quantity);

      // Notificar en tiempo real al Dashboard Bento vía WebSocket
      this.wsGateway.emitNewOrder(newOrder);

      // Verificar si quedó con bajo stock
      if (selectedProduct.stock - quantity <= selectedProduct.minStockAlert) {
        this.wsGateway.emitStockAlert({
          id: selectedProduct.id,
          name: selectedProduct.name,
          stock: selectedProduct.stock - quantity,
          minStockAlert: selectedProduct.minStockAlert,
        });
      }

      let confirmationMsg = `🎉 *¡PEDIDO REGISTRADO CON ÉXITO!* 🎉\n`;
      confirmationMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      confirmationMsg += `📄 *Número de Pedido:* \`${newOrder.orderNumber}\`\n`;
      confirmationMsg += `🛍️ *Producto:* ${selectedProduct.name}\n`;
      confirmationMsg += `🔢 *Cantidad:* ${quantity} unidad(es)\n`;
      confirmationMsg += `💵 *Total a Pagar:* $${total.toFixed(2)} USD\n`;
      confirmationMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      confirmationMsg += `📍 *Siguiente paso:* Por favor respóndenos con tu *Nombre Completo* y *Dirección de entrega / Ciudad* para coordinar el despacho.\n\n`;
      confirmationMsg += `_Un asesor de nuestro equipo ya está revisando tu orden en el panel._`;

      return {
        replyText: confirmationMsg,
        actionTaken: 'CREATED_ORDER',
      };
    }

    // Palabras Clave Personalizadas en Base de Datos
    const keywords = await this.prisma.botKeyword.findMany({ where: { isActive: true } });
    for (const kw of keywords) {
      const match =
        kw.matchType === 'EXACT'
          ? cleanText === kw.keyword.toLowerCase()
          : cleanText.includes(kw.keyword.toLowerCase());

      if (match) {
        if (kw.action === 'SHOW_CATALOG') {
          return this.handleIncomingMessage(customerPhone, customerName, 'catalogo');
        }
        if (kw.action === 'PAUSE_BOT') {
          await this.chatRepo.toggleBot(customerPhone, false);
        }
        return {
          replyText: kw.response,
          mediaUrl: kw.mediaUrl || undefined,
          actionTaken: `KEYWORD_${kw.keyword}`,
        };
      }
    }

    // Respuesta por Defecto
    return {
      replyText: `👋 ¡Hola! ¿En qué puedo ayudarte hoy?\n\n📌 *Opciones disponibles:*\n• Escribe *catalogo* para recibir nuestro Catálogo en PDF con fotos y precios.\n• Escribe *pedir #01* para ordenar.\n• Escribe *asesor* para hablar con un representante de nuestro equipo.`,
      actionTaken: 'DEFAULT_FALLBACK',
    };
  }
}
