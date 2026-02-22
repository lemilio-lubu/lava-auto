'use strict';

/**
 * rating.routes.js — Calificaciones de los servicios prestados.
 *
 * GET  /api/ratings/washer/:washerId         → ratings de un lavador
 * GET  /api/ratings/reservation/:resId       → rating de una reserva específica
 * POST /api/ratings                          → crear calificación
 *
 * Efecto secundario tras crear un rating:
 *   Actualiza auth.users.rating del lavador con el nuevo promedio.
 *   Al ser monolito, esto se hace directamente vía UserRepository.
 */

const express = require('express');

const RatingRepository      = require('./rating.repository');
const ReservationRepository = require('./reservation.repository');
const UserRepository        = require('../auth/user.repository');
const { authMiddleware }    = require('../../middleware/auth');
const { AppError }          = require('../../middleware/error-handler');
const { RESERVATION_STATUS } = require('../../config/constants');

const router = express.Router();

// ================================================================
// GET /api/ratings/washer/:washerId
// ================================================================

/**
 * @swagger
 * /api/ratings/washer/{washerId}:
 *   get:
 *     tags: [Ratings]
 *     summary: Calificaciones y promedio de un lavador
 *     parameters:
 *       - in: path
 *         name: washerId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Lista de ratings + promedio + total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:  { type: array, items: { $ref: '#/components/schemas/Rating' } }
 *                 average:  { type: number }
 *                 total:    { type: integer }
 */
router.get('/washer/:washerId', authMiddleware, async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const repo    = new RatingRepository(req.db);
    const [ratings, avg] = await Promise.all([
      repo.findByWasherId(req.params.washerId, {
        limit:  parseInt(limit,  10) || 50,
        offset: parseInt(offset, 10) || 0,
      }),
      repo.getAverageRating(req.params.washerId),
    ]);

    res.json({ ratings, ...avg });
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/ratings/reservation/:reservationId
// ================================================================

/**
 * @swagger
 * /api/ratings/reservation/{reservationId}:
 *   get:
 *     tags: [Ratings]
 *     summary: Rating asociado a una reserva específica
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rating de la reserva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       404:
 *         description: Aún no hay rating para esta reserva
 */
router.get('/reservation/:reservationId', authMiddleware, async (req, res, next) => {
  try {
    const repo   = new RatingRepository(req.db);
    const rating = await repo.findByReservationId(req.params.reservationId);
    if (!rating) throw new AppError('Este servicio aún no ha sido calificado.', 404);
    res.json(rating);
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/ratings
// ================================================================

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     tags: [Ratings]
 *     summary: Califica un servicio completado
 *     description: >
 *       Solo el cliente propietario puede calificar.
 *       La reserva debe estar en estado COMPLETED.
 *       Actualiza automáticamente el promedio del lavador.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RatingCreateBody'
 *     responses:
 *       201:
 *         description: Rating creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       400:
 *         description: La reserva no está completada o datos inválidos
 *       403:
 *         description: No eres el propietario de la reserva
 *       409:
 *         description: Esta reserva ya fue calificada
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { reservationId, stars, comment } = req.body;

    if (!reservationId || stars == null) {
      throw new AppError('reservationId y stars son requeridos.', 400);
    }
    if (stars < 1 || stars > 5) {
      throw new AppError('stars debe estar entre 1 y 5.', 400);
    }

    const resRepo  = new ReservationRepository(req.db);
    const reservation = await resRepo.findById(reservationId);

    if (!reservation) throw new AppError('Reserva no encontrada.', 404);
    if (reservation.userId !== req.user.id) throw new AppError('No autorizado.', 403);
    if (reservation.status !== RESERVATION_STATUS.COMPLETED) {
      throw new AppError('Solo se pueden calificar reservas completadas.', 400);
    }

    const ratingRepo    = new RatingRepository(req.db);
    const existingRating = await ratingRepo.findByReservationId(reservationId);
    if (existingRating) throw new AppError('Esta reserva ya fue calificada.', 409);

    const rating = await ratingRepo.create({
      reservationId,
      userId:   req.user.id,
      washerId: reservation.washerId,
      stars,
      comment,
    });

    // ── Efecto secundario: actualizar el rating del lavador en auth.users ──
    // Ventaja del monolito: sin necesidad de eventos/HTTP entre servicios.
    if (reservation.washerId) {
      try {
        const { average } = await ratingRepo.getAverageRating(reservation.washerId);
        const userRepo = new UserRepository(req.db);
        await userRepo.updateRating(reservation.washerId, average);
        await userRepo.incrementCompletedServices(reservation.washerId);
      } catch (sideEffectErr) {
        // El rating ya fue creado; loguear pero no fallar la respuesta
        console.error('[rating] Error actualizando stats del lavador:', sideEffectErr.message);
      }
    }

    res.status(201).json(rating);
  } catch (err) { next(err); }
});

module.exports = router;
