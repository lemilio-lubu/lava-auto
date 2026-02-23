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

  // Si DATABASE_URL está disponible usarla directamente (Railway)
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

  const pool = new Pool(poolConfig);

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
    // NO hacemos process.exit(1): si la migración falla el servidor igual arranca.
    // Esto permite que Railway marque el contenedor como healthy y se pueda
    // investigar el error en los logs sin que el contenedor quede en loop de reinicios.
    console.warn('[migrate] ⚠ El servidor arrancará sin aplicar el schema. Revisa los logs.');
  } finally {
    await pool.end();
  }
}

migrate();
