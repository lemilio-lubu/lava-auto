'use strict';

/**
 * Migración: agrega campos de cliente derivados del CRM (identificación, ciudad, provincia, empresa)
 * Ejecutar: node scripts/migrate_client_fields.js
 */

require('dotenv').config();
const { getPool } = require('../src/config/db');

async function migrate() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const alterations = [
      `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS identification VARCHAR(20)`,
      `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS city           VARCHAR(100)`,
      `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS province       VARCHAR(100)`,
      `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS company        VARCHAR(255)`,
    ];

    for (const sql of alterations) {
      await client.query(sql);
      console.log('OK:', sql.trim());
    }

    await client.query('COMMIT');
    console.log('\nMigración completada exitosamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
