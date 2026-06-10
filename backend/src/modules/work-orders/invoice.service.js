'use strict';

const PDFDocument = require('pdfkit');

class InvoiceService {
  async generatePdf(workOrder) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this._buildPdf(doc, workOrder);
      doc.end();
    });
  }

  // ----------------------------------------------------------------
  // Main layout
  // ----------------------------------------------------------------

  _buildPdf(doc, wo) {
    const PW = 595.28;
    const PH = 841.89;
    const M  = 50;
    const W  = PW - M * 2;  // 495.28

    const C = {
      navy:    '#0c4a6e',
      primary: '#0891b2',
      pLight:  '#e0f2fe',
      white:   '#ffffff',
      text:    '#1e293b',
      muted:   '#64748b',
      border:  '#cbd5e1',
      altRow:  '#f8fafc',
      danger:  '#dc2626',
    };

    const clientName     = wo.client?.name     ?? wo.clientName     ?? '—';
    const vehiclePlate   = wo.vehicle?.plate   ?? wo.vehiclePlate   ?? '—';
    const vehicleBrand   = wo.vehicle?.brand   ?? wo.vehicleBrand   ?? '';
    const vehicleModel   = wo.vehicle?.model   ?? wo.vehicleModel   ?? '';
    const technicianName = wo.technician?.name ?? wo.technicianName ?? 'No asignado';
    const dateStr        = new Date(wo.createdAt).toLocaleDateString('es-EC', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // ── HEADER BAND ─────────────────────────────────────────────────
    doc.rect(0, 0, PW, 108).fill(C.navy);
    doc.rect(0, 108, PW, 5).fill(C.primary);

    // Brand name (left)
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(32)
       .text('LAVA', M, 24, { continued: true })
       .fillColor(C.primary).text(' AUTO');

    doc.fillColor('#93c5fd').font('Helvetica').fontSize(9)
       .text('Taller de Carrocería y Servicio Automotriz', M, 62);

    // Decorative dot row
    [0, 8, 16].forEach((dx) => {
      doc.circle(M + dx, 80, 2).fill(C.primary);
    });

    // Invoice label + number (right)
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(22)
       .text('FACTURA', 0, 26, { align: 'right', width: PW - M });

    doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(11)
       .text(`No. ${wo.orderNumber}`, 0, 56, { align: 'right', width: PW - M });

    doc.fillColor('#93c5fd').font('Helvetica').fontSize(8.5)
       .text(dateStr, 0, 75, { align: 'right', width: PW - M });

    // ── INFO CARDS (client + vehicle) ───────────────────────────────
    let y = 126;
    const cardW = (W - 12) / 2;
    const cardH = 68;

    // Client card
    this._infoCard(doc, M, y, cardW, cardH, 'CLIENTE', [
      { bold: clientName },
    ], C);

    // Vehicle card
    const vlines = [
      { bold: `${vehicleBrand} ${vehicleModel}`.trim() || '—' },
      { normal: `Placa: ${vehiclePlate}` },
    ];
    if (wo.mileage != null) {
      vlines.push({ normal: `Km: ${wo.mileage.toLocaleString()}` });
    }
    this._infoCard(doc, M + cardW + 12, y, cardW, cardH, 'VEHÍCULO', vlines, C);

    y += cardH + 10;

    // ── TECHNICIAN ROW ───────────────────────────────────────────────
    doc.rect(M, y, W, 26).fill(C.altRow);
    doc.rect(M, y, W, 26).lineWidth(0.5).strokeColor(C.border).stroke();
    doc.rect(M, y, 4, 26).fill(C.primary);

    doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(8)
       .text('TÉCNICO RESPONSABLE:', M + 12, y + 9, { continued: true })
       .fillColor(C.text).font('Helvetica').fontSize(9)
       .text(`  ${technicianName}`);

    y += 34;

    // ── PROBLEM DESCRIPTION ──────────────────────────────────────────
    if (wo.problemDescription) {
      doc.fillColor(C.muted).font('Helvetica').fontSize(8)
         .text('PROBLEMA REPORTADO', M, y);
      y += 11;
      doc.fillColor(C.text).font('Helvetica').fontSize(9.5)
         .text(wo.problemDescription, M, y, { width: W });
      y = doc.y + 12;
    }

    // ── LABOR TABLE ──────────────────────────────────────────────────
    const labor = wo.labor ?? [];
    if (labor.length > 0) {
      y = this._sectionHeader(doc, 'MANO DE OBRA', M, y, W, C);
      y = this._table(
        doc, M, y, W, C,
        ['Descripción', 'Horas', 'Tarifa/h', 'Subtotal'],
        [0.50, 0.14, 0.18, 0.18],
        labor.map((l) => [
          l.description,
          String(l.hours),
          `$${Number(l.ratePerHour).toFixed(2)}`,
          `$${Number(l.subtotal).toFixed(2)}`,
        ]),
      );
      y += 14;
    }

    // ── PARTS TABLE ──────────────────────────────────────────────────
    const parts = wo.parts ?? [];
    if (parts.length > 0) {
      y = this._sectionHeader(doc, 'REPUESTOS / INSUMOS', M, y, W, C);
      y = this._table(
        doc, M, y, W, C,
        ['Descripción', 'Cant.', 'Precio U.', 'Subtotal'],
        [0.50, 0.12, 0.20, 0.18],
        parts.map((p) => [
          p.description,
          String(p.quantity),
          `$${Number(p.unitPrice).toFixed(2)}`,
          `$${Number(p.subtotal).toFixed(2)}`,
        ]),
      );
      y += 14;
    }

    // ── TOTALS ───────────────────────────────────────────────────────
    const finalCost = Number(wo.finalCost      ?? 0);
    const discount  = Number(wo.discountAmount ?? 0);
    const tax       = Number(wo.taxAmount      ?? 0);
    const total     = Number(wo.totalAmount    ?? 0);

    const tW = 200;
    const tX = M + W - tW;

    const totalsRow = (label, value, color, bold) => {
      doc.fillColor(color ?? C.muted).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5)
         .text(label, tX, y);
      doc.fillColor(color ?? C.text).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5)
         .text(value, tX, y, { width: tW, align: 'right' });
      y += 15;
    };

    totalsRow('Subtotal:', `$${finalCost.toFixed(2)}`);
    if (discount > 0) totalsRow('Descuento:', `-$${discount.toFixed(2)}`, C.danger);
    if (tax > 0)      totalsRow('IVA:', `$${tax.toFixed(2)}`);

    // Separator
    doc.moveTo(tX, y + 2).lineTo(tX + tW, y + 2).lineWidth(1).strokeColor(C.border).stroke();
    y += 9;

    // Total box
    doc.rect(tX, y, tW, 36).fill(C.navy);
    doc.rect(tX, y, 5, 36).fill(C.primary);

    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(10)
       .text('TOTAL USD', tX + 12, y + 12);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(17)
       .text(`$${total.toFixed(2)}`, tX, y + 9, { width: tW - 10, align: 'right' });

    y += 50;

    // ── NOTES ───────────────────────────────────────────────────────
    if (wo.internalNotes) {
      doc.rect(M, y, W, 1).fill(C.border);
      y += 8;
      doc.fillColor(C.muted).font('Helvetica').fontSize(8)
         .text('NOTAS:', M, y, { continued: true })
         .font('Helvetica').fillColor(C.text)
         .text(`  ${wo.internalNotes}`, { width: W - 5 });
      y = doc.y + 8;
    }

    // ── FOOTER (relativo al contenido, no a la página) ───────────────
    y += 24;
    doc.rect(M, y, W, 1).fill(C.primary);
    y += 9;

    doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
       .text(
         'LAVA AUTO · Taller de Carrocería y Servicio Automotriz · Documento generado automáticamente',
         M, y, { align: 'center', width: W },
       );
    doc.fillColor(C.primary).fontSize(7.5)
       .text(
         `Orden: ${wo.orderNumber}  ·  Emitida el ${dateStr}`,
         M, y + 13, { align: 'center', width: W },
       );
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  _infoCard(doc, x, y, w, h, label, lines, C) {
    doc.rect(x, y, w, h).fill(C.pLight);
    doc.rect(x, y, 4, h).fill(C.primary);

    doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(7.5)
       .text(label, x + 12, y + 9);

    let ly = y + 22;
    lines.forEach((line) => {
      if (line.bold) {
        doc.fillColor(C.text).font('Helvetica-Bold').fontSize(10.5)
           .text(line.bold, x + 12, ly, { width: w - 20 });
        ly += 15;
      } else {
        doc.fillColor(C.muted).font('Helvetica').fontSize(9)
           .text(line.normal, x + 12, ly, { width: w - 20 });
        ly += 13;
      }
    });
  }

  _sectionHeader(doc, title, x, y, w, C) {
    doc.rect(x, y, w, 22).fill(C.navy);
    doc.rect(x, y, 5, 22).fill(C.primary);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9)
       .text(title, x + 14, y + 7);
    return y + 22;
  }

  _table(doc, x, y, w, C, headers, ratios, rows) {
    const cols = ratios.map((r) => Math.floor(r * w));

    // Column header row
    doc.rect(x, y, w, 20).fill(C.pLight);
    doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(8);
    let cx = x;
    headers.forEach((h, i) => {
      doc.text(h, cx + 6, y + 6, { width: cols[i] - 12, align: i === 0 ? 'left' : 'right' });
      cx += cols[i];
    });
    y += 20;

    // Data rows
    rows.forEach((row, ri) => {
      const rh = 18;
      doc.rect(x, y, w, rh).fill(ri % 2 === 0 ? C.white : C.altRow);
      doc.fillColor(C.text).font('Helvetica').fontSize(9);
      cx = x;
      row.forEach((cell, i) => {
        doc.text(String(cell), cx + 6, y + 5, { width: cols[i] - 12, align: i === 0 ? 'left' : 'right' });
        cx += cols[i];
      });
      y += rh;
    });

    // Bottom rule
    doc.rect(x, y, w, 1).fill(C.border);
    return y + 4;
  }
}

module.exports = InvoiceService;
