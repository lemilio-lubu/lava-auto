'use strict';

/**
 * payment.repository.js — Repositorio para payments.payments.
 *
 * Extiende BaseRepository con consultas específicas de pagos:
 *   - Búsqueda por reserva, usuario y Stripe PaymentIntent
 *   - Estadísticas de facturación para el panel admin
 */

const BaseRepository    = require('../../shared/base-repository');
const { generateId }    = require('../../shared/id-generator');
const { DB_TABLES }     = require('../../config/constants');

class PaymentRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.PAYMENTS); // 'payments.payments'
  }

  // ── Búsqueda ─────────────────────────────────────────────────────

  async findByReservationId(reservationId) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table}
       WHERE reservation_id = $1
       ORDER BY created_at DESC`,
      [reservationId]
    );
    return rows.map(r => this._toEntity(r));
  }

  async findByUserId(userId, { limit = 50, offset = 0 } = {}) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table}
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows.map(r => this._toEntity(r));
  }

  async findByStripeIntent(paymentIntentId) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} WHERE stripe_payment_intent = $1`,
      [paymentIntentId]
    );
    return this._toEntity(rows[0]);
  }

  async findAll({ status, limit = 100, offset = 0 } = {}) {
    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE status = $1`;
    }
    params.push(limit, offset);
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table}
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows.map(r => this._toEntity(r));
  }

  // ── Escritura ─────────────────────────────────────────────────────

  async create(data) {
    const id = generateId('pay');
    const { rows } = await this._db.query(
      `INSERT INTO ${this._table}
         (id, reservation_id, user_id, amount, payment_method, status,
          transaction_id, stripe_payment_intent, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        id,
        data.reservationId,
        data.userId,
        data.amount,
        data.paymentMethod,
        data.status  || 'PENDING',
        data.transactionId        || null,
        data.stripePaymentIntent  || null,
        data.notes                || null,
      ]
    );
    return this._toEntity(rows[0]);
  }

  /** Actualiza status, transactionId, stripePaymentIntent, notes */
  async updateStatus(id, { status, transactionId, stripePaymentIntent, notes } = {}) {
    const FIELD_MAP = {
      status:               'status',
      transactionId:        'transaction_id',
      stripePaymentIntent:  'stripe_payment_intent',
      notes:                'notes',
    };
    const fields  = [];
    const values  = [];
    let   idx     = 1;
    const data    = { status, transactionId, stripePaymentIntent, notes };

    for (const [key, col] of Object.entries(FIELD_MAP)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return this.findById(id);

    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      values
    );
    return this._toEntity(rows[0]);
  }

  /** Actualiza por Stripe PaymentIntent (lo usa el webhook) */
  async updateByStripeIntent(paymentIntentId, data) {
    const payment = await this.findByStripeIntent(paymentIntentId);
    if (!payment) return null;
    return this.updateStatus(payment.id, data);
  }

  // ── Stats ─────────────────────────────────────────────────────────

  async getStats() {
    const { rows } = await this._db.query(
      `SELECT
         COUNT(*)                                     FILTER (WHERE status = 'PENDING')   AS pending,
         COUNT(*)                                     FILTER (WHERE status = 'COMPLETED') AS completed,
         COUNT(*)                                     FILTER (WHERE status = 'FAILED')    AS failed,
         COUNT(*)                                     FILTER (WHERE status = 'REFUNDED')  AS refunded,
         COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0) AS total_revenue,
         COUNT(*) FILTER (WHERE payment_method = 'CASH'   AND status = 'COMPLETED') AS cash_completed,
         COUNT(*) FILTER (WHERE payment_method = 'CARD'   AND status = 'COMPLETED') AS card_completed
       FROM ${this._table}`
    );
    const r = rows[0];
    return {
      pending:        parseInt(r.pending,         10),
      completed:      parseInt(r.completed,       10),
      failed:         parseInt(r.failed,          10),
      refunded:       parseInt(r.refunded,        10),
      totalRevenue:   parseFloat(r.total_revenue),
      cashCompleted:  parseInt(r.cash_completed,  10),
      cardCompleted:  parseInt(r.card_completed,  10),
    };
  }

  // ── Mapeo ─────────────────────────────────────────────────────────

  _toEntity(row) {
    if (!row) return null;
    return {
      id:                  row.id,
      reservationId:       row.reservation_id,
      userId:              row.user_id,
      amount:              parseFloat(row.amount),
      paymentMethod:       row.payment_method,
      status:              row.status,
      transactionId:       row.transaction_id,
      stripePaymentIntent: row.stripe_payment_intent,
      notes:               row.notes,
      createdAt:           row.created_at,
      updatedAt:           row.updated_at,
    };
  }
}

module.exports = PaymentRepository;
