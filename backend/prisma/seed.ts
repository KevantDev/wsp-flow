import { PrismaClient, Role, OrderStatus, OrderSource, PaymentMethod, PaymentStatus, TenantPlan, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos semilla Multi-Tenant SaaS...');

  // Limpieza inicial
  await prisma.auditLog.deleteMany();
  await prisma.broadcastRecipient.deleteMany();
  await prisma.broadcastCampaign.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.whatsAppSession.deleteMany();
  await prisma.companyConfig.deleteMany();
  await prisma.botKeyword.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.plan.deleteMany();

  // 0. Crear Planes de Suscripción SaaS
  await prisma.plan.createMany({
    data: [
      {
        code: TenantPlan.FREE_TRIAL,
        name: 'Free Trial',
        description: 'Para emprendimientos que están iniciando y quieren probar el bot de WhatsApp.',
        price: 0,
        currency: 'PEN',
        billingPeriod: 'MONTHLY',
        maxProducts: 20,
        maxBroadcasts: 50,
        maxUsers: 1,
        hasMercadoPago: false,
        hasAiBot: true,
        hasCustomThemes: false,
        hasPdfCatalog: false,
        features: [
          'Bot IA Luna (Consultas básicas)',
          'WhatsApp conectado 24/7',
          'Hasta 20 productos',
          '50 difusiones / mes',
          '1 usuario administrador',
        ],
        badgeColor: 'zinc',
        isPopular: false,
        isActive: true,
      },
      {
        code: TenantPlan.BASIC,
        name: 'Basic',
        description: 'Para negocios en crecimiento que necesitan catálogo web y pasarela de cobros.',
        price: 49,
        currency: 'PEN',
        billingPeriod: 'MONTHLY',
        maxProducts: 100,
        maxBroadcasts: 500,
        maxUsers: 2,
        hasMercadoPago: true,
        hasAiBot: true,
        hasCustomThemes: false,
        hasPdfCatalog: true,
        features: [
          'Bot IA Luna avanzado con catálogo',
          'Pasarela Mercado Pago (Yape y tarjetas)',
          'Hasta 100 productos',
          '500 difusiones / mes',
          'Catálogo PDF descargable',
          '2 operadores / subadmins',
        ],
        badgeColor: 'blue',
        isPopular: false,
        isActive: true,
      },
      {
        code: TenantPlan.PRO,
        name: 'Pro',
        description: 'Para marcas consolidadas que requieren personalización multitema y alto volumen.',
        price: 99,
        currency: 'PEN',
        billingPeriod: 'MONTHLY',
        maxProducts: 500,
        maxBroadcasts: 2500,
        maxUsers: 5,
        hasMercadoPago: true,
        hasAiBot: true,
        hasCustomThemes: true,
        hasPdfCatalog: true,
        features: [
          'Todo en Basic',
          '3 temas de tienda (Cyber Tech, Minimal, Warm)',
          'Hasta 500 productos',
          '2,500 difusiones CRM / mes',
          '5 operadores / subadmins',
          'Reportes de ventas avanzados',
        ],
        badgeColor: 'indigo',
        isPopular: true,
        isActive: true,
      },
      {
        code: TenantPlan.ENTERPRISE,
        name: 'Enterprise',
        description: 'Volumen corporativo con productos y difusiones ilimitadas, más soporte prioritario.',
        price: 249,
        currency: 'PEN',
        billingPeriod: 'MONTHLY',
        maxProducts: -1,
        maxBroadcasts: -1,
        maxUsers: -1,
        hasMercadoPago: true,
        hasAiBot: true,
        hasCustomThemes: true,
        hasPdfCatalog: true,
        features: [
          'Todo en Pro',
          'Productos y difusiones ilimitadas',
          'Operadores y subadmins ilimitados',
          'Múltiples números de WhatsApp',
          'Soporte 24/7 y SLA dedicado',
        ],
        badgeColor: 'amber',
        isPopular: false,
        isActive: true,
      },
    ],
  });

  console.log('✅ Planes de suscripción SaaS creados (Free Trial, Basic, Pro, Enterprise)');

  // 1. Crear Tenants (Emprendimientos / Tiendas)
  const tenantTech = await prisma.tenant.create({
    data: {
      name: 'WSP Tech & Gaming',
      slug: 'wsp-tech',
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.ENTERPRISE,
      logoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
      maxProducts: 200,
      maxBroadcasts: 5000,
    },
  });

  const tenantFashion = await prisma.tenant.create({
    data: {
      name: 'Moda Urbana & Sneakers',
      slug: 'moda-urbana',
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.PRO,
      logoUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&auto=format&fit=crop&q=80',
      maxProducts: 100,
      maxBroadcasts: 1500,
    },
  });

  console.log(`✅ Tenants creados: "${tenantTech.name}" (${tenantTech.id}) y "${tenantFashion.name}" (${tenantFashion.id})`);

  // 2. Crear Usuarios
  const passwordHash = await bcrypt.hash('Admin123456!', 10);

  // Super Admin del SaaS (Plataforma Global)
  await prisma.user.create({
    data: {
      email: 'superadmin@wspflow.com',
      passwordHash,
      fullName: 'Super Administrador SaaS',
      phoneNumber: '+51999999999',
      role: Role.SUPER_ADMIN,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  // Admin de Tienda Tech
  await prisma.user.create({
    data: {
      tenantId: tenantTech.id,
      email: 'admin@wspflow.com',
      passwordHash,
      fullName: 'Admin WSP Tech',
      phoneNumber: '+51987654321',
      role: Role.ADMIN,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // Operador de Ventas Tech
  await prisma.user.create({
    data: {
      tenantId: tenantTech.id,
      email: 'subadmin@wspflow.com',
      passwordHash,
      fullName: 'Asesor de Ventas Tech',
      phoneNumber: '+51987654320',
      role: Role.SUBADMIN,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  // Admin de Tienda Moda
  await prisma.user.create({
    data: {
      tenantId: tenantFashion.id,
      email: 'admin@modaurbana.com',
      passwordHash,
      fullName: 'Admin Moda Urbana',
      phoneNumber: '+51912345678',
      role: Role.ADMIN,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('✅ Usuarios creados: SuperAdmin, Admin Tech, Subadmin Tech, Admin Fashion');

  // 3. Crear Configuraciones de Empresa (CompanyConfig)
  await prisma.companyConfig.create({
    data: {
      tenantId: tenantTech.id,
      companyName: 'WSP Tech & Gaming',
      businessDescription: 'Tienda de tecnología de punta, audio Hi-Res y accesorios gaming.',
      address: 'Av. José Larco 743, Miraflores, Lima',
      pickupStoreAddress: 'Av. José Larco 743, Miraflores, Lima (Gratis)',
      aiModel: 'gpt-4o-mini',
      aiTemperature: 0.7,
      historyMessageLimit: 15,
      systemPrompt: 'Eres Luna, la asesora virtual experta en tecnología de WSP Tech. Responde con calidez peruana y recomienda productos con entusiasmo.',
      antiBanDelayMinMs: 1500,
      antiBanDelayMaxMs: 3500,
      deliveryZone1Price: 10,
      deliveryZone2Price: 12,
      deliveryZone3Price: 15,
      deliveryProvincePrice: 15,
    },
  });

  await prisma.companyConfig.create({
    data: {
      tenantId: tenantFashion.id,
      companyName: 'Moda Urbana & Sneakers',
      businessDescription: 'Boutique de moda urbana, hoodies oversized y zapatillas exclusivas.',
      address: 'Calle Las Begonias 441, San Isidro, Lima',
      pickupStoreAddress: 'Calle Las Begonias 441, San Isidro, Lima (Gratis)',
      aiModel: 'gpt-4o-mini',
      aiTemperature: 0.7,
      historyMessageLimit: 15,
      systemPrompt: 'Eres Mia, la asesora de estilo de Moda Urbana. Ayuda a los clientes a elegir su talla ideal y coordinar envíos rápidos.',
      antiBanDelayMinMs: 1500,
      antiBanDelayMaxMs: 3500,
      deliveryZone1Price: 10,
      deliveryZone2Price: 12,
      deliveryZone3Price: 15,
      deliveryProvincePrice: 15,
    },
  });

  console.log('✅ Configuraciones de empresa creadas para ambos tenants');

  // 4. Crear Categorías para Tenant Tech
  const catTech = await prisma.category.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Tecnología & Gadgets',
      slug: 'tecnologia-gadgets',
      description: 'Smartphones, smartwatches y dispositivos inteligentes',
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
      orderIndex: 1,
    },
  });

  const catAudio = await prisma.category.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Audio & Sonido',
      slug: 'audio-sonido',
      description: 'Auriculares inalámbricos, parlantes Bluetooth y micrófonos',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
      orderIndex: 2,
    },
  });

  const catGaming = await prisma.category.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Accesorios & Gaming',
      slug: 'accesorios-gaming',
      description: 'Teclados mecánicos, mouses ópticos y periféricos',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
      orderIndex: 3,
    },
  });

  // Categorías para Tenant Fashion
  const catSneakers = await prisma.category.create({
    data: {
      tenantId: tenantFashion.id,
      name: 'Sneakers & Zapatillas',
      slug: 'sneakers-zapatillas',
      description: 'Zapatillas urbanas de edición limitada y streetwear',
      imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&auto=format&fit=crop&q=80',
      orderIndex: 1,
    },
  });

  const catHoodies = await prisma.category.create({
    data: {
      tenantId: tenantFashion.id,
      name: 'Hoodies & Poleras',
      slug: 'hoodies-poleras',
      description: 'Poleras oversized de algodón orgánico',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&auto=format&fit=crop&q=80',
      orderIndex: 2,
    },
  });

  console.log('✅ Categorías creadas para ambos tenants');

  // 5. Crear Productos para Tenant Tech
  const p1 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
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
          { imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', isPrimary: true },
          { imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80', isPrimary: false },
        ],
      },
    },
  });

  const p2 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Smartwatch Ultra AMOLED Titanium',
      slug: 'smartwatch-ultra-amoled-titanium',
      sku: 'WCH-ULT-002',
      description: 'Pantalla AMOLED 1.43", caja de titanio resistente al agua IP68, sensor SpO2, GPS integrado y batería de 14 días.',
      price: 249.90,
      costPrice: 130.0,
      stock: 18,
      minStockAlert: 4,
      isAvailable: true,
      categoryId: catTech.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  const p3 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Teclado Mecánico RGB Hot-Swap 75%',
      slug: 'teclado-mecanico-rgb-hot-swap-75',
      sku: 'KEY-RGB-003',
      description: 'Switches Gateron Yellow pre-lubricados, estructura gasket mount, teclas PBT de doble inyección y perilla de volumen.',
      price: 199.00,
      costPrice: 99.0,
      stock: 12,
      minStockAlert: 3,
      isAvailable: true,
      categoryId: catGaming.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  const p4 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Mouse Gamer Wireless Ultralight 49g',
      slug: 'mouse-gamer-wireless-ultralight-49g',
      sku: 'MOU-WL-004',
      description: 'Sensor óptico PixArt 3395 (26000 DPI), polling rate 4000Hz, switches ópticos Kailh y peso ultra ligero de 49 gramos.',
      price: 129.90,
      costPrice: 60.0,
      stock: 3,
      minStockAlert: 5,
      isAvailable: true,
      categoryId: catGaming.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  const p5 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Soporte de Carga Inalámbrica 3 en 1 MagSafe',
      slug: 'soporte-carga-inalambrica-3-en-1-magsafe',
      sku: 'CHG-MAG-005',
      description: 'Estación de carga rápida magnética de 15W para iPhone, Apple Watch y AirPods. Acabado en aluminio espacial con diseño plegable para viajes y protección térmica inteligente.',
      price: 149.90,
      costPrice: 70.0,
      stock: 20,
      minStockAlert: 5,
      isAvailable: true,
      categoryId: catTech.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  const p6 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Parlante Portátil Bluetooth Impermeable IPX7 BassBoost',
      slug: 'parlante-portatil-bluetooth-ipx7-bassboost',
      sku: 'SPK-BT-006',
      description: 'Potencia de 30W con radiadores pasivos duales para graves profundos. Batería de 24 horas continuas, resistencia al agua IPX7 y sincronización estéreo TWS para emparejar 2 parlantes.',
      price: 169.00,
      costPrice: 85.0,
      stock: 15,
      minStockAlert: 4,
      isAvailable: true,
      categoryId: catAudio.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  const p7 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Cámara Web 4K Ultra HD con Anillo de Luz LED y Micrófono Dual',
      slug: 'camara-web-4k-ultra-hd-anillo-luz',
      sku: 'CAM-4K-007',
      description: 'Sensor Sony Starvis 4K a 60fps con enfoque automático ultra rápido, obturador de privacidad magnético, anillo de luz táctil con 3 tonos y micrófonos con cancelación de eco.',
      price: 219.00,
      costPrice: 110.0,
      stock: 14,
      minStockAlert: 3,
      isAvailable: true,
      categoryId: catGaming.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  const p8 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Hub USB-C 8 en 1 Multipuerto Aluminio 4K HDMI 100W PD',
      slug: 'hub-usb-c-8-en-1-aluminio-4k-100w',
      sku: 'HUB-USBC-008',
      description: 'Adaptador multipuerto USB-C con salida HDMI 4K a 60Hz, puerto de carga Power Delivery 100W, Gigabit Ethernet RJ45, 3 puertos USB 3.0 (5Gbps) y lectores de tarjetas SD/microSD.',
      price: 119.90,
      costPrice: 55.0,
      stock: 22,
      minStockAlert: 5,
      isAvailable: true,
      categoryId: catTech.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  const p9 = await prisma.product.create({
    data: {
      tenantId: tenantTech.id,
      name: 'Mousepad Gamer XL RGB Speed Control Impermeable 900x400mm',
      slug: 'mousepad-gamer-xl-rgb-900x400',
      sku: 'PAD-RGB-009',
      description: 'Superficie de microfibra de baja fricción optimizada para sensores ópticos y láser. Iluminación RGB perimetral con 14 modos cromáticos, base de goma antideslizante y recubrimiento hidrofóbico.',
      price: 79.90,
      costPrice: 35.0,
      stock: 30,
      minStockAlert: 6,
      isAvailable: true,
      categoryId: catGaming.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  // Productos para Tenant Fashion
  await prisma.product.create({
    data: {
      tenantId: tenantFashion.id,
      name: 'Sneakers Retro Streetwear 90s',
      slug: 'sneakers-retro-streetwear-90s',
      sku: 'SNK-RET-001',
      description: 'Zapatillas urbanas de cuero gamuzado con suela vulcanizada de alta tracción y amortiguación CloudWalk.',
      price: 289.00,
      costPrice: 140.0,
      stock: 15,
      minStockAlert: 3,
      isAvailable: true,
      categoryId: catSneakers.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      tenantId: tenantFashion.id,
      name: 'Hoodie Oversized Heavy Cotton',
      slug: 'hoodie-oversized-heavy-cotton',
      sku: 'HOD-OVR-002',
      description: 'Polera con capucha de 450 GSM, corte oversized unisex y felpa interna térmica de alta durabilidad.',
      price: 159.00,
      costPrice: 70.0,
      stock: 20,
      minStockAlert: 4,
      isAvailable: true,
      categoryId: catHoodies.id,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80', isPrimary: true },
        ],
      },
    },
  });

  console.log('✅ Productos creados para ambos tenants');

  // 6. Crear Sesiones de Chat de demostración
  const chat1 = await prisma.chatSession.create({
    data: {
      tenantId: tenantTech.id,
      customerPhone: '51987654321',
      customerName: 'Carlos Mendoza',
      isBotActive: true,
      lastInteraction: new Date(),
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        chatSessionId: chat1.id,
        sender: 'CUSTOMER',
        senderName: 'Carlos Mendoza',
        content: '¡Hola! ¿Tienen stock de los Auriculares Noise Cancelling?',
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        chatSessionId: chat1.id,
        sender: 'BOT',
        senderName: 'Luna Bot',
        content: '¡Hola Carlos! 😊 Sí, tenemos 25 unidades disponibles en stock con entrega inmediata en Lima por S/ 189.90. ¿Te gustaría ordenar uno?',
        createdAt: new Date(Date.now() - 3500000),
      },
    ],
  });

  // 7. Crear Pedidos de demostración
  await prisma.order.create({
    data: {
      tenantId: tenantTech.id,
      orderNumber: 'ORD-20260830-101',
      customerName: 'Carlos Mendoza',
      customerPhone: '51987654321',
      customerAddress: 'Av. Javier Prado Este 2450, San Borja, Lima',
      status: OrderStatus.CONFIRMED,
      source: OrderSource.WHATSAPP_BOT,
      subtotal: 189.90,
      deliveryFee: 10.00,
      total: 199.90,
      paymentMethod: PaymentMethod.CULQI_CARD,
      paymentStatus: PaymentStatus.PAID,
      culqiChargeId: 'chr_seed_card_101',
      paidAt: new Date(),
      chatSessionId: chat1.id,
      notes: 'Pedido confirmado y pagado en línea con Tarjeta',
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

  await prisma.order.create({
    data: {
      tenantId: tenantTech.id,
      orderNumber: 'ORD-20260830-102',
      customerName: 'Lucía Fernández',
      customerPhone: '51998877665',
      customerAddress: 'Av. Benavides 1530, Miraflores, Lima',
      status: OrderStatus.DELIVERED,
      source: OrderSource.WHATSAPP_BOT,
      subtotal: 249.90,
      deliveryFee: 0.00,
      total: 249.90,
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      paymentStatus: PaymentStatus.AWAITING_CASH,
      notes: 'Entrega contra entrega realizada. Pendiente de recaudo por supervisor.',
      items: {
        create: [
          {
            productId: p2.id,
            productName: p2.name,
            unitPrice: p2.price,
            quantity: 1,
            subtotal: 249.90,
          },
        ],
      },
    },
  });

  console.log('🌱 ¡Seed Multi-Tenant completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
