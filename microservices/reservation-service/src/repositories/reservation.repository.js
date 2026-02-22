/**
 * Reservation Repository - Repository Pattern Implementation
 */

const { generateId } = require('../../shared/utils/id-generator');

class ReservationRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'reservations';
  }

  async findById(id) {
    const query = `
      SELECT r.*, s.name as service_name, s.duration as service_duration
      FROM ${this.tableName} r
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.id = $1
    `;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async findByUserId(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    let query = `
      SELECT r.*, s.name as service_name, s.duration as service_duration
      FROM ${this.tableName} r
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.user_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ` AND r.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY r.scheduled_date DESC, r.scheduled_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByWasherId(washerId, options = {}) {
    const { status, limit = 50 } = options;
    let query = `
      SELECT r.*, s.name as service_name, s.duration as service_duration
      FROM ${this.tableName} r
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.washer_id = $1
    `;
    const params = [washerId];

    if (status) {
      query += ` AND r.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY r.scheduled_date DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findPendingJobs(options = {}) {
    const { limit = 50 } = options;
    const query = `
      SELECT r.*, s.name as service_name, s.duration as service_duration
      FROM ${this.tableName} r
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.status = 'PENDING' AND r.washer_id IS NULL
      ORDER BY r.scheduled_date ASC, r.scheduled_time ASC
      LIMIT $1
    `;
    const result = await this.db.query(query, [limit]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByVehicleId(vehicleId, options = {}) {
    const { status, limit = 50 } = options;
    let query = `
      SELECT r.*, s.name as service_name, s.duration as service_duration
      FROM ${this.tableName} r
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.vehicle_id = $1
    `;
    const params = [vehicleId];

    if (status) {
      query += ` AND r.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY r.scheduled_date DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findAll(options = {}) {
    const { status, limit = 100, offset = 0 } = options;
    let query = `
      SELECT r.*, s.name as service_name, s.duration as service_duration
      FROM ${this.tableName} r
      LEFT JOIN services s ON r.service_id = s.id
    `;
    const params = [];

    if (status) {
      query += ` WHERE r.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data) {
    const id = generateId('res');
    const query = `
      INSERT INTO ${this.tableName} 
      (id, user_id, vehicle_id, service_id, scheduled_date, scheduled_time, total_amount, notes, address, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      id,
      data.userId,
      data.vehicleId,
      data.serviceId,
      data.scheduledDate,
      data.scheduledTime,
      data.totalAmount,
      data.notes || null,
      data.address || null,
      data.latitude || null,
      data.longitude || null
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMapping = {
      status: 'status',
      washerId: 'washer_id',
      vehicleId: 'vehicle_id',
      serviceId: 'service_id',
      scheduledDate: 'scheduled_date',
      scheduledTime: 'scheduled_time',
      totalAmount: 'total_amount',
      notes: 'notes',
      address: 'address',
      latitude: 'latitude',
      longitude: 'longitude',
      startedAt: 'started_at',
      completedAt: 'completed_at',
      estimatedArrival: 'estimated_arrival'
    };

    for (const [key, value] of Object.entries(data)) {
      if (fieldMapping[key] !== undefined) {
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

  async assignWasher(id, washerId) {
    const query = `
      UPDATE ${this.tableName}
      SET washer_id = $1, status = 'CONFIRMED'
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.db.query(query, [washerId, id]);
    return this.mapToEntity(result.rows[0]);
  }

  async startService(id) {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'IN_PROGRESS', started_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async completeService(id) {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'COMPLETED', completed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async cancelReservation(id) {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'CANCELLED'
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async countByStatus(status) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = $1`;
    const result = await this.db.query(query, [status]);
    return parseInt(result.rows[0].count);
  }

  async countByUserId(userId) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = $1`;
    const result = await this.db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  async getStats(userId = null, washerId = null) {
    let query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
        COUNT(*) as total
      FROM ${this.tableName}
    `;
    const params = [];

    if (userId) {
      query += ` WHERE user_id = $1`;
      params.push(userId);
    } else if (washerId) {
      query += ` WHERE washer_id = $1`;
      params.push(washerId);
    }

    const result = await this.db.query(query, params);
    return result.rows[0];
  }

  mapToEntity(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      vehicleId: row.vehicle_id,
      serviceId: row.service_id,
      serviceName: row.service_name,
      serviceDuration: row.service_duration,
      washerId: row.washer_id,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      status: row.status,
      totalAmount: parseFloat(row.total_amount),
      notes: row.notes,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      estimatedArrival: row.estimated_arrival,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = ReservationRepository;
