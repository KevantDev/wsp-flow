import { PrismaClient, Role, OrderStatus, OrderSource } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos semilla (Seed)...');

  // Limpieza inicial opcional
  await prisma.auditLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.whatsAppSession.deleteMany();
  await prisma.botKeyword.deleteMany();

  // 1. Crear Usuarios
  const adminPasswordHash = await bcrypt.hash('Admin123456!', 10);
  const subadminPasswordHash = await bcrypt.hash('Subadmin123456!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@wspflow.com',
      passwordHash: adminPasswordHash,
      fullName: 'Administrador Principal',
      phoneNumber: '+5491123456789',
      role: Role.ADMIN,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const subadmin = await prisma.user.create({
    data: {
      email: 'subadmin@wspflow.com',
      passwordHash: subadminPasswordHash,
      fullName: 'Operador de Ventas',
      phoneNumber: '+5491198765432',
      role: Role.SUBADMIN,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('✅ Usuarios creados: Admin y Subadmin');

  // 2. Crear Categorías
  const catTech = await prisma.category.create({
    data: {
      name: 'Tecnología & Gadgets',
      slug: 'tecnologia-gadgets',
      description: 'Smartphones, smartwatches y dispositivos inteligentes',
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
      orderIndex: 1,
    },
  });

  const catAudio = await prisma.category.create({
    data: {
      name: 'Audio & Sonido',
      slug: 'audio-sonido',
      description: 'Auriculares inalámbricos, parlantes Bluetooth y micrófonos',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
      orderIndex: 2,
    },
  });

  const catGaming = await prisma.category.create({
    data: {
      name: 'Accesorios & Gaming',
      slug: 'accesorios-gaming',
      description: 'Teclados mecánicos, mouses ópticos y periféricos',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
      orderIndex: 3,
    },
  });

  console.log('✅ Categorías creadas');

  // 3. Crear Productos en Soles (PEN - S/.) (12 en total)
  const p1 = await prisma.product.create({
    data: {
      name: 'Auriculares Noise Cancelling Pro',
      slug: 'auriculares-noise-cancelling-pro',
      sku: 'AUD-NC-001',
      description: 'Cancelación activa de ruido, 40h de batería, sonido espacial Hi-Res y conexión multipunto Bluetooth 5.3.',
      price: 189.90,
      costPrice: 95.0,
      stock: 25,
      minStockAlert: 5,
      isAvailable: true,
      categoryId: catAudio.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Smartwatch Ultra AMOLED Titanium',
      slug: 'smartwatch-ultra-amoled-titanium',
      sku: 'WAT-ULT-002',
      description: 'Pantalla AMOLED 1.96", GPS dual, sensor de ritmo cardíaco SpO2, resistencia 5ATM y caja de titanio.',
      price: 289.00,
      costPrice: 140.0,
      stock: 14,
      minStockAlert: 4,
      isAvailable: true,
      categoryId: catTech.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Teclado Mecánico RGB Hot-Swap 75%',
      slug: 'teclado-mecanico-rgb-75',
      sku: 'KEY-RGB-003',
      description: 'Switches Gateron Pro Yellow, estructura gasket mount, teclas PBT de doble inyección y perilla multimedia.',
      price: 149.00,
      costPrice: 70.0,
      stock: 3, // Stock bajo para probar alertas en Bento Grid
      minStockAlert: 5,
      isAvailable: true,
      categoryId: catGaming.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Parlante Bluetooth Waterproof 360',
      slug: 'parlante-bluetooth-waterproof-360',
      sku: 'SPK-360-004',
      description: 'Sonido envolvente 360 grados, protección IPX7 contra agua, 24 horas de reproducción continua y luces RGB dinámicas.',
      price: 89.90,
      costPrice: 45.0,
      stock: 30,
      minStockAlert: 6,
      isAvailable: true,
      categoryId: catAudio.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'Mouse Ergonómico Inalámbrico Dual Pro',
      slug: 'mouse-ergonomico-inalambrico-dual-pro',
      sku: 'MOU-ERG-005',
      description: 'Sensor óptico de alta precisión 16,000 DPI, conectividad 2.4GHz + Bluetooth, batería recargable de 70 días y clics silenciosos.',
      price: 79.90,
      costPrice: 38.0,
      stock: 40,
      minStockAlert: 8,
      isAvailable: true,
      categoryId: catGaming.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p6 = await prisma.product.create({
    data: {
      name: 'Cámara Web 4K Pro Streaming AI',
      slug: 'camara-web-4k-pro-streaming-ai',
      sku: 'CAM-4K-006',
      description: 'Resolución Ultra HD 4K a 60fps, encuadre automático por IA con sensor Sony STARVIS y micrófonos duales con cancelación de eco.',
      price: 199.00,
      costPrice: 105.0,
      stock: 18,
      minStockAlert: 4,
      isAvailable: true,
      categoryId: catTech.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p7 = await prisma.product.create({
    data: {
      name: 'Monitor Curvo Gaming 27" QHD 180Hz',
      slug: 'monitor-curvo-gaming-27-qhd-180hz',
      sku: 'MON-CURV-007',
      description: 'Panel Fast-VA curvatura 1500R, resolución 2560x1440 QHD, 1ms de respuesta, soporte HDR400 y FreeSync Premium.',
      price: 699.00,
      costPrice: 450.0,
      stock: 12,
      minStockAlert: 3,
      isAvailable: true,
      categoryId: catGaming.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p8 = await prisma.product.create({
    data: {
      name: 'Micrófono Condensador USB Podcast Studio',
      slug: 'microfono-condensador-usb-podcast-studio',
      sku: 'MIC-POD-008',
      description: 'Cápsula de condensador cardioide 24-bit / 192 kHz, botón mute táctil capacitivo, salida de monitoreo directa y brazo metálico incluido.',
      price: 129.90,
      costPrice: 65.0,
      stock: 22,
      minStockAlert: 5,
      isAvailable: true,
      categoryId: catAudio.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p9 = await prisma.product.create({
    data: {
      name: 'Hub USB-C 10 en 1 Aluminio Aeroespacial',
      slug: 'hub-usbc-10-en-1-aluminio-aeroespacial',
      sku: 'HUB-10N1-009',
      description: 'Salida HDMI 4K@60Hz, Gigabit Ethernet RJ45, lector de tarjetas SD/TF, carga rápida Power Delivery 100W y 3 puertos USB 3.2 Gen 2.',
      price: 69.90,
      costPrice: 32.0,
      stock: 35,
      minStockAlert: 7,
      isAvailable: true,
      categoryId: catTech.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p10 = await prisma.product.create({
    data: {
      name: 'Barra de Luz LED RGB para Monitor con Dial 2.4G',
      slug: 'barra-luz-led-rgb-monitor-dial-24g',
      sku: 'LGT-RGB-010',
      description: 'Iluminación asimétrica antifatiga visual, backlight ambiental RGB reactivo y control remoto inalámbrico por dial táctil.',
      price: 65.00,
      costPrice: 30.0,
      stock: 28,
      minStockAlert: 6,
      isAvailable: true,
      categoryId: catGaming.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p11 = await prisma.product.create({
    data: {
      name: 'Cargador Rápido GaN 65W Triple Puerto',
      slug: 'cargador-rapido-gan-65w-triple-puerto',
      sku: 'CHG-GAN-011',
      description: 'Tecnología GaN III ultracompacta con 2 salidas USB-C PD 3.0 + 1 USB-A QC 4.0 para cargar laptops, tablets y móviles simultáneamente.',
      price: 55.00,
      costPrice: 25.0,
      stock: 50,
      minStockAlert: 10,
      isAvailable: true,
      categoryId: catTech.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  const p12 = await prisma.product.create({
    data: {
      name: 'Auriculares In-Ear True Wireless ANC con Estuche Táctil',
      slug: 'auriculares-in-ear-true-wireless-anc-estuche-tactil',
      sku: 'EAR-ANC-012',
      description: 'Drivers de grafeno de 11mm, cancelación híbrida activa de 42dB, estuche inteligente con pantalla táctil LED y protección IPX5.',
      price: 109.90,
      costPrice: 50.0,
      stock: 32,
      minStockAlert: 6,
      isAvailable: true,
      categoryId: catAudio.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
    },
  });

  console.log('✅ 12 Productos creados en Soles (S/.) con imágenes, stock y categorías');

  // 4. Crear Sesión de WhatsApp por Defecto
  await prisma.whatsAppSession.create({
    data: {
      sessionName: 'default',
      status: 'DISCONNECTED',
      isAutoReplyActive: true,
      welcomeMessage: '¡Hola! 👋 Bienvenido a nuestra tienda oficial en Perú. Escribe *catalogo* para ver nuestros productos en Soles o *ayuda* para contactar con un asesor.',
      outOfStockMessage: 'Lo sentimos, este producto se encuentra momentáneamente agotado. ¡Te avisaremos cuando tengamos reposición!',
    },
  });

  // 5. Crear Palabras Clave del Bot
  await prisma.botKeyword.createMany({
    data: [
      {
        keyword: 'catalogo',
        matchType: 'CONTAINS',
        response: '📦 Aquí tienes nuestro catálogo oficial de productos en Soles (S/.):',
        action: 'SHOW_CATALOG',
      },
      {
        keyword: 'asesor',
        matchType: 'CONTAINS',
        response: '👨‍💼 Un asesor de nuestro equipo se pondrá en contacto contigo en breve.',
        action: 'PAUSE_BOT',
      },
      {
        keyword: 'horarios',
        matchType: 'CONTAINS',
        response: '🕒 Nuestro horario de atención y envíos en Lima y provincias es de Lunes a Sábados de 09:00 a 20:00 hs.',
        action: 'INFO',
      },
    ],
  });

  // 6. Crear Pedidos Demostrativos en Soles
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-0001',
      customerName: 'Lucas Fernández',
      customerPhone: '51911334455',
      customerAddress: 'Av. Larco 743, Miraflores, Lima',
      status: OrderStatus.CONFIRMED,
      source: OrderSource.WHATSAPP_BOT,
      subtotal: 189.90,
      deliveryFee: 10.00,
      total: 199.90,
      notes: 'Entregar en portería - Pago confirmado Culqi',
      handledById: subadmin.id,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            unitPrice: p1.price,
            quantity: 1,
            subtotal: 189.90,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-0002',
      customerName: 'Mariana Gómez',
      customerPhone: '51911556677',
      customerAddress: 'Calle Las Camelias 450, San Isidro, Lima',
      status: OrderStatus.PENDING,
      source: OrderSource.MANUAL_DASHBOARD,
      subtotal: 289.00,
      deliveryFee: 12.00,
      total: 301.00,
      notes: 'Llamar antes de entregar (Horario tarde)',
      handledById: admin.id,
      items: {
        create: [
          {
            productId: p2.id,
            productName: p2.name,
            unitPrice: p2.price,
            quantity: 1,
            subtotal: 289.00,
          },
        ],
      },
    },
  });

  console.log('✅ Pedidos demostrativos creados en Soles:', order1.orderNumber, order2.orderNumber);

  // 7. Crear Sesiones de Chat y Mensajes Iniciales para el Live Chat
  await prisma.chatSession.create({
    data: {
      customerPhone: '51911334455',
      customerName: 'Lucas Fernández',
      isBotActive: false,
      lastInteraction: new Date(),
      unreadCount: 0,
      messages: {
        create: [
          {
            sender: 'CUSTOMER',
            senderName: 'Lucas Fernández',
            content: '¡Hola! Quería consultar sobre el estado de mi pedido de Auriculares Noise Cancelling (S/ 189.90).',
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 2),
          },
          {
            sender: 'BOT',
            senderName: 'Bot WSP',
            content: '¡Hola Lucas! 👋 Tu pedido ORD-2026-0001 se encuentra confirmado y pagado por S/ 199.90 (incluye delivery a Miraflores).',
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 2 + 10000),
          },
          {
            sender: 'AGENT',
            senderName: 'Administrador Principal',
            content: 'Hola Lucas, tu pedido ya está siendo empaquetado para despacho hoy mismo con motorizado.',
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 1),
          },
          {
            sender: 'CUSTOMER',
            senderName: 'Lucas Fernández',
            content: '¡Excelente, muchas gracias por la atención rápida!',
            isRead: true,
            createdAt: new Date(Date.now() - 1800000),
          },
        ],
      },
    },
  });

  await prisma.chatSession.create({
    data: {
      customerPhone: '51911556677',
      customerName: 'Mariana Gómez',
      isBotActive: true,
      lastInteraction: new Date(),
      unreadCount: 1,
      messages: {
        create: [
          {
            sender: 'CUSTOMER',
            senderName: 'Mariana Gómez',
            content: 'Hola, ¿tienen stock del Smartwatch Ultra AMOLED Titanium a S/ 289?',
            isRead: true,
            createdAt: new Date(Date.now() - 900000),
          },
          {
            sender: 'BOT',
            senderName: 'Bot WSP',
            content: '¡Hola Mariana! Sí, contamos con 14 unidades disponibles en stock para envío hoy mismo a San Isidro o cualquier distrito de Lima. El delivery es S/ 12.00.',
            isRead: true,
            createdAt: new Date(Date.now() - 880000),
          },
          {
            sender: 'CUSTOMER',
            senderName: 'Mariana Gómez',
            content: '¿Aceptan Yape o pago con tarjeta vía link?',
            isRead: false,
            createdAt: new Date(Date.now() - 300000),
          },
        ],
      },
    },
  });

  console.log('✅ Sesiones de Chat iniciales creadas con historial');
  console.log('🎉 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
