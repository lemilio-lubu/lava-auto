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

  // Usar un pool temporal solo para este script (no el módulo singleton)
  const pool = new Pool({
    host:     config.db.host,
    port:     config.db.port,
    database: config.db.name,
    user:     config.db.user,
    password: config.db.password,
    connectionTimeoutMillis: 5_000,
  });

  try {
    // Verificar conectividad
    await pool.query('SELECT 1');
    console.log('[migrate] Conexión exitosa.');

    // Leer e ejecutar el schema
    const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    console.log(`[migrate] Ejecutando ${SCHEMA_PATH}...`);
    await pool.query(sql);

    console.log('[migrate] ✅ Migración completada exitosamente.');
  } catch (err) {
    console.error('[migrate] ❌ Error durante la migración:', err.message);
    if (err.detail) console.error('[migrate] Detalle:', err.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
