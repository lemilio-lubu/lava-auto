'use strict';

/**
 * service.repository.js — Acceso al catálogo de servicios (reservations.services).
 *
 * Un servicio puede componerse de varias tarifas de mano de obra
 * (catalog.labor_rates) y varios repuestos (catalog.spare_parts). Cuando
 * tiene composición, su `price` se autocalcula = Σ(horas×tarifa) + Σ(cant×precio)
 * y se persiste para que el flujo de reservas siga leyendo `price` sin cambios.
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
    return rows.map((r) => this._toEntity(r));
  }

  /** Alias semántico: filtra solo por tipo de vehículo (activos) */
  async findByVehicleType(vehicleType) {
    return this.findAll({ activeOnly: true, vehicleType });
  }

  /** Devuelve un servicio con su composición de mano de obra y repuestos. */
  async findById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} WHERE id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const [laborItems, partItems] = await Promise.all([
      this.findLaborItems(id),
      this.findPartItems(id),
    ]);
    return this._toEntity(rows[0], laborItems, partItems);
  }

  /** Tareas de mano de obra del servicio, con su tarifa resuelta. */
  async findLaborItems(serviceId) {
    const { rows } = await this._db.query(
      `SELECT li.*, lr.name AS labor_rate_name, lr.rate_per_hour
         FROM ${DB_TABLES.SERVICE_LABOR_ITEMS} li
         JOIN ${DB_TABLES.CATALOG_LABOR_RATES} lr ON lr.id = li.labor_rate_id
        WHERE li.service_id = $1
        ORDER BY li.sort_order ASC, li.created_at ASC`,
      [serviceId]
    );
    return rows.map((r) => {
      const hours       = parseFloat(r.hours);
      const ratePerHour = parseFloat(r.rate_per_hour);
      return {
        id:           r.id,
        serviceId:    r.service_id,
        laborRateId:  r.labor_rate_id,
        laborRateName: r.labor_rate_name,
        hours,
        ratePerHour,
        subtotal:     hours * ratePerHour,
        sortOrder:    r.sort_order,
      };
    });
  }

  /** Repuestos del servicio, con su precio unitario resuelto. */
  async findPartItems(serviceId) {
    const { rows } = await this._db.query(
      `SELECT pi.*, sp.name AS spare_part_name, sp.unit_price
         FROM ${DB_TABLES.SERVICE_PART_ITEMS} pi
         JOIN ${DB_TABLES.CATALOG_SPARE_PARTS} sp ON sp.id = pi.spare_part_id
        WHERE pi.service_id = $1
        ORDER BY pi.sort_order ASC, pi.created_at ASC`,
      [serviceId]
    );
    return rows.map((r) => {
      const quantity  = parseFloat(r.quantity);
      const unitPrice = parseFloat(r.unit_price);
      return {
        id:            r.id,
        serviceId:     r.service_id,
        sparePartId:   r.spare_part_id,
        sparePartName: r.spare_part_name,
        quantity,
        unitPrice,
        subtotal:      quantity * unitPrice,
        sortOrder:     r.sort_order,
      };
    });
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
    const laborItems = Array.isArray(data.laborItems) ? data.laborItems : null;
    const partItems  = Array.isArray(data.partItems)  ? data.partItems  : null;
    const hasComposition = laborItems !== null || partItems !== null;

    const id = generateId('svc');

    await this._db.transaction(async (client) => {
      const price = hasComposition
        ? await this._computePrice(client, laborItems ?? [], partItems ?? [])
        : data.price;

      await client.query(
        `INSERT INTO ${this._table}
           (id, name, description, duration, price, vehicle_type, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          id,
          data.name,
          data.description ?? null,
          data.duration,
          price,
          data.vehicleType,
          data.isActive !== false,
        ]
      );

      if (hasComposition) {
        await this._replaceItems(client, id, laborItems ?? [], partItems ?? []);
      }
    });

    return this.findById(id);
  }

  async update(id, data) {
    const laborItems = Array.isArray(data.laborItems) ? data.laborItems : null;
    const partItems  = Array.isArray(data.partItems)  ? data.partItems  : null;
    const hasComposition = laborItems !== null || partItems !== null;

    await this._db.transaction(async (client) => {
      if (hasComposition) {
        await this._replaceItems(client, id, laborItems ?? [], partItems ?? []);
      }

      const fields = [];
      const values = [];
      let   i      = 1;

      for (const [key, col] of Object.entries(FIELD_MAP)) {
        if (key === 'price' && hasComposition) continue; // price es derivado
        if (data[key] !== undefined) {
          fields.push(`${col} = $${i++}`);
          values.push(data[key]);
        }
      }

      // Precio autocalculado a partir de la composición resultante.
      if (hasComposition) {
        const price = await this._computePrice(client, laborItems ?? [], partItems ?? []);
        fields.push(`price = $${i++}`);
        values.push(price);
      }

      if (fields.length === 0) return;

      values.push(id);
      await client.query(
        `UPDATE ${this._table} SET ${fields.join(', ')} WHERE id = $${i}`,
        values
      );
    });

    return this.findById(id);
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
  // Helpers de composición
  // ------------------------------------------------------------------

  /**
   * Borra la composición previa e inserta la nueva (mano de obra + repuestos).
   * @private
   */
  async _replaceItems(client, serviceId, laborItems, partItems) {
    await client.query(
      `DELETE FROM ${DB_TABLES.SERVICE_LABOR_ITEMS} WHERE service_id = $1`,
      [serviceId]
    );
    await client.query(
      `DELETE FROM ${DB_TABLES.SERVICE_PART_ITEMS} WHERE service_id = $1`,
      [serviceId]
    );

    for (let idx = 0; idx < laborItems.length; idx++) {
      const it = laborItems[idx];
      await client.query(
        `INSERT INTO ${DB_TABLES.SERVICE_LABOR_ITEMS}
           (id, service_id, labor_rate_id, hours, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [generateId('sli'), serviceId, it.laborRateId, it.hours ?? 1, idx]
      );
    }

    for (let idx = 0; idx < partItems.length; idx++) {
      const it = partItems[idx];
      await client.query(
        `INSERT INTO ${DB_TABLES.SERVICE_PART_ITEMS}
           (id, service_id, spare_part_id, quantity, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [generateId('spi'), serviceId, it.sparePartId, it.quantity ?? 1, idx]
      );
    }
  }

  /**
   * Calcula Σ(horas×tarifa) + Σ(cant×precio) resolviendo tarifas y precios
   * desde el catálogo. @returns {Promise<number>}
   * @private
   */
  async _computePrice(client, laborItems, partItems) {
    let total = 0;

    if (laborItems.length) {
      const ids = laborItems.map((it) => it.laborRateId);
      const { rows } = await client.query(
        `SELECT id, rate_per_hour FROM ${DB_TABLES.CATALOG_LABOR_RATES} WHERE id = ANY($1)`,
        [ids]
      );
      const rateById = new Map(rows.map((r) => [r.id, parseFloat(r.rate_per_hour)]));
      for (const it of laborItems) {
        total += (rateById.get(it.laborRateId) ?? 0) * (parseFloat(it.hours) || 0);
      }
    }

    if (partItems.length) {
      const ids = partItems.map((it) => it.sparePartId);
      const { rows } = await client.query(
        `SELECT id, unit_price FROM ${DB_TABLES.CATALOG_SPARE_PARTS} WHERE id = ANY($1)`,
        [ids]
      );
      const priceById = new Map(rows.map((r) => [r.id, parseFloat(r.unit_price)]));
      for (const it of partItems) {
        total += (priceById.get(it.sparePartId) ?? 0) * (parseFloat(it.quantity) || 0);
      }
    }

    return Math.round(total * 100) / 100;
  }

  // ------------------------------------------------------------------
  // Mapper
  // ------------------------------------------------------------------

  _toEntity(row, laborItems = [], partItems = []) {
    if (!row) return null;
    return {
      id:          row.id,
      name:        row.name,
      description: row.description,
      duration:    row.duration,
      price:       parseFloat(row.price),
      vehicleType: row.vehicle_type,
      isActive:    row.is_active,
      laborItems,
      partItems,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
    };
  }
}

module.exports = ServiceRepository;
