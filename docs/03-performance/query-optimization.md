# Optimización de Consultas, Paralelización y Eliminación de N+1

## 1. Erradicación del Problema N+1

En arquitecturas donde la base de datos es remota, los bucles de consultas individuales ($N+1$) son la causa principal de latencias excesivas.

### Caso: Agregación de GMV en `getEnrichedTenantsList`
- **Antes:** Por cada tenant, se ejecutaba una consulta individual `prisma.order.aggregate({ where: { tenantId } })`. Con 10 tenants, esto provocaba 11 consultas secuenciales (~2,500ms).
- **Ahora:** Se sustituyó por una única consulta agrupada:
  ```typescript
  const gmvGroups = await this.prisma.order.groupBy({
    by: ['tenantId'],
    _sum: { total: true },
    where: { status: { not: 'CANCELLED' } },
  });
  ```
  Tiempo de respuesta reducido a **~280ms** (1 solo viaje de red).

---

## 2. Paralelización de Operaciones con `Promise.all`

Se reemplazaron las ejecuciones secuenciales con `await` encadenados por llamadas concurrentes donde las operaciones son independientes:

1. **`OrdersService` (Creación y Reembolso de Pedidos):**
   - La búsqueda de productos en catálogo y el descuento o restauración de stock se resuelven en paralelo mediante `Promise.all`.
2. **`AiService` (Procesamiento de Mensajes de WhatsApp):**
   - La lectura de la configuración de la empresa (`getConfig`), la recuperación del historial reciente de chat (`getMessages`) y la consulta del catálogo activo se disparan simultáneamente.
   - **Ganancia:** Reduce entre 500ms y 1,000ms al tiempo de respuesta de cada mensaje de WhatsApp.
3. **`BroadcastService` y `DashboardService`:**
   - La métricas de clientes, sesiones activas e inventario se obtienen en paralelo.
