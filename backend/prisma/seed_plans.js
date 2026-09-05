const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultPlans = [
  {
    code: 'FREE_TRIAL',
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
    code: 'BASIC',
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
    code: 'PRO',
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
    code: 'ENTERPRISE',
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
];

async function main() {
  console.log('Seeding SaaS plans into database...');
  for (const plan of defaultPlans) {
    const upserted = await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
    console.log(`Plan [${upserted.code}] guardado: S/ ${upserted.price}/mes, MaxProd: ${upserted.maxProducts}, MaxBroadcast: ${upserted.maxBroadcasts}`);
  }
  const count = await prisma.plan.count();
  console.log(`Total planes en base de datos: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
