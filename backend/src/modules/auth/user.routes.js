'use strict';

/**
 * user.routes.js — Gestión de usuarios.
 *
 * GET    /api/users              → listar todos (ADMIN)
 * GET    /api/users/chat/available → usuarios disponibles para chat
 * GET    /api/users/:id          → perfil de un usuario
 * PUT    /api/users/:id          → actualizar perfil
 * DELETE /api/users/:id          → eliminar (ADMIN)
 * PUT    /api/users/:id/location → actualizar ubicación (propio usuario)
 */

const express = require('express');

const UserRepository     = require('./user.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError }       = require('../../middleware/error-handler');
const { USER_ROLES }     = require('../../config/constants');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────

const toPublicProfile = (u) => ({
  id:                u.id,
  name:              u.name,
  email:             u.email,
  phone:             u.phone ?? null,
  role:              u.role,
  address:           u.address ?? null,
  isAvailable:       u.is_available ?? false,
  rating:            parseFloat(u.rating) || 5.0,
  completedServices: parseInt(u.completed_services, 10) || 0,
  createdAt:         u.created_at,
});

// ================================================================
// GET /api/users  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Lista todos los usuarios (solo ADMIN)
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, CLIENT, WASHER]
 *         description: Filtrar por rol
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserPublic'
 *       403:
 *         description: Permisos insuficientes
 */
router.get('/',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { role, limit, offset } = req.query;
      const userRepo = new UserRepository(req.db);
      const users = await userRepo.findAll({
        role,
        limit:  parseInt(limit,  10) || 20,
        offset: parseInt(offset, 10) || 0,
      });
      res.json(users.map(toPublicProfile));
    } catch (err) { next(err); }
  }
);

// ================================================================
// GET /api/users/chat/available
// ================================================================

/**
 * @swagger
 * /api/users/chat/available:
 *   get:
 *     tags: [Users]
 *     summary: Usuarios disponibles para iniciar un chat según el rol
 *     description: >
 *       ADMIN ve a todos los clientes y lavadores.
 *       CLIENT y WASHER solo ven a los admins.
 *     responses:
 *       200:
 *         description: Lista de usuarios contactables
 */
router.get('/chat/available', authMiddleware, async (req, res, next) => {
  try {
    const userRepo = new UserRepository(req.db);
    let users = [];

    if (req.user.role === USER_ROLES.ADMIN) {
      const [clients, washers] = await Promise.all([
        userRepo.findAll({ role: USER_ROLES.CLIENT }),
        userRepo.findAll({ role: USER_ROLES.WASHER }),
      ]);
      users = [...clients, ...washers];
    } else {
      users = await userRepo.findAll({ role: USER_ROLES.ADMIN });
    }

    res.json(users.map((u) => ({
      id:          u.id,
      name:        u.name,
      role:        u.role,
      isAvailable: u.is_available,
    })));
  } catch (err) { next(err); }
});

// ================================================================
// GET /api/users/:id
// ================================================================

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obtiene el perfil de un usuario
 *     description: >
 *       Los admins y el propio usuario ven el perfil completo.
 *       Terceros solo ven nombre y rating.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const userRepo = new UserRepository(req.db);
    const user = await userRepo.findById(req.params.id);

    if (!user) throw new AppError('Usuario no encontrado.', 404);

    const isOwner = req.user.id === user.id;
    const isAdmin = req.user.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      // Vista reducida para terceros
      return res.json({ id: user.id, name: user.name, rating: user.rating });
    }

    res.json(toPublicProfile(user));
  } catch (err) { next(err); }
});

// ================================================================
// PUT /api/users/:id
// ================================================================

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Actualiza el perfil de un usuario
 *     description: Los usuarios solo pueden actualizar su propio perfil. Los admins pueden actualizar cualquiera.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:       { type: string }
 *               phone:      { type: string }
 *               address:    { type: string }
 *               latitude:   { type: number }
 *               longitude:  { type: number }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const isOwner = req.user.id === req.params.id;
    const isAdmin = req.user.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) throw new AppError('No autorizado.', 403);

    const userRepo = new UserRepository(req.db);
    const updated  = await userRepo.update(req.params.id, req.body);

    if (!updated) throw new AppError('Usuario no encontrado.', 404);

    res.json(updated);
  } catch (err) { next(err); }
});

// ================================================================
// DELETE /api/users/:id  (ADMIN)
// ================================================================

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Elimina un usuario (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const userRepo = new UserRepository(req.db);
      const deleted = await userRepo.delete(req.params.id);

      if (!deleted) throw new AppError('Usuario no encontrado.', 404);

      res.json({ message: 'Usuario eliminado exitosamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// PUT /api/users/:id/location
// ================================================================

/**
 * @swagger
 * /api/users/{id}/location:
 *   put:
 *     tags: [Users]
 *     summary: Actualiza la ubicación GPS del usuario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:  { type: number, example: -0.1807 }
 *               longitude: { type: number, example: -78.4678 }
 *     responses:
 *       200:
 *         description: Ubicación actualizada
 *       403:
 *         description: Solo el propio usuario puede actualizar su ubicación
 */
router.put('/:id/location', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) throw new AppError('No autorizado.', 403);

    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      throw new AppError('latitude y longitude son requeridos.', 400);
    }

    const userRepo = new UserRepository(req.db);
    const result   = await userRepo.updateLocation(req.params.id, latitude, longitude);

    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
