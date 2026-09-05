import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaCompanyConfigRepository } from '../persistence/prisma/repositories/prisma-company-config.repository';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class ReceiptPdfService {
  private readonly logger = new Logger(ReceiptPdfService.name);
  private readonly receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');

  constructor(private readonly configRepo: PrismaCompanyConfigRepository) {
    if (!fs.existsSync(this.receiptsDir)) {
      fs.mkdirSync(this.receiptsDir, { recursive: true });
    }
  }

  /**
   * Genera el PDF de la Boleta de Venta Electrónica para una orden específica
   */
  async generateReceiptPdf(order: OrderEntity): Promise<{ buffer: Buffer; filePath: string; fileName: string }> {
    const fileName = `Boleta_${order.orderNumber}.pdf`;
    const filePath = path.join(this.receiptsDir, fileName);

    let config: any = null;
    try {
      config = await this.configRepo.getConfig();
    } catch {
      // fallback
    }

    const companyName = config?.companyName || 'WSP FLOW ECOMMERCE S.A.C.';
    const companyAddress = config?.address || config?.pickupStoreAddress || 'Av. Larco 743, Miraflores, Lima, Perú';
    const companyPhone = config?.contactPhone || '+51 927 398 004';
    const companyRuc = '20609874512';

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Boleta de Venta - ${order.orderNumber}`,
            Author: companyName,
            Subject: `Comprobante de Venta Electrónica ${order.orderNumber}`,
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const finalBuffer = Buffer.concat(buffers);
          fs.writeFileSync(filePath, finalBuffer);
          this.logger.log(`✅ Boleta PDF generada: ${filePath} (${(finalBuffer.length / 1024).toFixed(1)} KB)`);
          resolve({ buffer: finalBuffer, filePath, fileName });
        });

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;

        // 1. TOP HEADER (Empresa y Caja de Boleta)
        // Empresa Izquierda
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#4338CA')
          .text(companyName, margin, margin);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#52525B')
          .text(`R.U.C.: ${companyRuc}`, margin, margin + 22)
          .text(`Dirección: ${companyAddress}`, margin, margin + 34, { width: 280 })
          .text(`Teléfono / WhatsApp: ${companyPhone}`, margin, margin + 58)
          .text(`Email: ventas@wspflow.com`, margin, margin + 70);

        // Caja de Boleta Derecha
        const boxWidth = 200;
        const boxHeight = 85;
        const boxX = pageWidth - margin - boxWidth;
        const boxY = margin;

        doc
          .roundedRect(boxX, boxY, boxWidth, boxHeight, 8)
          .fillAndStroke('#F8FAFC', '#CBD5E1');

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#1E293B')
          .text('R.U.C. 20609874512', boxX, boxY + 12, { width: boxWidth, align: 'center' })
          .fillColor('#4338CA')
          .fontSize(12)
          .text('BOLETA DE VENTA', boxX, boxY + 28, { width: boxWidth, align: 'center' })
          .fontSize(10)
          .text('ELECTRÓNICA', boxX, boxY + 43, { width: boxWidth, align: 'center' })
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#0F172A')
          .text(`B001 - ${order.orderNumber.replace('ORD-', '')}`, boxX, boxY + 60, { width: boxWidth, align: 'center' });

        // 2. DATOS DEL CLIENTE Y FECHA (Bento Box)
        const clientBoxY = margin + 95;
        const clientBoxHeight = 82;

        doc
          .roundedRect(margin, clientBoxY, contentWidth, clientBoxHeight, 8)
          .fillAndStroke('#FFFFFF', '#E2E8F0');

        // Extraer DNI si está en notas
        let customerDni = 'Sin DNI';
        if (order.notes && order.notes.includes('DNI:')) {
          const match = order.notes.match(/DNI:\s*([0-9A-Za-z]+)/);
          if (match) customerDni = match[1];
        }

        const dateStr = new Date(order.createdAt).toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Columna Izquierda
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('CLIENTE / SEÑOR(A):', margin + 14, clientBoxY + 12)
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0F172A')
          .text(order.customerName || 'Cliente General', margin + 14, clientBoxY + 24)
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('DIRECCIÓN DE ENTREGA:', margin + 14, clientBoxY + 44)
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(order.customerAddress || 'Entrega por coordinar', margin + 14, clientBoxY + 56, { width: 280, height: 20 });

        // Columna Derecha
        const rightColX = margin + 310;
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('DNI / DOC. IDENTIDAD:', rightColX, clientBoxY + 12)
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0F172A')
          .text(customerDni, rightColX, clientBoxY + 24)
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('FECHA DE EMISIÓN:', rightColX, clientBoxY + 44)
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(dateStr, rightColX, clientBoxY + 56);

        // 3. TABLA DE PRODUCTOS
        let tableY = clientBoxY + clientBoxHeight + 16;
        const colCantW = 45;
        const colPriceW = 85;
        const colTotalW = 95;
        const colDescW = contentWidth - colCantW - colPriceW - colTotalW;

        // Header Tabla
        doc
          .roundedRect(margin, tableY, contentWidth, 24, 4)
          .fill('#4338CA');

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#FFFFFF')
          .text('CANT.', margin + 8, tableY + 7, { width: colCantW, align: 'center' })
          .text('DESCRIPCIÓN DEL PRODUCTO', margin + colCantW + 8, tableY + 7, { width: colDescW })
          .text('P. UNITARIO', margin + colCantW + colDescW, tableY + 7, { width: colPriceW, align: 'right' })
          .text('IMPORTE (PEN)', margin + colCantW + colDescW + colPriceW - 8, tableY + 7, { width: colTotalW, align: 'right' });

        tableY += 24;

        // Items Rows
        const items = order.items || [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          const rowHeight = 26;

          doc
            .rect(margin, tableY, contentWidth, rowHeight)
            .fillAndStroke(rowBg, '#F1F5F9');

          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#0F172A')
            .text(`${item.quantity}`, margin + 8, tableY + 8, { width: colCantW, align: 'center' })
            .font('Helvetica-Bold')
            .text(item.productName, margin + colCantW + 8, tableY + 8, { width: colDescW - 10, ellipsis: true })
            .font('Helvetica')
            .text(`S/ ${item.unitPrice.toFixed(2)}`, margin + colCantW + colDescW, tableY + 8, { width: colPriceW, align: 'right' })
            .font('Helvetica-Bold')
            .text(`S/ ${item.subtotal.toFixed(2)}`, margin + colCantW + colDescW + colPriceW - 8, tableY + 8, { width: colTotalW, align: 'right' });

          tableY += rowHeight;
        }

        // 4. TOTALES Y RESUMEN FINANCIERO
        tableY += 12;
        const summaryBoxWidth = 230;
        const summaryBoxX = pageWidth - margin - summaryBoxWidth;

        const subtotal = order.subtotal;
        const deliveryFee = order.deliveryFee || 0;
        const total = order.total;
        // IGV incluido del 18%
        const opGravada = total / 1.18;
        const igv = total - opGravada;

        doc
          .roundedRect(summaryBoxX, tableY, summaryBoxWidth, 90, 8)
          .fillAndStroke('#F8FAFC', '#E2E8F0');

        let sumLineY = tableY + 10;
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('Op. Gravada (Base Imponible):', summaryBoxX + 12, sumLineY)
          .fillColor('#0F172A')
          .text(`S/ ${opGravada.toFixed(2)}`, summaryBoxX + 12, sumLineY, { width: summaryBoxWidth - 24, align: 'right' });

        sumLineY += 16;
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('I.G.V. (18% Incluido):', summaryBoxX + 12, sumLineY)
          .fillColor('#0F172A')
          .text(`S/ ${igv.toFixed(2)}`, summaryBoxX + 12, sumLineY, { width: summaryBoxWidth - 24, align: 'right' });

        sumLineY += 16;
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('Servicio de Delivery / Envío:', summaryBoxX + 12, sumLineY)
          .fillColor('#0F172A')
          .text(deliveryFee === 0 ? 'S/ 0.00 (Gratis)' : `S/ ${deliveryFee.toFixed(2)}`, summaryBoxX + 12, sumLineY, { width: summaryBoxWidth - 24, align: 'right' });

        sumLineY += 18;
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#4338CA')
          .text('IMPORTE TOTAL:', summaryBoxX + 12, sumLineY)
          .text(`S/ ${total.toFixed(2)} PEN`, summaryBoxX + 12, sumLineY, { width: summaryBoxWidth - 24, align: 'right' });

        // Método de Pago y Estado a la Izquierda
        doc
          .roundedRect(margin, tableY, contentWidth - summaryBoxWidth - 14, 90, 8)
          .fillAndStroke('#FFFFFF', '#E2E8F0');

        const paymentLabel = order.paymentMethod?.includes('MERCADOPAGO')
          ? '💙 Mercado Pago (Tarjetas / Yape)'
          : order.paymentMethod?.includes('YAPE')
          ? '💜 Yape Móvil'
          : order.paymentMethod?.includes('CARD') || order.paymentMethod?.includes('CULQI')
          ? '💳 Tarjeta de Crédito / Débito'
          : '💵 Pago / Contraentrega';

        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('MÉTODO DE PAGO:', margin + 14, tableY + 12)
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor('#0F172A')
          .text(paymentLabel, margin + 14, tableY + 24)
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text('ESTADO DEL COMPROBANTE:', margin + 14, tableY + 44)
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor(order.status === 'CONFIRMED' || order.status === 'DELIVERED' ? '#16A34A' : '#D97706')
          .text(order.status === 'CONFIRMED' || order.status === 'DELIVERED' ? '✓ PAGADO Y CONFIRMADO' : '⏳ PENDIENTE DE PAGO', margin + 14, tableY + 56);

        const transactionRef = (order as any).mercadoPagoPaymentId || order.culqiChargeId;
        if (transactionRef) {
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor('#64748B')
            .text(`Ref. Transacción: ${transactionRef}`, margin + 14, tableY + 70);
        }

        // 5. FOOTER LEGAL
        const footerY = pageHeight - 65;
        doc
          .rect(margin, footerY, contentWidth, 0.5)
          .fill('#CBD5E1');

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#94A3B8')
          .text('Representación impresa de la Boleta de Venta Electrónica. Consultas y soporte en wspflow.com', margin, footerY + 8, { width: contentWidth, align: 'center' })
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#4338CA')
          .text('¡Muchas gracias por su compra y preferencia!', margin, footerY + 22, { width: contentWidth, align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
