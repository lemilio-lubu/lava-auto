'use strict';

/**
 * reservation.repository.js — Acceso a reservations.reservations.
 *
 * Los JOINs con reservations.services son directos (misma DB).
 * Se incluye la información del servicio en cada row devuelta.
 */

const BaseRepository = require('../../shared/base-repository');
const { generateId } = require('../../shared/id-generator');
const { DB_TABLES, RESERVATION_STATUS } = require('../../config/constants');

/** Campos permitidos en update() */
const FIELD_MAP = Object.freeze({
  status:           'status',
  washerId:         'washer_id',
  vehicleId:        'vehicle_id',
  serviceId:        'service_id',
  scheduledDate:    'scheduled_date',
  scheduledTime:    'scheduled_time',
  totalAmount:      'total_amount',
  notes:            'notes',
  address:          'address',
  latitude:         'latitude',
  longitude:        'longitude',
  startedAt:        'started_at',
  completedAt:      'completed_at',
  estimatedArrival: 'estimated_arrival',
});

/** Query base con JOIN al catálogo de servicios */
const BASE_SELECT = `
  SELECT r.*,
         s.name     AS service_name,
         s.duration AS service_duration
  FROM   ${DB_TABLES.RESERVATIONS} r
  LEFT JOIN ${DB_TABLES.SERVICES} s ON s.id = r.service_id
`;

class ReservationRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.RESERVATIONS);
  }

  // ------------------------------------------------------------------
  // Consultas
  // ------------------------------------------------------------------

  async findById(id) {
    const { rows } = await this._db.query(
      `${BASE_SELECT} WHERE r.id = $1`,
      [id]
    );
    return this._toEntity(rows[0]);
  }

  async findByUserId(userId, { status, limit = 50, offset = 0 } = {}) {
    const params  = [userId];
    let   where   = 'WHERE r.user_id = $1';

    if (status) { where += ` AND r.status = $${params.push(status)}`; }

    const { rows } = await this._db.query(
      `${BASE_SELECT} ${where}
       ORDER BY r.scheduled_date DESC, r.scheduled_time DESC
       LIMIT $${params.push(Math.min(limit, 100))} OFFSET $${params.push(offset)}`,
      params
    );
    return rows.map(this._toEntity);
  }

  async findByWasherId(washerId, { status, limit = 50 } = {}) {
    const params = [washerId];
    let   where  = 'WHERE r.washer_id = $1';

    if (status) { where += ` AND r.status = $${params.push(status)}`; }

    const { rows } = await this._db.query(
      `${BASE_SELECT} ${where}
       ORDER BY r.scheduled_date DESC
       LIMIT $${params.push(Math.min(limit, 100))}`,
      params
    );
    return rows.map(this._toEntity);
  }

  async findByVehicleId(vehicleId, { status, limit = 50 } = {}) {
    const params = [vehicleId];
    let   where  = 'WHERE r.vehicle_id = $1';

    if (status) { where += ` AND r.status = $${params.push(status)}`; }

    const { rows } = await this._db.query(
      `${BASE_SELECT} ${where}
       ORDER BY r.scheduled_date DESC
       LIMIT $${params.push(Math.min(limit, 100))}`,
      params
    );
    return rows.map(this._toEntity);
  }

  /** Reservas PENDING sin lavador asignado (pool de trabajos disponibles) */
  async findPendingJobs({ limit = 50 } = {}) {
    const { rows } = await this._db.query(
      `${BASE_SELECT}
       WHERE r.status = 'PENDING' AND r.washer_id IS NULL
       ORDER BY r.scheduled_date ASC, r.scheduled_time ASC
       LIMIT $1`,
      [Math.min(limit, 100)]
    );
    return rows.map(this._toEntity);
  }

  async findAll({ status, limit = 100, offset = 0 } = {}) {
    const params = [];
    const where  = status ? `WHERE r.status = $${params.push(status)}` : '';

    const { rows } = await this._db.query(
      `${BASE_SELECT} ${where}
       ORDER BY r.created_at DESC
       LIMIT $${params.push(Math.min(limit, 100))} OFFSET $${params.push(offset)}`,
      params
    );
    return rows.map(this._toEntity);
  }

  // ------------------------------------------------------------------
  // Estadísticas
  // ------------------------------------------------------------------

  /** Conteos por estado; filtra por usuario o lavador si se pasan. */
  async getStats(userId = null, washerId = null) {
    const params = [];
    let   where  = '';

    if (userId)   { where = `WHERE user_id   = $${params.push(userId)}`;   }
    else if (washerId) { where = `WHERE washer_id = $${params.push(washerId)}`; }

    const { rows } = await this._db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING')     AS pending,
         COUNT(*) FILTER (WHERE status = 'CONFIRMED')   AS confirmed,
         COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS in_progress,
         COUNT(*) FILTER (WHERE status = 'COMPLETED')   AS completed,
         COUNT(*) FILTER (WHERE status = 'CANCELLED')   AS cancelled,
         COUNT(*)                                        AS total
       FROM ${this._table} ${where}`,
      params
    );
    return rows[0];
  }

  // ------------------------------------------------------------------
  // Escritura
  // ------------------------------------------------------------------

  async create(data) {
    const id = generateId('res');
    const { rows } = await this._db.query(
      `INSERT INTO ${this._table}
         (id, user_id, vehicle_id, service_id, scheduled_date, scheduled_time,
          total_amount, notes, address, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        id,
        data.userId,
        data.vehicleId,
        data.serviceId,
        data.scheduledDate,
        data.scheduledTime,
        data.totalAmount,
        data.notes        ?? null,
        data.address      ?? null,
        data.latitude     ?? null,
        data.longitude    ?? null,
      ]
    );
    return this._toEntity(rows[0]);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let   i      = 1;

    for (const [key, col] of Object.entries(FIELD_MAP)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${this._table} SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return this._toEntity(rows[0]);
  }

  async assignWasher(id, washerId) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET washer_id = $1, status = 'CONFIRMED'
       WHERE id = $2
       RETURNING *`,
      [washerId, id]
    );
    return this._toEntity(rows[0]);
  }

  async startService(id) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET status = 'IN_PROGRESS', started_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._toEntity(rows[0]);
  }

  async completeService(id) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET status = 'COMPLETED', completed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._toEntity(rows[0]);
  }

  async cancelReservation(id) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET status = 'CANCELLED'
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._toEntity(rows[0]);
  }

  // ------------------------------------------------------------------
  // Mapper privado
  // ------------------------------------------------------------------

  _toEntity(row) {
    if (!row) return null;
    return {
      id:               row.id,
      userId:           row.user_id,
      vehicleId:        row.vehicle_id,
      serviceId:        row.service_id,
      serviceName:      row.service_name  ?? null,
      serviceDuration:  row.service_duration ?? null,
      washerId:         row.washer_id,
      scheduledDate:    row.scheduled_date,
      scheduledTime:    row.scheduled_time,
      status:           row.status,
      totalAmount:      parseFloat(row.total_amount),
      notes:            row.notes,
      address:          row.address,
      latitude:         row.latitude,
      longitude:        row.longitude,
      startedAt:        row.started_at,
      completedAt:      row.completed_at,
      estimatedArrival: row.estimated_arrival,
      createdAt:        row.created_at,
      updatedAt:        row.updated_at,
    };
  }
}

module.exports = ReservationRepository;
