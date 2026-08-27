# 🚀 ESPECIFICACIÓN TÉCNICA Y ARQUITECTURA DEL SISTEMA
## Sistema de Gestión de Productos, Ventas y Bot Automatizado de WhatsApp (Baileys)

---

## 📑 Tabla de Contenidos
1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema y Principios de Diseño](#3-arquitectura-del-sistema-y-principios-de-diseño)
4. [Roles y Matriz de Permisos (RBAC)](#4-roles-y-matriz-de-permisos-rbac)
5. [Modelo de Datos y Base de Datos (PostgreSQL)](#5-modelo-de-datos-y-base-de-datos-postgresql)
6. [Módulo de WhatsApp Bot (@whiskeysockets/baileys)](#6-módulo-de-whatsapp-bot-whiskeysocketsbaileys)
7. [Módulos Funcionales del Sistema](#7-módulos-funcionales-del-sistema)
8. [Diseño UI/UX — Bento Grid & Tailwind CSS (Light Mode)](#8-diseño-uiux--bento-grid--tailwind-css-light-mode)
9. [Estructura del Proyecto (Carpetas)](#9-estructura-del-proyecto-carpetas)
10. [Flujos de Interacción y Diagramas de Secuencia](#10-flujos-de-interacción-y-diagramas-de-secuencia)
11. [Estrategia de Seguridad y Buenas Prácticas](#11-estrategia-de-seguridad-y-buenas-prácticas)
12. [Plan de Implementación Paso a Paso (Roadmap)](#12-plan-de-implementación-paso-a-paso-roadmap)
13. [Despliegue y Variables de Entorno](#13-despliegue-y-variables-de-entorno)
14. [Resumen y Estado del Proyecto](#14-resumen-y-estado-del-proyecto)
15. [Ecosistema de Skills de Antigravity (`skills.sh` & Customizations)](#15-ecosistema-de-skills-de-antigravity-skillssh--customizations)

---

## 1. Visión General del Proyecto

### 1.1. Propósito
El sistema es una plataforma integral de **Gestión de Inventario, Catálogo de Productos, Facturación/Pedidos y Atención al Cliente Automatizada**. Permite a comercios y empresas administrar sus productos y stock desde un panel administrativo moderno, mientras un **Bot de WhatsApp** inteligente (basado en la librería [`@whiskeysockets/baileys`](https://baileys.wiki/)) atiende a los clientes, presenta el catálogo con fotos y precios, responde consultas y gestiona pedidos de manera automática en tiempo real.

### 1.2. Objetivos Principales
- **Automatización 24/7 de Ventas:** El bot de WhatsApp atiende clientes, consulta el inventario en PostgreSQL y procesa pedidos sin intervención humana inmediata.
- **Gestión de Roles Segura:** Jerarquía de usuarios (Administrador y Subadministrador) con control de acceso basado en roles (RBAC).
- **Intervención Humana en Vivo (Live Agent Handover):** Los administradores pueden pausar el bot para un chat específico y responder directamente desde el panel web estilo WhatsApp Web.
- **Experiencia de Usuario de Alto Nivel:** Frontend moderno en Angular con diseño modular estilo **Bento Grid** en **Light Mode** con **Tailwind CSS**.
- **Calidad de Código y Mantenibilidad:** Backend en NestJS aplicando Arquitectura Limpia (Clean Architecture), principios SOLID y patrones de diseño robustos.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación / Rol |
| :--- | :--- | :--- |
| **Backend Framework** | **NestJS (Node.js LTS / TypeScript)** | Framework empresarial modular, fuertemente tipado, con inyección de dependencias nativa, soporte de WebSockets y arquitectura escalable. |
| **WhatsApp Engine** | **@whiskeysockets/baileys** | Conexión directa a los WebSockets de WhatsApp Web multi-device. Sin costo por mensaje de API oficial, ligero, rápido y permite envío de catálogos multimedia, botones y listas interactivas. |
| **Base de Datos** | **PostgreSQL 16** | Base de datos relacional robusta, con soporte ACID para transacciones de compras, inventario y relaciones complejas. |
| **ORM / Query Builder** | **Prisma ORM** (o TypeORM) | Tipado estricto extremo a extremo, migraciones automáticas y consultas optimizadas. |
| **Frontend Framework** | **Angular 18+ (Standalone Components)** | Signals reactivos, nuevo control flow (`@if`, `@for`), carga perezosa (lazy loading) por rutas, alto rendimiento y estructura mantenible. |
| **Estilos & UI** | **Tailwind CSS + Bento UI (Light Mode)** | Diseño Bento Grid en Light Mode con elevación suave (`bg-white border-zinc-200/80`), canvas `bg-[#F8F9FA]`, microinteracciones, accesibilidad WCAG AA y atajos `<kbd>`. |
| **Comunicación en Tiempo Real** | **WebSockets (Socket.io en NestJS / RxJS en Angular)** | Transmisión en vivo del código QR de autenticación Baileys, estado de la conexión WhatsApp, notificaciones de nuevos pedidos y chat en vivo. |
| **Almacenamiento Multimedia** | **Cloudinary / AWS S3 / Almacenamiento Local Seguro** | Para almacenar y servir imágenes de productos de alta resolución y archivos multimedia de WhatsApp. |
| **Seguridad & Autenticación** | **JWT (JSON Web Tokens) + Bcrypt** | Tokens de acceso y refresco seguros con cookies HTTP-only o headers Bearer, Guards de roles e interceptores de seguridad. |

---

## 3. Arquitectura del Sistema y Principios de Diseño

El backend se estructura bajo **Clean Architecture (Arquitectura Limpia / Hexagonal)** dividida en capas concéntricas, desacoplando la lógica de negocio de los detalles de infraestructura.

### 3.1. Diagrama de Capas de Arquitectura

```mermaid
graph TD
    subgraph Presentation_Layer["Presentation Layer (Controladores & Gateways)"]
        A1[REST API Controllers]
        A2[WebSocket Gateways]
    end

    subgraph Application_Layer["Application Layer (Casos de Uso)"]
        B1[Use Cases / Services]
        B2[DTOs & Input Validation]
        B3[Command / Query Handlers]
    end

    subgraph Domain_Layer["Domain Layer (Núcleo de Negocio)"]
        C1[Domain Entities]
        C2[Value Objects]
        C3[Repository Interfaces / Ports]
        C4[Domain Events & Exceptions]
    end

    subgraph Infrastructure_Layer["Infrastructure Layer (Adaptadores Externos)"]
        D1[Prisma PostgreSQL Repositories]
        D2[Baileys WhatsApp Adapter]
        D3[Cloudinary / Storage Service]
        D4[JWT Auth Provider]
    end

    Presentation_Layer --> Application_Layer
    Application_Layer --> Domain_Layer
    Infrastructure_Layer --> Domain_Layer
    Infrastructure_Layer --> Application_Layer
```

### 3.2. Aplicación de Principios SOLID

1. **S - Single Responsibility Principle (Responsabilidad Única):**
   - Cada servicio o caso de uso tiene una única razón para cambiar. Por ejemplo, `CreateProductUseCase` solo gestiona la creación de productos y validación de reglas de negocio; el almacenamiento de imágenes se delega a `StorageService`, y el envío de mensajes de WhatsApp a `WhatsAppNotificationService`.
2. **O - Open/Closed Principle (Abierto/Cerrado):**
   - El motor de flujos del bot de WhatsApp está diseñado con un patrón *Strategy / Handler*, permitiendo agregar nuevos comandos y respuestas sin modificar el core del despachador de mensajes.
3. **L - Liskov Substitution Principle (Sustitución de Liskov):**
   - Las interfaces de repositorios (`IProductRepository`, `IOrderRepository`, `IWhatsAppSessionRepository`) pueden sustituirse por implementaciones de prueba (Mock) o diferentes motores de persistencia sin romper la capa de aplicación.
4. **I - Interface Segregation Principle (Segregación de Interfaces):**
   - Interfaces pequeñas y específicas en lugar de interfaces gigantescas. Ejemplo: `IReadOnlyProductRepository` vs `IWriteProductRepository`.
5. **D - Dependency Inversion Principle (Inversión de Dependencias):**
   - La capa de aplicación y dominio dependen de abstracciones (interfaces/ports), no de implementaciones concretas de PostgreSQL o Baileys. Las dependencias se inyectan mediante el contenedor IoC de NestJS.

---

## 4. Roles y Matriz de Permisos (RBAC)

El sistema soporta autenticación basada en roles (`ADMIN` y `SUBADMIN`) con validación granular de permisos a nivel de decoradores `@Roles()` y `@Permissions()` en NestJS y `Guards` de rutas en Angular.

### 4.1. Definición de Roles

- **Administrador (Admin / SuperUser):** Propietario del negocio. Tiene control total de la plataforma, usuarios, configuraciones del bot, reportes financieros y eliminación de registros críticos.
- **Subadministrador (Subadmin / Empleado / Operador):** Personal encargado de inventario, atención a clientes y despacho de pedidos. Puede crear y editar productos, gestionar estados de compras y atender chats manuales, pero tiene restringida la administración de usuarios y la configuración técnica del sistema.

### 4.2. Matriz Comparativa de Permisos

| Módulo / Acción | Administrador | Subadministrador |
| :--- | :---: | :---: |
| **Gestión de Usuarios (Crear, Editar, Desactivar Subadmins)** | ✅ Total | ❌ Denegado |
| **Conexión / Desconexión de WhatsApp (Escanear QR Baileys)** | ✅ Total | ⚠️ Solo Ver Estado |
| **Configuración de Mensajes y Flujos del Bot** | ✅ Total | ❌ Denegado |
| **Crear / Editar Productos y Categorías** | ✅ Total | ✅ Permitido |
| **Eliminar Productos del Inventario** | ✅ Total | ❌ Denegado / Solo Desactivar |
| **Ajuste y Control de Stock** | ✅ Total | ✅ Permitido |
| **Ver y Gestionar Pedidos (Cambiar Estados)** | ✅ Total | ✅ Permitido |
| **Eliminar o Cancelar Pedidos** | ✅ Total | ⚠️ Requiere Aprobación |
| **Chat en Vivo (Pausar Bot y Responder Manualmente)** | ✅ Total | ✅ Permitido |
| **Métricas Financieras y Reportes de Ganancias** | ✅ Total | ❌ Denegado |
| **Auditoría de Acciones del Sistema** | ✅ Total | ❌ Denegado |

---

## 5. Modelo de Datos y Base de Datos (PostgreSQL)

A continuación se presenta el esquema relacional optimizado utilizando la sintaxis de **Prisma Schema**:

```prisma
// datasource y generator
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --------------------------------------------------------
// ENUMS
// --------------------------------------------------------
enum Role {
  ADMIN
  SUBADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum OrderSource {
  WHATSAPP_BOT
  MANUAL_DASHBOARD
}

enum SessionStatus {
  DISCONNECTED
  SCAN_QR
  CONNECTING
  CONNECTED
}

enum MessageSender {
  CUSTOMER
  BOT
  AGENT
}

// --------------------------------------------------------
// USUARIOS Y AUTENTICACIÓN
// --------------------------------------------------------
model User {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String
  fullName      String
  phoneNumber   String?
  role          Role        @default(SUBADMIN)
  isActive      Boolean     @default(true)
  avatarUrl     String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  auditLogs     AuditLog[]
  assignedChats ChatSession[]
  ordersHandled Order[]
}

// --------------------------------------------------------
// CATÁLOGO Y PRODUCTOS
// --------------------------------------------------------
model Category {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  description String?
  imageUrl    String?
  isActive    Boolean   @default(true)
  orderIndex  Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products    Product[]
}

model Product {
  id             String         @id @default(uuid())
  name           String
  slug           String         @unique
  sku            String         @unique
  description    String
  price          Decimal        @db.Decimal(10, 2)
  costPrice      Decimal?       @db.Decimal(10, 2)
  stock          Int            @default(0)
  minStockAlert  Int            @default(5)
  isAvailable    Boolean        @default(true)
  categoryId     String
  category       Category       @relation(fields: [categoryId], references: [id])
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  images         ProductImage[]
  orderItems     OrderItem[]
  
  @@index([categoryId])
  @@index([sku])
  @@index([name])
}

model ProductImage {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  imageUrl  String
  isPrimary Boolean  @default(false)
  orderIndex Int     @default(0)
  createdAt DateTime @default(now())
}

// --------------------------------------------------------
// SESIÓN DE WHATSAPP (BAILEYS)
// --------------------------------------------------------
model WhatsAppSession {
  id           String        @id @default(uuid())
  sessionName  String        @unique @default("default")
  phoneNumber  String?
  status       SessionStatus @default(DISCONNECTED)
  qrCode       String?       @db.Text
  authData     Json?         // Para guardar credenciales de Baileys si no se usa filesystem
  isAutoReplyActive Boolean  @default(true)
  welcomeMessage    String?  @db.Text
  outOfStockMessage String?  @db.Text
  updatedAt    DateTime      @updatedAt
  createdAt    DateTime      @default(now())
}

// --------------------------------------------------------
// BANDEJA DE ENTRADA Y CHAT
// --------------------------------------------------------
model ChatSession {
  id              String        @id @default(uuid())
  customerPhone   String        @unique
  customerName    String?
  isBotActive     Boolean       @default(true)
  lastInteraction DateTime      @default(now())
  unreadCount     Int           @default(0)
  assignedUserId  String?
  assignedUser    User?         @relation(fields: [assignedUserId], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  messages        ChatMessage[]
  orders          Order[]

  @@index([customerPhone])
}

model ChatMessage {
  id            String        @id @default(uuid())
  chatSessionId String
  chatSession   ChatSession   @relation(fields: [chatSessionId], references: [id], onDelete: Cascade)
  sender        MessageSender
  senderName    String?
  content       String        @db.Text
  mediaUrl      String?
  mediaType     String?       // text, image, audio, document
  whatsappMsgId String?       @unique
  isRead        Boolean       @default(false)
  createdAt     DateTime      @default(now())

  @@index([chatSessionId])
}

// --------------------------------------------------------
// PEDIDOS Y VENTAS
// --------------------------------------------------------
model Order {
  id              String       @id @default(uuid())
  orderNumber     String       @unique // ej: ORD-2026-0001
  chatSessionId   String?
  chatSession     ChatSession? @relation(fields: [chatSessionId], references: [id])
  customerName    String
  customerPhone   String
  customerAddress String?
  status          OrderStatus  @default(PENDING)
  source          OrderSource  @default(WHATSAPP_BOT)
  subtotal        Decimal      @db.Decimal(10, 2)
  deliveryFee     Decimal      @default(0.00) @db.Decimal(10, 2)
  total           Decimal      @db.Decimal(10, 2)
  notes           String?      @db.Text
  handledById     String?
  handledBy       User?        @relation(fields: [handledById], references: [id])
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  items           OrderItem[]

  @@index([status])
  @@index([customerPhone])
}

model OrderItem {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  productName String
  unitPrice   Decimal  @db.Decimal(10, 2)
  quantity    Int
  subtotal    Decimal  @db.Decimal(10, 2)
}

// --------------------------------------------------------
// FLUJOS Y PALABRAS CLAVE DEL BOT
// --------------------------------------------------------
model BotKeyword {
  id          String   @id @default(uuid())
  keyword     String   @unique
  matchType   String   @default("EXACT") // EXACT, CONTAINS, REGEX
  response    String   @db.Text
  mediaUrl    String?
  action      String?  // SHOW_CATALOG, CONTACT_AGENT, SHOW_OFFERS, etc.
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// --------------------------------------------------------
// AUDITORÍA DEL SISTEMA
// --------------------------------------------------------
model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String   // PRODUCT_CREATED, PRODUCT_DELETED, STATUS_CHANGED, etc.
  entity    String   // Product, Order, User, WhatsApp
  entityId  String?
  details   Json?
  ipAddress String?
  createdAt DateTime @default(now())
}
```

---

## 6. Módulo de WhatsApp Bot (`@whiskeysockets/baileys`)

La integración con WhatsApp utiliza la librería `@whiskeysockets/baileys` dentro de un servicio especializado en NestJS (`BaileysWhatsAppService`), aprovechando sockets directos sin intermediarios.

### 6.1. Arquitectura del Motor Baileys

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente (WhatsApp)
    participant Baileys as Baileys Socket Engine
    participant Gateway as WebSocket Gateway (NestJS)
    participant BotService as Bot Flow Service
    participant ProductRepo as Product Repository (PostgreSQL)
    actor Admin as Dashboard Bento (Angular)

    Note over Baileys, Gateway: Inicio de Sesión & QR Code
    Baileys->>Gateway: Evento QR Code generado
    Gateway->>Admin: Emite QR vía WebSocket al Bento Card
    Admin-->>Baileys: Escaneo con App WhatsApp móvil
    Baileys->>Gateway: Estado: CONNECTED

    Note over Cliente, BotService: Flujo de Atención y Venta
    Cliente->>Baileys: "Hola, quiero ver el catálogo"
    Baileys->>BotService: Evento 'messages.upsert'
    BotService->>ProductRepo: Consultar categorías y productos disponibles
    ProductRepo-->>BotService: Lista de productos con stock e imágenes
    BotService->>Baileys: Enviar menú interactivo / imágenes + precios
    Baileys->>Cliente: Mensaje con catálogo y opciones
    
    Cliente->>Baileys: "Quiero 2 unidades del Producto A"
    BotService->>ProductRepo: Verificar stock disponible
    BotService->>BotService: Generar borrador de orden en DB
    BotService->>Baileys: Confirmación de Pedido con resumen y total
    Baileys->>Cliente: "Tu pedido #ORD-2026-0001 ha sido registrado"
    BotService->>Gateway: Notificación en tiempo real "Nuevo Pedido WhatsApp"
    Gateway->>Admin: Alerta sonora y actualización inmediata en Bento Grid
```

### 6.2. Ciclo de Vida y Persistencia de Sesión
- **Manejo de Estado (`useMultiFileAuthState`):** Se almacenan las credenciales y llaves de cifrado en un volumen seguro o carpeta dedicada `./auth_info_baileys` con encriptación.
- **Reconexión Automática Inteligente:** En caso de desconexión por pérdida de red o reinicio del servidor, el servicio detecta `DisconnectReason.restartRequired` o `DisconnectReason.connectionLost` y reanuda el socket sin solicitar un nuevo QR.
- **Streaming de QR en Tiempo Real:** Cuando se requiere vinculación, el QR se transforma a DataURL y se emite vía WebSocket a la interfaz de Angular, actualizándose cada vez que caduca.

### 6.3. Funcionalidades del Bot de Ventas
1. **Menú Dinámico de Bienvenida:** Saludo personalizado según hora del día, presentación de categorías y opciones rápidas.
2. **Buscador de Productos Inteligente:** Búsqueda por texto (ej. *"auriculares"*, *"zapatillas talla 40"*), consultando la base de datos con filtros de coincidencia parcial e insensibilidad a mayúsculas.
3. **Fichas de Producto Multimedia:** Envío de imagen principal con pie de foto formateado (Nombre, Descripción, Precio, SKU, Disponibilidad).
4. **Carrito de Compras y Pedido Automatizado:** 
   - Selección de cantidad.
   - Solicitud de datos de entrega (Nombre, Dirección de envío o Retiro en tienda).
   - Creación inmediata del pedido en PostgreSQL con estado `PENDING`.
5. **Notificaciones de Estado:** Envío automático de mensaje al cliente cuando el estado de su pedido cambie en el Dashboard (ej. *"Tu pedido ha sido enviado con el repartidor 🚚"*).
6. **Mano a Mano con Agente Humano (Human Takeover):** Si el cliente escribe *"asesor"* o si el administrador presiona **"Pausar Bot"** en el panel, el bot se silencia para ese número telefónico y permite conversación fluida en tiempo real desde el dashboard.

### 6.4. Motor de Inteligencia Artificial — OpenAI (`gpt-5.6-luna`) & Function Calling

El sistema integra un motor conversacional avanzado basado en el modelo **`gpt-5.6-luna`** (configurable vía variable de entorno `OPENAI_MODEL` y `OPENAI_API_KEY`) implementado en `AiService`, dotando al bot de WhatsApp de razonamiento natural y capacidades operativas mediante **Herramientas de Ejecución (Function Calling)**:

#### 1. Persona y Directrices del Asistente (`Luna`):
- **Nombre:** Luna, Asesora Virtual de Ventas y Atención al Cliente de WSP Flow.
- **Tono:** Cálido, profesional, empático y enfocado en la conversión de ventas con emojis contextuales.
- **Comprensión:** Interpretación de consultas abiertas, modismos, dudas sobre características de productos y pedidos en lenguaje coloquial.

#### 2. Catálogo de Herramientas Operativas (Function Calling Schema):
| Herramienta / Función | Parámetros | Descripción / Acción en Backend |
| :--- | :--- | :--- |
| `search_products` | `query?: string`, `categoryId?: string` | Consulta el catálogo en PostgreSQL por coincidencia de texto, categoría o lista productos destacados con precios, SKU y stock en tiempo real. |
| `check_stock` | `sku: string` | Verifica la disponibilidad exacta de existencias de un producto específico antes de prometer una venta. |
| `create_order` | `customerName: string`, `customerAddress: string`, `items: [{ sku, quantity }]` | Crea una nueva orden en PostgreSQL con estado `PENDING`, descuenta el inventario y emite una alerta WebSocket instantánea al panel de pedidos. |
| `transfer_to_human` | `reason: string` | Pausa el bot automático (`isBotActive = false`) y notifica a los operadores en la vista de Live Chat para atención personalizada. |
| `get_store_info` | *(sin parámetros)* | Proporciona políticas oficiales de la tienda: métodos de pago (Efectivo, Transferencia, Tarjetas), plazos de envío y garantías. |

#### 3. Modo Híbrido y Tolerancia a Fallos:
- Si `OPENAI_API_KEY` no está configurada o si la API de OpenAI presenta latencia/interrupción, el sistema conmuta automáticamente al motor determinístico por palabras clave y reglas de catálogo sin interrumpir el servicio de atención en WhatsApp.

---

## 7. Módulos Funcionales del Sistema

```mermaid
mindmap
  root((Sistema Integral))
    Autenticación & RBAC
      JWT Tokens
      Roles Admin / Subadmin
      Auditoría de Actividad
    Catálogo & Productos
      CRUD de Productos
      Gestión de Categorías
      Control de Stock & Alertas
      Galería de Imágenes
    WhatsApp Engine Baileys
      Escaneo QR en Tiempo Real
      Flujos de Ventas
      Catálogo Automatizado
      Modo Bot / Modo Humano
    Ventas & Pedidos
      Pipeline de Pedidos
      Generación de Comprobantes
      Notificaciones al Cliente
    Dashboard Bento UI
      Métricas en Vivo
      Live Chat Inbox
      Alertas de Stock
```

### 7.1. Módulo de Autenticación y Usuarios
- Login con validación de credenciales (Argon2 / Bcrypt).
- Generación de Access Token (15 min) y Refresh Token (7 días).
- Panel de control de usuarios: Administrador puede invitar y crear Subadministradores, asignar contraseñas temporales y desactivar accesos.

### 7.2. Módulo de Catálogo, Inventario, Subida de Imágenes & Catálogo PDF
- **Gestor de Productos:** Formulario reactivo en Angular con soporte dual para imágenes:
  - **📁 Subida de Archivos Locales (Drag & Drop):** Zona interactiva de arrastrar y soltar o selector de archivos del sistema operativo con previsualización inmediata y validación (JPG, PNG, WEBP hasta 5MB).
  - **🌐 Enlaces Web:** Soporte para URLs de imágenes externas (Cloudinary, Unsplash, etc.).
- **Servicio de Almacenamiento Backend (`UploadController`):**
  - Endpoint `POST /api/v1/upload/image` gestionado con Multer y almacenamiento en `uploads/products/`.
  - Servido estático público en `http://localhost:3000/uploads/products/` para consumo por el frontend y envío directo en los mensajes multimedia del bot de WhatsApp.
- **📄 Generador de Catálogo en PDF (`CatalogPdfService`):**
  - **Diseño Bento Visual de Alto Impacto:** Documento A4 maquetado con encabezado institucional índigo, badges de SKU, miniaturas fotográficas de productos, descripciones, precios en dólares y etiquetas de stock disponible.
  - **Descarga desde el Panel Web:** Endpoint público `GET /api/v1/products/catalog/pdf` y botón **`📄 Catálogo PDF`** en la barra superior de productos con descarga inmediata en el navegador.
  - **Envío Automático por WhatsApp:** Cuando un cliente solicita el catálogo (*"catalogo"*, *"productos"*, *"precios"*) o interactúa con el bot, Baileys genera y despacha el archivo PDF como un documento nativo (`Catalogo_WSP_Flow.pdf`) con mensaje de bienvenida y guía de compra.
- **Categorías:** Estructura jerárquica con slugs amigables, filtrado por *pills* dinámicos en el catálogo.
- **Control de Existencias:** Descuento de stock en tiempo real al concretarse pedidos y bloqueo automático de venta en WhatsApp si el producto está agotado.

### 7.3. Módulo de Pedidos y Ventas — Pipeline To-Do / Kanban
- **Tablero Interactivo To-Do (4 Columnas de Flujo):**
  1. ⏳ **1. Por Atender / Pendientes (`PENDING`):** Pedidos nuevos generados automáticamente por el bot de WhatsApp o registrados manualmente. Botón de acción: *"Iniciar Preparación ➔"*.
  2. 📦 **2. En Preparación / Proceso (`PROCESSING` / `CONFIRMED`):** Pedidos en etapa de empaquetado o verificación. Botón de acción: *"Despachar / Enviar ➔"*.
  3. 🚚 **3. En Camino / Despachados (`SHIPPED`):** Pedidos en tránsito de entrega. Botón de acción: *"Marcar como Entregado ✅"*.
  4. 🎉 **4. Completados & Entregados (`DELIVERED`):** Pedidos cerrados con éxito y registro histórico.
- **Detalle de la Tarjeta To-Do:**
  - Código único de orden (`#ORD-XXXX`) y origen (`🤖 Bot WhatsApp` vs `🖥️ Panel`).
  - Datos del cliente con botón directo **`💬 Chat`** que abre la conversación en WhatsApp Web/App (`https://wa.me/...`).
  - Checklist de productos, cantidades unitarias, subtotales y total general.
  - Avance de estado en **1 solo clic**.
- **Modos de Visualización Dual:** Alternador en tiempo real entre **Tablero To-Do (Kanban)** y **Lista Compacta de Auditoría**.

### 7.4. Módulo de Bandeja de Entrada (Live Chat & WhatsApp Hub)
- Interfaz moderna inspirada en WhatsApp Web con soporte móvil y de escritorio.
- En dispositivos móviles: Alternancia automática entre lista de chats e hilo de mensajes activo con botón de navegación **`← Volver`**.
- Switch interactivo: `[ 🤖 Bot Activo | 👤 Agente Humano ]` para toma de control en vivo (Live Agent Handover).
- Envío de respuestas y mensajes directamente a WhatsApp desde la interfaz web.

### 7.5. Arquitectura Responsive & Navegación Móvil
- **Drawer Lateral Móvil:** En pantallas `< 1024px`, el sidebar se convierte en un panel deslizable con *backdrop blur* y botón hamburguesa en el navbar.
- **Diseño Adaptativo en todas las vistas:** Contenedores fluidos con márgenes y paddings optimizados para pantallas táctiles y monitores panorámicos.

### 7.6. Módulo de Landing Page Pública (`LandingComponent`)
- **Acceso Público:** Disponible en la raíz `/` y `/landing` sin requerir autenticación previa.
- **Simulador Interactivo de IA Luna:** Widget en tiempo real donde los visitantes pueden ejecutar 4 escenarios demostrativos (Pedir catálogo PDF, consultar stock, concretar orden automática y pedir agente humano).
- **Vitrina de Catálogo en Vivo:** Consulta directa de productos desde PostgreSQL con botón de compra rápida vía WhatsApp (`https://wa.me/?text=...`).
- **Descarga Pública de Catálogo en PDF:** Botón de generación inmediata que compila los productos en un documento A4 maquetado estilo Bento.
- **Grid de Beneficios & Planes de Precios:** Presentación en Bento Grid de las 6 ventajas competitivas (*IA GPT-5.6, Baileys sin costo por mensaje, Catálogo PDF, Tablero Kanban To-Do, Live Chat y Subadmins*) y 3 planes de suscripción (*Starter, Business IA y Enterprise*).

---

## 8. Diseño UI/UX — Bento Grid & Tailwind CSS (Light Mode)

> **Perfil y Rol:** Lead Product Designer y Frontend Engineer especializado en UI/UX y Bento Grids en Light Mode con Tailwind CSS.

---

### 8.1. Directrices UI/UX y Bento Grid (Light Mode)

#### 1. Reglas Visuales para Light Mode:
- **Prohibido el fondo blanco puro sobre blanco puro:** Se evita `#ffffff` sobre `#ffffff` sin contraste.
- **Fondo del canvas:** Tonos neutros cálidos o fríos estructurados (`bg-zinc-50`, `bg-slate-50/80` o `bg-[#F8F9FA]`) con textura radial sutil.
- **Fondo de las celdas:** Blanco puro con elevación sutil (`bg-white border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]`).
- **Contraste de texto y accesibilidad (WCAG AA):**
  - **Títulos:** `text-zinc-900` o `text-slate-900 font-semibold / font-bold`.
  - **Cuerpo / Descripciones:** `text-zinc-500` o `text-slate-600 font-normal`.
  - **Metadatos / Overlines:** `text-zinc-400 font-mono text-[11px] uppercase tracking-wider font-semibold`.

#### 2. Principios de UX en cada Celda:
- **Cero celdas genéricas:** Prohibido repetir el esquema "ícono + título + texto".
- **Feedback táctil e interactividad (Hover States):**
  - `hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-zinc-300 transition-all duration-200 ease-out`.
  - `group-hover:translate-x-0.5` o cambios sutiles de color en acciones interactivas.
- **Densidad y Componentes Vivos:**
  - **Celda 1 (Hero/Principal - 2x2):** Gráfica de métricas con números de impacto (`text-3xl font-bold tracking-tight text-zinc-900`), micro-toggles y chips de crecimiento.
  - **Celda 2 (Status/Operacional Baileys):** Badges con puntos de estado vivos (`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60`).
  - **Celda 3 (Social Proof / Stack / Equipo):** Mini avatares encimados (`flex -space-x-2`) combinados con micro-chips interactivos.
  - **Celda 4 (Visual / UI Preview):** Snippet visual estructurado, input de búsqueda simulado con botón de atajo (`<kbd class="kbd-badge">⌘K</kbd>` en `bg-zinc-100 border border-zinc-200 text-zinc-500`).

#### 3. Grid y Responsividad:
- **Estructura base:** `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6` o layout asimétrico.
- Layout asimétrico con anclaje visual claro y lectura natural en "F" o "Z".
- `p-5 md:p-6 rounded-2xl` / `rounded-3xl` para conservar una proporción equilibrada en los contenedores.

---

### 8.2. Paleta de Colores y Guía de Estilos (Light Mode)

| Elemento | Token Tailwind | Color / Valor |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-[#F8F9FA]` / `bg-zinc-50` | Neutro suave estructurado con micro-patrón radial |
| **Bento Cards (Superficie)** | `bg-white` + `border-zinc-200/80` | Blanco puro elevado con sombra `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` |
| **Hover en Bento Cards** | `hover:border-zinc-300` + `hover:shadow-md` | Elevación fluida y contorno reforzado |
| **Títulos Principales** | `text-zinc-900` | Negro carbón profundo de máximo contraste |
| **Textos Secundarios** | `text-zinc-500` / `text-slate-600` | Gris neutro de alta legibilidad |
| **Overlines / Código** | `text-zinc-400 font-mono text-[11px]` | Tipografía monoespaciada para metadatos |
| **Acento Primario** | `bg-indigo-600 hover:bg-indigo-700` | Índigo profesional para acciones primarias |
| **Acento WhatsApp** | `bg-emerald-50 text-emerald-700` | Verde pastel con bordes esmeralda para estados vivos |
| **Atajos de Teclado** | `<kbd>` en `bg-zinc-100 border-zinc-200` | Tecla física estilizada para shortcuts |

---

### 8.3. Mockup Conceptual del Dashboard Principal (Light Mode Bento Layout)

```
+---------------------------------------------------------------------------------------------------+
|  [⚡ WSP FLOW]   [🔍 Buscar en catálogo  ⌘K]          [🟢 Sistema Online]   [👤 Administrador]    |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-----------------------------+ +-----------------------------------+ +-----------------------+  |
|  | 🤖 BOT WHATSAPP BAILEYS     | | 📈 VENTAS TOTALES HOY             | | ⚡ ACCIONES RÁPIDAS    |  |
|  | [🟢 Conectado / Línea Activa| |  $ 1,450.00 USD  (+18.5% ↑)        | |  [➕ Nuevo Producto] |  |
|  | +54 9 11 2345-6789          | |  24 pedidos atendidos por el bot  | |  [📋 Ver Pedidos]    |  |
|  | Modo: Auto-Ventas ON [🔘]   | |  Barra de progreso semanal: 85%   | |  [🔄 Sincronizar]    |  |
|  | [Desconectar / Gestionar QR]| |                                   | |  [💬 Abrir Chats]    |  |
|  +-----------------------------+ +-----------------------------------+ +-----------------------+  |
|                                                                                                   |
|  +---------------------------------------------------+ +-----------------------------------------+  |
|  | 📦 INVENTARIO & CONTROL DE STOCK                  | | 💬 LIVE CHAT & CONVERSACIONES EN VIVO   |  |
|  | • 48 Productos en catálogo                        | |  Avatares activos: (CL) (MG) (AR)       |  |
|  | • [⚠️ 3 productos con stock bajo]                 | |  • +54 9 11... "Pedido #1023 confirmado"|  |
|  |                                                   | |  • +59 3 99... "Consultando catálogo..."|  |
|  | [ Administrar Productos -> ]                      | |  [ Abrir Live Chat -> ]                 |  |
|  +---------------------------------------------------+ +-----------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 9. Estructura del Proyecto (Carpetas)

El proyecto se estructurará como un **Monorepo / Separación Limpia** de cliente y servidor:

```
wsp-v4/
├── backend/                             # API NestJS (Clean Architecture)
│   ├── src/
│   │   ├── core/                        # Núcleo compartido (Guards, Decorators, Interceptors, Filters)
│   │   │   ├── decorators/              # @Roles(), @CurrentUser(), @Public()
│   │   │   ├── guards/                  # JwtAuthGuard, RolesGuard
│   │   │   ├── interceptors/            # TransformResponseInterceptor, LoggingInterceptor
│   │   │   └── filters/                 # AllExceptionsFilter
│   │   │
│   │   ├── domain/                      # Capa de Dominio (Pura, sin dependencias de Nest/Prisma)
│   │   │   ├── entities/                # ProductEntity, OrderEntity, UserEntity, ChatSessionEntity
│   │   │   ├── value-objects/           # PhoneNumber, Money, SKU
│   │   │   ├── repositories/            # IProductRepository, IOrderRepository, IUserRepository (Interfaces)
│   │   │   └── exceptions/              # ProductNotFoundException, InsufficientStockException
│   │   │
│   │   ├── application/                 # Capa de Aplicación (Casos de Uso)
│   │   │   ├── use-cases/
│   │   │   │   ├── auth/                # LoginUseCase, RefreshTokenUseCase
│   │   │   │   ├── products/            # CreateProductUseCase, UpdateStockUseCase, GetCatalogUseCase
│   │   │   │   ├── orders/              # ProcessBotOrderUseCase, UpdateOrderStatusUseCase
│   │   │   │   └── whatsapp/            # InitializeBaileysUseCase, ProcessIncomingMessageUseCase
│   │   │   └── dtos/                    # CreateProductDto, CreateOrderDto, FilterProductsDto
│   │   │
│   │   ├── infrastructure/              # Capa de Infraestructura (Adaptadores externos)
│   │   │   ├── persistence/
│   │   │   │   ├── prisma/              # PrismaService, schema.prisma, Migrations
│   │   │   │   └── repositories/        # PrismaProductRepository, PrismaOrderRepository
│   │   │   ├── whatsapp/
│   │   │   │   ├── baileys/             # BaileysClient, BaileysSessionManager, BaileysMessageSender
│   │   │   │   └── handlers/            # MessageUpsertHandler, ConnectionUpdateHandler
│   │   │   └── storage/                 # CloudinaryService / LocalStorageService
│   │   │
│   │   └── presentation/                # Capa de Presentación (Controladores & WebSockets)
│   │       ├── controllers/             # AuthController, ProductsController, OrdersController, UsersController
│   │       └── gateways/                # WhatsAppSocketGateway, OrdersSocketGateway, ChatSocketGateway
│   │
│   ├── test/                            # Tests unitarios y E2E
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                            # Aplicación Angular 18+ (Standalone + Tailwind)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                    # Servicios singleton, interceptores HTTP, guards de rutas
│   │   │   │   ├── guards/              # auth.guard.ts, role.guard.ts
│   │   │   │   ├── interceptors/        # auth.interceptor.ts, error.interceptor.ts
│   │   │   │   └── services/            # auth.service.ts, websocket.service.ts, notification.service.ts
│   │   │   │
│   │   │   ├── shared/                  # Componentes reutilizables estilo Bento
│   │   │   │   ├── components/
│   │   │   │   │   ├── bento-card/      # Tarjeta contenedora con glassmorphism y hover glow
│   │   │   │   │   ├── stats-card/      # Métrica con badge de porcentaje y mini gráfico
│   │   │   │   │   ├── modal/           # Diálogo modal accesible
│   │   │   │   │   ├── badge/           # Badges de estado (Conectado, Pendiente, etc.)
│   │   │   │   │   └── search-input/    # Input con shortcut Cmd+K
│   │   │   │   └── pipes/               # currency-format.pipe.ts, time-ago.pipe.ts
│   │   │   │
│   │   │   ├── features/                # Módulos / Vistas por dominio funcional
│   │   │   │   ├── auth/                # Login page, Forgot password
│   │   │   │   ├── dashboard/           # Bento Grid principal con métricas, QR y accesos
│   │   │   │   ├── products/            # Lista bento de productos, formulario modal, control de stock
│   │   │   │   ├── orders/              # Tablero Kanban y tabla detallada de ventas
│   │   │   │   ├── whatsapp/            # Hub de conexión Baileys, configuración de mensajes, flujos
│   │   │   │   ├── live-chat/           # Bandeja tipo WhatsApp Web para intervenir chats
│   │   │   │   └── users/               # Gestión de Subadministradores y roles
│   │   │   │
│   │   │   └── layouts/                 # MainLayout (Sidebar colapsable + Header Bento)
│   │   ├── assets/                      # Sonidos de notificación, íconos, logos
│   │   ├── styles.css                   # Tailwind directives y utilidades personalizadas
│   │   └── index.html
│   ├── tailwind.config.js
│   ├── package.json
│   └── angular.json
│
├── docker-compose.yml                   # Orquestación de PostgreSQL, Redis, Backend y Frontend
└── README.md
```

---

## 10. Flujos de Interacción y Diagramas de Secuencia

### 10.1. Flujo de Consulta de Catálogo y Compra por WhatsApp

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 📱 Cliente (WhatsApp)
    participant Baileys as ⚡ Baileys WhatsApp Engine
    participant MessageHandler as 🧠 Flow Message Handler
    participant ProductService as 📦 Product & Stock Service
    participant OrderService as 💳 Order Processing Service
    participant DB as 🗄️ PostgreSQL Database
    participant AdminDashboard as 🖥️ Bento Dashboard (Angular)

    Cliente->>Baileys: "Hola, ¿qué productos tienen disponibles?"
    Baileys->>MessageHandler: Parse mensaje entrante
    MessageHandler->>ProductService: Consultar productos activos con stock > 0
    ProductService->>DB: SELECT * FROM products WHERE is_available = true AND stock > 0
    DB-->>ProductService: Lista de productos
    ProductService-->>MessageHandler: Formatear catálogo (Texto + Fotos)
    MessageHandler->>Baileys: Enviar catálogo interactivo con numeración/códigos
    Baileys-->>Cliente: Entrega mensaje con fotos, precios y comando para pedir

    Cliente->>Baileys: "Quiero comprar 1 unidad del producto #01"
    MessageHandler->>ProductService: Validar stock de #01
    ProductService->>DB: Verificar cantidad disponible
    DB-->>ProductService: Stock OK (Stock actual: 15)
    
    MessageHandler->>Baileys: Solicitar datos: "Ingresa tu Nombre y Dirección de entrega"
    Cliente->>Baileys: "Carlos Gómez, Av. Libertador 450"
    
    MessageHandler->>OrderService: Crear orden con estado PENDING
    OrderService->>DB: INSERT INTO orders & order_items
    DB-->>OrderService: Orden creada: #ORD-2026-0089
    
    OrderService->>AdminDashboard: Emitir evento WebSocket 'NEW_ORDER'
    Note over AdminDashboard: 🔔 Alerta Sonora + Bento Card de Pedido parpadea en verde
    
    OrderService->>Baileys: Enviar confirmación formal al cliente
    Baileys-->>Cliente: "¡Gracias Carlos! Tu pedido #ORD-2026-0089 está registrado. Un asesor lo procesará pronto."
```

### 10.2. Flujo de Toma de Control Humano (Human Takeover)

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 📱 Cliente
    actor SubAdmin as 👤 Subadministrador (Dashboard)
    participant SocketGateway as 🌐 WebSockets Gateway
    participant DB as 🗄️ PostgreSQL
    participant Baileys as ⚡ Baileys Engine

    Cliente->>Baileys: "Tengo una duda técnica que el menú no responde"
    Baileys->>SocketGateway: Nuevo mensaje en ChatSession
    SocketGateway->>SubAdmin: Notificación visual en la bandeja de entrada
    
    SubAdmin->>SocketGateway: Clic en "Pausar Bot para este Chat"
    SocketGateway->>DB: UPDATE ChatSession SET isBotActive = false
    
    SubAdmin->>SocketGateway: Escribe respuesta: "Hola Carlos, soy Martín de soporte. ¿En qué te ayudo?"
    SocketGateway->>Baileys: SendTextMessage(targetPhone, content)
    Baileys-->>Cliente: Mensaje enviado como agente humano
    
    Note over Cliente, Baileys: Los mensajes del cliente NO dispararán respuestas automáticas del bot mientras esté pausado.
```

---

## 11. Estrategia de Seguridad y Buenas Prácticas

### 11.1. Seguridad en Backend (NestJS)
- **Hashing Criptográfico:** `Argon2id` o `Bcrypt` (12 salt rounds) para almacenamiento de contraseñas de usuarios.
- **Validación de Entradas:** `ValidationPipe` global con `class-validator` y `class-transformer`, con `whitelist: true` y `forbidNonWhitelisted: true` para prevenir inyección de payloads maliciosos.
- **Protección contra Ataques:** 
  - `helmet` para configurar cabeceras HTTP seguras.
  - `@nestjs/throttler` para limitar peticiones (Rate Limiting) y prevenir ataques de fuerza bruta en endpoints de autenticación.
  - CORS configurado estrictamente para los orígenes autorizados del frontend.
- **Seguridad en Baileys:** Aislamiento de las credenciales de WhatsApp en directorios protegidos con permisos de lectura restringidos; limpieza de sesiones corruptas.

### 11.2. Buenas Prácticas de Frontend (Angular)
- **Signals y Reactividad Moderna:** Reducción de renders innecesarios y abandono de `ChangeDetectionStrategy.Default` en favor de `OnPush` con Signals nativos.
- **Standalone Components:** Arquitectura modular sin módulos `NgModule` pesados, permitiendo tree-shaking óptimo.
- **Control de Rutas y Guards:** Protección de rutas mediante `canActivate: [authGuard, roleGuard]` impidiendo que un `SUBADMIN` acceda a configuraciones o usuarios.

---

## 12. Plan de Implementación Paso a Paso (Roadmap)

```mermaid
gantt
    title Cronograma de Implementación del Proyecto
    dateFormat  YYYY-MM-DD
    section Fase 1: Entorno & DB
    Setup Inicial Monorepo & Prisma       :2026-09-01, 3d
    Modelado de Base de Datos PostgreSQL  :2026-09-04, 2d
    section Fase 2: Backend Core & Auth
    Autenticación JWT & RBAC (Roles)      :2026-09-06, 4d
    Módulo de Catálogo & Productos CRUD   :2026-09-10, 4d
    section Fase 3: Motor Baileys
    Integración Baileys & QR WebSocket    :2026-09-14, 5d
    Motor de Flujos & Venta Automatizada  :2026-09-19, 5d
    section Fase 4: Frontend Bento UI
    Setup Angular 18 + Tailwind Bento     :2026-09-24, 4d
    Dashboard Bento & Control de Bot      :2026-09-28, 4d
    Módulo de Productos & Pedidos         :2026-10-02, 5d
    Bandeja Live Chat & Human Takeover    :2026-10-07, 4d
    section Fase 5: QA & Despliegue
    Pruebas E2E & Optimización            :2026-10-11, 4d
    Dockerización & Puesta en Producción  :2026-10-15, 3d
```

### Detalle de Fases

1. **Fase 1: Configuración Base y Persistencia**
   - Inicialización del proyecto backend NestJS y frontend Angular.
   - Configuración de PostgreSQL y esquema Prisma con migraciones iniciales.
   - Creación de semilla de datos (Seed) con usuario Administrador por defecto y categorías demo.

2. **Fase 2: Backend Core, Seguridad y Catálogo**
   - Implementación de casos de uso de Autenticación (`login`, `refresh-token`).
   - Implementación del CRUD de Productos con subida de imágenes, control de stock y filtros.
   - Implementación del sistema de Auditoría.

3. **Fase 3: Motor de WhatsApp Baileys**
   - Creación del `BaileysManagerService` para gestionar la conexión del socket y eventos de ciclo de vida.
   - Implementación del Gateway de WebSockets para transmitir el código QR y estado de la conexión en vivo.
   - Desarrollo del despachador de mensajes y lógica de atención al cliente (catálogo y pedidos).

4. **Fase 4: Frontend Bento Grid con Tailwind CSS**
   - Configuración de Tailwind CSS con paleta personalizada, variables CSS y utilidades Bento.
   - Desarrollo de componentes compartidos: Bento Card, Stat Card, QR Viewer, Modal, Data Tables.
   - Vistas: Dashboard Principal, Gestión de Productos, Tablero de Pedidos, Conexión WhatsApp y Live Chat.

5. **Fase 5: Pruebas, Ajustes y Despliegue**
   - Pruebas integrales de flujo de compra por WhatsApp y recepción en tiempo real en el Dashboard.
   - Configuración de `docker-compose.yml` para despliegue automatizado.

---

## 13. Despliegue y Variables de Entorno

### 13.1. Archivo `.env.example` (Backend)

```env
# Servidor
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:4200

# Base de Datos PostgreSQL
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/wsp_system_db?schema=public"

# Seguridad JWT
JWT_ACCESS_SECRET="super-secret-access-key-wsp-2026-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="super-secret-refresh-key-wsp-2026-change-in-production"
JWT_REFRESH_EXPIRATION="7d"

# WhatsApp Baileys Configuration
BAILEY_SESSION_DIR="./auth_info_baileys"
BAILEY_AUTO_RECONNECT=true
DEFAULT_COUNTRY_CODE="54"

# Motor de Inteligencia Artificial (OpenAI)
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
OPENAI_MODEL="gpt-5.6-luna"

# Almacenamiento Multimedia (Local / Cloudinary)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### 13.2. Orquestación con Docker (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres_db:
    image: postgres:16-alpine
    container_name: wsp_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: wsp_system_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - wsp_network

  backend_api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: wsp_backend
    restart: always
    depends_on:
      - postgres_db
    environment:
      DATABASE_URL: "postgresql://postgres:postgrespassword@postgres_db:5432/wsp_system_db?schema=public"
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - baileys_auth_data:/app/auth_info_baileys
    networks:
      - wsp_network

  frontend_app:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wsp_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend_api
    networks:
      - wsp_network

volumes:
  postgres_data:
  baileys_auth_data:

networks:
  wsp_network:
    driver: bridge
```

---

## 14. Resumen y Estado del Proyecto

Este documento constituye la **guía técnica maestra** del sistema, centralizando la arquitectura de Backend en NestJS (Clean Architecture, SOLID, Prisma, PostgreSQL 16), Frontend en Angular 18 con Bento Grid en Light Mode, Motor de WhatsApp Baileys con IA OpenAI (`gpt-5.6-luna`), generador de catálogo PDF y subida de archivos.

---

## 15. Ecosistema de Skills de Antigravity (`skills.sh` & Customizations)

El proyecto es 100% compatible con el estándar abierto de **Agent Skills** de [`skills.sh`](https://skills.sh) y el **Antigravity Customization System**.

Las siguientes **Skills de Especialidad UI/UX & Frontend** se encuentran instaladas en la raíz del workspace en `.agents/skills/` para guiar al asistente en cualquier desarrollo visual:

| Skill | Repositorio / Origen | Propósito y Capacidades |
| :--- | :--- | :--- |
| **`design-taste-frontend`** | `Leonxlnx/taste-skill` | Directrices anti-slop frontend, control de dials visuales (`DESIGN_VARIANCE: 7`, `MOTION_INTENSITY: 6`, `VISUAL_DENSITY: 4`), eliminación de clichés de IA, consistencia de radio de curvatura y contrastes WCAG AA estrictos. |
| **`frontend-design`** | `anthropics/skills` | Diseño frontend de grado de producción con personalidad distintiva, tipografía intencional, esquemas de color no genéricos y microinteracciones refinadas. |
| **`ui-ux-pro-max`** | `nextlevelbuilder/ui-ux-pro-max-skill` | Patrones avanzados de UI/UX para interfaces complejas, optimización de flujos de usuario y diseño de dashboards de alta densidad. |
| **`vercel-composition-patterns`** | `vercel-labs/agent-skills` | Arquitectura de componentes escalables, composición declarativa y desacoplamiento de interfaces reactivas. |

### Cómo instalar nuevas Skills en el proyecto:
```bash
npx skills add <url-del-repositorio> --skill <nombre-de-la-skill>
```
Antigravity detecta automáticamente la instalación y ubica los archivos `SKILL.md` en `.agents/skills/<skill_name>/` para su carga progresiva.

