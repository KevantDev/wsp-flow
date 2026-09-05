# Pasarela de Pagos Mercado Pago (OAuth Connect, Checkout Pro, Yape, Webhooks & Reembolsos)

## 1. Justificación Técnica: Migración de Culqi a Mercado Pago

La pasarela principal de **WSP Flow** fue migrada a **Mercado Pago** para resolver los siguientes cuellos de botella críticos del ecosistema peruano:

1. **Aprobación Instantánea vs Esperas Burocráticas:**
   - Culqi impone revisiones comerciales manuales que tardan de 1 a 2 semanas por tienda (requiere RUC activo, Libro de Reclamaciones con formulario web, Términos y Condiciones formales y dominio público con HTTPS verificado), impidiendo el autoservicio rápido de nuevos comerciantes SaaS.
   - Mercado Pago otorga credenciales de producción inmediatas y vinculación multi-tenant en 1 clic sin fricción documental previa.

2. **Arquitectura Multi-Tenant con Mercado Pago Connect (OAuth 2.0):**
   - Los tenants no necesitan compartir claves secretas en texto plano; simplemente autorizan la aplicación mediante OAuth Connect.
   - Cada tenant cobra directamente en su propia cuenta y recibe el dinero en su banco o billetera digital en Perú sin que la plataforma retenga fondos.

3. **Checkout Pro Multimétodo:**
   - Soporte nativo y sin costo adicional para **Tarjetas de Débito y Crédito** (Visa, Mastercard, American Express, Diners).
   - Soporte para **Yape** directo.
   - Soporte para **PagoEfectivo** (banca por internet y depósitos en agentes físicos a nivel nacional).
   - Soporte para saldo en cuenta Mercado Pago.

---

## 2. Métodos de Conexión del Tenant (`/settings`)

Cada comercio puede vincular su cuenta de Mercado Pago desde la sección de configuración:

### Método 1: OAuth Connect en 1 Clic (Recomendado)
- Endpoint: `GET /api/v1/payments/mercadopago/connect`
- El backend genera la URL de autorización oficial:
  `https://auth.mercadopago.com.pe/authorization?client_id=...&response_type=code&platform_id=mp&state=tenantId&redirect_uri=...`
- El comerciante autoriza en Mercado Pago y es redirigido a `GET /api/v1/payments/mercadopago/callback`.
- El backend intercambia el `code` temporal por el `access_token` y `refresh_token` del vendedor con `https://api.mercadopago.com/oauth/token` y los almacena en el registro de `Tenant` de Supabase PostgreSQL.

### Método 2: Credenciales Manuales de Desarrollador (BYOK)
- Si el comercio ya posee credenciales de aplicación creadas en `mercadopago.com.pe/developers`, puede ingresar su `Public Key` (`APP_USR-...`) y `Access Token` (`APP_USR-...`) en los campos manuales de la tarjeta Bento de configuración.

### Desconexión Segura
- Endpoint: `POST /api/v1/payments/mercadopago/disconnect`
- Limpia los tokens del tenant en la base de datos de inmediato.

---

## 3. Flujo de Compra y Checkout Pro (`/pay/:orderNumber`)

1. **Creación de Preferencia:**
   - El cliente selecciona sus productos desde la tienda web o el asistente virtual de WhatsApp.
   - En `/pay/:orderNumber`, al hacer clic en **"Pagar con Mercado Pago"**, el frontend llama a:
     `POST /api/v1/payments/mercadopago/create-preference` con `{ orderNumber }`.
   - El backend busca las credenciales de ese `Tenant`, ensambla los items, datos del pagador (`payer`), URLs de retorno (`back_urls`), `auto_return: "approved"`, y la `notification_url` para webhooks.
   - Mercado Pago retorna `{ id, initPoint, sandboxInitPoint }`.
   - El usuario es redirigido a la experiencia de Checkout Pro oficial.

2. **Retorno Automático y Validación Inmediata:**
   - Si el pago es aprobado, Mercado Pago redirige al cliente a:
     `https://app.wspflow.com/pay/:orderNumber?status=approved&collection_id=...&payment_id=...`
   - El frontend detecta los query params y llama a:
     `POST /api/v1/payments/mercadopago/confirm-return` con `{ orderNumber, paymentId, status }`.
   - Se valida el cobro contra la API de Mercado Pago, la orden se marca como `CONFIRMED`, se descuenta el inventario, se emite el evento WebSocket al Kanban y se dispara el mensaje de WhatsApp por Baileys con la boleta PDF adjunta.

3. **Experiencia de Usuario Limpia y Directa (Opción A):**
   - El checkout elimina formularios manuales y pestañas redundantes para evitar fricción y confusión en el comprador final.
   - Presenta visualmente las 4 modalidades soportadas: **Tarjetas** (Visa, Mastercard, Amex, Diners), **Yape** (directo sin comisiones), **PagoEfectivo** (banca móvil y agentes) y **Dinero en cuenta Mercado Pago**.
   - Cuenta con un botón de acción principal de alta conversión: `Pagar S/ ... con Mercado Pago` con garantías de seguridad SSL oficial.

---

## 4. Webhooks IPN en Tiempo Real

- **Endpoint de Notificación:** `POST /api/v1/payments/mercadopago-webhook`
- Mercado Pago envía notificaciones asíncronas con eventos `topic=payment` o `type=payment`.
- El backend procesa el payload:
  1. Extrae el `data.id` del pago.
  2. Consulta la API de Mercado Pago (`GET /v1/payments/:id`) para verificar el estado auténtico (`status === "approved"`).
  3. Extrae la `external_reference` (que contiene el `orderNumber`).
  4. Actualiza la orden en PostgreSQL con `paymentStatus = PAID`, `paymentMethod = MERCADOPAGO`, y guarda `mercadoPagoPaymentId`.
  5. Reduce el stock de los productos vendidos si no había sido descontado previamente.
  6. Emite WebSocket para actualizar el dashboard y pipeline de pedidos en vivo.
  7. Envía mensaje de confirmación por WhatsApp mediante Baileys y genera el comprobante PDF.

---

## 5. Motor de Reembolsos (Refunds)

- Endpoint: `POST /api/v1/payments/refund/:orderId`
- Los administradores pueden procesar devoluciones de dinero con un solo clic desde el modal de detalle de la orden.
- El backend detecta si la orden fue pagada con Mercado Pago (`mercadoPagoPaymentId`) o Culqi (`chargeId` retrocompatible).
- Si es Mercado Pago:
  - Llama a `POST /v1/payments/:paymentId/refunds` utilizando el `access_token` del tenant correspondiente.
  - Mercado Pago devuelve el dinero al medio de pago original del comprador (tarjeta o cuenta).
  - La orden se actualiza a `paymentStatus = REFUNDED` y `status = CANCELLED`.
  - El stock de los productos se devuelve automáticamente al inventario disponible.
