'use strict';

/**
 * service.routes.js — Catálogo de servicios de lavado.
 *
 * GET    /api/services                     → listar servicios
 * GET    /api/services/type/:vehicleType   → filtrar por tipo de vehículo
 * GET    /api/services/:id                 → detalle
 * POST   /api/services                     → crear (ADMIN)
 * PUT    /api/services/:id                 → actualizar (ADMIN)
 * DELETE /api/services/:id                 → eliminar (ADMIN, solo sin reservas)
 */

const express = require('express');

const ServiceRepository = require('./service.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError }      = require('../../middleware/error-handler');
const { USER_ROLES, VEHICLE_TYPES } = require('../../config/constants');

const router = express.Router();

const VALID_TYPES = new Set(Object.values(VEHICLE_TYPES));

// ================================================================
// GET /api/services
// ================================================================

/**
 * @swagger
 * /api/services:
 *   get:
 *     tags: [Services]
 *     summary: Lista el catálogo de servicios de lavado
 *     description: ADMIN ve todos (activos e inactivos). Otros roles solo ven los activos.
 *     parameters:
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [SEDAN, SUV, HATCHBACK, PICKUP, VAN, MOTORCYCLE]
 *     responses:
 *       200:
 *         description: Lista de servicios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { vehicleType } = req.query;
    const activeOnly = req.user.role !== USER_ROLES.ADMIN;
    const repo = new ServiceRepository(req.db);
    const services = await repo.findAll({ activeOnly, vehicleType });
    res.json(services);
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/services/type/:vehicleType  — antes de /:id
// ================================================================

/**
 * @swagger
 * /api/services/type/{vehicleType}:
 *   get:
 *     tags: [Services]
 *     summary: Servicios disponibles para un tipo de vehículo
 *     parameters:
 *       - in: path
 *         name: vehicleType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SEDAN, SUV, HATCHBACK, PICKUP, VAN, MOTORCYCLE]
 *     responses:
 *       200:
 *         description: Servicios filtrados por tipo de vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *       400:
 *         description: Tipo de vehículo inválido
 */
router.get('/type/:vehicleType', authMiddleware, async (req, res, next) => {
  try {
    const { vehicleType } = req.params;
    if (!VALID_TYPES.has(vehicleType)) {
      throw new AppError(
        `Tipo inválido. Valores permitidos: ${[...VALID_TYPES].join(', ')}.`, 400
      );
    }
    const repo = new ServiceRepository(req.db);
    const services = await repo.findByVehicleType(vehicleType);
    res.json(services);
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/services/:id
// ================================================================

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Obtiene un servicio por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos del servicio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Servicio no encontrado
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo    = new ServiceRepository(req.db);
    const service = await repo.findById(req.params.id);
    if (!service) throw new AppError('Servicio no encontrado.', 404);
    res.json(service);
  } catch (err) { next(err); }
});

// ================================================================
// POST /api/services  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/services:
 *   post:
 *     tags: [Services]
 *     summary: Crea un nuevo servicio (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceCreateBody'
 *     responses:
 *       201:
 *         description: Servicio creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Campos requeridos faltantes
 */
router.post('/',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name, description, duration, price, vehicleType, isActive } = req.body;

      if (!name?.trim() || !duration || price == null || !vehicleType) {
        throw new AppError('name, duration, price y vehicleType son requeridos.', 400);
      }
      if (!VALID_TYPES.has(vehicleType)) {
        throw new AppError(
          `vehicleType inválido. Valores: ${[...VALID_TYPES].join(', ')}.`, 400
        );
      }

      const repo    = new ServiceRepository(req.db);
      const service = await repo.create({
        name, description, duration, price, vehicleType,
        isActive: isActive !== undefined ? isActive : true,
      });

      res.status(201).json(service);
    } catch (err) { next(err); }
  }
);

// ================================================================
// PUT /api/services/:id  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     tags: [Services]
 *     summary: Actualiza un servicio (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceCreateBody'
 *     responses:
 *       200:
 *         description: Servicio actualizado
 *       404:
 *         description: Servicio no encontrado
 */
router.put('/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo    = new ServiceRepository(req.db);
      const updated = await repo.update(req.params.id, req.body);
      if (!updated) throw new AppError('Servicio no encontrado.', 404);
      res.json(updated);
    } catch (err) { next(err); }
  }
);

// ================================================================
// DELETE /api/services/:id  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     tags: [Services]
 *     summary: Elimina un servicio (solo ADMIN, sin reservas asociadas)
 *     description: >
 *       Si el servicio tiene reservas, se devuelve 409.
 *       En ese caso, considere desactivarlo en lugar de eliminarlo.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Servicio eliminado
 *       404:
 *         description: Servicio no encontrado
 *       409:
 *         description: El servicio tiene reservas asociadas
 */
router.delete('/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo    = new ServiceRepository(req.db);
      const service = await repo.findById(req.params.id);
      if (!service) throw new AppError('Servicio no encontrado.', 404);

      const hasRes = await repo.hasReservations(req.params.id);
      if (hasRes) {
        throw new AppError(
          'No se puede eliminar: el servicio tiene reservas asociadas. Desactívelo en su lugar.',
          409
        );
      }

      await repo.delete(req.params.id);
      res.json({ message: 'Servicio eliminado exitosamente.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
