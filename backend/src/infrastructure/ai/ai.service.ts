import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { PrismaProductRepository } from '../persistence/prisma/repositories/prisma-product.repository';
import { PrismaOrderRepository } from '../persistence/prisma/repositories/prisma-order.repository';
import { PrismaChatRepository } from '../persistence/prisma/repositories/prisma-chat.repository';
import { PrismaCompanyConfigRepository } from '../persistence/prisma/repositories/prisma-company-config.repository';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { OrderSource, OrderStatus } from '../../domain/entities/order.entity';
import { DeliveryService } from '../../application/services/delivery.service';
import { CatalogPdfService } from '../pdf/catalog-pdf.service';

export interface AiProcessResult {
  replyText: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  caption?: string;
  documentPath?: string;
  documentFileName?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private readonly defaultModel = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

  constructor(
    private readonly productRepo: PrismaProductRepository,
    private readonly orderRepo: PrismaOrderRepository,
    private readonly chatRepo: PrismaChatRepository,
    private readonly configRepo: PrismaCompanyConfigRepository,
    private readonly wsGateway: WhatsAppGateway,
    private readonly deliveryService: DeliveryService,
    private readonly catalogPdfService: CatalogPdfService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log(`🤖 OpenAI AI Service inicializado con modelo: ${this.defaultModel}`);
    } else {
      this.logger.warn(
        '⚠️ OPENAI_API_KEY no configurada. El bot operará en modo híbrido con respuestas automáticas.',
      );
    }
  }

  isAvailable(): boolean {
    return this.openai !== null && !!process.env.OPENAI_API_KEY;
  }

  /**
   * Transcribe una nota de voz o audio recibido por WhatsApp usando OpenAI Whisper AI
   */
  async transcribeAudio(audioBuffer: Buffer, originalMimeType?: string): Promise<string> {
    if (!this.openai) {
      this.logger.warn('OpenAI no configurado para transcripción de audio.');
      return '';
    }

    try {
      this.logger.log(`🎙️ [Whisper AI] Transcribiendo nota de voz (${audioBuffer.length} bytes)...`);

      const tempDir = path.resolve(process.cwd(), 'uploads', 'temp_audio');
      await fsPromises.mkdir(tempDir, { recursive: true });

      const extension = originalMimeType?.includes('mp4') ? 'mp4' : 'ogg';
      const tempFilePath = path.join(
        tempDir,
        `voice_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`,
      );
      await fsPromises.writeFile(tempFilePath, audioBuffer);

      const fileStream = fs.createReadStream(tempFilePath);

      const transcription = await this.openai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
        language: 'es',
        prompt: 'Atención al cliente comercio electrónico en Perú, productos, stock, compras, pagos con Yape o Culqi, delivery a Lima y provincias.',
      });

      // Limpiar archivo temporal de forma asíncrona no bloqueante
      await fsPromises.unlink(tempFilePath).catch(() => {});

      const text = transcription.text ? transcription.text.trim() : '';
      this.logger.log(`🎙️ [Whisper AI] Transcripción completada: "${text}"`);
      return text;
    } catch (err: any) {
      this.logger.error(`Error en transcripción de audio Whisper: ${err.message}`);
      return '';
    }
  }

  /**
   * Procesa un mensaje de WhatsApp entrante con GPT-5.6-luna, memoria de conversación y Function Calling
   */
  async processWhatsAppMessage(
    tenantId: string,
    customerPhone: string,
    customerName: string,
    userMessage: string,
    chatSessionId?: string,
  ): Promise<AiProcessResult> {
    if (!this.openai) {
      return { replyText: this.generateFallbackResponse(userMessage) };
    }

    try {
      // 1. Obtener la configuración, historial y catálogo activo concurrentemente en paralelo
      const [config, rawMessages, activeProducts] = await Promise.all([
        this.configRepo.getConfig(tenantId),
        chatSessionId ? this.chatRepo.getMessages(chatSessionId, 15) : Promise.resolve([]),
        this.productRepo.findAll({ tenantId, onlyAvailable: true }),
      ]);

      let modelToUse = config.aiModel || this.defaultModel || 'gpt-4o-mini';
      if (modelToUse.includes('luna') || !modelToUse.startsWith('gpt-')) {
        modelToUse = 'gpt-4o-mini';
      }
      const temperature = config.aiTemperature ?? 0.7;
      const historyLimit = config.historyMessageLimit ?? 15;

      // 2. Formatear historial reciente de la conversación
      const recentHistory: { role: 'user' | 'assistant'; content: string }[] = rawMessages
        .slice(-historyLimit)
        .map((m) => ({
          role: m.sender === 'CUSTOMER' ? ('user' as const) : ('assistant' as const),
          content: m.content,
        }));
      const productsSummary = activeProducts.map((p) => ({
        sku: p.sku,
        name: p.name,
        category: p.categoryName || 'General',
        price: p.price,
        stock: p.stock,
        hasImages: (p.images?.length || 0) > 0,
        hasVideo: !!p.videoUrl,
      }));

      // 4. Construir el System Prompt maestro enriquecido con datos reales de la empresa y directrices de seguridad
      const isLongConversation = recentHistory.length >= 8;
      const salesUrgencyPrompt = isLongConversation
        ? `\n\n[ESTRATEGIA DE CIERRE DE VENTA]: Este cliente ya lleva varias consultas en el chat. Tras responder a su duda, haz un llamado a la acción directo y amable para concretar su pedido hoy mismo o pregúntale si prefiere que un asesor lo contacte para resolver detalles finales.`
        : '';

      const systemPrompt = `${config.systemPrompt}

DATOS OFICIALES DE LA EMPRESA:
- Nombre Comercial: ${config.companyName}
- Rubro y Descripción: ${config.businessDescription}
- Políticas de Envío: ${config.shippingPolicy}
- Métodos de Pago Aceptados: ${config.paymentMethods}
- Horarios de Atención: ${config.workingHours}
- Ubicación / Dirección: ${config.address}

CATÁLOGO DISPONIBLE EN INVENTARIO (${productsSummary.length} productos):
${JSON.stringify(productsSummary, null, 1)}

REGLAS INVIOLABLES DE SEGURIDAD & FORMATO COMERCIAL:
1. Eres exclusivamente la asesora comercial de ventas de ${config.companyName}.
2. MONEDA OFICIAL: Todos los precios, subtotales y totales son exclusivamente en SOLES PERUANOS (S/ PEN). Queda TERMINANTEMENTE PROHIBIDO usar el signo de dólar ($). Siempre escribe "S/ 79.90", "S/ 149.00", etc.
3. FORMATO WHATSAPP: Para resaltar palabras usa el formato oficial de WhatsApp con UN SOLO asterisco (*texto en negrita*). NUNCA uses dobles asteriscos (**texto**), ni títulos markdown (###).
4. Tienes estrictamente prohibido responder temas ajenos a la tienda (no resolver tareas escolares, no generar código, no opinar de política o temas no comerciales). Si el usuario insiste, redirige amablemente hacia los productos.
5. Responde siempre con calidez humana, precisión y empatía en español. Utiliza emojis comerciales sutiles (🛍️, ✨, 📦, ⚡, 🚀, 💬).
6. Si el cliente solicita fotos o video demostrativo de un producto, utiliza 'send_product_media'.
7. MANEJO DE UBICACIÓN GPS: Cuando el cliente envíe su ubicación GPS de WhatsApp (mensaje que inicia con "📍 [Ubicación GPS: ...]"), agradécele, confirma la dirección detectada y distrito, indícale la tarifa de envío calculada en Soles (S/), y pregúntale si confirma su pedido con despacho a esa dirección o qué productos desea ordenar.
8. Cuando el cliente pregunte por su pedido, usa 'track_order' y explícale con amabilidad en Soles (S/).
9. FLUJO DE COMPRA OBLIGATORIO: Antes de llamar a 'create_order', SIEMPRE debes: (a) confirmar los productos y cantidad, (b) confirmar la dirección o tipo de entrega, (c) PREGUNTAR EXPLÍCITAMENTE el método de pago con estas opciones:
   - *1️⃣ Pago online* (Tarjeta de crédito/débito o Yape — enlace seguro)
   - *2️⃣ Efectivo al recibir* (Contra entrega — pagas cuando llega tu pedido)
   Solo llama a 'create_order' después de que el cliente elija una opción.
10. Si el cliente pide expresamente una persona o no puedes resolver su problema, usa 'transfer_to_human'.${salesUrgencyPrompt}`;


      const tools: OpenAI.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'search_products',
            description:
              'Busca productos en el catálogo por nombre, SKU, categoría o lista todos los disponibles con sus descripciones completas.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Texto de búsqueda por nombre o palabra clave (ej: "auriculares", "reloj").',
                },
                categoryId: {
                  type: 'string',
                  description: 'ID de la categoría (opcional).',
                },
              },
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'check_stock',
            description: 'Verifica la disponibilidad exacta de inventario y precio de un producto por SKU.',
            parameters: {
              type: 'object',
              properties: {
                sku: {
                  type: 'string',
                  description: 'Código SKU del producto (ej: "PROD-01", "AUD-01").',
                },
              },
              required: ['sku'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'send_product_media',
            description:
              'Envía fotos en alta resolución o video de demostración de un producto al chat de WhatsApp del cliente cuando solicita ver imágenes o videos.',
            parameters: {
              type: 'object',
              properties: {
                sku: {
                  type: 'string',
                  description: 'Código SKU del producto a enviar.',
                },
                mediaType: {
                  type: 'string',
                  enum: ['image', 'video'],
                  description: 'Tipo de multimedia solicitado ("image" para foto, "video" para video).',
                },
              },
              required: ['sku'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'create_order',
            description:
              'Crea y registra un nuevo pedido de compra en PostgreSQL, descuenta el stock y notifica al panel To-Do Kanban. IMPORTANTE: Antes de llamar a esta función, SIEMPRE debes preguntar al cliente su método de pago (tarjeta/Yape online o efectivo contra entrega) si no lo mencionó.',
            parameters: {
              type: 'object',
              properties: {
                customerName: {
                  type: 'string',
                  description: 'Nombre completo del cliente comprador.',
                },
                customerAddress: {
                  type: 'string',
                  description: 'Dirección o ciudad de envío proporcionada por el cliente.',
                },
                paymentMethod: {
                  type: 'string',
                  enum: ['CULQI_ONLINE', 'CASH_ON_DELIVERY'],
                  description: 'Método de pago elegido por el cliente. "CULQI_ONLINE" para pago con tarjeta o Yape, "CASH_ON_DELIVERY" para efectivo al recibir el pedido.',
                },
                items: {
                  type: 'array',
                  description: 'Lista de productos a comprar con SKU y cantidad.',
                  items: {
                    type: 'object',
                    properties: {
                      sku: {
                        type: 'string',
                        description: 'SKU del producto a ordenar.',
                      },
                      quantity: {
                        type: 'number',
                        description: 'Cantidad de unidades.',
                      },
                    },
                    required: ['sku', 'quantity'],
                  },
                },
              },
              required: ['customerName', 'items', 'paymentMethod'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'transfer_to_human',
            description:
              'Transfiere la conversación a un asesor humano y pausa el bot en la bandeja Live Chat.',
            parameters: {
              type: 'object',
              properties: {
                reason: {
                  type: 'string',
                  description: 'Motivo de la transferencia.',
                },
              },
              required: ['reason'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'calculate_delivery',
            description:
              'Calcula la tarifa de envío para Lima (Zonas 1, 2, 3), Provincias (Agencia Shalom/Marvisur) o Recojo en Tienda en Miraflores (Gratis).',
            parameters: {
              type: 'object',
              properties: {
                deliveryType: {
                  type: 'string',
                  enum: ['PICKUP', 'HOME_DELIVERY', 'PROVINCE_AGENCY'],
                  description: 'Tipo de entrega ("PICKUP" para recojo en tienda, "HOME_DELIVERY" para envío a domicilio en Lima, "PROVINCE_AGENCY" para provincias).',
                },
                districtOrAddress: {
                  type: 'string',
                  description: 'Distrito, dirección o ciudad de destino (ej: "Miraflores", "Los Olivos", "Trujillo").',
                },
              },
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'track_order',
            description:
              'Consulta el estado actual en tiempo real de un pedido, sus productos, monto total, estado de pago y seguimiento de entrega por código de orden o usando el teléfono del cliente.',
            parameters: {
              type: 'object',
              properties: {
                orderNumber: {
                  type: 'string',
                  description: 'Código de la orden (ej: "ORD-2026-0001", "ORD-2026-0003"). Opcional si se consulta por el teléfono del cliente.',
                },
              },
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'send_catalog_pdf',
            description:
              'Genera y envía el archivo del Catálogo Oficial de Productos en formato PDF al chat de WhatsApp del cliente cuando solicita ver el catálogo, lista de productos o precios.',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_store_info',
            description:
              'Devuelve información oficial sobre métodos de pago, envíos, horarios de atención y dirección de recojo en tienda.',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        },
      ];

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        {
          role: 'user',
          content: `[Cliente WhatsApp: ${customerName} (+${customerPhone})]: ${userMessage}`,
        },
      ];

      let mediaToDispatch:
        | {
            mediaUrl?: string;
            mediaType: 'image' | 'video' | 'document';
            caption?: string;
            documentPath?: string;
            documentFileName?: string;
          }
        | undefined;

      // Primera llamada al modelo
      let response = await this.openai.chat.completions.create({
        model: modelToUse,
        messages,
        tools,
        tool_choice: 'auto',
        temperature,
      });

      let responseMessage = response.choices[0].message;

      // Loop de ejecución de herramientas
      while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;

          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || '{}');
          let toolResult = '';

          this.logger.log(`🔧 Tool [${functionName}] ejecutada con args: ${JSON.stringify(args)}`);

          switch (functionName) {
            case 'send_catalog_pdf': {
              try {
                const { filePath } = await this.catalogPdfService.generateCatalogPdf(tenantId);
                toolResult = JSON.stringify({
                  success: true,
                  message: 'El Catálogo PDF oficial con fotos, precios y stock en Soles ha sido generado y adjuntado al mensaje.',
                  fileName: 'Catalogo_Productos.pdf',
                });
                mediaToDispatch = {
                  documentPath: filePath,
                  documentFileName: 'Catalogo_Productos.pdf',
                  mediaType: 'document',
                  caption: `📄 *Catálogo Oficial de Productos — ${config.companyName}*`,
                };
              } catch (pdfErr: any) {
                toolResult = JSON.stringify({ error: `Error generando PDF: ${pdfErr.message}` });
              }
              break;
            }

            case 'search_products':
              toolResult = await this.executeSearchProducts(tenantId, args.query, args.categoryId);
              break;

            case 'check_stock':
              toolResult = await this.executeCheckStock(tenantId, args.sku);
              break;

            case 'send_product_media': {
              const mediaResult = await this.executeSendProductMedia(tenantId, args.sku, args.mediaType || 'image');
              toolResult = mediaResult.resultJson;
              if (mediaResult.mediaUrl) {
                mediaToDispatch = {
                  mediaUrl: mediaResult.mediaUrl,
                  mediaType: mediaResult.mediaType,
                  caption: mediaResult.caption,
                };
              }
              break;
            }

            case 'create_order':
              toolResult = await this.executeCreateOrder(
                tenantId,
                customerPhone,
                args.customerName || customerName,
                args.customerAddress || '',
                args.items || [],
                chatSessionId,
                args.paymentMethod,
              );
              break;

            case 'calculate_delivery': {
              const calcResult = this.deliveryService.calculateDelivery(args.deliveryType, args.districtOrAddress);
              toolResult = JSON.stringify({
                zoneName: calcResult.zone.name,
                type: calcResult.zone.type,
                deliveryFee: calcResult.deliveryFee,
                estimatedTime: calcResult.zone.estimatedTime,
                description: calcResult.zone.description,
                pickupAddress: config.pickupStoreAddress || 'Av. Larco 743, Miraflores, Lima (Gratis)',
              });
              break;
            }

            case 'track_order':
              toolResult = await this.executeTrackOrder(tenantId, customerPhone, args.orderNumber, chatSessionId);
              break;

            case 'transfer_to_human':
              toolResult = await this.executeTransferToHuman(tenantId, customerPhone, args.reason);
              break;

            case 'get_store_info':
              toolResult = JSON.stringify({
                companyName: config.companyName,
                shippingPolicy: config.shippingPolicy,
                paymentMethods: config.paymentMethods,
                workingHours: config.workingHours,
                address: config.address,
                pickupLocation: 'Av. Larco 743, Miraflores, Lima (Gratis - Lun a Sáb 9am a 8pm)',
                deliveryZones: this.deliveryService.getAllDeliveryZones(),
              });
              break;

            default:
              toolResult = JSON.stringify({ error: `Herramienta desconocida: ${functionName}` });
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }

        response = await this.openai.chat.completions.create({
          model: modelToUse,
          messages,
          temperature,
        });

        responseMessage = response.choices[0].message;
      }

      const rawReply =
        responseMessage.content || '¡Hola! ¿En qué más te puedo asesorar sobre nuestros productos?';
      const cleanReply = rawReply
        .replace(/\*\*(.*?)\*\*/g, '*$1*')
        .replace(/\$(\s*\d+(\.\d+)?)/g, 'S/ $1');

      return {
        replyText: cleanReply,
        mediaUrl: mediaToDispatch?.mediaUrl,
        mediaType: mediaToDispatch?.mediaType,
        documentPath: mediaToDispatch?.documentPath,
        documentFileName: mediaToDispatch?.documentFileName,
        caption: mediaToDispatch?.caption
          ? mediaToDispatch.caption
              .replace(/\*\*(.*?)\*\*/g, '*$1*')
              .replace(/\$(\s*\d+(\.\d+)?)/g, 'S/ $1')
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(`Error en OpenAI AI Service: ${error.message}`);
      return { replyText: this.generateFallbackResponse(userMessage) };
    }
  }

  // --- Implementaciones de Tools / Functions ---

  private async executeSearchProducts(tenantId: string, query?: string, categoryId?: string): Promise<string> {
    try {
      const products = await this.productRepo.findAll({ tenantId, categoryId, search: query, onlyAvailable: true });
      const simplified = products.map((p) => ({
        sku: p.sku,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.categoryName || 'General',
        description: p.description,
        available: p.isAvailable && p.stock > 0,
        imagesCount: p.images?.length || 0,
        hasVideo: !!p.videoUrl,
      }));
      return JSON.stringify({ count: simplified.length, products: simplified });
    } catch (err: any) {
      return JSON.stringify({ error: 'Error al consultar inventario', message: err.message });
    }
  }

  private async executeCheckStock(tenantId: string, sku: string): Promise<string> {
    try {
      const product = await this.productRepo.findBySku(sku, tenantId);
      if (!product) {
        return JSON.stringify({ found: false, message: `No se encontró producto con SKU ${sku}` });
      }
      return JSON.stringify({
        found: true,
        sku: product.sku,
        name: product.name,
        stock: product.stock,
        inStock: product.stock > 0,
        price: product.price,
        description: product.description,
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message });
    }
  }

  private async executeSendProductMedia(
    tenantId: string,
    sku: string,
    requestedType: 'image' | 'video',
  ): Promise<{ resultJson: string; mediaUrl?: string; mediaType: 'image' | 'video'; caption?: string }> {
    try {
      const product = await this.productRepo.findBySku(sku, tenantId);
      if (!product) {
        return {
          resultJson: JSON.stringify({ success: false, message: `Producto con SKU ${sku} no encontrado.` }),
          mediaType: requestedType,
        };
      }

      if (requestedType === 'video' && product.videoUrl) {
        return {
          resultJson: JSON.stringify({
            success: true,
            mediaType: 'video',
            videoUrl: product.videoUrl,
            message: `Video de ${product.name} preparado para envío.`,
          }),
          mediaUrl: product.videoUrl,
          mediaType: 'video',
          caption: `🎥 *Demostración:* ${product.name} (SKU: ${product.sku})`,
        };
      }

      // Enviar imagen principal o primera imagen disponible
      const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
      if (primaryImage) {
        return {
          resultJson: JSON.stringify({
            success: true,
            mediaType: 'image',
            imageUrl: primaryImage.imageUrl,
            message: `Foto de ${product.name} preparada para envío.`,
          }),
          mediaUrl: primaryImage.imageUrl,
          mediaType: 'image',
          caption: `📸 *${product.name}* • S/ ${product.price.toFixed(2)} (SKU: ${product.sku})`,
        };
      }

      return {
        resultJson: JSON.stringify({
          success: false,
          message: `El producto ${product.name} no cuenta con fotos o videos cargados actualmente.`,
        }),
        mediaType: requestedType,
      };
    } catch (err: any) {
      return {
        resultJson: JSON.stringify({ success: false, error: err.message }),
        mediaType: requestedType,
      };
    }
  }

  private async executeCreateOrder(
    tenantId: string,
    phone: string,
    customerName: string,
    customerAddress: string,
    items: { sku: string; quantity: number }[],
    chatSessionId?: string,
    paymentMethod?: string,
  ): Promise<string> {
    try {
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        const prod = await this.productRepo.findBySku(item.sku, tenantId);
        if (!prod) {
          return JSON.stringify({ success: false, error: `El producto con código ${item.sku} no existe.` });
        }
        if (prod.stock < item.quantity) {
          return JSON.stringify({
            success: false,
            error: `Stock insuficiente para ${prod.name}. Stock actual: ${prod.stock} unidades.`,
          });
        }
        const itemSubtotal = prod.price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          productId: prod.id,
          productName: prod.name,
          quantity: item.quantity,
          unitPrice: prod.price,
          subtotal: itemSubtotal,
        });

        // Descontar inventario
        await this.productRepo.decrementStock(prod.id, item.quantity);
      }

      // Calcular costo de envío o recojo en tienda según la dirección/distrito
      const deliveryCalc = this.deliveryService.calculateDelivery(undefined, customerAddress);
      const deliveryFee = deliveryCalc.deliveryFee;
      const total = subtotal + deliveryFee;

      // Determinar método de pago
      const isCashOnDelivery = paymentMethod === 'CASH_ON_DELIVERY';
      const resolvedPaymentMethod = isCashOnDelivery ? 'CASH_ON_DELIVERY' : 'CULQI_PENDING';

      const newOrder = await this.orderRepo.create(
        {
          tenantId,
          chatSessionId,
          customerName,
          customerPhone: phone,
          customerAddress: customerAddress || 'Coordinar entrega / Recojo en tienda',
          status: OrderStatus.PENDING,
          source: OrderSource.WHATSAPP_BOT,
          subtotal,
          deliveryFee,
          total,
          paymentMethod: resolvedPaymentMethod as any,
          notes: `Generado por Asistente AI Luna - Método: ${deliveryCalc.zone.name} (S/ ${deliveryFee.toFixed(2)}) - Pago: ${isCashOnDelivery ? 'Efectivo contra entrega' : 'Online Culqi/Yape'}`,
        },
        orderItems,
      );

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const paymentUrl = isCashOnDelivery ? null : `${baseUrl}/pay/${newOrder.orderNumber}`;

      this.wsGateway.emitNewOrder(newOrder);

      if (isCashOnDelivery) {
        return JSON.stringify({
          success: true,
          orderNumber: newOrder.orderNumber,
          subtotal,
          deliveryFee,
          total,
          deliveryZone: deliveryCalc.zone.name,
          paymentMethod: 'CASH_ON_DELIVERY',
          status: newOrder.status,
          message: `Pedido registrado con éxito. El cliente pagará en *efectivo al recibir*. Informa: Subtotal S/ ${subtotal.toFixed(2)} + ${deliveryCalc.zone.name} S/ ${deliveryFee.toFixed(2)} = *Total S/ ${total.toFixed(2)}*. Le llegarán notificaciones de seguimiento por WhatsApp.`,
        });
      }

      return JSON.stringify({
        success: true,
        orderNumber: newOrder.orderNumber,
        subtotal,
        deliveryFee,
        total,
        deliveryZone: deliveryCalc.zone.name,
        paymentUrl,
        status: newOrder.status,
        message: `Pedido registrado con éxito. Informa al cliente que su pedido incluye: Subtotal S/ ${subtotal.toFixed(2)} + ${deliveryCalc.zone.name} S/ ${deliveryFee.toFixed(2)} = Total S/ ${total.toFixed(2)}. Dale el enlace de pago directo ${paymentUrl} para que pague con Yape o Tarjeta de débito/crédito.`,
      });
    } catch (err: any) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }

  private async executeTrackOrder(tenantId: string, phone: string, orderNumber?: string, chatSessionId?: string): Promise<string> {
    try {
      const statusLabels: Record<string, string> = {
        PENDING: '⏳ Pendiente de Pago / Confirmación',
        CONFIRMED: '✅ Pago Confirmado (En cola de empaquetado)',
        PROCESSING: '📦 En Preparación (Almacén empacando productos)',
        SHIPPED: '🚚 En Camino (Despachado en ruta de entrega)',
        DELIVERED: '🎉 Entregado con éxito',
        CANCELLED: '❌ Cancelado',
      };

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

      let specificOrder = null;
      if (orderNumber) {
        specificOrder = await this.orderRepo.findByOrderNumber(orderNumber.trim().toUpperCase(), tenantId);
      }

      // Buscar pedidos vinculados por chatSessionId o por teléfono
      const ordersList = await this.orderRepo.findAll({
        tenantId,
        chatSessionId,
        customerPhone: phone,
        limit: 5,
      });

      if (!specificOrder && ordersList.length === 0) {
        return JSON.stringify({
          found: false,
          message:
            'No se encontró ningún pedido reciente asociado a este número ni al código de orden ingresado.',
        });
      }

      const mapOrderInfo = (ord: any) => ({
        orderNumber: ord.orderNumber,
        customerName: ord.customerName,
        status: ord.status,
        statusLabel: statusLabels[ord.status] || ord.status,
        subtotal: ord.subtotal,
        deliveryFee: ord.deliveryFee,
        total: ord.total,
        deliveryAddress: ord.customerAddress,
        createdAt: ord.createdAt,
        items: (ord.items || []).map((i: any) => ({
          product: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        isPaid: Boolean(
          ord.paidAt ||
            ord.status === OrderStatus.CONFIRMED ||
            ord.status === OrderStatus.PROCESSING ||
            ord.status === OrderStatus.SHIPPED ||
            ord.status === OrderStatus.DELIVERED,
        ),
        paymentUrl: ord.status === OrderStatus.PENDING ? `${baseUrl}/pay/${ord.orderNumber}` : null,
      });

      const primaryOrder = specificOrder || ordersList[0];

      return JSON.stringify({
        found: true,
        totalOrdersCount: ordersList.length,
        latestOrder: mapOrderInfo(primaryOrder),
        allRecentOrders: ordersList.map(mapOrderInfo),
        message: `El cliente tiene ${ordersList.length} pedido(s) registrado(s). El pedido principal/más reciente es #${primaryOrder.orderNumber} con estado: ${statusLabels[primaryOrder.status] || primaryOrder.status}. Explícale con claridad los productos y estado en Soles (S/).`,
      });
    } catch (err: any) {
      return JSON.stringify({ found: false, error: err.message });
    }
  }

  private async executeTransferToHuman(tenantId: string, phone: string, reason: string): Promise<string> {
    try {
      await this.chatRepo.toggleBot(tenantId, phone, false);
      return JSON.stringify({
        success: true,
        transferred: true,
        message: `El bot fue pausado. Un asesor humano ha sido notificado para atender por motivo: "${reason}".`,
      });
    } catch (err: any) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }

  private generateFallbackResponse(userMsg: string): string {
    const text = userMsg.toLowerCase();
    if (text.includes('catalogo') || text.includes('productos') || text.includes('precio') || text.includes('hola')) {
      return '¡Hola! 🛍️ Bienvenido a nuestra tienda. Escribe *catalogo* para recibir nuestro catálogo en PDF o dime qué producto estás buscando y con gusto te asesoro.';
    }
    if (text.includes('asesor') || text.includes('humano') || text.includes('operador')) {
      return '👨‍💼 He transferido tu consulta a uno de nuestros asesores humanos. En breve te responderán por este mismo chat.';
    }
    return '¡Hola! 👋 Gracias por comunicarte. Escribe *catalogo* para ver los productos disponibles o *asesor* para hablar con nuestro equipo.';
  }
}
