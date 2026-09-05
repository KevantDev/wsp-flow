# Pasarela de Pagos Culqi (Módulo Migrado)

> ⚠️ **Módulo Migrado a Mercado Pago**: A partir de la versión v4 de **WSP Flow**, la pasarela de pagos oficial en Perú es **Mercado Pago (Checkout Pro & OAuth Connect)** debido a la activación inmediata de credenciales sin demoras comerciales de 2 semanas. La integración de Culqi se conserva únicamente con fines de compatibilidad y soporte retroactivo para transacciones previas.
> 
> 👉 Consulta la documentación técnica activa y oficial en: [**Pasarela de Pagos Mercado Pago**](./payments-mercadopago.md).

---

## 1. Arquitectura de Cobros Digitales (Legado)

El módulo de pagos estaba originalmente integrado con la API de **Culqi**, soportando:

1. **Yape (Código de Aprobación OTP de 6 dígitos):**
   - El cliente genera un código de aprobación temporal en su aplicación Yape.
   - Ingresa su número celular y código OTP en la pantalla de pago `/pay/:orderNumber`.
   - Culqi valida el débito en tiempo real sin requerir tarjeta física.

2. **Tarjetas de Débito y Crédito (Visa, Mastercard, Amex, Diners):**
   - Tokenización segura en el cliente (token Culqi `tkn_live_...` o simulador en sandbox).
   - Cobro directo mediante endpoint `POST /api/v1/payments/pay-card`.

3. **Pago Contra Entrega / Transferencia:**
   - Opciones coordinadas directamente mediante la tienda web o el bot de WhatsApp.

---

## 2. Flujo de Checkout Público (`/pay/:orderNumber`)

- **Link de Pago Único:** Al registrarse un pedido desde el bot de WhatsApp o la tienda digital, se genera un enlace seguro `https://tudominio.com/pay/:orderNumber`.
- **Cálculo de Envíos y Total:**
  - `Subtotal` + `Costo de Delivery` (configurado según la zona seleccionada: Lima Metropolitana, Zonas periféricas o Provincias vía agencia) = `Total a Pagar`.
- **Feedback Visual:** Integrado con el sistema de Toasts (`ToastService`). Al procesar o rechazar un cobro, muestra notificaciones estilo Bento y bloquea dobles envíos.

---

## 3. Webhooks & Sincronización en Tiempo Real

- **Endpoint de Recepción:** `POST /api/v1/payments/culqi-webhook`.
- Al recibirse el evento `charge.creation.successful`:
  1. La orden pasa automáticamente de `PENDING` a `CONFIRMED`.
  2. Se emite un evento WebSocket al tablero Kanban To-Do, desplazando la tarjeta de la columna *Por Atender* a *En Preparación*.
  3. El bot de WhatsApp despacha un mensaje de confirmación al cliente con el comprobante de compra.

---

## 4. Motor de Reembolsos en Dinero (Refunds)

- En el tablero de órdenes, los administradores cuentan con un botón de **Reembolso**.
- Solicita el motivo del reembolso mediante un diálogo modal moderno.
- Invoca la API de Culqi (`POST /v2/refunds`), cancela el pedido en PostgreSQL, restaura automáticamente el inventario descontado y notifica al cliente por WhatsApp.
