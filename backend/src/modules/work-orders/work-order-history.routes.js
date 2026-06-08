'use strict';

/**
 * work-order-history.routes.js — Rutas de historial de órdenes de trabajo
 * asociadas a un vehículo o cliente.
 *
 * GET /api/vehicles/:vehicleId/work-order-history  — authenticated
 * GET /api/clients/:clientId/work-order-history    — ADMIN o self
 */

const express = require('express');

const WorkOrderRepository = require('./work-order.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError }  = require('../../middleware/error-handler');
const { USER_ROLES } = require('../../config/constants');

const vehicleHistoryRouter = express.Router({ mergeParams: true });
const clientHistoryRouter  = express.Router({ mergeParams: true });

// ================================================================
// Vehicle work-order history
// ================================================================

/**
 * @swagger
 * /api/vehicles/{vehicleId}/work-order-history:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Historial de órdenes de trabajo de un vehículo (authenticated)
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Historial de órdenes
 */
vehicleHistoryRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const repo = new WorkOrderRepository(req.db);
    const data = await repo.findByVehicle(req.params.vehicleId);
    res.json({ data, message: 'Historial de órdenes del vehículo obtenido correctamente.' });
  } catch (err) { next(err); }
});

// ================================================================
// Client work-order history
// ================================================================

/**
 * @swagger
 * /api/clients/{clientId}/work-order-history:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Historial de órdenes de trabajo de un cliente (ADMIN o self)
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Historial de órdenes
 *       403:
 *         description: Sin permiso para ver el historial de este cliente
 */
clientHistoryRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const isAdmin = role === USER_ROLES.ADMIN;
    const isSelf  = userId === req.params.clientId;
    if (!isAdmin && !isSelf) {
      throw new AppError('No tienes permiso para ver el historial de este cliente.', 403);
    }
    const repo = new WorkOrderRepository(req.db);
    const data = await repo.findByClient(req.params.clientId);
    res.json({ data, message: 'Historial de órdenes del cliente obtenido correctamente.' });
  } catch (err) { next(err); }
});

module.exports = { vehicleHistoryRouter, clientHistoryRouter };
