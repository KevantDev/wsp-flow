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

  // 3. Crear Productos
  const p1 = await prisma.product.create({
    data: {
      name: 'Auriculares Noise Cancelling Pro',
      slug: 'auriculares-noise-cancelling-pro',
      sku: 'AUD-NC-001',
      description: 'Cancelación activa de ruido, 40h de batería, sonido espacial Hi-Res y conexión multipunto Bluetooth 5.3.',
      price: 129.99,
      costPrice: 75.0,
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
      price: 189.5,
      costPrice: 110.0,
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
      price: 89.0,
      costPrice: 48.0,
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
      price: 59.99,
      costPrice: 30.0,
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

  console.log('✅ Productos creados con imágenes y stock');

  // 4. Crear Sesión de WhatsApp por Defecto
  await prisma.whatsAppSession.create({
    data: {
      sessionName: 'default',
      status: 'DISCONNECTED',
      isAutoReplyActive: true,
      welcomeMessage: '¡Hola! 👋 Bienvenido a nuestra tienda oficial. Escribe *catalogo* para ver nuestros productos o *ayuda* para contactar con un asesor.',
      outOfStockMessage: 'Lo sentimos, este producto se encuentra momentáneamente agotado. ¡Te avisaremos cuando tengamos reposición!',
    },
  });

  // 5. Crear Palabras Clave del Bot
  await prisma.botKeyword.createMany({
    data: [
      {
        keyword: 'catalogo',
        matchType: 'CONTAINS',
        response: '📦 Aquí tienes nuestro catálogo de productos en stock:',
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
        response: '🕒 Nuestro horario de atención y envíos es de Lunes a Sábados de 09:00 a 20:00 hs.',
        action: 'INFO',
      },
    ],
  });

  // 6. Crear un Pedido Demostrativo
  const order = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-0001',
      customerName: 'Lucas Fernández',
      customerPhone: '+5491133445566',
      customerAddress: 'Av. Corrientes 1234, CABA',
      status: OrderStatus.CONFIRMED,
      source: OrderSource.WHATSAPP_BOT,
      subtotal: 129.99,
      deliveryFee: 5.0,
      total: 134.99,
      notes: 'Entregar en horario de tarde',
      handledById: subadmin.id,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            unitPrice: p1.price,
            quantity: 1,
            subtotal: 129.99,
          },
        ],
      },
    },
  });

  console.log('✅ Pedido demostrativo creado:', order.orderNumber);
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
