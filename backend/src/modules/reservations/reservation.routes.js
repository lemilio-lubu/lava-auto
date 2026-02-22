'use strict';

/**
 * reservation.routes.js — Gestión de reservas.
 *
 * GET    /api/reservations             → reservas del usuario (o por vehicleId)
 * GET    /api/reservations/all         → todas (ADMIN)
 * GET    /api/reservations/stats       → estadísticas por rol
 * GET    /api/reservations/:id         → detalle
 * POST   /api/reservations             → crear reserva
 * PUT    /api/reservations/:id         → editar (solo PENDING)
 * POST   /api/reservations/:id/assign  → asignar lavador (ADMIN)
 * POST   /api/reservations/:id/cancel  → cancelar
 */

const express = require('express');

const ReservationRepository = require('./reservation.repository');
const ServiceRepository     = require('./service.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError }          = require('../../middleware/error-handler');
const { USER_ROLES, RESERVATION_STATUS } = require('../../config/constants');

const router = express.Router();

// ================================================================
// GET /api/reservations
// ================================================================

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     tags: [Reservations]
 *     summary: Lista las reservas del usuario autenticado (o filtra por vehicleId)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: vehicleId
 *         schema: { type: string }
 *         description: Filtrar por vehículo
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Lista de reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, vehicleId, limit, offset } = req.query;
    const repo = new ReservationRepository(req.db);

    let reservations;
    if (vehicleId) {
      reservations = await repo.findByVehicleId(vehicleId, { status });
    } else if (req.user.role === USER_ROLES.WASHER) {
      reservations = await repo.findByWasherId(req.user.id, {
        status,
        limit:  parseInt(limit,  10) || 50,
        offset: parseInt(offset, 10) || 0,
      });
    } else {
      reservations = await repo.findByUserId(req.user.id, {
        status,
        limit:  parseInt(limit,  10) || 50,
        offset: parseInt(offset, 10) || 0,
      });
    }

    res.json(reservations);
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/reservations/all  (ADMIN)  — antes de /:id
// ================================================================

/**
 * @swagger
 * /api/reservations/all:
 *   get:
 *     tags: [Reservations]
 *     summary: Lista todas las reservas (solo ADMIN)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Lista completa de reservas
 */
router.get('/all',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { status, limit, offset } = req.query;
      const repo = new ReservationRepository(req.db);
      const reservations = await repo.findAll({
        status,
        limit:  parseInt(limit,  10) || 100,
        offset: parseInt(offset, 10) || 0,
      });
      res.json(reservations);
    } catch (err) { next(err); }
  }
);

// ================================================================
// GET /api/reservations/stats  — antes de /:id
// ================================================================

/**
 * @swagger
 * /api/reservations/stats:
 *   get:
 *     tags: [Reservations]
 *     summary: Estadísticas de reservas por rol
 *     description: >
 *       ADMIN ve estadísticas globales.
 *       WASHER ve las suyas.
 *       CLIENT ve las propias.
 *     responses:
 *       200:
 *         description: Conteos por estado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationStats'
 */
router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const repo = new ReservationRepository(req.db);
    let stats;

    if (req.user.role === USER_ROLES.ADMIN) {
      stats = await repo.getStats();
    } else if (req.user.role === USER_ROLES.WASHER) {
      stats = await repo.getStats(null, req.user.id);
    } else {
      stats = await repo.getStats(req.user.id);
    }

    // Convertir strings a enteros
    res.json({
      pending:    parseInt(stats.pending,    10),
      confirmed:  parseInt(stats.confirmed,  10),
      inProgress: parseInt(stats.in_progress, 10),
      completed:  parseInt(stats.completed,  10),
      cancelled:  parseInt(stats.cancelled,  10),
      total:      parseInt(stats.total,      10),
    });
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/reservations/:id
// ================================================================

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     tags: [Reservations]
 *     summary: Obtiene el detalle de una reserva
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos de la reserva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Reserva no encontrada
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo        = new ReservationRepository(req.db);
    const reservation = await repo.findById(req.params.id);

    if (!reservation) throw new AppError('Reserva no encontrada.', 404);

    // Solo el cliente, el lavador asignado o un admin pueden verla
    if (req.user.role !== USER_ROLES.ADMIN &&
        reservation.userId   !== req.user.id &&
        reservation.washerId !== req.user.id) {
      throw new AppError('No autorizado.', 403);
    }

    res.json(reservation);
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/reservations
// ================================================================

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Crea una nueva reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservationCreateBody'
 *     responses:
 *       201:
 *         description: Reserva creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Campos requeridos faltantes o servicio inexistente
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      vehicleId, serviceId, scheduledDate, scheduledTime,
      notes, address, latitude, longitude,
    } = req.body;

    if (!vehicleId || !serviceId || !scheduledDate || !scheduledTime) {
      throw new AppError(
        'vehicleId, serviceId, scheduledDate y scheduledTime son requeridos.', 400
      );
    }

    const svcRepo = new ServiceRepository(req.db);
    const service = await svcRepo.findById(serviceId);
    if (!service || !service.isActive) {
      throw new AppError('Servicio no encontrado o inactivo.', 400);
    }

    const resRepo = new ReservationRepository(req.db);
    const reservation = await resRepo.create({
      userId: req.user.id,
      vehicleId,
      serviceId,
      scheduledDate,
      scheduledTime,
      totalAmount: service.price,
      notes,
      address,
      latitude,
      longitude,
    });

    res.status(201).json(reservation);
  } catch (err) { next(err); }
});

// ================================================================
// PUT /api/reservations/:id
// ================================================================

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     tags: [Reservations]
 *     summary: Edita una reserva (solo si está en estado PENDING)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservationCreateBody'
 *     responses:
 *       200:
 *         description: Reserva actualizada
 *       400:
 *         description: Solo se pueden editar reservas pendientes
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Reserva no encontrada
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo        = new ReservationRepository(req.db);
    const reservation = await repo.findById(req.params.id);

    if (!reservation) throw new AppError('Reserva no encontrada.', 404);

    if (req.user.role !== USER_ROLES.ADMIN && reservation.userId !== req.user.id) {
      throw new AppError('No autorizado.', 403);
    }

    if (reservation.status !== RESERVATION_STATUS.PENDING) {
      throw new AppError('Solo se pueden editar reservas en estado PENDING.', 400);
    }

    const { vehicleId, serviceId, scheduledDate, scheduledTime, address, latitude, longitude, notes } = req.body;

    // Si cambia el servicio, recalcular el monto
    let totalAmount = reservation.totalAmount;
    if (serviceId && serviceId !== reservation.serviceId) {
      const svcRepo = new ServiceRepository(req.db);
      const service = await svcRepo.findById(serviceId);
      if (service) totalAmount = service.price;
    }

    const updated = await repo.update(req.params.id, {
      ...(vehicleId      && { vehicleId }),
      ...(serviceId      && { serviceId }),
      ...(scheduledDate  && { scheduledDate }),
      ...(scheduledTime  && { scheduledTime }),
      ...(address      !== undefined && { address }),
      ...(latitude     !== undefined && { latitude }),
      ...(longitude    !== undefined && { longitude }),
      ...(notes        !== undefined && { notes }),
      ...(totalAmount  !== reservation.totalAmount && { totalAmount }),
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/reservations/:id/assign  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/reservations/{id}/assign:
 *   post:
 *     tags: [Reservations]
 *     summary: Asigna un lavador a la reserva (solo ADMIN)
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
 *             required: [washerId]
 *             properties:
 *               washerId: { type: string }
 *     responses:
 *       200:
 *         description: Lavador asignado; estado cambia a CONFIRMED
 *       400:
 *         description: Solo se puede asignar a reservas PENDING
 */
router.post('/:id/assign',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { washerId } = req.body;
      if (!washerId) throw new AppError('washerId es requerido.', 400);

      const repo        = new ReservationRepository(req.db);
      const reservation = await repo.findById(req.params.id);

      if (!reservation) throw new AppError('Reserva no encontrada.', 404);

      if (reservation.status !== RESERVATION_STATUS.PENDING) {
        throw new AppError('Solo se puede asignar lavador a reservas PENDING.', 400);
      }

      const updated = await repo.assignWasher(req.params.id, washerId);
      res.json(updated);
    } catch (err) { next(err); }
  }
);

// ================================================================
// POST /api/reservations/:id/cancel
// ================================================================

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   post:
 *     tags: [Reservations]
 *     summary: Cancela una reserva (PENDING o CONFIRMED)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *       400:
 *         description: No se puede cancelar en el estado actual
 */
router.post('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const repo        = new ReservationRepository(req.db);
    const reservation = await repo.findById(req.params.id);

    if (!reservation) throw new AppError('Reserva no encontrada.', 404);

    if (req.user.role !== USER_ROLES.ADMIN && reservation.userId !== req.user.id) {
      throw new AppError('No autorizado.', 403);
    }

    const cancellable = [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED];
    if (!cancellable.includes(reservation.status)) {
      throw new AppError('No se puede cancelar una reserva en este estado.', 400);
    }

    const cancelled = await repo.cancelReservation(req.params.id);
    res.json(cancelled);
  } catch (err) { next(err); }
});

module.exports = router;
