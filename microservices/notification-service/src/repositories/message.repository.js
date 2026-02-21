/**
 * Message Repository - Repository Pattern Implementation
 */

const { generateId } = require('../../shared/utils/id-generator');

class MessageRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'messages';
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async findConversation(userId1, userId2, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await this.db.query(query, [userId1, userId2, limit, offset]);
    return result.rows.map(row => this.mapToEntity(row)).reverse();
  }

  async findUserConversations(userId) {
    // Get list of users that have conversations with this user
    // Note: We can't join with users table since it's in auth-service DB
    // We'll return the data we have and the frontend will display user IDs
    // In production, you'd use an inter-service call or a shared cache
    const query = `
      WITH conversation_users AS (
        SELECT DISTINCT
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id
        FROM ${this.tableName}
        WHERE sender_id = $1 OR receiver_id = $1
      ),
      last_messages AS (
        SELECT 
          cu.other_user_id,
          MAX(m.created_at) as last_message_at,
          SUM(CASE WHEN m.receiver_id = $1 AND m.read = false THEN 1 ELSE 0 END) as unread_count
        FROM conversation_users cu
        JOIN ${this.tableName} m ON 
          (m.sender_id = $1 AND m.receiver_id = cu.other_user_id) OR
          (m.sender_id = cu.other_user_id AND m.receiver_id = $1)
        GROUP BY cu.other_user_id
      )
      SELECT 
        other_user_id,
        other_user_id as other_user_name,
        last_message_at,
        unread_count::integer
      FROM last_messages
      ORDER BY last_message_at DESC
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async create(data) {
    const id = generateId('msg');
    const query = `
      INSERT INTO ${this.tableName} (id, sender_id, sender_role, receiver_id, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      id,
      data.senderId,
      data.senderRole || null,
      data.receiverId,
      data.content
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  async markAsRead(id) {
    const query = `UPDATE ${this.tableName} SET read = true WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async markConversationAsRead(senderId, receiverId) {
    const query = `
      UPDATE ${this.tableName} 
      SET read = true 
      WHERE sender_id = $1 AND receiver_id = $2 AND read = false
    `;
    await this.db.query(query, [senderId, receiverId]);
  }

  async countUnread(userId) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE receiver_id = $1 AND read = false`;
    const result = await this.db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  mapToEntity(row) {
    if (!row) return null;
    return {
      id: row.id,
      senderId: row.sender_id,
      senderRole: row.sender_role,
      receiverId: row.receiver_id,
      content: row.content,
      read: row.read,
      createdAt: row.created_at
    };
  }
}

module.exports = MessageRepository;
