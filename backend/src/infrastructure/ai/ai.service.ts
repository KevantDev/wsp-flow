import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaProductRepository } from '../persistence/prisma/repositories/prisma-product.repository';
import { PrismaOrderRepository } from '../persistence/prisma/repositories/prisma-order.repository';
import { PrismaChatRepository } from '../persistence/prisma/repositories/prisma-chat.repository';
import { PrismaCompanyConfigRepository } from '../persistence/prisma/repositories/prisma-company-config.repository';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { OrderSource, OrderStatus } from '../../domain/entities/order.entity';
import { DeliveryService } from '../../application/services/delivery.service';

export interface AiProcessResult {
  replyText: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  caption?: string;
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
   * Procesa un mensaje de WhatsApp entrante con GPT-5.6-luna, memoria de conversación y Function Calling
   */
  async processWhatsAppMessage(
    customerPhone: string,
    customerName: string,
    userMessage: string,
    chatSessionId?: string,
  ): Promise<AiProcessResult> {
    if (!this.openai) {
      return { replyText: this.generateFallbackResponse(userMessage) };
    }

    try {
      // 1. Obtener la configuración dinámica de la empresa y la IA
      const config = await this.configRepo.getConfig();
      let modelToUse = config.aiModel || this.defaultModel || 'gpt-4o-mini';
      if (modelToUse.includes('luna') || !modelToUse.startsWith('gpt-')) {
        modelToUse = 'gpt-4o-mini';
      }
      const temperature = config.aiTemperature ?? 0.7;
      const historyLimit = config.historyMessageLimit ?? 15;

      // 2. Obtener historial reciente de la conversación para contexto continuo
      let recentHistory: { role: 'user' | 'assistant'; content: string }[] = [];
      if (chatSessionId) {
        const messages = await this.chatRepo.getMessages(chatSessionId, historyLimit);
        // Tomar los últimos mensajes antes del actual
        recentHistory = messages
          .slice(-historyLimit)
          .map((m) => ({
            role: m.sender === 'CUSTOMER' ? ('user' as const) : ('assistant' as const),
            content: m.content,
          }));
      }

      // 3. Obtener catálogo rápido de productos activos para contexto base
      const activeProducts = await this.productRepo.findAll({ onlyAvailable: true });
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

REGLAS INVIOLABLES DE SEGURIDAD & ENFOQUE COMERCIAL (SHIELDING):
1. Eres exclusivamente la asesora comercial de ventas de ${config.companyName}.
2. Tienes estrictamente prohibido responder temas ajenos a la tienda (no resolver tareas escolares, no generar código, no opinar de política o temas no comerciales). Si el usuario insiste, redirige amablemente hacia los productos.
3. Responde siempre con calidez humana, precisión y empatía en español. Utiliza emojis comerciales sutiles (🛍️, ✨, 📦, ⚡, 🚀, 💬).
4. Si el cliente solicita fotos o video demostrativo de un producto, utiliza 'send_product_media'.
5. Cuando el cliente desee comprar, pide su nombre y dirección de entrega y ejecuta 'create_order'.
6. Si el cliente pide expresamente una persona o no puedes resolver su problema, usa 'transfer_to_human'.${salesUrgencyPrompt}`;

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
              'Crea y registra un nuevo pedido de compra en PostgreSQL, descuenta el stock y notifica al panel To-Do Kanban.',
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
              required: ['customerName', 'items'],
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

      let mediaToDispatch: { mediaUrl: string; mediaType: 'image' | 'video'; caption?: string } | undefined;

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
            case 'search_products':
              toolResult = await this.executeSearchProducts(args.query, args.categoryId);
              break;

            case 'check_stock':
              toolResult = await this.executeCheckStock(args.sku);
              break;

            case 'send_product_media': {
              const mediaResult = await this.executeSendProductMedia(args.sku, args.mediaType || 'image');
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
                customerPhone,
                args.customerName || customerName,
                args.customerAddress || '',
                args.items || [],
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
                pickupAddress: 'Av. Larco 743, Miraflores, Lima (Gratis)',
              });
              break;
            }

            case 'transfer_to_human':
              toolResult = await this.executeTransferToHuman(customerPhone, args.reason);
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

      return {
        replyText: responseMessage.content || '¡Hola! ¿En qué más te puedo asesorar sobre nuestros productos?',
        mediaUrl: mediaToDispatch?.mediaUrl,
        mediaType: mediaToDispatch?.mediaType,
        caption: mediaToDispatch?.caption,
      };
    } catch (error: any) {
      this.logger.error(`Error en OpenAI AI Service: ${error.message}`);
      return { replyText: this.generateFallbackResponse(userMessage) };
    }
  }

  // --- Implementaciones de Tools / Functions ---

  private async executeSearchProducts(query?: string, categoryId?: string): Promise<string> {
    try {
      const products = await this.productRepo.findAll({ categoryId, search: query, onlyAvailable: true });
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

  private async executeCheckStock(sku: string): Promise<string> {
    try {
      const product = await this.productRepo.findBySku(sku);
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
    sku: string,
    requestedType: 'image' | 'video',
  ): Promise<{ resultJson: string; mediaUrl?: string; mediaType: 'image' | 'video'; caption?: string }> {
    try {
      const product = await this.productRepo.findBySku(sku);
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
    phone: string,
    customerName: string,
    customerAddress: string,
    items: { sku: string; quantity: number }[],
  ): Promise<string> {
    try {
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        const prod = await this.productRepo.findBySku(item.sku);
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

      const newOrder = await this.orderRepo.create(
        {
          customerName,
          customerPhone: phone,
          customerAddress: customerAddress || 'Coordinar entrega / Recojo en tienda',
          status: OrderStatus.PENDING,
          source: OrderSource.WHATSAPP_BOT,
          subtotal,
          deliveryFee,
          total,
          paymentMethod: 'CULQI_PENDING',
          notes: `Generado por Asistente AI Luna - Método: ${deliveryCalc.zone.name} (S/ ${deliveryFee.toFixed(2)})`,
        },
        orderItems,
      );

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const paymentUrl = `${baseUrl}/pay/${newOrder.orderNumber}`;

      this.wsGateway.emitNewOrder(newOrder);

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

  private async executeTransferToHuman(phone: string, reason: string): Promise<string> {
    try {
      await this.chatRepo.toggleBot(phone, false);
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
