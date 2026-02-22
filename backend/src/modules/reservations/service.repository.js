'use strict';

/**
 * service.repository.js — Acceso al catálogo de servicios (reservations.services).
 */

const BaseRepository  = require('../../shared/base-repository');
const { generateId }  = require('../../shared/id-generator');
const { DB_TABLES }   = require('../../config/constants');

const FIELD_MAP = Object.freeze({
  name:        'name',
  description: 'description',
  duration:    'duration',
  price:       'price',
  vehicleType: 'vehicle_type',
  isActive:    'is_active',
});

class ServiceRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.SERVICES); // 'reservations.services'
  }

  // ------------------------------------------------------------------
  // Lectura
  // ------------------------------------------------------------------

  /**
   * Lista servicios con filtros opcionales.
   * @param {{ activeOnly?: boolean, vehicleType?: string }} options
   */
  async findAll({ activeOnly = true, vehicleType } = {}) {
    const conditions = [];
    const params     = [];

    if (activeOnly) conditions.push('is_active = true');

    if (vehicleType) {
      conditions.push(`vehicle_type = $${params.push(vehicleType)}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} ${where} ORDER BY vehicle_type, price`,
      params
    );
    return rows.map(this._toEntity);
  }

  /** Alias semántico: filtra solo por tipo de vehículo (activos) */
  async findByVehicleType(vehicleType) {
    return this.findAll({ activeOnly: true, vehicleType });
  }

  /** Devuelve true si el servicio tiene al menos una reserva asociada */
  async hasReservations(serviceId) {
    const { rows } = await this._db.query(
      `SELECT 1 FROM ${DB_TABLES.RESERVATIONS} WHERE service_id = $1 LIMIT 1`,
      [serviceId]
    );
    return rows.length > 0;
  }

  // ------------------------------------------------------------------
  // Escritura
  // ------------------------------------------------------------------

  async create(data) {
    const id = generateId('svc');
    const { rows } = await this._db.query(
      `INSERT INTO ${this._table}
         (id, name, description, duration, price, vehicle_type, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        id,
        data.name,
        data.description ?? null,
        data.duration,
        data.price,
        data.vehicleType,
        data.isActive !== false,
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
    return this._toEntity(rows[0] ?? null);
  }

  /** Elimina físicamente el servicio (solo si no tiene reservas). */
  async delete(id) {
    const { rows } = await this._db.query(
      `DELETE FROM ${this._table} WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._toEntity(rows[0] ?? null);
  }

  // ------------------------------------------------------------------
  // Mapper
  // ------------------------------------------------------------------

  _toEntity(row) {
    if (!row) return null;
    return {
      id:          row.id,
      name:        row.name,
      description: row.description,
      duration:    row.duration,
      price:       parseFloat(row.price),
      vehicleType: row.vehicle_type,
      isActive:    row.is_active,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
    };
  }
}

module.exports = ServiceRepository;
