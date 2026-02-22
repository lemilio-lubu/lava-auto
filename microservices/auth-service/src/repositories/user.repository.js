/**
 * User Repository - Repository Pattern Implementation
 */

const { generateId } = require('../../shared/utils/id-generator');

class UserRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'users';
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const result = await this.db.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  async findByResetToken(token) {
    const query = `SELECT * FROM ${this.tableName} WHERE reset_token = $1 AND reset_token_expiry > NOW()`;
    const result = await this.db.query(query, [token]);
    return result.rows[0] || null;
  }

  async findAll(options = {}) {
    const { limit = 100, offset = 0, role } = options;
    let query = `SELECT id, name, email, phone, role, is_available, rating, completed_services, address, latitude, longitude, created_at 
                 FROM ${this.tableName}`;
    const params = [];

    if (role) {
      query += ` WHERE role = $1`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findWashers(options = {}) {
    const { available, limit = 50 } = options;
    let query = `SELECT id, name, email, phone, is_available, rating, completed_services, address, latitude, longitude 
                 FROM ${this.tableName} WHERE role = 'WASHER'`;
    const params = [];

    if (available !== undefined) {
      query += ` AND is_available = $1`;
      params.push(available);
    }

    query += ` ORDER BY rating DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async create(data) {
    const prefix = data.role === 'WASHER' ? 'washer' : (data.role === 'ADMIN' ? 'admin' : 'user');
    const finalId = generateId(prefix);
    
    const query = `
      INSERT INTO ${this.tableName} (id, name, email, password, phone, role, address, latitude, longitude, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, email, phone, role, is_available, created_at
    `;
    const result = await this.db.query(query, [
      finalId,
      data.name,
      data.email.toLowerCase(),
      data.password,
      data.phone || null,
      data.role || 'CLIENT',
      data.address || null,
      data.latitude || null,
      data.longitude || null,
      data.role === 'WASHER' ? true : null  // Washers disponibles por defecto
    ]);
    return result.rows[0];
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'phone', 'address', 'latitude', 'longitude', 'is_available', 'rating', 'completed_services'];
    
    for (const [key, value] of Object.entries(data)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, phone, role, is_available, rating, address, latitude, longitude
    `;
    values.push(id);

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async updatePassword(id, hashedPassword) {
    const query = `UPDATE ${this.tableName} SET password = $1 WHERE id = $2`;
    await this.db.query(query, [hashedPassword, id]);
  }

  async setResetToken(id, token, expiry) {
    const query = `UPDATE ${this.tableName} SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`;
    await this.db.query(query, [token, expiry, id]);
  }

  async clearResetToken(id) {
    const query = `UPDATE ${this.tableName} SET reset_token = NULL, reset_token_expiry = NULL WHERE id = $1`;
    await this.db.query(query, [id]);
  }

  async updateAvailability(id, isAvailable) {
    const query = `UPDATE ${this.tableName} SET is_available = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.query(query, [isAvailable, id]);
    return result.rows[0];
  }

  async updateLocation(id, latitude, longitude) {
    const query = `UPDATE ${this.tableName} SET latitude = $1, longitude = $2 WHERE id = $3 RETURNING *`;
    const result = await this.db.query(query, [latitude, longitude, id]);
    return result.rows[0];
  }

  async incrementCompletedServices(id) {
    const query = `UPDATE ${this.tableName} SET completed_services = completed_services + 1 WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async updateRating(id, newRating) {
    const query = `UPDATE ${this.tableName} SET rating = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.query(query, [newRating, id]);
    return result.rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async count(role = null) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (role) {
      query += ` WHERE role = $1`;
      params.push(role);
    }

    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = UserRepository;
