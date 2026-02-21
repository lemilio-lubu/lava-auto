/**
 * Vehicle Repository - Repository Pattern Implementation
 */

const { generateId } = require('../../shared/utils/id-generator');

class VehicleRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'vehicles';
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async findByPlate(plate) {
    const query = `SELECT * FROM ${this.tableName} WHERE plate = $1`;
    const result = await this.db.query(query, [plate.toUpperCase()]);
    return this.mapToEntity(result.rows[0]);
  }

  async findByUserId(userId, activeOnly = true) {
    let query = `SELECT * FROM ${this.tableName} WHERE user_id = $1`;
    if (activeOnly) {
      query += ` AND is_active = true`;
    }
    query += ` ORDER BY created_at DESC`;
    
    const result = await this.db.query(query, [userId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findAll(options = {}) {
    const { limit = 100, offset = 0, activeOnly = true } = options;
    let query = `SELECT * FROM ${this.tableName}`;
    
    if (activeOnly) {
      query += ` WHERE is_active = true`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    
    const result = await this.db.query(query, [limit, offset]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data) {
    const id = generateId('vhc');
    const query = `
      INSERT INTO ${this.tableName} (id, user_id, brand, model, plate, vehicle_type, color, year, owner_name, owner_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      id,
      data.userId || null,
      data.brand,
      data.model,
      data.plate.toUpperCase(),
      data.vehicleType,
      data.color || null,
      data.year || null,
      data.ownerName,
      data.ownerPhone || null
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMapping = {
      brand: 'brand',
      model: 'model',
      plate: 'plate',
      vehicleType: 'vehicle_type',
      color: 'color',
      year: 'year',
      ownerName: 'owner_name',
      ownerPhone: 'owner_phone',
      isActive: 'is_active'
    };

    for (const [key, value] of Object.entries(data)) {
      if (fieldMapping[key] && value !== undefined) {
        fields.push(`${fieldMapping[key]} = $${paramIndex}`);
        values.push(key === 'plate' ? value.toUpperCase() : value);
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
      RETURNING *
    `;
    values.push(id);

    const result = await this.db.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id) {
    // Soft delete
    const query = `UPDATE ${this.tableName} SET is_active = false WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async hardDelete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async count(userId = null) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_active = true`;
    const params = [];

    if (userId) {
      query += ` AND user_id = $1`;
      params.push(userId);
    }

    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async hasReservations(vehicleId) {
    // This would need to call the reservation service
    // For now, return false - in production, use HTTP call or event
    return false;
  }

  mapToEntity(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      brand: row.brand,
      model: row.model,
      plate: row.plate,
      vehicleType: row.vehicle_type,
      color: row.color,
      year: row.year,
      ownerName: row.owner_name,
      ownerPhone: row.owner_phone,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = VehicleRepository;
