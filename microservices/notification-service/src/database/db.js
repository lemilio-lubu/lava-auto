/**
 * Database Connection for Notification Service
 */

const { Pool } = require('pg');

class Database {
  constructor(config) {
    this.pool = new Pool({
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database || 'lava_auto_notifications',
      user: config.user || 'postgres',
      password: config.password || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Database error:', err);
    });
  }

  async query(text, params) {
    const result = await this.pool.query(text, params);
    return result;
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
