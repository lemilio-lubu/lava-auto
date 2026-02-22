'use strict';

/**
 * notification.repository.js — Repositorio para notifications.notifications
 * y notifications.messages.
 *
 * Dos tablas, una clase: mantiene toda la lógica de BD de notificaciones
 * y chat en un único lugar sin romper el patrón BaseRepository.
 */

const BaseRepository = require('../../shared/base-repository');
const { generateId } = require('../../shared/id-generator');
const { DB_TABLES }  = require('../../config/constants');

class NotificationRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.NOTIFICATIONS); // 'notifications.notifications'
  }

  // ── Notificaciones ────────────────────────────────────────────────

  /**
   * Obtiene las notificaciones de un usuario.
   * @param {string} userId
   * @param {object} opts
   * @param {boolean} [opts.unreadOnly=false]
   * @param {number}  [opts.limit=30]
   */
  async findByUserId(userId, { unreadOnly = false, limit = 30 } = {}) {
    const params = [userId, limit];
    const extra  = unreadOnly ? 'AND is_read = false' : '';
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table}
       WHERE user_id = $1 ${extra}
       ORDER BY created_at DESC
       LIMIT $2`,
      params
    );
    return rows.map(r => this._toEntity(r));
  }

  /** Cuenta las notificaciones no leídas de un usuario (para badge). */
  async countUnread(userId) {
    const { rows } = await this._db.query(
      `SELECT COUNT(*)::int AS count FROM ${this._table}
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return rows[0].count;
  }

  /** Marca una notificación como leída. */
  async markAsRead(id, userId) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /** Marca TODAS las notificaciones de un usuario como leídas. */
  async markAllAsRead(userId) {
    const { rowCount } = await this._db.query(
      `UPDATE ${this._table} SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return rowCount;
  }

  /**
   * Crea una nueva notificación.
   * @param {object} data  { userId, title, message, type, actionUrl, metadata }
   */
  async create(data) {
    const id = generateId('ntf');
    const { rows } = await this._db.query(
      `INSERT INTO ${this._table}
         (id, user_id, title, message, type, action_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        data.userId,
        data.title,
        data.message,
        data.type    ?? 'INFO',
        data.actionUrl ?? null,
        data.metadata  ? JSON.stringify(data.metadata) : null,
      ]
    );
    return this._toEntity(rows[0]);
  }

  /** Elimina una notificación (solo el propietario puede borrarla). */
  async delete(id, userId) {
    const { rowCount } = await this._db.query(
      `DELETE FROM ${this._table} WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rowCount > 0;
  }

  // ── Mensajes de chat ──────────────────────────────────────────────

  /**
   * Devuelve la lista de conversaciones del usuario con el último mensaje.
   * Retorna el shape que espera el frontend:
   *   { other_user_id, other_user_name, other_user_role, last_message_at, unread_count }
   */
  async findConversations(userId) {
    const { rows } = await this._db.query(
      `SELECT
         CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
         MAX(u.name)::text                                                   AS other_user_name,
         MAX(u.role)::text                                                   AS other_user_role,
         MAX(m.created_at)                                                   AS last_message_at,
         COUNT(CASE WHEN m.receiver_id = $1 AND m.read = false THEN 1 END)::int AS unread_count
       FROM ${DB_TABLES.MESSAGES} m
       JOIN auth.users u
         ON u.id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       GROUP BY CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
       ORDER BY last_message_at DESC`,
      [userId]
    );
    return rows;
  }

  /**
   * Devuelve los mensajes entre dos usuarios.
   * @param {string} userA
   * @param {string} userB
   * @param {number} [limit=50]
   */
  async findMessagesBetween(userA, userB, limit = 50) {
    const { rows } = await this._db.query(
      `SELECT m.*, su.name AS sender_name, su.role AS sender_role
       FROM ${DB_TABLES.MESSAGES} m
       JOIN auth.users su ON su.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC
       LIMIT $3`,
      [userA, userB, limit]
    );
    return rows;
  }

  /** Crea un mensaje de chat. */
  async createMessage(data) {
    const id = generateId('msg');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.MESSAGES}
         (id, sender_id, sender_role, receiver_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, data.senderId, data.senderRole ?? null, data.receiverId, data.content]
    );
    // Enriquecer con nombres para devolverlo al cliente directamente
    const msg = rows[0];
    const { rows: urows } = await this._db.query(
      `SELECT id, name, role FROM auth.users WHERE id IN ($1, $2)`,
      [data.senderId, data.receiverId]
    );
    const byId = Object.fromEntries(urows.map(u => [u.id, u]));
    return {
      ...msg,
      senderName:   byId[msg.sender_id]?.name   ?? null,
      receiverName: byId[msg.receiver_id]?.name ?? null,
    };
  }

  /** Marca como leídos todos los mensajes enviados a receiverId por senderId. */
  async markMessagesRead(senderId, receiverId) {
    const { rowCount } = await this._db.query(
      `UPDATE ${DB_TABLES.MESSAGES}
       SET read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND read = false`,
      [senderId, receiverId]
    );
    return rowCount;
  }

  /** Marca un único mensaje como leído (solo si el receptor es userId). */
  async markSingleMessageRead(messageId, userId) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.MESSAGES}
       SET read = true
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [messageId, userId]
    );
    return rows[0] ?? null;
  }

  /** Cuenta los mensajes no leídos recibidos por userId. */
  async countUnreadMessages(userId) {
    const { rows } = await this._db.query(
      `SELECT COUNT(*)::int AS count
       FROM ${DB_TABLES.MESSAGES}
       WHERE receiver_id = $1 AND read = false`,
      [userId]
    );
    return rows[0].count;
  }

  // ── Mapeador ──────────────────────────────────────────────────────

  _toEntity(row) {
    if (!row) return null;
    return {
      id:        row.id,
      userId:    row.user_id,
      title:     row.title,
      message:   row.message,
      type:      row.type,
      isRead:    row.is_read,
      actionUrl: row.action_url,
      metadata:  row.metadata,
      createdAt: row.created_at,
    };
  }
}

module.exports = NotificationRepository;
