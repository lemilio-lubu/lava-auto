'use strict';

/**
 * base-repository.js — Repositorio base con operaciones CRUD genéricas.
 *
 * Patrón Repository: desacopla la lógica de negocio del acceso a datos.
 * Cada repository de dominio extiende esta clase y solo agrega
 * los métodos específicos que necesita.
 *
 * CONVENCIÓN DE NOMBRE DE TABLA:
 *   Siempre pasar el nombre cualificado con schema:
 *   new UserRepository(db, 'auth.users')
 *   new VehicleRepository(db, 'vehicles.vehicles')
 *
 *   Usar las constantes de DB_TABLES en src/config/constants.js
 *   para evitar typos.
 */

const { PAGINATION } = require('../config/constants');

class BaseRepository {
  /**
   * @param {import('../config/database')} db - Módulo de base de datos
   * @param {string} tableName - Nombre cualificado: 'schema.tabla'
   */
  constructor(db, tableName) {
    if (!tableName || !tableName.includes('.')) {
      throw new Error(
        `[BaseRepository] tableName debe incluir el schema (ej: 'auth.users'). Recibido: '${tableName}'`
      );
    }
    this._db = db;
    this._table = tableName;
  }

  // ------------------------------------------------------------------
  // Consultas de lectura
  // ------------------------------------------------------------------

  /**
   * Busca un registro por su PK (columna `id`).
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  /**
   * Devuelve todos los registros con paginación opcional.
   * @param {{ limit?: number, offset?: number, orderBy?: string, order?: 'ASC'|'DESC' }} options
   * @returns {Promise<Object[]>}
   */
  async findAll({ limit = PAGINATION.DEFAULT_LIMIT, offset = 0, orderBy = 'created_at', order = 'DESC' } = {}) {
    // Sanitizar para evitar inyección SQL en los parámetros de ordenación
    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';
    const safeOrderBy = /^[a-z_]+$/.test(orderBy) ? orderBy : 'created_at';
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT, 1), PAGINATION.MAX_LIMIT);

    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} ORDER BY ${safeOrderBy} ${safeOrder} LIMIT $1 OFFSET $2`,
      [safeLimit, offset]
    );
    return rows;
  }

  /**
   * Devuelve todos los registros donde `field` = `value`.
   * @param {string} field - Nombre de columna (solo letras y guión bajo)
   * @param {*} value
   * @returns {Promise<Object[]>}
   */
  async findByField(field, value) {
    this._assertSafeColumnName(field);
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} WHERE ${field} = $1`,
      [value]
    );
    return rows;
  }

  /**
   * Devuelve el primer registro donde `field` = `value`, o null.
   * @param {string} field
   * @param {*} value
   * @returns {Promise<Object|null>}
   */
  async findOneByField(field, value) {
    this._assertSafeColumnName(field);
    const { rows } = await this._db.query(
      `SELECT * FROM ${this._table} WHERE ${field} = $1 LIMIT 1`,
      [value]
    );
    return rows[0] ?? null;
  }

  // ------------------------------------------------------------------
  // Mutaciones
  // ------------------------------------------------------------------

  /**
   * Inserta un registro y devuelve la fila creada.
   * @param {Object} data - Objeto plano con los campos a insertar
   * @returns {Promise<Object>}
   */
  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await this._db.query(
      `INSERT INTO ${this._table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return rows[0];
  }

  /**
   * Actualiza un registro por id y devuelve la fila actualizada.
   * Solo actualiza los campos presentes en `data`.
   * @param {string} id
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const { rows } = await this._db.query(
      `UPDATE ${this._table} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0] ?? null;
  }

  /**
   * Elimina un registro por id y devuelve la fila eliminada.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async delete(id) {
    const { rows } = await this._db.query(
      `DELETE FROM ${this._table} WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] ?? null;
  }

  // ------------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------------

  /**
   * Cuenta el total de registros con una cláusula WHERE opcional.
   * @param {string} [whereClause] - Ej: 'WHERE status = $1'
   * @param {Array}  [params]
   * @returns {Promise<number>}
   */
  async count(whereClause = '', params = []) {
    const { rows } = await this._db.query(
      `SELECT COUNT(*) AS count FROM ${this._table} ${whereClause}`,
      params
    );
    return parseInt(rows[0].count, 10);
  }

  /**
   * Verifica si existe un registro con el id dado.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    const { rows } = await this._db.query(
      `SELECT EXISTS(SELECT 1 FROM ${this._table} WHERE id = $1) AS "exists"`,
      [id]
    );
    return rows[0].exists;
  }

  // ------------------------------------------------------------------
  // Helpers privados
  // ------------------------------------------------------------------

  /**
   * Previene inyección SQL en nombres de columnas (no parametrizables con $n).
   * @private
   */
  _assertSafeColumnName(name) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
      throw new Error(`[BaseRepository] Nombre de columna inválido: '${name}'`);
    }
  }
}

module.exports = BaseRepository;
