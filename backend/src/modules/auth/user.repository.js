'use strict';

/**
 * user.repository.js — Acceso a datos de la tabla auth.users.
 *
 * Extiende BaseRepository para CRUD genérico y añade métodos
 * específicos del dominio de usuarios/lavadores.
 *
 * Tabla: auth.users  (schema 'auth', definido en DB_TABLES.USERS)
 */

const BaseRepository = require('../../shared/base-repository');
const { generateId }  = require('../../shared/id-generator');
const { DB_TABLES, USER_ROLES, PAGINATION } = require('../../config/constants');

class UserRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.USERS);
  }

  // ------------------------------------------------------------------
  // Lectura
  // ------------------------------------------------------------------

  /** @returns {Promise<Object|null>} usuario con password (solo para login) */
  async findByEmail(email) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    return rows[0] ?? null;
  }

  /** Solo devuelve usuario si el token aún no ha expirado */
  async findByResetToken(token) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table}
       WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );
    return rows[0] ?? null;
  }

  /**
   * Listado de usuarios sin exponer el password.
   * @param {{ role?: string, limit?: number, offset?: number }} options
   */
  async findAll({ role, limit = PAGINATION.DEFAULT_LIMIT, offset = 0 } = {}) {
    const safeLimit = Math.min(parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const params = [safeLimit, offset];
    let whereClause = '';

    if (role) {
      whereClause = 'WHERE role = $3';
      params.push(role);
    }

    const { rows } = await this._db.query(
      `SELECT id, name, email, phone, role,
              is_available, rating, completed_services,
              address, latitude, longitude, created_at
       FROM ${this._table}
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );
    return rows;
  }

  /**
   * Lista lavadores sin exponer datos sensibles.
   * @param {{ available?: boolean, limit?: number }} options
   */
  async findWashers({ available, limit = 50 } = {}) {
    const safeLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const params = [safeLimit];
    let availableClause = '';

    if (available !== undefined) {
      availableClause = `AND is_available = $2`;
      params.push(available);
    }

    const { rows } = await this._db.query(
      `SELECT id, name, email, phone,
              is_available, rating, completed_services,
              address, latitude, longitude
       FROM ${this._table}
       WHERE role = '${USER_ROLES.WASHER}' ${availableClause}
       ORDER BY rating DESC
       LIMIT $1`,
      params
    );
    return rows;
  }

  // ------------------------------------------------------------------
  // Escritura
  // ------------------------------------------------------------------

  /**
   * Crea un usuario con ID generado y email normalizado.
   * NUNCA recibe el password en texto plano — debe llegar ya hasheado.
   */
  async create(data) {
    const rolePrefix = {
      [USER_ROLES.ADMIN]:  'admin',
      [USER_ROLES.WASHER]: 'washer',
      [USER_ROLES.CLIENT]: 'user',
    };
    const prefix = rolePrefix[data.role] ?? 'user';
    const id = generateId(prefix);

    const { rows } = await this._db.query(
      `INSERT INTO ${this._table}
         (id, name, email, password, phone, role, address, latitude, longitude, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, phone, role, is_available, rating, completed_services, created_at`,
      [
        id,
        data.name.trim(),
        data.email.toLowerCase().trim(),
        data.password,
        data.phone ?? null,
        data.role ?? USER_ROLES.CLIENT,
        data.address ?? null,
        data.latitude ?? null,
        data.longitude ?? null,
        data.role === USER_ROLES.WASHER, // los lavadores inician disponibles
      ]
    );
    return rows[0];
  }

  /**
   * Actualización parcial: solo actualiza los campos permitidos.
   * Retorna el perfil actualizado sin password.
   */
  async update(id, data) {
    const ALLOWED = ['name', 'phone', 'address', 'latitude', 'longitude',
                     'is_available', 'rating', 'completed_services'];

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      // Convierte camelCase → snake_case para campos de la BD
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (ALLOWED.includes(col)) {
        fields.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING id, name, email, phone, role,
                 is_available, rating, address, latitude, longitude, updated_at`,
      values
    );
    return rows[0] ?? null;
  }

  async updatePassword(id, hashedPassword) {
    await this._db.query(
      `UPDATE ${this._table} SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, id]
    );
  }

  async setResetToken(id, token, expiry) {
    await this._db.query(
      `UPDATE ${this._table}
       SET reset_token = $1, reset_token_expiry = $2, updated_at = NOW()
       WHERE id = $3`,
      [token, expiry, id]
    );
  }

  async clearResetToken(id) {
    await this._db.query(
      `UPDATE ${this._table}
       SET reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  async updateAvailability(id, isAvailable) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET is_available = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, is_available`,
      [isAvailable, id]
    );
    return rows[0] ?? null;
  }

  async updateLocation(id, latitude, longitude) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET latitude = $1, longitude = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, latitude, longitude`,
      [latitude, longitude, id]
    );
    return rows[0] ?? null;
  }

  async incrementCompletedServices(id) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET completed_services = completed_services + 1, updated_at = NOW()
       WHERE id = $1
       RETURNING id, completed_services, rating`,
      [id]
    );
    return rows[0] ?? null;
  }

  async updateRating(id, newRating) {
    const { rows } = await this._db.query(
      `UPDATE ${this._table}
       SET rating = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, rating`,
      [newRating, id]
    );
    return rows[0] ?? null;
  }

  async countByRole(role = null) {
    const params = [];
    let whereClause = '';
    if (role) {
      whereClause = 'WHERE role = $1';
      params.push(role);
    }
    const { rows } = await this._db.query(
      `SELECT COUNT(*) AS count FROM ${this._table} ${whereClause}`,
      params
    );
    return parseInt(rows[0].count, 10);
  }
}

module.exports = UserRepository;
