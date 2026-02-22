'use strict';

/**
 * payment.routes.js — Gestión de pagos (Stripe + Efectivo).
 *
 * ── Flujo TARJETA (Stripe) ──────────────────────────────────────
 *   1. POST /api/payments/create-intent
 *      Cliente recibe { clientSecret, paymentId, isMock }
 *   2. Frontend usa Stripe.js para confirmar el pago con clientSecret.
 *   3. Stripe llama al webhook → payment queda COMPLETED automáticamente.
 *      [O en dev sin webhook: POST /api/payments/:id/mock-confirm]
 *
 * ── Flujo EFECTIVO (Uber-style) ────────────────────────────────
 *   1. POST /api/payments/cash
 *      Cliente registra la intención de pago en efectivo → PENDING.
 *   2. Lavador completa el servicio y recibe el dinero en mano.
 *   3. POST /api/payments/:id/confirm-cash  (WASHER | ADMIN)
 *      Marca el pago como COMPLETED con un tap.
 *
 * Endpoints:
 *   GET  /                          → pagos del usuario autenticado
 *   GET  /all                       → todos (ADMIN)
 *   GET  /stats                     → estadísticas (ADMIN)
 *   GET  /reservation/:reservationId → pagos de una reserva
 *   GET  /:id                       → detalle
 *   POST /create-intent             → crea PaymentIntent de Stripe (CARD)
 *   POST /mock-confirm              → confirma pago mock (dev sin Stripe)
 *   POST /cash                      → registra pago pendiente en efectivo
 *   POST /:id/confirm-cash          → lavador confirma efectivo recibido
 *   POST /:id/refund                → reembolso (ADMIN)
 */

const express = require('express');

const PaymentRepository     = require('./payment.repository');
const ReservationRepository = require('../reservations/reservation.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError } = require('../../middleware/error-handler');
const { USER_ROLES, PAYMENT_METHODS, RESERVATION_STATUS } = require('../../config/constants');

const router = express.Router();

// Stripe opcional — funciona en modo mock si no hay clave real configurada.
// Las claves reales tienen más de 30 caracteres; el placeholder es inválido.
const _stripeKey = process.env.STRIPE_SECRET_KEY;
const _isRealKey = _stripeKey &&
  _stripeKey !== 'sk_test_placeholder' &&
  _stripeKey !== 'sk_live_placeholder' &&
  _stripeKey.length > 30;

const stripe = _isRealKey ? require('stripe')(_stripeKey) : null;

// ================================================================
// GET /api/payments
// ================================================================

/**
 * @swagger
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: Lista los pagos del usuario autenticado
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Lista de pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const repo = new PaymentRepository(req.db);
    const payments = await repo.findByUserId(req.user.id, {
      limit:  parseInt(limit,  10) || 50,
      offset: parseInt(offset, 10) || 0,
    });
    res.json(payments);
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/payments/all  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/payments/all:
 *   get:
 *     tags: [Payments]
 *     summary: Lista todos los pagos (solo ADMIN)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, COMPLETED, FAILED, REFUNDED] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Lista completa de pagos
 */
router.get('/all',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { status, limit, offset } = req.query;
      const repo = new PaymentRepository(req.db);
      const payments = await repo.findAll({
        status,
        limit:  parseInt(limit,  10) || 100,
        offset: parseInt(offset, 10) || 0,
      });
      res.json(payments);
    } catch (err) { next(err); }
  }
);

// ================================================================
// GET /api/payments/stats  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     tags: [Payments]
 *     summary: Estadísticas de pagos (solo ADMIN)
 *     responses:
 *       200:
 *         description: Estadísticas de facturación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentStats'
 */
router.get('/stats',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new PaymentRepository(req.db);
      res.json(await repo.getStats());
    } catch (err) { next(err); }
  }
);

// ================================================================
// GET /api/payments/reservation/:reservationId
// ================================================================

/**
 * @swagger
 * /api/payments/reservation/{reservationId}:
 *   get:
 *     tags: [Payments]
 *     summary: Pagos de una reserva específica
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de pagos de la reserva
 */
router.get('/reservation/:reservationId', authMiddleware, async (req, res, next) => {
  try {
    const repo = new PaymentRepository(req.db);
    const payments = await repo.findByReservationId(req.params.reservationId);
    res.json(payments);
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/payments/:id
// ================================================================

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Obtiene el detalle de un pago
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos del pago
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Pago no encontrado
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo    = new PaymentRepository(req.db);
    const payment = await repo.findById(req.params.id);

    if (!payment) throw new AppError('Pago no encontrado.', 404);
    if (req.user.role !== USER_ROLES.ADMIN && payment.userId !== req.user.id) {
      throw new AppError('No autorizado.', 403);
    }
    res.json(payment);
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/payments/create-intent  — Stripe Card
// ================================================================

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     tags: [Payments]
 *     summary: Crea un PaymentIntent de Stripe para pago con tarjeta
 *     description: >
 *       Devuelve un `clientSecret` que el frontend usa con Stripe.js.
 *       Si no hay clave Stripe configurada, devuelve un mock para desarrollo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationId]
 *             properties:
 *               reservationId: { type: string }
 *     responses:
 *       200:
 *         description: PaymentIntent creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntentResponse'
 *       400:
 *         description: Reserva no encontrada o monto inválido
 */
router.post('/create-intent', authMiddleware, async (req, res, next) => {
  try {
    const { reservationId } = req.body;
    if (!reservationId) throw new AppError('reservationId es requerido.', 400);

    // Obtener monto desde la reserva (fuente de verdad)
    const resRepo     = new ReservationRepository(req.db);
    const reservation = await resRepo.findById(reservationId);
    if (!reservation) throw new AppError('Reserva no encontrada.', 404);

    // Solo el propietario de la reserva puede iniciar el pago
    if (reservation.userId !== req.user.id) throw new AppError('No autorizado.', 403);

    const amount = reservation.totalAmount;

    let paymentIntentId, clientSecret, isMock;

    if (stripe) {
      const intent = await stripe.paymentIntents.create({
        amount:   Math.round(amount * 100), // Stripe maneja centavos
        currency: process.env.STRIPE_CURRENCY || 'usd',
        metadata: { reservationId, userId: req.user.id },
      });
      paymentIntentId = intent.id;
      clientSecret    = intent.client_secret;
      isMock          = false;
    } else {
      // Modo desarrollo sin Stripe real
      paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      clientSecret    = `${paymentIntentId}_secret_mock`;
      isMock          = true;
    }

    const repo    = new PaymentRepository(req.db);
    const payment = await repo.create({
      reservationId,
      userId:              req.user.id,
      amount,
      paymentMethod:       PAYMENT_METHODS.CARD,
      stripePaymentIntent: paymentIntentId,
    });

    res.json({ clientSecret, paymentId: payment.id, isMock });
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/payments/mock-confirm  — solo para desarrollo
// ================================================================

/**
 * @swagger
 * /api/payments/mock-confirm:
 *   post:
 *     tags: [Payments]
 *     summary: Confirma un pago mock (solo modo desarrollo sin Stripe real)
 *     description: >
 *       Simula la confirmación de Stripe cuando no hay integration real.
 *       Solo funciona sobre pagos con `pi_mock_` como PaymentIntent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId]
 *             properties:
 *               paymentId: { type: string }
 *     responses:
 *       200:
 *         description: Pago confirmado en modo mock
 *       400:
 *         description: El pago no está pendiente o no es un mock
 */
router.post('/mock-confirm', authMiddleware, async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) throw new AppError('paymentId es requerido.', 400);

    const repo    = new PaymentRepository(req.db);
    const payment = await repo.findById(paymentId);
    if (!payment) throw new AppError('Pago no encontrado.', 404);

    if (payment.status !== 'PENDING') {
      throw new AppError('El pago ya fue procesado.', 400);
    }
    if (!payment.stripePaymentIntent?.startsWith('pi_mock_')) {
      throw new AppError('Este endpoint solo aplica a pagos mock.', 400);
    }

    const updated = await repo.updateStatus(paymentId, {
      status:        'COMPLETED',
      transactionId: `mock_txn_${Date.now()}`,
    });

    res.json({ success: true, payment: updated, message: 'Pago confirmado (modo demo).' });
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/payments/cash  — Efectivo
// ================================================================

/**
 * @swagger
 * /api/payments/cash:
 *   post:
 *     tags: [Payments]
 *     summary: Registra la intención de pago en efectivo
 *     description: >
 *       El cliente indica que pagará en efectivo al lavador al finalizar el
 *       servicio. Crea un pago en estado **PENDING** que el lavador deberá
 *       confirmar manualmente al recibir el dinero.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationId]
 *             properties:
 *               reservationId: { type: string }
 *               notes:         { type: string, example: 'Pagará al terminar el servicio' }
 *     responses:
 *       201:
 *         description: Pago en efectivo registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Ya existe un pago para esta reserva
 */
router.post('/cash', authMiddleware, async (req, res, next) => {
  try {
    const { reservationId, notes } = req.body;
    if (!reservationId) throw new AppError('reservationId es requerido.', 400);

    // Verificar que la reserva pertenece al usuario
    const resRepo     = new ReservationRepository(req.db);
    const reservation = await resRepo.findById(reservationId);
    if (!reservation) throw new AppError('Reserva no encontrada.', 404);
    if (reservation.userId !== req.user.id) throw new AppError('No autorizado.', 403);

    // Evitar duplicados
    const repo     = new PaymentRepository(req.db);
    const existing = await repo.findByReservationId(reservationId);
    if (existing.length > 0) {
      throw new AppError('Ya existe un pago registrado para esta reserva.', 400);
    }

    const payment = await repo.create({
      reservationId,
      userId:        req.user.id,
      amount:        reservation.totalAmount,
      paymentMethod: PAYMENT_METHODS.CASH,
      notes:         notes || 'Pago en efectivo al lavador',
    });

    res.status(201).json(payment);
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/payments/:id/confirm-cash  — Lavador confirma efectivo
// ================================================================

/**
 * @swagger
 * /api/payments/{id}/confirm-cash:
 *   post:
 *     tags: [Payments]
 *     summary: Lavador confirma que recibió el efectivo
 *     description: >
 *       Flujo estilo Uber: al terminar el servicio, el lavador toca
 *       **"Confirmar efectivo recibido"** y el pago queda COMPLETED.
 *       Solo aplica a pagos en efectivo pendientes.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pago marcado como COMPLETED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: El pago no está pendiente o no es en efectivo
 *       403:
 *         description: Solo el lavador asignado o un ADMIN puede confirmar
 */
router.post('/:id/confirm-cash',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER, USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo    = new PaymentRepository(req.db);
      const payment = await repo.findById(req.params.id);

      if (!payment) throw new AppError('Pago no encontrado.', 404);

      if (payment.paymentMethod !== PAYMENT_METHODS.CASH) {
        throw new AppError('Este endpoint solo aplica a pagos en efectivo.', 400);
      }
      if (payment.status !== 'PENDING') {
        throw new AppError('El pago ya fue procesado.', 400);
      }

      // Verificar que es el lavador asignado a la reserva (o un admin)
      if (req.user.role === USER_ROLES.WASHER) {
        const resRepo     = new ReservationRepository(req.db);
        const reservation = await resRepo.findById(payment.reservationId);
        if (reservation?.washerId !== req.user.id) {
          throw new AppError('Solo el lavador asignado puede confirmar el efectivo.', 403);
        }
      }

      const updated = await repo.updateStatus(req.params.id, {
        status:        'COMPLETED',
        transactionId: `cash_${Date.now()}`,
      });

      res.json(updated);
    } catch (err) { next(err); }
  }
);

// ================================================================
// POST /api/payments/:id/refund  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Reembolsa un pago completado (solo ADMIN)
 *     description: >
 *       Para pagos con Stripe, genera el reembolso en la plataforma.
 *       Para pagos en efectivo, solo actualiza el estado.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pago reembolsado
 *       400:
 *         description: Solo se pueden reembolsar pagos COMPLETED
 */
router.post('/:id/refund',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo    = new PaymentRepository(req.db);
      const payment = await repo.findById(req.params.id);

      if (!payment) throw new AppError('Pago no encontrado.', 404);
      if (payment.status !== 'COMPLETED') {
        throw new AppError('Solo se pueden reembolsar pagos completados.', 400);
      }

      // Reembolso real en Stripe
      if (stripe && payment.stripePaymentIntent &&
          !payment.stripePaymentIntent.startsWith('pi_mock_')) {
        await stripe.refunds.create({ payment_intent: payment.stripePaymentIntent });
      }

      const updated = await repo.updateStatus(req.params.id, { status: 'REFUNDED' });
      res.json(updated);
    } catch (err) { next(err); }
  }
);

module.exports = router;
