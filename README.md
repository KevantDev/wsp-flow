# ⚡ WSP FLOW — Bento Commerce & WhatsApp Bot IA

Plataforma integral de **Comercio Electrónico y Atención Automatizada por WhatsApp** desarrollada con **Angular 18**, **NestJS 10**, **Prisma ORM**, **PostgreSQL 16**, **WhatsApp Baileys Engine** y **OpenAI GPT-5.6-luna (Function Calling)**.

---

## 🚀 Características Principales

- **🎨 Diseño Bento Grid en Light Mode:**
  - Sistema de diseño de alta gama basado en las directrices de `frontend-design` y `ui-ux-pro-max`.
  - Iconografía vectorial SVG pura, microinteracciones táctiles y contraste accesible (WCAG AA).
- **🌐 Landing Page Pública Interactiva:**
  - Simulador de WhatsApp en tiempo real con 4 escenarios demostrativos.
  - Vitrina de catálogo público con botones de compra directa (`wa.me/?text=...`).
- **🤖 Asistente Virtual Luna con Function Calling:**
  - Motor impulsado por OpenAI (`gpt-5.6-luna`) con herramientas para consultar inventario, verificar stock, registrar pedidos y transferir a agentes humanos.
- **📱 WhatsApp Multi-Device con Baileys:**
  - Conexión mediante escaneo QR por WebSockets en tiempo real, sin depender de la API Cloud ni tarifas por conversación de Meta.
- **📄 Generador de Catálogo en PDF:**
  - Compilación automática en un documento A4 maquetado estilo Bento con fotos, precios y SKUs.
  - Envío automático del PDF al chat de WhatsApp al solicitar el catálogo.
- **📋 Tablero To-Do / Kanban de Pedidos:**
  - 4 etapas de flujo (*Por Atender, En Preparación, En Camino, Entregados*) con avance en 1 solo clic y enlaces a WhatsApp Web.
- **💬 Bandeja de Entrada Live Chat:**
  - Interfaz tipo WhatsApp Web con switch para toma de control en vivo (*Bot Activo / Agente Humano*).
- **👥 Roles y Permisos de Equipo:**
  - Control de accesos para Administrador Principal y Subadministradores.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | Angular 18 (Standalone Components, Signals), Tailwind CSS, Vanilla CSS |
| **Backend** | NestJS 10, TypeScript, Clean Architecture, SOLID |
| **Base de Datos** | PostgreSQL 16 + Prisma ORM |
| **WhatsApp Engine** | `@whiskeysockets/baileys` (WebSockets en tiempo real) |
| **Inteligencia Artificial** | `OpenAI SDK` (`gpt-5.6-luna` con Function Calling) |
| **Generación PDF** | `PDFKit` (Maquetación editorial de alta resolución) |
| **Subida de Archivos** | `Multer` (Almacenamiento local con entrega estática) |

---

## ⚙️ Requisitos Previos

- **Node.js:** v18 o superior
- **PostgreSQL:** v14 o superior
- **Git**

---

## 📦 Instalación y Puesta en Marcha

### 1. Clonar el Repositorio
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd "wsp v4"
```

### 2. Configurar el Backend
```bash
cd backend
npm install
cp .env.example .env
```
*Edita el archivo `.env` con tus credenciales de PostgreSQL y tu clave de OpenAI.*

### 3. Migrar la Base de Datos y Cargar Datos Iniciales
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Iniciar el Backend (Modo Desarrollo)
```bash
npm run start:dev
```
*API disponible en: `http://localhost:3000/api/v1`*

### 5. Configurar e Iniciar el Frontend
En otra terminal:
```bash
cd ../frontend
npm install
npm start
```
*Aplicación disponible en: `http://localhost:4200`*

---

## 🔑 Credenciales Demostrativas Iniciales

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **👑 Administrador** | `admin@wspflow.com` | `Admin123456!` |
| **👤 Subadministrador** | `subadmin@wspflow.com` | `Subadmin123456!` |

---

## 📑 Documentación Completa

Para conocer todos los diagramas de arquitectura, modelos Prisma, flujos de secuencia y contratos de API, consulta el documento maestro:
👉 **[`PROJECT_SPECIFICATION.md`](./PROJECT_SPECIFICATION.md)**

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
