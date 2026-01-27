/**
 * Shared Database Connection Module
 * Uses native PostgreSQL with pg library
 * Implements Connection Pool Pattern
 */

const { Pool } = require('pg');

class Database {
  constructor(config) {
    this.pool = new Pool({
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database,
      user: config.user || 'postgres',
      password: config.password || 'postgres',
      max: config.maxConnections || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Query error', { text, error: error.message });
      throw error;
    }
  }

  async getClient() {
    const client = await this.pool.connect();
    return client;
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = Database;
