'use strict';

/**
 * chat.routes.js — Mensajería entre usuarios (cliente ↔ lavador ↔ admin).
 *
 * GET  /api/chat/conversations       → lista de conversaciones del usuario
 * GET  /api/chat/unread-count        → cantidad de mensajes no leídos
 * GET  /api/chat/conversation/:uid   → mensajes con un usuario (alias frontend)
 * GET  /api/chat/:userId             → mensajes con un usuario
 * POST /api/chat/send                → enviar mensaje (alias frontend)
 * POST /api/chat/:userId             → enviar mensaje
 * PUT  /api/chat/:messageId/read     → marcar mensaje individual como leído
 */

const { Router } = require('express');
const { authMiddleware }         = require('../../middleware/auth');
const NotificationRepository     = require('./notification.repository');

const router = Router();

router.use(authMiddleware);

// ── GET /api/chat/conversations ───────────────────────────────────

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Lista de conversaciones del usuario actual
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Conversaciones con el último mensaje de cada una
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 */
router.get('/conversations', async (req, res, next) => {
  try {
    const repo = new NotificationRepository(req.db);
    const list = await repo.findConversations(req.user.id);
    res.json(list);
  } catch (err) { next(err); }
});

// ── GET /api/chat/unread-count ─────────────────────────────────────

/**
 * @swagger
 * /api/chat/unread-count:
 *   get:
 *     summary: Cantidad de mensajes no leídos
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Contador
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
    const count = await repo.countUnreadMessages(req.user.id);
    res.json({ count });
  } catch (err) { next(err); }
});

// ── GET /api/chat/conversation/:userId  (alias del frontend) ──────
router.get('/conversation/:userId', async (req, res, next) => {
  try {
    const repo     = new NotificationRepository(req.db);
    const limit    = Math.min(Number(req.query.limit) || 50, 200);
    const messages = await repo.findMessagesBetween(req.user.id, req.params.userId, limit);
    await repo.markMessagesRead(req.params.userId, req.user.id);
    res.json(messages);
  } catch (err) { next(err); }
});

// ── POST /api/chat/send  (alias del frontend) ─────────────────────

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Enviar mensaje (alias del frontend)
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, content]
 *             properties:
 *               receiverId:   { type: string }
 *               content:      { type: string }
 *               receiverRole: { type: string }
 *     responses:
 *       201: { description: Mensaje guardado }
 */
router.post('/send', async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId)        return res.status(400).json({ error: 'receiverId requerido' });
    if (!content?.trim())  return res.status(400).json({ error: 'El contenido del mensaje es requerido' });

    const repo = new NotificationRepository(req.db);
    const msg  = await repo.createMessage({
      senderId:   req.user.id,
      senderRole: req.user.role,
      receiverId,
      content:    content.trim(),
    });

    if (req.io) {
      req.io.to(`room:${receiverId}`).emit('new-message', msg);
    }

    res.status(201).json(msg);
  } catch (err) { next(err); }
});

// ── GET /api/chat/:userId ─────────────────────────────────────────

/**
 * @swagger
 * /api/chat/{userId}:
 *   get:
 *     summary: Mensajes entre el usuario actual y otro usuario
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Lista de mensajes ordenados por fecha
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const repo    = new NotificationRepository(req.db);
    const limit   = Math.min(Number(req.query.limit) || 50, 200);
    const messages = await repo.findMessagesBetween(req.user.id, req.params.userId, limit);

    // Marcar como leídos los mensajes que nos enviaron
    await repo.markMessagesRead(req.params.userId, req.user.id);

    res.json(messages);
  } catch (err) { next(err); }
});

// ── POST /api/chat/:userId ────────────────────────────────────────

/**
 * @swagger
 * /api/chat/{userId}:
 *   post:
 *     summary: Enviar mensaje a un usuario
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Estoy en camino, llego en 5 minutos"
 *     responses:
 *       201:
 *         description: Mensaje enviado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Contenido requerido
 */
router.post('/:userId', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'El contenido del mensaje es requerido' });

    const repo = new NotificationRepository(req.db);
    const msg  = await repo.createMessage({
      senderId:   req.user.id,
      senderRole: req.user.role,
      receiverId: req.params.userId,
      content:    content.trim(),
    });

    // Emitir en tiempo real al destinatario si está conectado
    if (req.io) {
      req.io.to(`room:${req.params.userId}`).emit('new-message', msg);
    }

    res.status(201).json(msg);
  } catch (err) { next(err); }
});

// ── PUT /api/chat/:messageId/read ─────────────────────────────────

/**
 * @swagger
 * /api/chat/{messageId}/read:
 *   put:
 *     summary: Marcar mensaje individual como leído
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Mensaje actualizado }
 *       404: { description: Mensaje no encontrado }
 */
router.put('/:messageId/read', async (req, res, next) => {
  try {
    const repo = new NotificationRepository(req.db);
    const msg  = await repo.markSingleMessageRead(req.params.messageId, req.user.id);
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });
    res.json(msg);
  } catch (err) { next(err); }
});

module.exports = router;
