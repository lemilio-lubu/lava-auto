/**
 * Service Repository - Repository Pattern Implementation
 */

const { generateId } = require('../../shared/utils/id-generator');

class ServiceRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'services';
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async findAll(options = {}) {
    const { activeOnly, vehicleType } = options;
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];
    const conditions = [];

    // Si activeOnly es explicitamente false, no filtrar
    // Si es true o undefined (default), filtrar por activos
    if (activeOnly !== false) {
      conditions.push(`is_active = true`);
    }

    if (vehicleType) {
      conditions.push(`vehicle_type = $${params.length + 1}`);
      params.push(vehicleType);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY vehicle_type, price`;

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByVehicleType(vehicleType) {
    const query = `SELECT * FROM ${this.tableName} WHERE vehicle_type = $1 AND is_active = true ORDER BY price`;
    const result = await this.db.query(query, [vehicleType]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data) {
    const id = generateId('svc');
    const query = `
      INSERT INTO ${this.tableName} (id, name, description, duration, price, vehicle_type, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      id,
      data.name,
      data.description || null,
      data.duration,
      data.price,
      data.vehicleType,
      data.isActive !== false
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMapping = {
      name: 'name',
      description: 'description',
      duration: 'duration',
      price: 'price',
      vehicleType: 'vehicle_type',
      isActive: 'is_active'
    };

    for (const [key, value] of Object.entries(data)) {
      if (fieldMapping[key] !== undefined && value !== undefined) {
        fields.push(`${fieldMapping[key]} = $${paramIndex}`);
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
      RETURNING *
    `;
    values.push(id);

    const result = await this.db.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async hasReservations(id) {
    const query = `SELECT COUNT(*) as count FROM reservations WHERE service_id = $1`;
    const result = await this.db.query(query, [id]);
    return parseInt(result.rows[0].count, 10) > 0;
  }

  async delete(id) {
    // Eliminar físicamente el servicio de la base de datos
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  mapToEntity(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      duration: row.duration,
      price: parseFloat(row.price),
      vehicleType: row.vehicle_type,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = ServiceRepository;
