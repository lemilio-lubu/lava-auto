/**
 * Rating Repository - Repository Pattern Implementation
 */

const { generateId } = require('../../shared/utils/id-generator');

class RatingRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'ratings';
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async findByReservationId(reservationId) {
    const query = `SELECT * FROM ${this.tableName} WHERE reservation_id = $1`;
    const result = await this.db.query(query, [reservationId]);
    return this.mapToEntity(result.rows[0]);
  }

  async findByWasherId(washerId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE washer_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.db.query(query, [washerId, limit, offset]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data) {
    const id = generateId('rat');
    const query = `
      INSERT INTO ${this.tableName} (id, reservation_id, user_id, washer_id, stars, comment)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      id,
      data.reservationId,
      data.userId,
      data.washerId,
      data.stars,
      data.comment || null
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  async getAverageRating(washerId) {
    const query = `
      SELECT 
        AVG(stars)::DECIMAL(3,2) as average,
        COUNT(*) as total
      FROM ${this.tableName}
      WHERE washer_id = $1
    `;
    const result = await this.db.query(query, [washerId]);
    return {
      average: parseFloat(result.rows[0].average) || 5.0,
      total: parseInt(result.rows[0].total)
    };
  }

  mapToEntity(row) {
    if (!row) return null;
    return {
      id: row.id,
      reservationId: row.reservation_id,
      userId: row.user_id,
      washerId: row.washer_id,
      stars: row.stars,
      comment: row.comment,
      createdAt: row.created_at
    };
  }
}

module.exports = RatingRepository;
