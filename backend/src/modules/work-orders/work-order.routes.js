'use strict';

/**
 * work-order.routes.js — Rutas del módulo de Órdenes de Trabajo.
 *
 * GET    /api/work-orders                              ADMIN: listar con filtros
 * GET    /api/work-orders/stats                        ADMIN: conteo por estado
 * GET    /api/work-orders/:id                          ADMIN | técnico asignado | cliente dueño
 * POST   /api/work-orders                              ADMIN: crear
 * PUT    /api/work-orders/:id                          ADMIN: actualizar campos
 * POST   /api/work-orders/:id/status                   ADMIN: cambiar estado
 * DELETE /api/work-orders/:id                          ADMIN: cancelar
 *
 * GET    /api/work-orders/:id/labor                    ADMIN | técnico asignado
 * POST   /api/work-orders/:id/labor                    ADMIN
 * PUT    /api/work-orders/:id/labor/:lineId             ADMIN
 * DELETE /api/work-orders/:id/labor/:lineId             ADMIN
 *
 * GET    /api/work-orders/:id/parts                    ADMIN | técnico asignado
 * POST   /api/work-orders/:id/parts                    ADMIN
 * PUT    /api/work-orders/:id/parts/:lineId             ADMIN
 * DELETE /api/work-orders/:id/parts/:lineId             ADMIN
 *
 * POST   /api/work-orders/:id/photos                   ADMIN
 * DELETE /api/work-orders/:id/photos/:photoId           ADMIN
 *
 * POST   /api/work-orders/:id/invoice                  ADMIN: genera factura (idempotente) y descarga PDF
 * GET    /api/work-orders/:id/invoice/download          ADMIN: descarga PDF de la factura
 *
 * GET    /api/vehicles/:vehicleId/work-order-history   authenticated
 * GET    /api/clients/:clientId/work-order-history     ADMIN | self
 */

const express = require('express');

const WorkOrderService    = require('./work-order.service');
const WorkOrderRepository = require('./work-order.repository');
const InvoiceService      = require('./invoice.service');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError }        = require('../../middleware/error-handler');
const { USER_ROLES, WORK_ORDER_STATUS } = require('../../config/constants');

const router = express.Router();

// ================================================================
// WORK ORDERS — CRUD
// ================================================================

/**
 * @swagger
 * /api/work-orders:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Lista órdenes de trabajo con filtros opcionales (solo ADMIN)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: technicianId
 *         schema: { type: string }
 *       - in: query
 *         name: clientId
 *         schema: { type: string }
 *       - in: query
 *         name: vehicleId
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Lista de órdenes de trabajo
 */
router.get('/',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { status, technicianId, clientId, vehicleId, limit, offset } = req.query;
      const repo = new WorkOrderRepository(req.db);
      const data = await repo.findAll({ status, technicianId, clientId, vehicleId, limit, offset });
      res.json({ data, message: 'Órdenes obtenidas correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/stats:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Conteo de órdenes por estado (solo ADMIN)
 *     responses:
 *       200:
 *         description: Estadísticas de órdenes
 */
router.get('/stats',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new WorkOrderRepository(req.db);
      const data = await repo.countByStatus();
      res.json({ data, message: 'Estadísticas obtenidas correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Obtiene el detalle completo de una orden
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       403:
 *         description: Sin permiso para ver esta orden
 *       404:
 *         description: Orden no encontrada
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new WorkOrderRepository(req.db);
    const data = await repo.findById(req.params.id);
    if (!data) throw new AppError('Orden de trabajo no encontrada.', 404);

    const { role, id: userId } = req.user;
    const isAdmin      = role === USER_ROLES.ADMIN;
    const isTechnician = data.technician && data.technician.id === userId;
    const isOwner      = data.client.id === userId;

    if (!isAdmin && !isTechnician && !isOwner) {
      throw new AppError('No tienes permiso para ver esta orden.', 403);
    }

    res.json({ data, message: 'Orden obtenida correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/work-orders:
 *   post:
 *     tags: [WorkOrders]
 *     summary: Crea una nueva orden de trabajo (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, vehicleId]
 *             properties:
 *               clientId:           { type: string }
 *               vehicleId:          { type: string }
 *               technicianId:       { type: string }
 *               priority:           { type: string }
 *               mileage:            { type: integer }
 *               problemDescription: { type: string }
 *               estimatedCost:      { type: number }
 *     responses:
 *       201:
 *         description: Orden creada
 */
router.post('/',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { clientId, vehicleId, technicianId, priority,
              mileage, problemDescription, estimatedCost } = req.body;
      if (!clientId || !vehicleId) {
        throw new AppError('clientId y vehicleId son requeridos.', 400);
      }
      const service = new WorkOrderService(req.db);
      const data = await service.createWorkOrder(
        { clientId, vehicleId, technicianId, priority, mileage, problemDescription, estimatedCost },
        req.user.id
      );
      res.status(201).json({ data, message: 'Orden de trabajo creada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   put:
 *     tags: [WorkOrders]
 *     summary: Actualiza los campos de una orden (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Orden actualizada
 *       404:
 *         description: Orden no encontrada
 */
router.put('/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new WorkOrderRepository(req.db);
      const existing = await repo.findById(req.params.id);
      if (!existing) throw new AppError('Orden de trabajo no encontrada.', 404);

      const {
        technicianId, priority, mileage, problemDescription, diagnosis,
        recommendations, internalNotes, estimatedCost, finalCost,
        discountAmount, taxAmount, totalAmount,
        approvedBy, approvedAt, invoicedAt, deliveredAt,
      } = req.body;

      const data = await repo.update(req.params.id, {
        technicianId, priority, mileage, problemDescription, diagnosis,
        recommendations, internalNotes, estimatedCost, finalCost,
        discountAmount, taxAmount, totalAmount,
        approvedBy, approvedAt, invoicedAt, deliveredAt,
      });
      res.json({ data, message: 'Orden actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}/status:
 *   post:
 *     tags: [WorkOrders]
 *     summary: Cambia el estado de una orden (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string }
 *               notes:  { type: string }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       422:
 *         description: Transición no permitida
 */
router.post('/:id/status',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { status, notes } = req.body;
      if (!status) throw new AppError('status es requerido.', 400);
      if (!Object.values(WORK_ORDER_STATUS).includes(status)) {
        throw new AppError(`Estado inválido: ${status}.`, 400);
      }
      const service = new WorkOrderService(req.db);
      const data = await service.changeStatus(req.params.id, status, req.user.id, notes);
      res.json({ data, message: 'Estado actualizado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   delete:
 *     tags: [WorkOrders]
 *     summary: Cancela una orden de trabajo (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Orden cancelada
 *       422:
 *         description: Orden en estado terminal, no se puede cancelar
 */
router.delete('/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new WorkOrderRepository(req.db);
      const wo = await repo.findById(req.params.id);
      if (!wo) throw new AppError('Orden de trabajo no encontrada.', 404);

      const terminal = [WORK_ORDER_STATUS.DELIVERED, WORK_ORDER_STATUS.INVOICED];
      if (terminal.includes(wo.status)) {
        throw new AppError(
          `No se puede cancelar una orden en estado ${wo.status}.`, 422
        );
      }

      const service = new WorkOrderService(req.db);
      const data = await service.changeStatus(req.params.id, WORK_ORDER_STATUS.CANCELLED, req.user.id, req.body.notes);
      res.json({ data, message: 'Orden cancelada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// INVOICES
// ================================================================

/**
 * @swagger
 * /api/work-orders/{id}/invoice:
 *   post:
 *     tags: [WorkOrders]
 *     summary: Genera y descarga la factura PDF de una orden (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF de la factura
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Orden no encontrada
 *       422:
 *         description: Estado de la orden no permite facturar
 */
router.post('/:id/invoice',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new WorkOrderRepository(req.db);
      const wo   = await repo.findById(req.params.id);
      if (!wo) throw new AppError('Orden de trabajo no encontrada.', 404);

      const invoiceableStatuses = [
        WORK_ORDER_STATUS.COMPLETED,
        WORK_ORDER_STATUS.INVOICED,
        WORK_ORDER_STATUS.DELIVERED,
      ];
      if (!invoiceableStatuses.includes(wo.status)) {
        throw new AppError(
          `La orden debe estar en estado COMPLETED, INVOICED o DELIVERED para generar factura. Estado actual: ${wo.status}.`,
          422,
        );
      }

      let invoice = await repo.findInvoiceByWorkOrder(req.params.id);
      if (!invoice) {
        const invoiceNumber = `FAC-${wo.orderNumber.replace('OT-', '')}`;
        invoice = await repo.createInvoice(req.params.id, {
          invoiceNumber,
          subtotal:       wo.finalCost,
          discountAmount: wo.discountAmount,
          taxAmount:      wo.taxAmount,
          total:          wo.totalAmount,
        });
      }

      const invoiceService = new InvoiceService();
      const pdfBuffer      = await invoiceService.generatePdf(wo);

      await repo.updateInvoicePdfUrl(invoice.id, 'generated');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${wo.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}/invoice/download:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Descarga la factura PDF de una orden (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF de la factura
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Orden no encontrada
 *       422:
 *         description: Estado de la orden no permite facturar
 */
router.get('/:id/invoice/download',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new WorkOrderRepository(req.db);
      const wo   = await repo.findById(req.params.id);
      if (!wo) throw new AppError('Orden de trabajo no encontrada.', 404);

      const invoiceableStatuses = [
        WORK_ORDER_STATUS.COMPLETED,
        WORK_ORDER_STATUS.INVOICED,
        WORK_ORDER_STATUS.DELIVERED,
      ];
      if (!invoiceableStatuses.includes(wo.status)) {
        throw new AppError(
          `La orden debe estar en estado COMPLETED, INVOICED o DELIVERED para generar factura. Estado actual: ${wo.status}.`,
          422,
        );
      }

      let invoice = await repo.findInvoiceByWorkOrder(req.params.id);
      if (!invoice) {
        const invoiceNumber = `FAC-${wo.orderNumber.replace('OT-', '')}`;
        invoice = await repo.createInvoice(req.params.id, {
          invoiceNumber,
          subtotal:       wo.finalCost,
          discountAmount: wo.discountAmount,
          taxAmount:      wo.taxAmount,
          total:          wo.totalAmount,
        });
      }

      const invoiceService = new InvoiceService();
      const pdfBuffer      = await invoiceService.generatePdf(wo);

      await repo.updateInvoicePdfUrl(invoice.id, 'generated');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${wo.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) { next(err); }
  }
);

// ================================================================
// LABOR LINES
// ================================================================

/**
 * @swagger
 * /api/work-orders/{id}/labor:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Lista las líneas de mano de obra de una orden
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Líneas de mano de obra
 */
router.get('/:id/labor', authMiddleware, async (req, res, next) => {
  try {
    const repo = new WorkOrderRepository(req.db);
    const wo = await repo.findById(req.params.id);
    if (!wo) throw new AppError('Orden de trabajo no encontrada.', 404);

    const { role, id: userId } = req.user;
    const isAdmin      = role === USER_ROLES.ADMIN;
    const isTechnician = wo.technician && wo.technician.id === userId;
    if (!isAdmin && !isTechnician) {
      throw new AppError('No tienes permiso para ver las líneas de esta orden.', 403);
    }

    const data = await repo.findLaborByWorkOrder(req.params.id);
    res.json({ data, message: 'Líneas de mano de obra obtenidas correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/work-orders/{id}/labor:
 *   post:
 *     tags: [WorkOrders]
 *     summary: Agrega una línea de mano de obra (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description]
 *             properties:
 *               description:  { type: string }
 *               technicianId: { type: string }
 *               laborRateId:  { type: string }
 *               hours:        { type: number }
 *               ratePerHour:  { type: number }
 *     responses:
 *       201:
 *         description: Línea agregada
 */
router.post('/:id/labor',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { description, technicianId, laborRateId, hours, ratePerHour } = req.body;
      if (!description) throw new AppError('description es requerido.', 400);
      const service = new WorkOrderService(req.db);
      const data = await service.addLaborLine(req.params.id, { description, technicianId, laborRateId, hours, ratePerHour });
      res.status(201).json({ data, message: 'Línea de mano de obra agregada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}/labor/{lineId}:
 *   put:
 *     tags: [WorkOrders]
 *     summary: Actualiza una línea de mano de obra (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: lineId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Línea actualizada
 */
router.put('/:id/labor/:lineId',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { description, technicianId, laborRateId, hours, ratePerHour } = req.body;
      const service = new WorkOrderService(req.db);
      const data = await service.updateLaborLine(
        req.params.lineId, req.params.id,
        { description, technicianId, laborRateId, hours, ratePerHour }
      );
      res.json({ data, message: 'Línea de mano de obra actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}/labor/{lineId}:
 *   delete:
 *     tags: [WorkOrders]
 *     summary: Elimina una línea de mano de obra (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: lineId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Línea eliminada
 */
router.delete('/:id/labor/:lineId',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const service = new WorkOrderService(req.db);
      const data = await service.deleteLaborLine(req.params.lineId, req.params.id);
      res.json({ data, message: 'Línea de mano de obra eliminada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// PARTS LINES
// ================================================================

/**
 * @swagger
 * /api/work-orders/{id}/parts:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Lista las líneas de repuestos de una orden
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Líneas de repuestos
 */
router.get('/:id/parts', authMiddleware, async (req, res, next) => {
  try {
    const repo = new WorkOrderRepository(req.db);
    const wo = await repo.findById(req.params.id);
    if (!wo) throw new AppError('Orden de trabajo no encontrada.', 404);

    const { role, id: userId } = req.user;
    const isAdmin      = role === USER_ROLES.ADMIN;
    const isTechnician = wo.technician && wo.technician.id === userId;
    if (!isAdmin && !isTechnician) {
      throw new AppError('No tienes permiso para ver los repuestos de esta orden.', 403);
    }

    const data = await repo.findPartsByWorkOrder(req.params.id);
    res.json({ data, message: 'Líneas de repuestos obtenidas correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/work-orders/{id}/parts:
 *   post:
 *     tags: [WorkOrders]
 *     summary: Agrega una línea de repuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description]
 *             properties:
 *               description: { type: string }
 *               sparePartId: { type: string }
 *               quantity:    { type: number }
 *               unitPrice:   { type: number }
 *     responses:
 *       201:
 *         description: Línea agregada
 */
router.post('/:id/parts',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { description, sparePartId, quantity, unitPrice } = req.body;
      if (!description) throw new AppError('description es requerido.', 400);
      const service = new WorkOrderService(req.db);
      const data = await service.addPartLine(req.params.id, { description, sparePartId, quantity, unitPrice });
      res.status(201).json({ data, message: 'Línea de repuesto agregada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}/parts/{lineId}:
 *   put:
 *     tags: [WorkOrders]
 *     summary: Actualiza una línea de repuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: lineId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Línea actualizada
 */
router.put('/:id/parts/:lineId',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { description, sparePartId, quantity, unitPrice } = req.body;
      const service = new WorkOrderService(req.db);
      const data = await service.updatePartLine(
        req.params.lineId, req.params.id,
        { description, sparePartId, quantity, unitPrice }
      );
      res.json({ data, message: 'Línea de repuesto actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}/parts/{lineId}:
 *   delete:
 *     tags: [WorkOrders]
 *     summary: Elimina una línea de repuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: lineId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Línea eliminada
 */
router.delete('/:id/parts/:lineId',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const service = new WorkOrderService(req.db);
      const data = await service.deletePartLine(req.params.lineId, req.params.id);
      res.json({ data, message: 'Línea de repuesto eliminada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// PHOTOS
// ================================================================

/**
 * @swagger
 * /api/work-orders/{id}/photos:
 *   post:
 *     tags: [WorkOrders]
 *     summary: Agrega una foto de evidencia (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [photoUrl]
 *             properties:
 *               photoUrl:    { type: string }
 *               photoType:   { type: string, enum: [BEFORE, DURING, AFTER] }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Foto agregada
 */
router.post('/:id/photos',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { photoUrl, photoType, description } = req.body;
      if (!photoUrl) throw new AppError('photoUrl es requerido.', 400);
      const repo = new WorkOrderRepository(req.db);
      const wo = await repo.findById(req.params.id);
      if (!wo) throw new AppError('Orden de trabajo no encontrada.', 404);
      const data = await repo.addPhoto(req.params.id, { photoUrl, photoType, description });
      res.status(201).json({ data, message: 'Foto agregada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/work-orders/{id}/photos/{photoId}:
 *   delete:
 *     tags: [WorkOrders]
 *     summary: Elimina una foto de evidencia (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Foto eliminada
 *       404:
 *         description: Foto no encontrada
 */
router.delete('/:id/photos/:photoId',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new WorkOrderRepository(req.db);
      const data = await repo.deletePhoto(req.params.photoId);
      if (!data) throw new AppError('Foto no encontrada.', 404);
      res.json({ data, message: 'Foto eliminada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ── Services ─────────────────────────────────────────────────────────────────

router.post('/:id/services',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const svc = new WorkOrderService(req.db);
      const { serviceTypeId, name, description, basePrice } = req.body;
      const service = await svc.addService(req.params.id, { serviceTypeId, name, description, basePrice });
      res.status(201).json({ data: service, message: 'Servicio agregado correctamente.' });
    } catch (err) { next(err); }
  }
);

router.delete('/:id/services/:serviceId',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const svc = new WorkOrderService(req.db);
      const removed = await svc.removeService(req.params.serviceId, req.params.id);
      if (!removed) throw new AppError('Servicio no encontrado.', 404);
      res.json({ data: removed, message: 'Servicio eliminado correctamente.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
