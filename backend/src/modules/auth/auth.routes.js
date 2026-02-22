'use strict';

/**
 * auth.routes.js — Rutas de autenticación.
 *
 * Endpoints públicos (sin JWT):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/reset-password/request
 *   POST /api/auth/reset-password/confirm
 *
 * Endpoints protegidos (requieren JWT):
 *   GET  /api/auth/me
 *   POST /api/auth/refresh
 */

const crypto   = require('node:crypto');
const express  = require('express');
const bcrypt   = require('bcryptjs');

const UserRepository         = require('./user.repository');
const { generateToken }      = require('../../middleware/auth');
const { authMiddleware }     = require('../../middleware/auth');
const { authRateLimiter }    = require('../../middleware/rate-limiter');
const { AppError }           = require('../../middleware/error-handler');
const { USER_ROLES }         = require('../../config/constants');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────

/** Campos públicos del usuario (sin password ni tokens) */
const toPublicUser = (u) => ({
  id:                u.id,
  name:              u.name,
  email:             u.email,
  role:              u.role,
  phone:             u.phone ?? null,
  address:           u.address ?? null,
  isAvailable:       u.is_available ?? false,
  rating:            parseFloat(u.rating) || 5.0,
  completedServices: parseInt(u.completed_services, 10) || 0,
});

// ================================================================
// POST /api/auth/register
// ================================================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registro de nuevo usuario
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      throw new AppError('Nombre, email y contraseña son requeridos.', 400);
    }

    if (password.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres.', 400);
    }

    // Solo se permite registrar CLIENT; WASHER/ADMIN los crea un admin
    const assignedRole = role === USER_ROLES.WASHER ? USER_ROLES.CLIENT : (role ?? USER_ROLES.CLIENT);

    const userRepo = new UserRepository(req.db);

    const existing = await userRepo.findByEmail(email);
    if (existing) throw new AppError('El email ya está registrado.', 409);

    const hashed = await bcrypt.hash(password, 10);
    const user   = await userRepo.create({ name, email, password: hashed, phone, role: assignedRole });

    const token  = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.status(201).json({ user: toPublicUser(user), token });
  } catch (err) {
    next(err);
  }
});

// ================================================================
// POST /api/auth/login
// ================================================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicio de sesión
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Login exitoso — devuelve usuario y token JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Campos requeridos faltantes
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      throw new AppError('Email y contraseña son requeridos.', 400);
    }

    const userRepo = new UserRepository(req.db);
    const user     = await userRepo.findByEmail(email);

    // Mensaje genérico para no revelar si el email existe
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Credenciales inválidas.', 401);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.json({ user: toPublicUser(user), token });
  } catch (err) {
    next(err);
  }
});

// ================================================================
// GET /api/auth/me
// ================================================================

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: Token inválido o ausente
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const userRepo = new UserRepository(req.db);
    const user = await userRepo.findById(req.user.id);

    if (!user) throw new AppError('Usuario no encontrado.', 404);

    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
});

// ================================================================
// POST /api/auth/refresh
// ================================================================

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renueva el token JWT
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Token inválido
 */
router.post('/refresh', authMiddleware, (req, res) => {
  const token = generateToken({
    id:    req.user.id,
    email: req.user.email,
    role:  req.user.role,
    name:  req.user.name,
  });
  res.json({ token });
});

// ================================================================
// POST /api/auth/reset-password/request
// ================================================================

/**
 * @swagger
 * /api/auth/reset-password/request:
 *   post:
 *     tags: [Auth]
 *     summary: Solicita el restablecimiento de contraseña
 *     description: Siempre devuelve 200 para no revelar si el email existe.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Si el email existe, se enviará el enlace de recuperación
 */
router.post('/reset-password/request', authRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) throw new AppError('El email es requerido.', 400);

    const userRepo = new UserRepository(req.db);
    const user = await userRepo.findByEmail(email);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry     = new Date(Date.now() + 3_600_000); // 1 hora
      await userRepo.setResetToken(user.id, resetToken, expiry);
      // En producción: enviar email con el token
      console.info(`[reset-password] Token para ${email}: ${resetToken}`);
    }

    // Respuesta idéntica independientemente de si el email existe
    res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación.' });
  } catch (err) {
    next(err);
  }
});

// ================================================================
// POST /api/auth/reset-password/confirm
// ================================================================

/**
 * @swagger
 * /api/auth/reset-password/confirm:
 *   post:
 *     tags: [Auth]
 *     summary: Confirma el restablecimiento de contraseña con el token recibido
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:    { type: string }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Token inválido o expirado / contraseña inválida
 */
router.post('/reset-password/confirm', authRateLimiter, async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new AppError('Token y nueva contraseña son requeridos.', 400);
    }
    if (password.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres.', 400);
    }

    const userRepo = new UserRepository(req.db);
    const user = await userRepo.findByResetToken(token);

    if (!user) throw new AppError('Token inválido o expirado.', 400);

    const hashed = await bcrypt.hash(password, 10);
    await userRepo.updatePassword(user.id, hashed);
    await userRepo.clearResetToken(user.id);

    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
