'use strict';

/**
 * vehicle.repository.js — Acceso a la tabla vehicles.vehicles.
 *
 * Extiende BaseRepository y agrega métodos específicos del dominio.
 * La verificación de reservas activas se hace mediante consulta directa
 * a reservations.reservations (mismo DB → sin llamadas HTTP).
 */

const BaseRepository = require('../../shared/base-repository');
const { generateId } = require('../../shared/id-generator');
const { DB_TABLES, RESERVATION_STATUS } = require('../../config/constants');

/** Campos de la entidad que se permiten actualizar (allowlist) */
const UPDATABLE_FIELDS = Object.freeze({
  brand:       'brand',
  model:       'model',
  plate:       'plate',
  vehicleType: 'vehicle_type',
  color:       'color',
  year:        'year',
  ownerName:   'owner_name',
  ownerPhone:  'owner_phone',
  isActive:    'is_active',
  brandId:     'brand_id',
  modelId:     'model_id',
  fuelTypeId:  'fuel_type_id',
});

/** Shared SELECT with LEFT JOINs to resolve catalog names */
const VEHICLE_SELECT = `
  SELECT v.*,
         b.name AS brand_name,
         m.name AS model_name
  FROM vehicles.vehicles v
  LEFT JOIN catalog.brands b ON b.id = v.brand_id
  LEFT JOIN catalog.models m ON m.id = v.model_id
`;

class VehicleRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.VEHICLES); // 'vehicles.vehicles'
  }

  // ------------------------------------------------------------------
  // Lectura
  // ------------------------------------------------------------------

  /**
   * Override de BaseRepository — usa JOIN con catalog para devolver brandName/modelName.
   */
  async findById(id) {
    const { rows } = await this._db.query(
      `${VEHICLE_SELECT} WHERE v.id = $1`,
      [id]
    );
    return this._toEntity(rows[0] ?? null);
  }

  /**
   * Busca vehículo por placa (normalizada a mayúsculas).
   */
  async findByPlate(plate) {
    const { rows } = await this._db.query(
      `${VEHICLE_SELECT} WHERE v.plate = $1`,
      [plate.toUpperCase()]
    );
    return this._toEntity(rows[0]);
  }

  /**
   * Devuelve los vehículos de un usuario.
   * @param {string}  userId
   * @param {boolean} activeOnly  Si true, filtra is_active = true (default: true)
   */
  async findByUserId(userId, activeOnly = true) {
    const extra = activeOnly ? 'AND v.is_active = true' : '';
    const { rows } = await this._db.query(
      `${VEHICLE_SELECT}
       WHERE v.user_id = $1 ${extra}
       ORDER BY v.created_at DESC`,
      [userId]
    );
    return rows.map((row) => this._toEntity(row));
  }

  /**
   * Lista todos los vehículos (uso admin).
   */
  async findAllVehicles({ limit = 100, offset = 0, activeOnly = true } = {}) {
    const extra = activeOnly ? 'WHERE v.is_active = true' : '';
    const { rows } = await this._db.query(
      `${VEHICLE_SELECT}
       ${extra}
       ORDER BY v.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Math.min(limit, 100), offset]
    );
    return rows.map((row) => this._toEntity(row));
  }

  /**
   * Cuenta vehículos activos. Si se pasa userId, filtra por usuario.
   */
  async countActive(userId = null) {
    let sql    = `SELECT COUNT(*) AS count FROM ${this._table} WHERE is_active = true`;
    const params = [];

    if (userId) {
      sql += ` AND user_id = $1`;
      params.push(userId);
    }

    const { rows } = await this._db.query(sql, params);
    return parseInt(rows[0].count, 10);
  }

  // ------------------------------------------------------------------
  // Escritura
  // ------------------------------------------------------------------

  /**
   * Crea un vehículo.
   * Acepta brandId/modelId/fuelTypeId opcionales junto con los campos de texto.
   */
  async create(data) {
    const id = generateId('vhc');
    const { rows } = await this._db.query(
      `INSERT INTO ${this._table}
         (id, user_id, brand, model, plate, vehicle_type, color, year,
          owner_name, owner_phone, brand_id, model_id, fuel_type_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        id,
        data.userId      ?? null,
        data.brand,
        data.model,
        data.plate.toUpperCase(),
        data.vehicleType,
        data.color       ?? null,
        data.year        ?? null,
        data.ownerName,
        data.ownerPhone  ?? null,
        data.brandId     ?? null,
        data.modelId     ?? null,
        data.fuelTypeId  ?? null,
      ]
    );
    return this._toEntity(rows[0]);
  }

  /**
   * Actualiza los campos permitidos de un vehículo.
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let   i      = 1;

    for (const [key, col] of Object.entries(UPDATABLE_FIELDS)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(key === 'plate' ? data[key].toUpperCase() : data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET ${fields.join(', ')}
       WHERE id = $${i}
       RETURNING *`,
      values
    );
    return this._toEntity(rows[0] ?? null);
  }

  /**
   * Soft-delete: marca is_active = false.
   */
  async softDelete(id) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table} SET is_active = false WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._toEntity(rows[0] ?? null);
  }

  // ------------------------------------------------------------------
  // Validación cruzada (monolito: consulta directa, sin HTTP)
  // ------------------------------------------------------------------

  /**
   * Devuelve true si el vehículo tiene reservas en estado activo
   * (PENDING | CONFIRMED | IN_PROGRESS).
   * Al ser un monolito, consultamos la tabla del módulo de reservas
   * directamente sin necesidad de llamadas HTTP entre servicios.
   */
  async hasActiveReservations(vehicleId) {
    const activeStatuses = [
      RESERVATION_STATUS.PENDING,
      RESERVATION_STATUS.CONFIRMED,
      RESERVATION_STATUS.IN_PROGRESS,
    ];

    // Construye IN ($1,$2,$3) dinámicamente
    const placeholders = activeStatuses.map((_, idx) => `$${idx + 2}`).join(',');

    const { rows } = await this._db.query(
      `SELECT 1 FROM ${DB_TABLES.RESERVATIONS}
       WHERE vehicle_id = $1
         AND status IN (${placeholders})
       LIMIT 1`,
      [vehicleId, ...activeStatuses]
    );
    return rows.length > 0;
  }

  // ------------------------------------------------------------------
  // Mapper privado (snake_case DB → camelCase entidad)
  // ------------------------------------------------------------------

  _toEntity(row) {
    if (!row) return null;
    return {
      id:          row.id,
      userId:      row.user_id,
      brand:       row.brand,
      model:       row.model,
      plate:       row.plate,
      vehicleType: row.vehicle_type,
      color:       row.color,
      year:        row.year,
      ownerName:   row.owner_name,
      ownerPhone:  row.owner_phone,
      isActive:    row.is_active,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
      brandId:     row.brand_id    ?? null,
      modelId:     row.model_id    ?? null,
      fuelTypeId:  row.fuel_type_id ?? null,
      brandName:   row.brand_name  ?? null,
      modelName:   row.model_name  ?? null,
    };
  }
}

module.exports = VehicleRepository;
