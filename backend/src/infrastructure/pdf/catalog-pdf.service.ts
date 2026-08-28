import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { PrismaProductRepository } from '../persistence/prisma/repositories/prisma-product.repository';
import { PrismaCategoryRepository } from '../persistence/prisma/repositories/prisma-category.repository';

@Injectable()
export class CatalogPdfService {
  private readonly logger = new Logger(CatalogPdfService.name);
  private readonly catalogDir = path.join(process.cwd(), 'uploads', 'catalogs');
  private readonly pdfPath = path.join(this.catalogDir, 'catalogo_wsp_flow.pdf');

  constructor(
    private readonly productRepo: PrismaProductRepository,
    private readonly categoryRepo: PrismaCategoryRepository,
  ) {
    if (!fs.existsSync(this.catalogDir)) {
      fs.mkdirSync(this.catalogDir, { recursive: true });
    }
  }

  getPdfPath(): string {
    return this.pdfPath;
  }

  hasGeneratedPdf(): boolean {
    return fs.existsSync(this.pdfPath);
  }

  /**
   * Genera o regenera el catálogo completo en PDF con diseño Bento
   */
  async generateCatalogPdf(): Promise<{ buffer: Buffer; filePath: string }> {
    this.logger.log('📄 Iniciando generación del Catálogo PDF...');

    const products = await this.productRepo.findAll({ onlyAvailable: true });
    const categories = await this.categoryRepo.findAll(true);

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36, // 0.5 pulgada
          info: {
            Title: 'Catálogo de Productos - WSP Flow',
            Author: 'WSP Flow Commerce',
            Subject: 'Catálogo de Productos y Precios',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const finalBuffer = Buffer.concat(buffers);
          fs.writeFileSync(this.pdfPath, finalBuffer);
          this.logger.log(`✅ Catálogo PDF guardado exitosamente en: ${this.pdfPath} (${(finalBuffer.length / 1024).toFixed(1)} KB)`);
          resolve({ buffer: finalBuffer, filePath: this.pdfPath });
        });

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 36;
        const contentWidth = pageWidth - margin * 2;

        // --- ENCABEZADO PRINCIPAL (HEADER BANNER) ---
        this.renderHeader(doc, margin, contentWidth);

        let currentY = 135;

        // --- RENDERIZAR PRODUCTOS EN GRID BENTO ---
        const cardWidth = (contentWidth - 16) / 2; // 2 columnas
        const cardHeight = 150;
        let col = 0;

        for (let i = 0; i < products.length; i++) {
          const product = products[i];

          // Comprobar si cabe en la página actual
          if (currentY + cardHeight > pageHeight - 60) {
            this.renderFooter(doc, pageWidth, pageHeight, margin);
            doc.addPage();
            this.renderHeader(doc, margin, contentWidth, false);
            currentY = 110;
            col = 0;
          }

          const cardX = margin + col * (cardWidth + 16);
          const cardY = currentY;

          // Dibujar tarjeta Bento blanca con borde suave
          doc
            .roundedRect(cardX, cardY, cardWidth, cardHeight, 10)
            .fillAndStroke('#FFFFFF', '#E4E4E7');

          // Descargar e incrustar imagen si existe
          const imageUrl = product.images?.[0]?.imageUrl;
          let imageDrawn = false;

          if (imageUrl) {
            try {
              const imgBuffer = await this.fetchImageBuffer(imageUrl);
              if (imgBuffer) {
                doc.image(imgBuffer, cardX + 10, cardY + 12, {
                  fit: [70, 70],
                  align: 'center',
                  valign: 'center',
                });
                imageDrawn = true;
              }
            } catch (imgErr) {
              // Silencioso: si falla la foto, se dibuja placeholder
            }
          }

          if (!imageDrawn) {
            doc
              .roundedRect(cardX + 10, cardY + 12, 70, 70, 6)
              .fillAndStroke('#F4F4F5', '#E4E4E7');
            doc
              .fontSize(10)
              .fillColor('#A1A1AA')
              .text('📦', cardX + 38, cardY + 38);
          }

          // Información del producto (Derecha)
          const textStartX = cardX + 90;
          const textWidth = cardWidth - 100;

          // Badge SKU
          doc
            .roundedRect(textStartX, cardY + 12, 55, 14, 4)
            .fillAndStroke('#EEF2FF', '#C7D2FE');
          doc
            .fontSize(7)
            .fillColor('#4338CA')
            .font('Helvetica-Bold')
            .text(product.sku, textStartX + 4, cardY + 16, { width: 47, align: 'center' });

          // Categoría
          doc
            .fontSize(8)
            .fillColor('#71717A')
            .font('Helvetica')
            .text(product.categoryName || 'General', textStartX + 62, cardY + 16, { width: textWidth - 62 });

          // Nombre del Producto
          doc
            .fontSize(10)
            .fillColor('#18181B')
            .font('Helvetica-Bold')
            .text(product.name, textStartX, cardY + 32, {
              width: textWidth,
              height: 26,
              ellipsis: true,
            });

          // Descripción corta
          if (product.description) {
            doc
              .fontSize(7.5)
              .fillColor('#71717A')
              .font('Helvetica')
              .text(product.description, textStartX, cardY + 62, {
                width: textWidth,
                height: 22,
                ellipsis: true,
              });
          }

          // Barra inferior de la tarjeta (Precio + Stock)
          doc
            .moveTo(cardX + 10, cardY + 110)
            .lineTo(cardX + cardWidth - 10, cardY + 110)
            .strokeColor('#F4F4F5')
            .stroke();

          // Precio Destacado
          doc
            .fontSize(13)
            .fillColor('#4F46E5')
            .font('Helvetica-Bold')
            .text(`S/ ${product.price.toFixed(2)}`, cardX + 10, cardY + 122);

          // Stock Badge
          const stockText = product.stock > 5 ? `Stock: ${product.stock} un.` : `¡Últimas ${product.stock} un.!`;
          const stockBg = product.stock > 5 ? '#ECFDF5' : '#FFFBEB';
          const stockBorder = product.stock > 5 ? '#A7F3D0' : '#FDE68A';
          const stockColor = product.stock > 5 ? '#047857' : '#B45309';

          doc
            .roundedRect(cardX + cardWidth - 85, cardY + 120, 75, 18, 5)
            .fillAndStroke(stockBg, stockBorder);
          doc
            .fontSize(7.5)
            .fillColor(stockColor)
            .font('Helvetica-Bold')
            .text(stockText, cardX + cardWidth - 85, cardY + 125, { width: 75, align: 'center' });

          // Avanzar posición en grid
          col++;
          if (col === 2) {
            col = 0;
            currentY += cardHeight + 14;
          }
        }

        // Renderizar Footer en la última página
        this.renderFooter(doc, pageWidth, pageHeight, margin);

        doc.end();
      } catch (err) {
        this.logger.error(`Error generando PDF: ${err.message}`);
        reject(err);
      }
    });
  }

  private renderHeader(doc: typeof PDFDocument, margin: number, contentWidth: number, isFirstPage = true) {
    // Banner Gradient Indigo/Purple
    doc
      .roundedRect(margin, margin, contentWidth, isFirstPage ? 76 : 54, 12)
      .fillAndStroke('#4F46E5', '#4338CA');

    // Título
    doc
      .fontSize(isFirstPage ? 18 : 14)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('⚡ WSP FLOW — CATÁLOGO DE PRODUCTOS', margin + 18, margin + (isFirstPage ? 16 : 12));

    // Subtítulo
    doc
      .fontSize(isFirstPage ? 9.5 : 8)
      .fillColor('#E0E7FF')
      .font('Helvetica')
      .text(
        'Ventas y Pedidos Automáticos por WhatsApp • Precios en tiempo real',
        margin + 18,
        margin + (isFirstPage ? 40 : 32),
      );

    // Fecha / Estado Pill
    const dateStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    doc
      .roundedRect(margin + contentWidth - 110, margin + 16, 95, 22, 6)
      .fillAndStroke('#3730A3', '#6366F1');
    doc
      .fontSize(8)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text(`📅 ${dateStr}`, margin + contentWidth - 110, margin + 22, { width: 95, align: 'center' });
  }

  private renderFooter(doc: typeof PDFDocument, pageWidth: number, pageHeight: number, margin: number) {
    const footerY = pageHeight - 42;
    doc
      .moveTo(margin, footerY)
      .lineTo(pageWidth - margin, footerY)
      .strokeColor('#E4E4E7')
      .stroke();

    doc
      .fontSize(8)
      .fillColor('#71717A')
      .font('Helvetica')
      .text('🛍️ Para realizar un pedido, responde directamente por WhatsApp con el código SKU o nombre del producto.', margin, footerY + 8);

    doc
      .fontSize(8)
      .fillColor('#4F46E5')
      .font('Helvetica-Bold')
      .text('WSP Flow Commerce', pageWidth - margin - 100, footerY + 8, { width: 100, align: 'right' });
  }

  private async fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
      if (url.startsWith('http://localhost:3000/uploads/')) {
        const relative = url.replace('http://localhost:3000/uploads/', '');
        const localPath = path.join(process.cwd(), 'uploads', relative);
        if (fs.existsSync(localPath)) {
          return fs.readFileSync(localPath);
        }
      }

      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 3500 });
      return Buffer.from(response.data);
    } catch {
      return null;
    }
  }
}
