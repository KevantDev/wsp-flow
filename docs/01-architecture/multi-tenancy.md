# Arquitectura Multi-Tenant SaaS & Super Admin Portal

## 1. Modelo de Multi-Inquilino (Multi-Tenancy)

El sistema opera como una plataforma SaaS multi-empresa donde múltiples comercios conviven sobre la misma infraestructura física pero manteniendo estricto aislamiento lógico:

- **Aislamiento por `tenantId`:** Cada registro operacional (`Product`, `Category`, `Order`, `ChatMessage`, `WhatsAppSession`, `CompanyConfig`) pertenece a un único inquilino.
- **Ruta Pública por Slug:** Cada comercio cuenta con una URL pública amigable (ej: `/store/wsp-tech`, `/store/boutique-paris`).
- **Instancias Baileys Independientes:** Cada inquilino dispone de su propio socket de WhatsApp autenticado con su número telefónico y almacenamiento de credenciales aislado en `./auth_info_baileys/:tenantId`.

---

## 2. Niveles de Planes de Suscripción & Modelo Dinámico de Configuración

A diferencia de modelos rígidos con enums estáticos, WSP Flow cuenta con una tabla relacional `plans` en PostgreSQL administrable en caliente por el Super Administrador desde `/admin/plans`:

| Plan Code | Nombre | Precio (PEN) | Máx. Productos | Difusiones/Mes | Máx. Operadores | Mercado Pago | Temas Multitema | Catálogo PDF |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`FREE_TRIAL`** | Free Trial | S/ 0 | 20 | 50 | 1 | ❌ Bloqueado | ❌ Estándar | ❌ |
| **`BASIC`** | Basic | S/ 49 | 100 | 500 | 2 | ✅ Habilitado | ❌ Estándar | ✅ PDFKit |
| **`PRO`** | Pro | S/ 99 | 500 | 2,500 | 5 | ✅ Habilitado | ✅ 3 Temas | ✅ PDFKit |
| **`ENTERPRISE`** | Enterprise | S/ 249 | Ilimitado (-1) | Ilimitado (-1) | Ilimitado (-1) | ✅ Habilitado | ✅ 3 Temas | ✅ PDFKit |

### 2.1. Política de Cumplimiento Estricto (Enforcement)
1. **Creación de Productos (`POST /api/v1/products`):** El servicio `PlansService.checkTenantQuota(tenantId, 'PRODUCT')` audita el conteo de productos activos. Si `count >= maxProducts` y el límite no es ilimitado (`-1`), responde con `HTTP 403 Forbidden` informando la cuota agotada.
2. **Campañas Masivas CRM (`POST /api/v1/broadcasts`):** Se valida el tamaño de la audiencia estimada y el volumen acumulado de envíos en el mes calendario actual frente a `maxBroadcasts`.
3. **Registro de Subadministradores (`POST /api/v1/auth/register-subadmin`):** Se valida que la cantidad de operadores de la tienda no sobrepase `maxUsers`.
4. **Pasarela Mercado Pago (`GET /api/v1/payments/mercadopago/connect`):** Tenants en `FREE_TRIAL` son rechazados al intentar iniciar OAuth Connect o ingresar llaves privadas sin contratar `BASIC` o superior.
5. **Personalización Multitema:** Los temas `dark-tech` y `warm-brand` requieren suscripción `PRO` o `ENTERPRISE`.

### 2.2. Endpoints de Planes (`/api/v1/plans`)
- `GET /api/v1/plans`: Lista pública de planes activos (para landing y checkout).
- `GET /api/v1/plans/my-quota`: Consulta en tiempo real de consumo y límites para la tienda autenticada.
- `GET /api/v1/plans/admin`: Panel de Super Admin con métricas de tiendas suscritas por plan.
- `PATCH /api/v1/plans/:code`: Actualización de precios, cuotas y características con sincronización en caliente a tiendas existentes.

---

## 3. Super Admin Portal (`/admin/super-dashboard`)

El portal de Super Administrador permite a los dueños de la plataforma supervisar la salud del SaaS:

1. **Métricas Financieras Consolidadas:**
   - **MRR (Monthly Recurring Revenue):** Ingresos recurrentes mensuales por suscripciones en soles (PEN).
   - **ARR (Annual Recurring Revenue):** Proyección anualizada del negocio.
   - **GMV Global (Gross Merchandise Value):** Volumen total de ventas transaccionadas por todas las tiendas cliente.
   - **Tasa de Activación WhatsApp:** Porcentaje de tiendas con socket Baileys en estado `CONNECTED`.

2. **Gestión Integral de Tiendas (`/admin/tenants`):**
   - Aprovisionamiento instantáneo de nuevas tiendas con generación automática de slug y credenciales de usuario dueño.
   - Modificación de planes en caliente (`PATCH /tenants/:id/plan`).
   - Suspensión y reactivación inmediata de servicios (`PATCH /tenants/:id/status`).

3. **Modo Soporte / Suplantación de Identidad (Impersonation):**
   - Permite a los superadministradores ingresar al panel administrativo de cualquier tienda cliente con un clic (`POST /tenants/:id/impersonate`).
   - Genera un token JWT temporal con permisos sobre el tenant seleccionado sin alterar ni requerir la contraseña del cliente.
   - Banner visual superior que alerta al operador de que se encuentra en *"Modo Soporte"* con botón directo para salir.

4. **Monitor Global de Sesiones Baileys (`/admin/sessions`):**
   - Vista en tiempo real del estado de todos los sockets de WhatsApp en la plataforma.
   - Filtros por estado: Conectadas, Esperando QR, Desconectadas.
   - Botón de reinicio forzado individual con diálogo modal de confirmación.

5. **Aislamiento de Cobros y Cuentas Bancarias (Mercado Pago Connect):**
   - Cada tienda/tenant cobra directamente en su propia cuenta bancaria o billetera de Mercado Pago en Perú.
   - **Flujo 1-Clic (OAuth Connect):** El comerciante hace clic en *"Vincular Mercado Pago"* en su panel de configuración (`/settings`), se autoriza mediante el protocolo OAuth 2.0 (`https://auth.mercadopago.com.pe/authorization`), y el backend almacena de forma segura su `access_token` y `user_id` vinculados exclusivamente a su registro de `Tenant`.
   - **Flujo BYOK (Bring Your Own Key):** Alternativamente, el comercio puede ingresar manualmente su `Public Key` y `Access Token` desde el portal de desarrolladores de Mercado Pago.
   - Al generarse una preferencia de Checkout Pro, el backend usa el token específico de ese tenant para que los fondos ingresen directamente al dueño de la tienda sin intermediación financiera de la plataforma.
