/**
 * Notification Repository - Repository Pattern Implementation
 */

const { generateId } = require('../../shared/utils/id-generator');

class NotificationRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'notifications';
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async findByUserId(userId, options = {}) {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;
    let query = `SELECT * FROM ${this.tableName} WHERE user_id = $1`;
    const params = [userId];

    if (unreadOnly) {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data) {
    const id = generateId('ntf');
    const query = `
      INSERT INTO ${this.tableName} (id, user_id, title, message, type, action_url, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      id,
      data.userId,
      data.title,
      data.message,
      data.type || 'INFO',
      data.actionUrl || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  async markAsRead(id) {
    const query = `UPDATE ${this.tableName} SET is_read = true WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async markAllAsRead(userId) {
    const query = `UPDATE ${this.tableName} SET is_read = true WHERE user_id = $1 AND is_read = false`;
    await this.db.query(query, [userId]);
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async countUnread(userId) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = $1 AND is_read = false`;
    const result = await this.db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  mapToEntity(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      actionUrl: row.action_url,
      metadata: row.metadata,
      createdAt: row.created_at
    };
  }
}

module.exports = NotificationRepository;
