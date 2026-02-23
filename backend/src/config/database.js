'use strict';

/**
 * database.js — Pool de conexiones PostgreSQL (Singleton).
 *
 * Un único Pool compartido por toda la aplicación.
 * Node.js cachea los módulos en require(), lo que garantiza
 * que esta instancia sea la misma en todos los imports.
 *
 * NO instanciar Database en cada request ni en cada módulo.
 * Importar este módulo directamente donde se necesite el pool.
 */

const { Pool } = require('pg');
const config = require('./env');

// Si DATABASE_URL está disponible (Railway Postgres plugin) se usa connectionString
// directamente; libpq (pg) ignora el resto de las opciones en ese caso.
const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      max: config.db.poolMax,
      idleTimeoutMillis: config.db.idleTimeoutMs,
      connectionTimeoutMillis: config.db.connectTimeoutMs,
      ssl: { rejectUnauthorized: false }, // requerido por Railway Postgres
    }
  : {
      host:     config.db.host,
      port:     config.db.port,
      database: config.db.name,
      user:     config.db.user,
      password: config.db.password,
      max:      config.db.poolMax,
      idleTimeoutMillis:     config.db.idleTimeoutMs,
      connectionTimeoutMillis: config.db.connectTimeoutMs,
      ssl: config.isProduction ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

// Log de errores en clientes idle (no termina el proceso)
pool.on('error', (err) => {
  console.error('[db] Error inesperado en cliente idle:', err.message);
});

/**
 * Ejecuta una query parametrizada.
 *
 * @param {string} text  - SQL con placeholders $1, $2, ...
 * @param {Array}  params - Valores para los placeholders
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    if (!config.isProduction) {
      const duration = Date.now() - start;
      console.debug(`[db] query (${duration}ms) rows=${result.rowCount} — ${text.slice(0, 60)}`);
    }
    return result;
  } catch (err) {
    console.error('[db] Error en query:', { sql: text.slice(0, 80), error: err.message });
    throw err;
  }
}

/**
 * Ejecuta un bloque de queries dentro de una transacción ACID.
 * Hace ROLLBACK automático si el callback lanza una excepción.
 *
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 *
 * @example
 * const result = await db.transaction(async (client) => {
 *   const res1 = await client.query('INSERT INTO ...', [...]);
 *   const res2 = await client.query('UPDATE  ...', [...]);
 *   return res1.rows[0];
 * });
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verifica la conectividad con la base de datos.
 * Útil en el health check del servidor.
 *
 * @returns {Promise<boolean>}
 */
async function isHealthy() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Cierra limpiamente el pool (útil en tests y graceful shutdown).
 */
async function close() {
  await pool.end();
}

module.exports = { query, transaction, isHealthy, close };
