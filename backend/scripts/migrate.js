'use strict';

/**
 * migrate.js — Inicializa el schema de la base de datos.
 *
 * Lee src/database/schema.sql y lo ejecuta contra la BD configurada.
 * Es idempotente: puede ejecutarse varias veces sin errores.
 *
 * USO:
 *   node scripts/migrate.js
 *   npm run migrate
 */

// Cargar variables de entorno antes de cualquier otra cosa
require('../src/config/env');

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const config = require('../src/config/env');

const SCHEMA_PATH = path.join(__dirname, '../src/database/schema.sql');

async function migrate() {
  console.log('[migrate] Iniciando migración de base de datos...');
  console.log(`[migrate] Host: ${config.db.host}:${config.db.port} / DB: ${config.db.name}`);

  const poolConfig = config.db.connectionString
    ? {
        connectionString: config.db.connectionString,
        connectionTimeoutMillis: 10_000,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host:     config.db.host,
        port:     config.db.port,
        database: config.db.name,
        user:     config.db.user,
        password: config.db.password,
        connectionTimeoutMillis: 10_000,
      };

  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 3_000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const pool = new Pool(poolConfig);
    try {
      await pool.query('SELECT 1');
      console.log(`[migrate] Conexión exitosa (intento ${attempt}).`);

      const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
      console.log(`[migrate] Ejecutando ${SCHEMA_PATH}...`);
      await pool.query(sql);

      console.log('[migrate] ✅ Migración completada exitosamente.');
      await pool.end();
      return;
    } catch (err) {
      await pool.end().catch(() => {});
      console.error(`[migrate] ❌ Intento ${attempt}/${MAX_RETRIES} fallido: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        console.log(`[migrate] Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.warn('[migrate] ⚠ Todos los intentos fallaron. El servidor arrancará sin migración.');
      }
    }
  }
}

migrate();
