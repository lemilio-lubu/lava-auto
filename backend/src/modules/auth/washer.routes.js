'use strict';

/**
 * washer.routes.js — Gestión de lavadores.
 *
 * GET  /api/washers                 → listar lavadores (con filtro ?available=true)
 * GET  /api/washers/:id             → perfil del lavador
 * GET  /api/washers/:id/stats       → estadísticas del lavador
 * PUT  /api/washers/availability    → toggle disponibilidad (propio WASHER)
 * PUT  /api/washers/location        → actualizar ubicación (propio WASHER)
 * POST /api/washers/register        → crear lavador (solo ADMIN)
 */

const express  = require('express');
const bcrypt   = require('bcryptjs');

const UserRepository     = require('./user.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError }       = require('../../middleware/error-handler');
const { USER_ROLES }     = require('../../config/constants');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────

const toWasherProfile = (w) => ({
  id:                w.id,
  name:              w.name,
  email:             w.email ?? undefined,
  phone:             w.phone ?? null,
  isAvailable:       w.is_available ?? false,
  rating:            parseFloat(w.rating) || 5.0,
  completedServices: parseInt(w.completed_services, 10) || 0,
  address:           w.address ?? null,
  latitude:          w.latitude ?? null,
  longitude:         w.longitude ?? null,
});

// ================================================================
// GET /api/washers
// ================================================================

/**
 * @swagger
 * /api/washers:
 *   get:
 *     tags: [Washers]
 *     summary: Lista todos los lavadores
 *     parameters:
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filtrar solo los disponibles
 *     responses:
 *       200:
 *         description: Lista de lavadores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WasherPublic'
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { available } = req.query;
    const filterAvailable =
      available === 'true'  ? true  :
      available === 'false' ? false : undefined;

    const userRepo  = new UserRepository(req.db);
    const washers   = await userRepo.findWashers({ available: filterAvailable });

    res.json(washers.map(toWasherProfile));
  } catch (err) { next(err); }
});

// ================================================================
// PUT /api/washers/availability  — debe ir ANTES de /:id
// ================================================================

/**
 * @swagger
 * /api/washers/availability:
 *   put:
 *     tags: [Washers]
 *     summary: Activa/desactiva disponibilidad del lavador autenticado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isAvailable]
 *             properties:
 *               isAvailable: { type: boolean }
 *     responses:
 *       200:
 *         description: Disponibilidad actualizada
 *       403:
 *         description: Solo lavadores pueden usar este endpoint
 */
router.put('/availability',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER),
  async (req, res, next) => {
    try {
      const { isAvailable } = req.body;
      if (isAvailable === undefined) {
        throw new AppError('isAvailable es requerido.', 400);
      }

      const userRepo = new UserRepository(req.db);
      const result   = await userRepo.updateAvailability(req.user.id, isAvailable);

      res.json({ isAvailable: result.is_available });
    } catch (err) { next(err); }
  }
);

// ================================================================
// PUT /api/washers/location  — debe ir ANTES de /:id
// ================================================================

/**
 * @swagger
 * /api/washers/location:
 *   put:
 *     tags: [Washers]
 *     summary: Actualiza la ubicación GPS del lavador autenticado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:  { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200:
 *         description: Ubicación actualizada
 */
router.put('/location',
  authMiddleware,
  roleMiddleware(USER_ROLES.WASHER),
  async (req, res, next) => {
    try {
      const { latitude, longitude } = req.body;
      if (latitude == null || longitude == null) {
        throw new AppError('latitude y longitude son requeridos.', 400);
      }

      const userRepo = new UserRepository(req.db);
      const result   = await userRepo.updateLocation(req.user.id, latitude, longitude);

      res.json({ latitude: result.latitude, longitude: result.longitude });
    } catch (err) { next(err); }
  }
);

// ================================================================
// POST /api/washers/register  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/washers/register:
 *   post:
 *     tags: [Washers]
 *     summary: Registra un nuevo lavador (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string }
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               phone:    { type: string }
 *               address:  { type: string }
 *     responses:
 *       201:
 *         description: Lavador registrado
 *       409:
 *         description: Email ya registrado
 */
router.post('/register',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name, email, password, phone, address } = req.body;

      if (!name?.trim() || !email?.trim() || !password) {
        throw new AppError('Nombre, email y contraseña son requeridos.', 400);
      }
      if (password.length < 6) {
        throw new AppError('La contraseña debe tener al menos 6 caracteres.', 400);
      }

      const userRepo = new UserRepository(req.db);
      const existing = await userRepo.findByEmail(email);
      if (existing) throw new AppError('El email ya está registrado.', 409);

      const hashed = await bcrypt.hash(password, 10);
      const washer = await userRepo.create({
        name, email, password: hashed, phone, address,
        role: USER_ROLES.WASHER,
      });

      res.status(201).json({
        message: 'Lavador registrado exitosamente.',
        washer: toWasherProfile(washer),
      });
    } catch (err) { next(err); }
  }
);

// ================================================================
// GET /api/washers/:id
// ================================================================

/**
 * @swagger
 * /api/washers/{id}:
 *   get:
 *     tags: [Washers]
 *     summary: Obtiene el perfil de un lavador
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Perfil del lavador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WasherPublic'
 *       404:
 *         description: Lavador no encontrado
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const userRepo = new UserRepository(req.db);
    const washer   = await userRepo.findById(req.params.id);

    if (!washer || washer.role !== USER_ROLES.WASHER) {
      throw new AppError('Lavador no encontrado.', 404);
    }

    res.json(toWasherProfile(washer));
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/washers/:id/stats
// ================================================================

/**
 * @swagger
 * /api/washers/{id}/stats:
 *   get:
 *     tags: [Washers]
 *     summary: Estadísticas del lavador
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas del lavador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 completedServices: { type: integer }
 *                 rating:            { type: number }
 *                 isAvailable:       { type: boolean }
 *       404:
 *         description: Lavador no encontrado
 */
router.get('/:id/stats', authMiddleware, async (req, res, next) => {
  try {
    const userRepo = new UserRepository(req.db);
    const washer   = await userRepo.findById(req.params.id);

    if (!washer || washer.role !== USER_ROLES.WASHER) {
      throw new AppError('Lavador no encontrado.', 404);
    }

    res.json({
      completedServices: parseInt(washer.completed_services, 10) || 0,
      rating:            parseFloat(washer.rating) || 5.0,
      isAvailable:       washer.is_available ?? false,
    });
  } catch (err) { next(err); }
});

module.exports = router;
