'use strict';

/**
 * rating.repository.js — Acceso a reservations.ratings.
 *
 * Tras crear un rating, el llamador debe actualizar auth.users
 * con el nuevo promedio (ver rating.routes.js → UserRepository).
 */

const BaseRepository  = require('../../shared/base-repository');
const { generateId }  = require('../../shared/id-generator');
const { DB_TABLES }   = require('../../config/constants');

class RatingRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.RATINGS); // 'reservations.ratings'
  }

  // ------------------------------------------------------------------
  // Lectura
  // ------------------------------------------------------------------

  async findByReservationId(reservationId) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} WHERE reservation_id = $1`,
      [reservationId]
    );
    return this._toEntity(rows[0]);
  }

  async findByWasherId(washerId, { limit = 50, offset = 0 } = {}) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table}
       WHERE washer_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [washerId, Math.min(limit, 100), offset]
    );
    return rows.map(this._toEntity);
  }

  /**
   * Promedio de estrellas y total de ratings de un lavador.
   * @returns {{ average: number, total: number }}
   */
  async getAverageRating(washerId) {
    const { rows } = await this._db.query(
      `SELECT
         AVG(stars)::DECIMAL(3,2) AS average,
         COUNT(*)                 AS total
       FROM ${this._table}
       WHERE washer_id = $1`,
      [washerId]
    );
    return {
      average: parseFloat(rows[0].average) || 5.0,
      total:   parseInt(rows[0].total, 10),
    };
  }

  // ------------------------------------------------------------------
  // Escritura
  // ------------------------------------------------------------------

  async create(data) {
    const id = generateId('rat');
    const { rows } = await this._db.query(
      `INSERT INTO ${this._table}
         (id, reservation_id, user_id, washer_id, stars, comment)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        id,
        data.reservationId,
        data.userId,
        data.washerId,
        data.stars,
        data.comment ?? null,
      ]
    );
    return this._toEntity(rows[0]);
  }

  // ------------------------------------------------------------------
  // Mapper
  // ------------------------------------------------------------------

  _toEntity(row) {
    if (!row) return null;
    return {
      id:            row.id,
      reservationId: row.reservation_id,
      userId:        row.user_id,
      washerId:      row.washer_id,
      stars:         row.stars,
      comment:       row.comment,
      createdAt:     row.created_at,
    };
  }
}

module.exports = RatingRepository;
