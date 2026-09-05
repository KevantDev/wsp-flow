# Sistema de Diseño UI/UX (Bento Grid & Light Mode)

## 1. Directrices de Bento Grid en Light Mode

El frontend de **WSP Flow** implementa un diseño modular estilo **Bento Grid** optimizado para **Light Mode** con **Tailwind CSS**:

1. **Evitar el blanco puro sobre blanco puro:**
   - Fondo general del canvas: `bg-[#F8F9FA]` o `bg-zinc-50`.
   - Superficie de las tarjetas Bento: `bg-white` con bordes sutiles `border border-zinc-200/80` y elevación suave `shadow-[0_2px_8px_rgba(0,0,0,0.04)]`.
2. **Contraste de Texto y Accesibilidad (WCAG AA):**
   - Títulos principales: `text-zinc-900 font-extrabold`.
   - Textos descriptivos: `text-zinc-500` o `text-slate-600`.
   - Metadatos y etiquetas: `text-zinc-400 font-mono text-[11px] uppercase tracking-wider font-semibold`.
3. **Micro-interacciones y Estados Hover:**
   - Elevación al interactuar: `hover:shadow-md hover:border-zinc-300 transition-all duration-200 ease-out`.
   - Atajos de teclado estilizados: `<kbd class="kbd-badge">⌘K</kbd>` para búsqueda rápida.

---

## 2. Paleta de Colores y Tokens Tailwind

| Elemento | Clase Tailwind | Color / Valor |
| :--- | :--- | :--- |
| **Canvas** | `bg-[#F8F9FA]` | Gris neutro suave con micro-textura radial |
| **Bento Cards** | `bg-white` + `border-zinc-200/80` | Blanco puro elevado |
| **Primario / Acción** | `bg-indigo-600 hover:bg-indigo-700` | Índigo profesional |
| **Acento WhatsApp** | `bg-emerald-50 text-emerald-700` | Verde pastel con bordes esmeralda |
| **Peligro / Alerta** | `bg-rose-50 text-rose-700 border-rose-200` | Rojo coral para cancelaciones o errores |

---

## 3. Experiencia de Carga Inmediata (Skeleton UI)

Para erradicar los spinners que congelan la pantalla completa, las vistas principales implementan esqueletos pulsantes de alta fidelidad:
- **Tienda Digital (`StoreFrontComponent`):** Muestra el esqueleto del Navbar, Hero y la cuadrícula de productos con sombras y bordes reales mientras se resuelve la API.
- **Tablero To-Do (`OrdersComponent`):** Tarjetas skeleton en las 4 columnas del pipeline.
- **Cuadrícula de Productos (`ProductsComponent`):** Cuadrícula de 6 a 8 tarjetas skeleton.

---

## 4. Reactividad de Alto Rendimiento (Angular 18 Signals)

- Se eliminaron las funciones en plantillas que se reejecutaban en cada ciclo de detección de cambios (`ChangeDetection`).
- Se sustituyeron por señales computadas inmutables:
  - `ordersByColumn = computed(...)` en el Kanban de pedidos.
  - `filteredProducts = computed(...)` en el catálogo de productos.
  - `fontFamilyStyle = computed(...)` y `theme = computed(...)` en la tienda pública.
