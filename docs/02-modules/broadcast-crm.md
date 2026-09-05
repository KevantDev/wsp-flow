# Módulo de Difusiones Masivas & Cartera de Clientes CRM

## 1. Visión General del CRM

El módulo de **Difusiones (`BroadcastsComponent`)** permite a los comercios gestionar su cartera de clientes y despachar campañas promocionales masivas a través de WhatsApp con protección anti-ban.

---

## 2. Gestión de Cartera de Clientes

- **Importación y Registro:**
  - Registro automático de cada cliente que conversa con el bot de WhatsApp o genera un pedido.
  - Registro manual desde el panel mediante modal con opción de saludo de bienvenida inmediato.
- **Segmentación Inteligente:**
  - `ALL`: Todos los contactos registrados.
  - `CUSTOMERS_WITH_ORDERS`: Clientes compradores recurrentes.
  - `LEADS`: Contactos que consultaron pero no han generado compras aún.
- **Estimación en Tiempo Real:** Al redactar la campaña, el sistema calcula de inmediato el número estimado de destinatarios según el segmento elegido.

---

## 3. Campañas de Difusión con Protección Anti-Ban

- **Cola Asíncrona con Intervalos Humanizados:**
  - El motor de despacho no envía ráfagas simultáneas. Aplica pausas de 4 a 12 segundos entre mensajes individuales para simular comportamiento de usuario real y evitar bloqueos por parte de Meta.
- **Controles de Campaña en Vivo:**
  - **Iniciar:** Pone en marcha el despachador en segundo plano.
  - **Pausar:** Detiene temporalmente la cola.
  - **Cancelar / Eliminar:** Cancela los envíos restantes con confirmación modal.
- **Seguimiento por WebSockets:**
  - Progreso porcentual en tiempo real emitido al Bento Card (`BROADCAST_PROGRESS`).
