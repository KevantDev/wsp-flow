# ⚡ WSP Flow — Especificación Técnica Maestra

> **Plataforma Integral de Comercio Electrónico Multi-Tenant SaaS, Gestión de Inventario, Pasarela de Pagos (Mercado Pago Checkout Pro & OAuth Connect) y Asistente Virtual de Ventas en WhatsApp (@whiskeysockets/baileys + OpenAI Luna).**

---

## 1. Visión Ejecutiva del Proyecto

**WSP Flow** es una plataforma SaaS integral que permite a múltiples comercios administrar su catálogo de productos, inventario, pedidos y finanzas desde un panel de control de alta fidelidad (**Bento Grid UI** en Light Mode), mientras un **Bot de WhatsApp Inteligente** (Luna) atiende clientes 24/7, verifica existencias en tiempo real, despacha catálogos multimedia y procesa pedidos en línea.

### 🌟 Pilares Principales:
- **Automatización de Ventas 24/7:** Bot de WhatsApp con OpenAI (`gpt-4o-mini` / `gpt-5.6-luna`) y Function Calling para responder dudas, consultar inventario y cerrar compras automáticamente.
- **Tiendas Digitales Multitema:** Tiendas públicas por slug (`/store/:slug`) con 3 plantillas estéticas (*Cyber Tech*, *Minimal Luxury*, *Gastronomic Warm*), carrito interactivo y checkout dual (Mercado Pago o WhatsApp).
- **Pasarela de Pagos Mercado Pago:** Integración Multi-Tenant vía OAuth Connect (1 clic) y BYOK, Checkout Pro con Tarjetas (Visa/Mastercard/Amex/Diners), Yape directo sin demoras de aprobación comercial, PagoEfectivo, Webhooks en tiempo real y reembolsos automatizados.
- **Arquitectura Multi-Tenant SaaS & Planes Dinámicos:** Aislamiento total de datos por tienda, portal de Super Administrador con métricas consolidadas (MRR, ARR, GMV), modo soporte (suplantación de identidad) y **gestión dinámica de Planes de Suscripción (`/admin/plans`) con cumplimiento estricto (enforcement) de cuotas** de productos, difusiones masivas, operadores y módulos habilitados.
- **Rendimiento de Grado de Producción:** Capa de caché TTL en memoria (respuestas en 1ms), paralelización con `Promise.all`, Skeleton UI y Angular Signals computadas.
- **Notificaciones Modernas:** Sistema unificado de Toasts Bento y diálogos modales asíncronos (`ToastService`), sin alertas nativas bloqueantes.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Rol en el Sistema |
| :--- | :--- | :--- |
| **Backend Framework** | **NestJS 10 (Node.js LTS / TypeScript)** | Clean Architecture, Inyección de Dependencias, WebSockets y controladores REST. |
| **Motor de WhatsApp** | **@whiskeysockets/baileys** | Conexión directa a WebSockets de WhatsApp multi-device (sin intermediarios ni costo por mensaje). |
| **Base de Datos** | **PostgreSQL 16 (Supabase)** | Base de datos relacional ACID con aislamiento lógico multi-tenant. |
| **ORM & Migraciones** | **Prisma ORM** | Modelado fuertemente tipado, consultas agrupadas y migraciones automatizadas. |
| **Inteligencia Artificial** | **OpenAI API (`gpt-4o-mini` / `gpt-5.6-luna`)** | Asistente de ventas Luna con Function Calling y buffer dinámico de 10s. |
| **Frontend Framework** | **Angular 18 (Standalone Components)** | Reactividad mediante Signals, Lazy Loading de rutas y Skeleton Screens. |
| **Estilos & UI** | **Tailwind CSS + Bento Design (Light Mode)** | Elevación suave, canvas `#F8F9FA`, micro-animaciones y soporte móvil. |
| **Tiempo Real** | **Socket.io (NestJS Gateway / RxJS)** | Transmisión de QR Baileys, sincronización Kanban y chat en vivo. |
| **Pasarela de Pagos** | **Mercado Pago (Checkout Pro & OAuth Connect)** | Tarjetas de crédito/débito, Yape, PagoEfectivo, Webhooks IPN y reembolsos directos (con soporte retrocompatible para Culqi). |

---

## 3. 📑 Mapa Maestro de Documentación Técnica (`docs/`)

Para mantener una arquitectura modular, de rápida lectura y óptima en consumo de contexto para IA y desarrolladores, la especificación detallada está organizada en la carpeta [`docs/`](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/):

### 🏛️ Arquitectura & Core
- [**Diseño del Sistema y Clean Architecture**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/01-architecture/system-design.md): Capas Hexagonales, principios SOLID y árbol de directorios.
- [**Esquema de Base de Datos y Modelos Prisma**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/01-architecture/database-schema.md): Diagrama ERD, Enums y modelos de PostgreSQL.
- [**Roles, Permisos (RBAC) y Seguridad**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/01-architecture/rbac-security.md): Matriz de permisos (SuperAdmin, Admin, Subadmin), tokens JWT y anti-ban.
- [**Arquitectura Multi-Tenant SaaS**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/01-architecture/multi-tenancy.md): Aislamiento de comercios, planes, Super Admin y modo soporte (impersonation).

### 📦 Módulos Funcionales
- [**Motor de WhatsApp Baileys & Asistente IA Luna**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/02-modules/whatsapp-bot.md): Flujos conversacionales, Function Calling, buffer debounce y human takeover.
- [**Pasarela de Pagos Mercado Pago**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/02-modules/payments-mercadopago.md): OAuth Connect, Checkout Pro (Tarjetas, Yape, PagoEfectivo), Webhooks y reembolsos.
- [**Tiendas Digitales y Personalización Multitema**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/02-modules/storefront-themes.md): Las 3 plantillas (`dark-tech`, `light-minimal`, `warm-brand`), carrito y checkout dual.
- [**Difusiones Masivas & Cartera CRM**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/02-modules/broadcast-crm.md): Campañas de WhatsApp con protección anti-ban y segmentación de clientes.
- [**Generador de Catálogo en PDF**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/02-modules/catalog-pdf.md): Generación dinámica de catálogos A4 con PDFKit para web y WhatsApp.

### ⚡ Rendimiento & Optimización
- [**Estrategia de Caché en Memoria (TTL)**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/03-performance/caching-strategy.md): Caché en RAM de 3min/45s y reducción de latencia (2,292ms a 1ms).
- [**Optimización de Consultas & Concurrencia**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/03-performance/query-optimization.md): Eliminación de N+1 con `groupBy` y paralelización masiva con `Promise.all`.

### 🎨 Diseño UI/UX & Notificaciones
- [**Sistema de Diseño Bento Grid (Light Mode)**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/04-ui-ux/design-system.md): Tokens Tailwind, Skeleton Screens y Angular Signals computadas.
- [**Sistema Global de Notificaciones (Toasts & Modales)**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/04-ui-ux/notifications-system.md): Arquitectura de `ToastService` y diálogos modales asíncronos.

### 🚀 Despliegue & DevOps
- [**Guía de Despliegue en la Nube (Gratis)**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/05-devops-deployment/cloud-deployment.md): Despliegue paso a paso en Supabase, Render y Vercel.
- [**Orquestación Docker & Variables de Entorno**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/05-devops-deployment/docker-setup.md): Configuración de `docker-compose.yml` y plantilla `.env.example`.
- [**Ecosistema de Skills de Antigravity**](file:///c:/Users/kevantDev/Desktop/wsp%20v4/docs/05-devops-deployment/antigravity-skills.md): Directrices anti-slop frontend y habilidades instaladas (`skills.sh`).

---

## 4. Guía de Ejecución Rápida en Local

### 4.1. Iniciar el Backend (NestJS)
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
# API disponible en: http://localhost:3000/api/v1
```

### 4.2. Iniciar el Frontend (Angular 18)
```bash
cd frontend
npm install
npm start
# Aplicación disponible en: http://localhost:4200
```
