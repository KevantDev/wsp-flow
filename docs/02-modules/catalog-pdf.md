# Generador de Catálogo de Productos en PDF

## 1. Visión General

El servicio **`CatalogPdfService`** genera automáticamente un catálogo de ventas en formato PDF tamaño A4 con diseño editorial Bento de alto impacto a partir del inventario activo en PostgreSQL.

---

## 2. Características del Diseño del Catálogo

- **Encabezado Institucional:** Nombre del comercio, logotipo, datos de contacto de WhatsApp y fecha de emisión.
- **Grilla de Productos:** Miniaturas fotográficas, títulos de productos, códigos SKU, descripciones compactas, precios en moneda local/dólares e indicadores de stock.
- **Formato Vectorial Ligero:** Compilado mediante la librería **PDFKit** en streaming directo, evitando generar archivos temporales pesados en el disco.

---

## 3. Puntos de Acceso y Descarga

1. **Descarga desde el Panel de Administración:**
   - Botón directo **`📄 Catálogo PDF`** en la vista de Productos (`/products`).
   - Endpoint: `GET /api/v1/products/catalog/pdf`.
2. **Descarga desde la Landing Page Pública:**
   - Botón de descarga en la vitrina para clientes y visitantes.
3. **Despacho Automático en WhatsApp:**
   - Cuando un cliente escribe en el chat palabras clave como *"catálogo"*, *"productos"* o *"precios"*, el bot Baileys genera el PDF al vuelo y lo envía como documento nativo (`Catalogo_WSP_Flow.pdf`) con una guía de compra.
