'use strict';

/**
 * job.routes.js — Panel de trabajo para lavadores.
 *
 * GET  /api/jobs/available          → pool de trabajos PENDING sin asignar
 * GET  /api/jobs/my-jobs            → trabajos propios del lavador
 * POST /api/jobs/:id/accept         → aceptar trabajo (auto-asignación)
 * POST /api/jobs/:id/start          → iniciar servicio → IN_PROGRESS
 * POST /api/jobs/:id/complete       → completar servicio → COMPLETED
 * PUT  /api/jobs/:id/eta            → actualizar hora estimada de llegada
 *
 * Mejora sobre el microservicio original:
 *   Los datos del vehículo y del servicio se obtienen directamente
 *   mediante JOIN en la misma DB, sin llamadas HTTP entre servicios.
 */

const express = require('express');

const ReservationRepository = require('./reservation.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError }          = require('../../middleware/error-handler');
const { USER_ROLES, RESERVATION_STATUS, DB_TABLES } = require('../../config/constants');

const router = express.Router();

// ── Helper: enriquecer trabajos con datos del vehículo (misma DB) ───
/**
 * Enriquece cada trabajo con los datos completos del vehículo,
 * consultando vehicles.vehicles directamente (no HTTP).
 */
async function enrichWithVehicle(db, jobs) {
  if (jobs.length === 0) return jobs;

  // Obtener todos los vehicleId únicos de una vez
  const vehicleIds = [...new Set(jobs.map(j => j.vehicleId).filter(Boolean))];
  if (vehicleIds.length === 0) return jobs.map(j => ({ ...j, vehicle: null }));

  const placeholders = vehicleIds.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await db.query(
    `SELECT id, brand, model, plate, vehicle_type AS "vehicleType",
            color, year, owner_name AS "ownerName", owner_phone AS "ownerPhone"
     FROM   ${DB_TABLES.VEHICLES}
     WHERE  id IN (${placeholders})`,
    vehicleIds
  );

  const vehicleMap = Object.fromEntries(rows.map(v => [v.id, v]));

  return jobs.map(job => ({
    ...job,
    vehicle: vehicleMap[job.vehicleId] ?? null,
  }));
}

// ================================================================
// GET /api/jobs/available  (WASHER | ADMIN)
// ================================================================

/**
 * @swagger
 * /api/jobs/available:
 *   get:
 *     tags: [Jobs]
 *     summary: Pool de trabajos disponibles (PENDING sin lavador asignado)
 *     responses:
 *       200:
 *         description: Lista de reservas pendientes con datos del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JobEnriched'
 */
router.get('/available',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER, USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new ReservationRepository(req.db);
      const jobs = await repo.findPendingJobs();
      const enriched = await enrichWithVehicle(req.db, jobs);
      res.json(enriched);
    } catch (err) { next(err); }
  }
);

// ================================================================
// GET /api/jobs/my-jobs  (WASHER)
// ================================================================

/**
 * @swagger
 * /api/jobs/my-jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Trabajos asignados al lavador autenticado
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Trabajos del lavador enriquecidos con datos de vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JobEnriched'
 */
router.get('/my-jobs',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER),
  async (req, res, next) => {
    try {
      const { status } = req.query;
      const repo = new ReservationRepository(req.db);
      const jobs = await repo.findByWasherId(req.user.id, { status });
      const enriched = await enrichWithVehicle(req.db, jobs);
      res.json(enriched);
    } catch (err) { next(err); }
  }
);

// ================================================================
// POST /api/jobs/:id/accept  (WASHER — auto-asignación)
// ================================================================

/**
 * @swagger
 * /api/jobs/{id}/accept:
 *   post:
 *     tags: [Jobs]
 *     summary: Aceptar un trabajo disponible (el lavador se auto-asigna)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trabajo aceptado; estado cambia a CONFIRMED
 *       400:
 *         description: El trabajo ya no está disponible o ya fue asignado
 *       404:
 *         description: Trabajo no encontrado
 */
router.post('/:id/accept',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER),
  async (req, res, next) => {
    try {
      const repo        = new ReservationRepository(req.db);
      const reservation = await repo.findById(req.params.id);

      if (!reservation) throw new AppError('Trabajo no encontrado.', 404);

      if (reservation.status !== RESERVATION_STATUS.PENDING) {
        throw new AppError('Este trabajo ya no está disponible.', 400);
      }
      if (reservation.washerId) {
        throw new AppError('Este trabajo ya fue asignado.', 400);
      }

      const updated = await repo.assignWasher(req.params.id, req.user.id);
      res.json(updated);
    } catch (err) { next(err); }
  }
);

// ================================================================
// POST /api/jobs/:id/start  (WASHER)
// ================================================================

/**
 * @swagger
 * /api/jobs/{id}/start:
 *   post:
 *     tags: [Jobs]
 *     summary: Iniciar el servicio → estado IN_PROGRESS
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Servicio iniciado
 *       400:
 *         description: El trabajo debe estar CONFIRMED para iniciarse
 *       403:
 *         description: No eres el lavador asignado a este trabajo
 */
router.post('/:id/start',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER),
  async (req, res, next) => {
    try {
      const repo        = new ReservationRepository(req.db);
      const reservation = await repo.findById(req.params.id);

      if (!reservation) throw new AppError('Trabajo no encontrado.', 404);
      if (reservation.washerId !== req.user.id) throw new AppError('No es tu trabajo.', 403);
      if (reservation.status !== RESERVATION_STATUS.CONFIRMED) {
        throw new AppError('El trabajo debe estar CONFIRMED para iniciarse.', 400);
      }

      const updated = await repo.startService(req.params.id);
      res.json(updated);
    } catch (err) { next(err); }
  }
);

// ================================================================
// POST /api/jobs/:id/complete  (WASHER)
// ================================================================

/**
 * @swagger
 * /api/jobs/{id}/complete:
 *   post:
 *     tags: [Jobs]
 *     summary: Marcar el servicio como completado → COMPLETED
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Servicio completado
 *       400:
 *         description: El trabajo debe estar IN_PROGRESS para completarse
 *       403:
 *         description: No eres el lavador asignado a este trabajo
 */
router.post('/:id/complete',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER),
  async (req, res, next) => {
    try {
      const repo        = new ReservationRepository(req.db);
      const reservation = await repo.findById(req.params.id);

      if (!reservation) throw new AppError('Trabajo no encontrado.', 404);
      if (reservation.washerId !== req.user.id) throw new AppError('No es tu trabajo.', 403);
      if (reservation.status !== RESERVATION_STATUS.IN_PROGRESS) {
        throw new AppError('El trabajo debe estar IN_PROGRESS para completarse.', 400);
      }

      const updated = await repo.completeService(req.params.id);
      res.json(updated);
    } catch (err) { next(err); }
  }
);

// ================================================================
// PUT /api/jobs/:id/eta  (WASHER)
// ================================================================

/**
 * @swagger
 * /api/jobs/{id}/eta:
 *   put:
 *     tags: [Jobs]
 *     summary: Actualiza el tiempo estimado de llegada del lavador
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
 *             required: [estimatedArrival]
 *             properties:
 *               estimatedArrival:
 *                 type: string
 *                 format: date-time
 *                 example: '2026-02-21T15:30:00Z'
 *     responses:
 *       200:
 *         description: ETA actualizado
 *       403:
 *         description: No eres el lavador asignado a este trabajo
 */
router.put('/:id/eta',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER),
  async (req, res, next) => {
    try {
      const { estimatedArrival } = req.body;
      if (!estimatedArrival) throw new AppError('estimatedArrival es requerido.', 400);

      const repo        = new ReservationRepository(req.db);
      const reservation = await repo.findById(req.params.id);

      if (!reservation) throw new AppError('Trabajo no encontrado.', 404);
      if (reservation.washerId !== req.user.id) throw new AppError('No es tu trabajo.', 403);

      const updated = await repo.update(req.params.id, { estimatedArrival });
      res.json(updated);
    } catch (err) { next(err); }
  }
);

module.exports = router;
