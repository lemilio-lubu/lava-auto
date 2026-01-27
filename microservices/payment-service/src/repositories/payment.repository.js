/**
 * Payment Repository - Repository Pattern Implementation
 */

const crypto = require('crypto');

class PaymentRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'payments';
  }

  generateId() {
    return `pay_${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return this.mapToEntity(result.rows[0]);
  }

  async findByReservationId(reservationId) {
    const query = `SELECT * FROM ${this.tableName} WHERE reservation_id = $1 ORDER BY created_at DESC`;
    const result = await this.db.query(query, [reservationId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.db.query(query, [userId, limit, offset]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByStripePaymentIntent(paymentIntentId) {
    const query = `SELECT * FROM ${this.tableName} WHERE stripe_payment_intent = $1`;
    const result = await this.db.query(query, [paymentIntentId]);
    return this.mapToEntity(result.rows[0]);
  }

  async findAll(options = {}) {
    const { status, limit = 100, offset = 0 } = options;
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data) {
    const id = this.generateId();
    const query = `
      INSERT INTO ${this.tableName} 
      (id, reservation_id, user_id, amount, payment_method, status, transaction_id, stripe_payment_intent, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      id,
      data.reservationId,
      data.userId,
      data.amount,
      data.paymentMethod,
      data.status || 'PENDING',
      data.transactionId || null,
      data.stripePaymentIntent || null,
      data.notes || null
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMapping = {
      status: 'status',
      transactionId: 'transaction_id',
      stripePaymentIntent: 'stripe_payment_intent',
      notes: 'notes'
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

  async updateByStripeIntent(paymentIntentId, data) {
    const payment = await this.findByStripePaymentIntent(paymentIntentId);
    if (!payment) return null;
    return this.update(payment.id, data);
  }

  async getTotalByUser(userId) {
    const query = `
      SELECT SUM(amount) as total
      FROM ${this.tableName}
      WHERE user_id = $1 AND status = 'COMPLETED'
    `;
    const result = await this.db.query(query, [userId]);
    return parseFloat(result.rows[0].total) || 0;
  }

  async getStats() {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
        COUNT(*) FILTER (WHERE status = 'REFUNDED') as refunded,
        SUM(amount) FILTER (WHERE status = 'COMPLETED') as total_completed
      FROM ${this.tableName}
    `;
    const result = await this.db.query(query);
    return result.rows[0];
  }

  mapToEntity(row) {
    if (!row) return null;
    return {
      id: row.id,
      reservationId: row.reservation_id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      paymentMethod: row.payment_method,
      status: row.status,
      transactionId: row.transaction_id,
      stripePaymentIntent: row.stripe_payment_intent,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = PaymentRepository;
