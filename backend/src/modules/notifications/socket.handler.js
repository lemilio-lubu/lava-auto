'use strict';

/**
 * socket.handler.js — Lógica central de Socket.IO.
 *
 * Responsabilidades:
 *   1. Autenticar cada conexión con el JWT del handshake.
 *   2. Unir al usuario a su sala personal `room:<userId>`.
 *   3. Manejar eventos de chat en tiempo real.
 *   4. Manejar actualizaciones de ubicación del lavador.
 *
 * Uso:
 *   const socketHandler = require('./modules/notifications/socket.handler');
 *   socketHandler(io, db);
 *
 * El módulo exporta además un helper `notifyUser` para que otros
 * módulos puedan emitir notificaciones sin importar `io` directamente.
 */

const jwt            = require('jsonwebtoken');
const { SOCKET_EVENTS } = require('../../config/constants');
const NotificationRepository = require('./notification.repository');

/**
 * Inicializa todos los listeners de Socket.IO.
 * @param {import('socket.io').Server} io
 * @param {object} db  — instancia del pool de BD
 */
function socketHandler(io, db) {

  // ── Middleware de autenticación ──────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
               || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) return next(new Error('Token requerido'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload; // { id, email, role, ... }
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  // ── Conexión ─────────────────────────────────────────────────────
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    const { id: userId, role } = socket.user;

    // Unirse a la sala personal → permite enviar eventos directos
    socket.join(`room:${userId}`);
    console.log(`[socket] ${role} ${userId} conectado (${socket.id})`);

    // ── Chat: enviar mensaje ────────────────────────────────────────
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
      try {
        const { receiverId, content } = data ?? {};
        if (!receiverId || !content?.trim()) return;

        const repo = new NotificationRepository(db);
        const msg  = await repo.createMessage({
          senderId:   userId,
          senderRole: role,
          receiverId,
          content:    content.trim(),
        });

        // Emitir al destinatario (si está online) y confirmar al remitente
        io.to(`room:${receiverId}`).emit(SOCKET_EVENTS.NEW_MESSAGE, msg);
        socket.emit(SOCKET_EVENTS.NEW_MESSAGE, { ...msg, _own: true });
      } catch (err) {
        console.error('[socket] send-message error:', err.message);
      }
    });

    // ── Tracking: lavador actualiza su ubicación ────────────────────
    // El frontend del lavador emite { reservationId, lat, lng }
    // Todos los que estén en la sala de la reserva reciben la actualización
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, (data) => {
      const { reservationId, lat, lng } = data ?? {};
      if (!reservationId || lat == null || lng == null) return;

      // El cliente se une a la sala de la reserva desde el frontend
      io.to(`reservation:${reservationId}`).emit(SOCKET_EVENTS.WASHER_LOCATION, {
        washerId: userId,
        lat,
        lng,
        ts: Date.now(),
      });
    });

    // ── Unirse a sala de reserva (lo hace el cliente desde el frontend) ─
    socket.on(SOCKET_EVENTS.JOIN_CHAT, (data) => {
      const { reservationId } = data ?? {};
      if (reservationId) {
        socket.join(`reservation:${reservationId}`);
      }
    });

    // ── Desconexión ───────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`[socket] ${role} ${userId} desconectado`);
    });
  });
}

/**
 * Helper para crear una notificación en BD Y emitirla por Socket.IO.
 * Se usa en los demás routers (job.routes, reservation.routes, etc.)
 * sin necesitar importar ni `io` ni el repositorio directamente.
 *
 * @param {object} db
 * @param {import('socket.io').Server} io
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.type        — NOTIFICATION_TYPES value
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {object} [opts.metadata]
 * @param {string} [opts.actionUrl]
 * @returns {Promise<object>}       — notificación creada
 */
async function notifyUser(db, io, { userId, type, title, message, metadata, actionUrl } = {}) {
  const repo  = new NotificationRepository(db);
  const notif = await repo.create({ userId, type, title, message, metadata, actionUrl });

  if (io) {
    io.to(`room:${userId}`).emit('notification', notif);
  }

  return notif;
}

module.exports = socketHandler;
module.exports.notifyUser = notifyUser;
