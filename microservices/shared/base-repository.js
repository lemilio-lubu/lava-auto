/**
 * Base Repository - Repository Pattern Implementation
 * Provides common CRUD operations for all repositories
 */

class BaseRepository {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll(options = {}) {
    const { limit = 100, offset = 0, orderBy = 'created_at', order = 'DESC' } = options;
    const query = `
      SELECT * FROM ${this.tableName} 
      ORDER BY ${orderBy} ${order}
      LIMIT $1 OFFSET $2
    `;
    const result = await this.db.query(query, [limit, offset]);
    return result.rows;
  }

  async findByField(field, value) {
    const query = `SELECT * FROM ${this.tableName} WHERE ${field} = $1`;
    const result = await this.db.query(query, [value]);
    return result.rows;
  }

  async findOneByField(field, value) {
    const query = `SELECT * FROM ${this.tableName} WHERE ${field} = $1 LIMIT 1`;
    const result = await this.db.query(query, [value]);
    return result.rows[0] || null;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    const result = await this.db.query(query, [...values, id]);
    return result.rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async count(whereClause = '', params = []) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async exists(id) {
    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`;
    const result = await this.db.query(query, [id]);
    return result.rows[0].exists;
  }
}

module.exports = BaseRepository;
