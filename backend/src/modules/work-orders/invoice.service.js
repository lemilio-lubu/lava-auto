'use strict';

/**
 * invoice.service.js — Generación de PDF en memoria para Órdenes de Trabajo.
 *
 * No escribe al sistema de archivos. Retorna un Buffer listo para enviar
 * como respuesta HTTP con Content-Type: application/pdf.
 */

const PDFDocument = require('pdfkit');

class InvoiceService {
  /**
   * Genera un PDF para la orden de trabajo dada y retorna el Buffer.
   *
   * @param {object} workOrder - Entidad completa retornada por repo.findById()
   * @returns {Promise<Buffer>}
   */
  async generatePdf(workOrder) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this._buildPdf(doc, workOrder);
      doc.end();
    });
  }

  // ----------------------------------------------------------------
  // Private
  // ----------------------------------------------------------------

  _buildPdf(doc, wo) {
    // Resolve nested vs flat shapes from repo.findById()
    const clientName     = wo.client?.name     ?? wo.clientName     ?? '-';
    const vehiclePlate   = wo.vehicle?.plate   ?? wo.vehiclePlate   ?? '-';
    const vehicleBrand   = wo.vehicle?.brand   ?? wo.vehicleBrand   ?? '';
    const vehicleModel   = wo.vehicle?.model   ?? wo.vehicleModel   ?? '';
    const technicianName = wo.technician?.name ?? wo.technicianName ?? 'No asignado';

    // ── Header ──────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ORDEN DE TRABAJO', { align: 'center' });

    doc
      .fontSize(14)
      .font('Helvetica')
      .text(`# ${wo.orderNumber}`, { align: 'center' });

    doc.moveDown();

    // ── Date and status ─────────────────────────────────────────────
    doc
      .fontSize(10)
      .text(`Fecha: ${new Date(wo.createdAt).toLocaleDateString('es-EC')}`);
    doc.text(`Estado: ${wo.status}`);
    doc.moveDown();

    // ── Client (left) / Vehicle (right) ─────────────────────────────
    const leftX  = 50;
    const rightX = 300;
    const topY   = doc.y;

    doc.font('Helvetica-Bold').text('CLIENTE', leftX, topY);
    doc.font('Helvetica').text(clientName, leftX, topY + 14);

    doc.font('Helvetica-Bold').text('VEHÍCULO', rightX, topY);
    doc
      .font('Helvetica')
      .text(
        `${vehicleBrand} ${vehicleModel} — Placa: ${vehiclePlate}`.trim(),
        rightX,
        topY + 14,
      );
    if (wo.mileage != null) {
      doc.text(`Kilometraje: ${wo.mileage.toLocaleString()}`, rightX, topY + 28);
    }

    doc.moveDown(3);

    // ── Technician ──────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .text('TÉCNICO RESPONSABLE: ', { continued: true });
    doc.font('Helvetica').text(technicianName);
    doc.moveDown();

    // ── Problem description ─────────────────────────────────────────
    if (wo.problemDescription) {
      doc.font('Helvetica-Bold').text('PROBLEMA REPORTADO:');
      doc.font('Helvetica').text(wo.problemDescription);
      doc.moveDown();
    }

    // ── Labor table ─────────────────────────────────────────────────
    const labor = wo.labor ?? [];
    if (labor.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('MANO DE OBRA');
      doc.moveDown(0.5);
      this._drawTable(
        doc,
        ['Descripción', 'Horas', 'Tarifa/h', 'Subtotal'],
        labor.map((l) => [
          l.description,
          String(l.hours),
          `$${Number(l.ratePerHour).toFixed(2)}`,
          `$${Number(l.subtotal).toFixed(2)}`,
        ]),
      );
      doc.moveDown();
    }

    // ── Parts table ─────────────────────────────────────────────────
    const parts = wo.parts ?? [];
    if (parts.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('REPUESTOS / INSUMOS');
      doc.moveDown(0.5);
      this._drawTable(
        doc,
        ['Descripción', 'Cant.', 'Precio U.', 'Subtotal'],
        parts.map((p) => [
          p.description,
          String(p.quantity),
          `$${Number(p.unitPrice).toFixed(2)}`,
          `$${Number(p.subtotal).toFixed(2)}`,
        ]),
      );
      doc.moveDown();
    }

    // ── Cost summary ────────────────────────────────────────────────
    const summaryX   = 350;
    const finalCost  = Number(wo.finalCost   ?? 0);
    const discount   = Number(wo.discountAmount ?? 0);
    const tax        = Number(wo.taxAmount    ?? 0);
    const total      = Number(wo.totalAmount  ?? 0);

    doc.fontSize(10).font('Helvetica');

    doc
      .text('Subtotal:', summaryX, doc.y, { continued: true })
      .text(`  $${finalCost.toFixed(2)}`, { align: 'right' });

    if (discount > 0) {
      doc
        .text('Descuento:', summaryX, doc.y, { continued: true })
        .text(`  -$${discount.toFixed(2)}`, { align: 'right' });
    }

    if (tax > 0) {
      doc
        .text('Impuestos:', summaryX, doc.y, { continued: true })
        .text(`  $${tax.toFixed(2)}`, { align: 'right' });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('TOTAL:', summaryX, doc.y, { continued: true })
      .text(`  $${total.toFixed(2)}`, { align: 'right' });

    // ── Footer ───────────────────────────────────────────────────────
    doc.moveDown(3);
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('grey')
      .text(
        'Este documento es generado automáticamente por el sistema de gestión del taller.',
        { align: 'center' },
      );
  }

  /**
   * Draws a simple table with a header row and data rows.
   *
   * @param {PDFDocument} doc
   * @param {string[]} headers
   * @param {string[][]} rows
   */
  _drawTable(doc, headers, rows) {
    const colWidths = [250, 60, 80, 80];
    const startX    = 50;
    let y           = doc.y;

    // Header row
    doc.font('Helvetica-Bold').fontSize(9);
    headers.forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h, x, y, { width: colWidths[i] });
    });
    y += 16;
    doc.moveTo(startX, y).lineTo(startX + 470, y).stroke();
    y += 4;

    // Data rows
    doc.font('Helvetica').fontSize(9);
    rows.forEach((row) => {
      row.forEach((cell, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(String(cell), x, y, { width: colWidths[i] });
      });
      y += 16;
    });

    doc.moveDown();
  }
}

module.exports = InvoiceService;
