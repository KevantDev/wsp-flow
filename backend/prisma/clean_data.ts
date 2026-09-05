import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando Limpieza Total de Pedidos, Conversaciones y Mensajes...');

  // 1. Eliminar Items y Órdenes
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✅ Eliminados ${deletedOrderItems.count} items de pedidos.`);
  console.log(`✅ Eliminados ${deletedOrders.count} pedidos.`);

  // 2. Eliminar Mensajes y Sesiones de Chat
  const deletedMessages = await prisma.chatMessage.deleteMany({});
  const deletedSessions = await prisma.chatSession.deleteMany({});
  console.log(`✅ Eliminados ${deletedMessages.count} mensajes de chat.`);
  console.log(`✅ Eliminadas ${deletedSessions.count} sesiones de chat.`);

  // 3. Eliminar Campañas y Destinatarios de Difusión (si existen)
  try {
    const deletedRecipients = await prisma.broadcastRecipient.deleteMany({});
    const deletedCampaigns = await prisma.broadcastCampaign.deleteMany({});
    console.log(`✅ Eliminados ${deletedRecipients.count} destinatarios de difusión.`);
    console.log(`✅ Eliminadas ${deletedCampaigns.count} campañas de difusión.`);
  } catch (e: any) {
    console.log('ℹ️ Tablas de difusión no requieren limpieza.');
  }

  // 4. Limpiar Logs de Auditoría
  const deletedLogs = await prisma.auditLog.deleteMany({});
  console.log(`✅ Eliminados ${deletedLogs.count} logs de auditoría.`);

  // 5. Restablecer Stock de Productos a sus cantidades base
  const stockMap: Record<string, number> = {
    'AUD-NC-001': 25,
    'WAT-ULT-002': 14,
    'KEY-RGB-003': 15,
    'SPK-360-004': 30,
    'MOU-ERG-005': 40,
    'CAM-4K-006': 18,
    'MON-CURV-007': 12,
    'MIC-POD-008': 22,
    'HUB-10N1-009': 35,
    'LGT-RGB-010': 28,
    'CHG-GAN-011': 50,
    'EAR-ANC-012': 32,
  };

  for (const [sku, stock] of Object.entries(stockMap)) {
    await prisma.product.updateMany({
      where: { sku },
      data: { stock, isAvailable: true },
    });
  }
  console.log('✅ Stock de productos restablecido a valores óptimos.');

  console.log('\n🎉 ¡Limpieza Total completada exitosamente! Base de datos lista para pruebas desde cero.');
}

main()
  .catch((err) => {
    console.error('❌ Error durante la limpieza:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
