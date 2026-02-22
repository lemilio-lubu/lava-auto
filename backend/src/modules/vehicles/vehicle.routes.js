'use strict';

/**
 * vehicle.routes.js — Gestión de vehículos.
 *
 * GET    /api/vehicles                → vehículos del usuario autenticado
 * GET    /api/vehicles/all            → todos los vehículos (ADMIN)
 * GET    /api/vehicles/stats/count    → conteo de vehículos activos
 * GET    /api/vehicles/:id            → detalle de un vehículo
 * POST   /api/vehicles                → crear vehículo
 * PUT    /api/vehicles/:id            → actualizar vehículo
 * DELETE /api/vehicles/:id            → soft-delete (verifica reservas activas)
 */

const express = require('express');

const VehicleRepository = require('./vehicle.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError }  = require('../../middleware/error-handler');
const { USER_ROLES, VEHICLE_TYPES } = require('../../config/constants');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────

const VALID_TYPES = new Set(Object.values(VEHICLE_TYPES));

// ================================================================
// GET /api/vehicles  — vehículos del usuario actual
// ================================================================

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: Lista los vehículos del usuario autenticado
 *     responses:
 *       200:
 *         description: Lista de vehículos activos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const repo = new VehicleRepository(req.db);
    const vehicles = await repo.findByUserId(req.user.id);
    res.json(vehicles);
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/vehicles/all  — todos (ADMIN)  → ANTES de /:id
// ================================================================

/**
 * @swagger
 * /api/vehicles/all:
 *   get:
 *     tags: [Vehicles]
 *     summary: Lista todos los vehículos registrados (solo ADMIN)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: activeOnly
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: Lista de vehículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       403:
 *         description: Permisos insuficientes
 */
router.get('/all',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { limit, offset, activeOnly } = req.query;
      const repo = new VehicleRepository(req.db);
      const vehicles = await repo.findAllVehicles({
        limit:      parseInt(limit,  10) || 100,
        offset:     parseInt(offset, 10) || 0,
        activeOnly: activeOnly !== 'false',
      });
      res.json(vehicles);
    } catch (err) { next(err); }
  }
);

// ================================================================
// GET /api/vehicles/stats/count  → ANTES de /:id
// ================================================================

/**
 * @swagger
 * /api/vehicles/stats/count:
 *   get:
 *     tags: [Vehicles]
 *     summary: Conteo de vehículos activos
 *     description: ADMIN obtiene el total; otros usuarios obtienen solo los suyos.
 *     responses:
 *       200:
 *         description: Número de vehículos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer, example: 5 }
 */
router.get('/stats/count', authMiddleware, async (req, res, next) => {
  try {
    const repo  = new VehicleRepository(req.db);
    const userId = req.user.role === USER_ROLES.ADMIN ? null : req.user.id;
    const count  = await repo.countActive(userId);
    res.json({ count });
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/vehicles/:id
// ================================================================

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Obtiene un vehículo por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo    = new VehicleRepository(req.db);
    const vehicle = await repo.findById(req.params.id);

    if (!vehicle) throw new AppError('Vehículo no encontrado.', 404);

    // Solo el dueño o un admin puede verlo
    if (req.user.role !== USER_ROLES.ADMIN && vehicle.userId !== req.user.id) {
      throw new AppError('No autorizado.', 403);
    }

    res.json(vehicle);
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/vehicles
// ================================================================

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     tags: [Vehicles]
 *     summary: Registra un nuevo vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleCreateBody'
 *     responses:
 *       201:
 *         description: Vehículo creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Campos requeridos faltantes o tipo de vehículo inválido
 *       409:
 *         description: Placa ya registrada
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { brand, model, plate, vehicleType, color, year, ownerName, ownerPhone } = req.body;

    if (!brand?.trim() || !model?.trim() || !plate?.trim() ||
        !vehicleType?.trim() || !ownerName?.trim()) {
      throw new AppError('brand, model, plate, vehicleType y ownerName son requeridos.', 400);
    }

    if (!VALID_TYPES.has(vehicleType)) {
      throw new AppError(
        `vehicleType inválido. Valores permitidos: ${[...VALID_TYPES].join(', ')}.`, 400
      );
    }

    const repo = new VehicleRepository(req.db);

    const existing = await repo.findByPlate(plate);
    if (existing) throw new AppError('Ya existe un vehículo con esa placa.', 409);

    const vehicle = await repo.create({
      userId: req.user.id,
      brand, model, plate, vehicleType,
      color, year, ownerName, ownerPhone,
    });

    res.status(201).json(vehicle);
  } catch (err) { next(err); }
});

// ================================================================
// PUT /api/vehicles/:id
// ================================================================

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     tags: [Vehicles]
 *     summary: Actualiza los datos de un vehículo
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
 *             $ref: '#/components/schemas/VehicleCreateBody'
 *     responses:
 *       200:
 *         description: Vehículo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: Placa ya en uso por otro vehículo
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo    = new VehicleRepository(req.db);
    const vehicle = await repo.findById(req.params.id);

    if (!vehicle) throw new AppError('Vehículo no encontrado.', 404);

    if (req.user.role !== USER_ROLES.ADMIN && vehicle.userId !== req.user.id) {
      throw new AppError('No autorizado.', 403);
    }

    // Verificar unicidad de placa si se está cambiando
    if (req.body.plate) {
      const normalized = req.body.plate.toUpperCase();
      if (normalized !== vehicle.plate) {
        const conflict = await repo.findByPlate(normalized);
        if (conflict) throw new AppError('Ya existe un vehículo con esa placa.', 409);
      }
    }

    // Validar tipo si se está cambiando
    if (req.body.vehicleType && !VALID_TYPES.has(req.body.vehicleType)) {
      throw new AppError(
        `vehicleType inválido. Valores permitidos: ${[...VALID_TYPES].join(', ')}.`, 400
      );
    }

    const updated = await repo.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});

// ================================================================
// DELETE /api/vehicles/:id  (soft-delete con verificación de reservas)
// ================================================================

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     tags: [Vehicles]
 *     summary: Elimina (soft-delete) un vehículo
 *     description: >
 *       No se puede eliminar un vehículo con reservas activas
 *       (PENDING, CONFIRMED o IN_PROGRESS).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vehículo eliminado
 *       400:
 *         description: El vehículo tiene reservas activas
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo    = new VehicleRepository(req.db);
    const vehicle = await repo.findById(req.params.id);

    if (!vehicle) throw new AppError('Vehículo no encontrado.', 404);

    if (req.user.role !== USER_ROLES.ADMIN && vehicle.userId !== req.user.id) {
      throw new AppError('No autorizado.', 403);
    }

    // Verificación directa en la misma DB (ventaja del monolito vs. llamada HTTP)
    const hasActive = await repo.hasActiveReservations(req.params.id);
    if (hasActive) {
      throw new AppError(
        'No se puede eliminar el vehículo porque tiene reservas activas.',
        400
      );
    }

    await repo.softDelete(req.params.id);
    res.json({ message: 'Vehículo eliminado exitosamente.' });
  } catch (err) { next(err); }
});

module.exports = router;
