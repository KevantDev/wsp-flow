import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaProductRepository } from '../persistence/prisma/repositories/prisma-product.repository';
import { PrismaOrderRepository } from '../persistence/prisma/repositories/prisma-order.repository';
import { PrismaChatRepository } from '../persistence/prisma/repositories/prisma-chat.repository';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';
import { OrderSource, OrderStatus } from '../../domain/entities/order.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private readonly modelName = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

  constructor(
    private readonly productRepo: PrismaProductRepository,
    private readonly orderRepo: PrismaOrderRepository,
    private readonly chatRepo: PrismaChatRepository,
    private readonly wsGateway: WhatsAppGateway,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log(`🤖 OpenAI AI Service inicializado con modelo: ${this.modelName}`);
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
   * Procesa un mensaje de WhatsApp entrante con GPT-5.6-luna y Function Calling
   */
  async processWhatsAppMessage(
    customerPhone: string,
    customerName: string,
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = [],
  ): Promise<string> {
    if (!this.openai) {
      return this.generateFallbackResponse(userMessage);
    }

    try {
      const systemPrompt = `Eres Luna, la asesora virtual de ventas y atención al cliente de WSP Flow por WhatsApp.
Tu objetivo es brindar una atención cálida, profesional, rápida y persuasiva para concretar ventas de productos.

DIRECTRICES:
1. Comunícate en español de forma amigable, usando emojis apropiados (🛍️, ✨, 📦, ⚡, 🚀).
2. Tienes acceso a herramientas (functions) para consultar productos, verificar stock en tiempo real y registrar pedidos.
3. SIEMPRE utiliza la herramienta 'search_products' cuando el cliente pregunte qué vendes, pida el catálogo, o busque un producto específico.
4. Cuando el cliente decida comprar, solicita amablemente su nombre y dirección de envío (si aplica), y utiliza la herramienta 'create_order'.
5. Si el cliente pide hablar con una persona o tiene un reclamo que no puedes resolver, usa la herramienta 'transfer_to_human'.
6. Presenta los precios con el signo de dólar ($) y destaca los beneficios del producto.
7. Mantén las respuestas concisas y fáciles de leer en WhatsApp (usa saltos de línea y viñetas).`;

      const tools: OpenAI.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'search_products',
            description:
              'Busca productos en el inventario de la tienda por nombre, SKU, categoría o lista todos los disponibles.',
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
            description: 'Verifica la disponibilidad exacta de inventario de un producto.',
            parameters: {
              type: 'object',
              properties: {
                sku: {
                  type: 'string',
                  description: 'Código SKU del producto a consultar (ej: "PROD-01", "AUD-01").',
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
              'Crea y registra un nuevo pedido de compra en la base de datos PostgreSQL, descuenta el stock y genera el código de orden.',
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
              'Pasa la atención a un asesor o subadministrador humano en el panel Live Chat cuando el cliente lo solicita.',
            parameters: {
              type: 'object',
              properties: {
                reason: {
                  type: 'string',
                  description: 'Motivo de la transferencia al agente humano.',
                },
              },
              required: ['reason'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_store_info',
            description:
              'Devuelve información oficial sobre métodos de pago (Efectivo, Transferencia, Tarjeta), envíos y garantías.',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        },
      ];

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        {
          role: 'user',
          content: `[Cliente WhatsApp: ${customerName} (+${customerPhone})]: ${userMessage}`,
        },
      ];

      // Primera llamada al modelo
      let response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages,
        tools,
        tool_choice: 'auto',
      });

      let responseMessage = response.choices[0].message;

      // Loop de ejecución de herramientas (Function Calling)
      while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;

          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || '{}');
          let toolResult = '';

          this.logger.log(`🔧 Ejecutando Tool [${functionName}] con argumentos: ${JSON.stringify(args)}`);

          switch (functionName) {
            case 'search_products':
              toolResult = await this.executeSearchProducts(args.query, args.categoryId);
              break;

            case 'check_stock':
              toolResult = await this.executeCheckStock(args.sku);
              break;

            case 'create_order':
              toolResult = await this.executeCreateOrder(
                customerPhone,
                args.customerName || customerName,
                args.customerAddress || '',
                args.items || [],
              );
              break;

            case 'transfer_to_human':
              toolResult = await this.executeTransferToHuman(customerPhone, args.reason);
              break;

            case 'get_store_info':
              toolResult = JSON.stringify({
                storeName: 'WSP Flow Store',
                paymentMethods: ['Transferencia Bancaria', 'MercadoPago / Tarjetas', 'Efectivo contra entrega'],
                shipping: 'Envíos a todo el país en 24-48 hs hábiles.',
                guarantee: 'Garantía oficial de 6 meses en todos los productos.',
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

        // Llamar nuevamente al modelo con el resultado de las herramientas
        response = await this.openai.chat.completions.create({
          model: this.modelName,
          messages,
        });

        responseMessage = response.choices[0].message;
      }

      return responseMessage.content || '¡Hola! ¿En qué puedo ayudarte hoy con nuestro catálogo?';
    } catch (error: any) {
      this.logger.error(`Error en OpenAI AI Service (${this.modelName}): ${error.message}`);
      return this.generateFallbackResponse(userMessage);
    }
  }

  // --- Implementaciones de Tools / Functions ---

  private async executeSearchProducts(query?: string, categoryId?: string): Promise<string> {
    try {
      const products = await this.productRepo.findAll({ categoryId, search: query, onlyAvailable: true });
      const simplified = products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.categoryName || 'General',
        description: p.description,
        available: p.isAvailable && p.stock > 0,
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
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message });
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

      const total = subtotal;
      const newOrder = await this.orderRepo.create(
        {
          customerName,
          customerPhone: phone,
          customerAddress,
          status: OrderStatus.PENDING,
          source: OrderSource.WHATSAPP_BOT,
          subtotal,
          deliveryFee: 0,
          total,
          notes: `Generado automáticamente por Asistente AI Luna (${this.modelName})`,
        },
        orderItems,
      );

      // Notificar al Dashboard vía WebSocket
      this.wsGateway.emitNewOrder(newOrder);

      return JSON.stringify({
        success: true,
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
        status: newOrder.status,
        message: 'Pedido registrado con éxito en PostgreSQL y notificado al panel',
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
      return '¡Hola! 🛍️ Bienvenido a nuestra tienda. Escribe *catalogo* para ver los productos en promoción o dime qué estás buscando y con gusto te ayudo.';
    }
    if (text.includes('asesor') || text.includes('humano')) {
      return '👨‍💼 He transferido tu consulta a uno de nuestros asesores humanos. En breve te responderán por este mismo chat.';
    }
    return '¡Hola! 👋 Gracias por comunicarte. Escribe *catalogo* para ver nuestras ofertas o *asesor* para hablar con un representante.';
  }
}
