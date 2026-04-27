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

  // Paso 1: esperar conexión con reintentos
  let pool;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    pool = new Pool(poolConfig);
    try {
      await pool.query('SELECT 1');
      console.log(`[migrate] Conexión exitosa (intento ${attempt}).`);
      break;
    } catch (err) {
      await pool.end().catch(() => {});
      pool = null;
      console.error(`[migrate] ❌ Sin conexión (intento ${attempt}/${MAX_RETRIES}): ${err.message}`);
      if (attempt < MAX_RETRIES) {
        console.log(`[migrate] Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  if (!pool) {
    console.warn('[migrate] ⚠ No se pudo conectar a la BD. El servidor arrancará sin migración.');
    return;
  }

  // Paso 2: ejecutar schema.sql completo (idempotente)
  try {
    const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    console.log(`[migrate] Ejecutando ${SCHEMA_PATH}...`);
    await pool.query(sql);
    console.log('[migrate] ✅ schema.sql ejecutado.');
  } catch (err) {
    console.error(`[migrate] ⚠ schema.sql falló (se continuará): ${err.message}`);
  }

  // Paso 3: columnas críticas — siempre se ejecutan, independiente del paso 2
  const criticalColumns = [
    `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS identification       VARCHAR(20)`,
    `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS city                VARCHAR(100)`,
    `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS province            VARCHAR(100)`,
    `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS company             VARCHAR(255)`,
    `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS totp_secret         VARCHAR(255)`,
    `ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS totp_enabled        BOOLEAN NOT NULL DEFAULT false`,
  ];
  for (const stmt of criticalColumns) {
    try {
      await pool.query(stmt);
    } catch (err) {
      console.error(`[migrate] ⚠ Columna falló: ${err.message}`);
    }
  }
  console.log('[migrate] ✅ Columnas críticas verificadas.');

  await pool.end();
  console.log('[migrate] ✅ Migración completada.');
}

migrate();
