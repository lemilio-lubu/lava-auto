'use strict';

/**
 * notification.routes.js — Endpoints REST para notificaciones del usuario.
 *
 * GET  /api/notifications          → mis notificaciones (soporta ?unreadOnly=true)
 * GET  /api/notifications/unread-count → badge counter
 * PUT  /api/notifications/:id/read → marcar una como leída
 * PUT  /api/notifications/read-all → marcar todas como leídas
 * DELETE /api/notifications/:id    → eliminar notificación
 *
 * Uso interno (llamado desde otros módulos, NO expuesto como endpoint REST):
 *   require('../notifications/notification.repository')
 */

const { Router } = require('express');
const { authMiddleware } = require('../../middleware/auth');
const NotificationRepository = require('./notification.repository');

const router = Router();

// Todos los endpoints requieren sesión
router.use(authMiddleware);

// ── GET /api/notifications ────────────────────────────────────────

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Mis notificaciones
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *         description: Si es true devuelve solo las no leídas
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get('/', async (req, res, next) => {
  try {
    const repo = new NotificationRepository(req.db);
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit      = Math.min(Number(req.query.limit) || 30, 100);
    const list = await repo.findByUserId(req.user.id, { unreadOnly, limit });
    res.json(list);
  } catch (err) { next(err); }
});

// ── GET /api/notifications/unread-count ──────────────────────────

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Contador de notificaciones no leídas
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Cantidad de notificaciones pendientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const repo  = new NotificationRepository(req.db);
    const count = await repo.countUnread(req.user.id);
    res.json({ count });
  } catch (err) { next(err); }
});

// ── PUT /api/notifications/read-all ──────────────────────────────
// IMPORTANTE: esta ruta estática debe ir ANTES que /:id/read

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Marcar todas las notificaciones como leídas
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Cantidad de notificaciones actualizadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated: { type: integer }
 */
router.put('/read-all', async (req, res, next) => {
  try {
    const repo    = new NotificationRepository(req.db);
    const updated = await repo.markAllAsRead(req.user.id);
    res.json({ updated });
  } catch (err) { next(err); }
});

// ── PUT /api/notifications/:id/read ──────────────────────────────

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Marcar una notificación como leída
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notificación actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notificación no encontrada
 */
router.put('/:id/read', async (req, res, next) => {
  try {
    const repo  = new NotificationRepository(req.db);
    const notif = await repo.markAsRead(req.params.id, req.user.id);
    if (!notif) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json(notif);
  } catch (err) { next(err); }
});

// ── DELETE /api/notifications/:id ────────────────────────────────

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Eliminar notificación
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notificación eliminada
 *       404:
 *         description: No encontrada
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const repo    = new NotificationRepository(req.db);
    const deleted = await repo.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
