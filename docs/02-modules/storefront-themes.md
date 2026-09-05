# Motor de Tiendas Digitales y Personalización Multitema

## 1. Visión General de la Tienda Digital (`/store/:slug`)

Cada comercio alojado en **WSP Flow** cuenta con una tienda web moderna, ultra rápida y de alto impacto estético accesible mediante su slug único (ej: `/store/wsp-tech`).

---

## 2. Las 3 Plantillas Visuales Integradas

| Plantilla | Identificador | Estética & Enfoque |
| :--- | :---: | :--- |
| **Cyber Tech & Gaming** | `dark-tech` | Fondo oscuro profundo (`#090d16`), acentos neón esmeralda (`#10b981`), tarjetas neo-glass y badges técnicos. Ideal para electrónica, periféricos y gaming. |
| **Minimal Boutique & Luxury** | `light-minimal` | Fondo marfil claro (`#fcfcfd`), tipografía serif editorial (*Playfair Display*), acentos en oro rosado o negro obsidiana. Ideal para moda, joyería y cosmética. |
| **Gastronomic Warm Brand** | `warm-brand` | Tonos terracota y ámbar cálido, bordes suaves, tarjetas de ingredientes y badges de frescura. Ideal para restaurantes, cafeterías y alimentos artesanales. |

---

## 3. Personalizador en Vivo (`StoreThemeComponent`)

Desde el panel administrativo de la tienda (`/settings`), los administradores pueden personalizar en tiempo real sin tocar código:
- **Colores de Acento:** Paleta con selectores predefinidos y previsualización inmediata.
- **Tipografías:** Outfit, Plus Jakarta Sans, Inter o Playfair Display cargadas de forma asíncrona.
- **Banners de Hero & Promociones:** Textos, botones CTA, subtítulos y banners promocionales con contador regresivo.
- **Insignias de Confianza (Trust Badges):** Despacho express, garantía de tienda, pagos seguros y soporte WhatsApp 24/7.
- **Reseñas y Testimonios:** Módulo de opiniones de clientes con fotos y calificaciones por estrellas.

---

## 4. Carrito de Compras Persistente & Checkout Dual

- **`CartService` (Signals):** Gestión del estado de la bolsa de compras en memoria con persistencia en LocalStorage.
- **Drawer Deslizable (`CartDrawerComponent`):** Panel lateral interactivo accesible en todo momento con selector de cantidades y cálculo dinámico de subtotales.
- **Modalidades de Despacho:**
  1. `PICKUP`: Recojo gratuito en la tienda física configurada.
  2. `HOME_DELIVERY`: Envío urbano a domicilio con tarifa calculada por distrito.
  3. `PROVINCE_AGENCY`: Envío terrestre a provincias mediante agencias de encomienda (Shalom / Olva Courier).
- **Checkout Dual:**
  - **Botón "Pagar en Línea con Mercado Pago":** Redirige al Checkout Pro oficial para liquidar con Yape, Tarjetas (Visa, Mastercard, Amex), PagoEfectivo o dinero en cuenta.
  - **Botón "Pedir por WhatsApp":** Genera un mensaje preformateado con la lista de productos y enlace directo para cerrar la venta mediante el Asistente IA Luna.
