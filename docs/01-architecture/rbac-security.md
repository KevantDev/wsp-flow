# Roles, Permisos (RBAC) y Estrategia de Seguridad

## 1. Jerarquía de Roles del Sistema

El sistema implementa control de acceso basado en roles granular mediante decoradores en NestJS (`@Roles()`, `@CurrentUser()`) y `Guards` de rutas en Angular (`authGuard`, `roleGuard`).

| Rol | Descripción y Alcance |
| :--- | :--- |
| **`SUPER_ADMIN`** | Operador global de la plataforma SaaS. Acceso al dashboard financiero global, gestión de tenants, cambio de planes y modo suplantación (impersonation). |
| **`ADMIN`** | Dueño de la tienda o negocio. Control total sobre su catálogo, pedidos, configuración de IA, conexión WhatsApp Baileys y gestión de su equipo. |
| **`SUBADMIN`** | Operador de almacén, despachador o agente de ventas. Permisos restringidos a catálogo, pedidos y atención en Live Chat. |

---

## 2. Matriz de Permisos Detallada

| Funcionalidad / Módulo | SUPER_ADMIN | ADMIN | SUBADMIN |
| :--- | :---: | :---: | :---: |
| **Super Admin Dashboard (MRR, ARR, GMV Global)** | ✅ | ❌ | ❌ |
| **Crear y Bloquear Tiendas / Tenants** | ✅ | ❌ | ❌ |
| **Suplantación de Identidad (Modo Soporte)** | ✅ | ❌ | ❌ |
| **Gestión de Subadministradores de Tienda** | ✅ | ✅ | ❌ |
| **Escanear QR / Reiniciar WhatsApp Baileys** | ✅ | ✅ | ⚠️ Solo Ver Estado |
| **Configuración del Prompt de Luna & IA** | ✅ | ✅ | ❌ |
| **CRUD de Productos y Categorías** | ✅ | ✅ | ✅ |
| **Eliminación Permanente de Productos** | ✅ | ✅ | ❌ Solo Desactivar |
| **Avanzar Estados de Pedidos en Kanban** | ✅ | ✅ | ✅ |
| **Reembolsos en Dinero (Mercado Pago)** | ✅ | ✅ | ❌ Requiere Aprobación |
| **Atención en Live Chat y Pausar Bot** | ✅ | ✅ | ✅ |
| **Difusiones Masivas y CRM de Clientes** | ✅ | ✅ | ⚠️ Solo Lectura |

---

## 3. Seguridad de Autenticación y Tokens JWT

- **Access Token:** Válido por 15 minutos. Contiene `{ sub: userId, role: Role, tenantId: string }`.
- **Refresh Token:** Válido por 7 días con rotación automática tras cada renovación.
- **Hashing de Contraseñas:** Encriptación Bcrypt con 12 rondas de salt.
- **Interceptores de Seguridad:**
  - `JwtAuthGuard`: Valida la firma del token en cada endpoint privado.
  - `RolesGuard`: Comprueba la matriz de roles contra la metadata de la ruta.
  - `TenantGuard`: Asegura que el usuario solo acceda a recursos asociados a su `tenantId`.

---

## 4. Protección Anti-Ban y Blindaje de IA

1. **Simulación de Comportamiento Humano:**
   - Delays aleatorios configurables (1500ms a 3500ms) antes de cada mensaje.
   - Emisión de evento de presencia `composing` (*"escribiendo..."*).
   - Intervalos de descanso entre envíos de campañas masivas de difusión.

2. **Prompt Shielding & Anti-Jailbreak:**
   - Reglas maestras que impiden a Luna revelar el system prompt, programar código, responder temas políticos o ejecutar instrucciones fuera del catálogo del comercio.
