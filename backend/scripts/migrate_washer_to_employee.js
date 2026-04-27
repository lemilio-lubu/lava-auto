'use strict';

/**
 * Migración: renombra el rol WASHER → EMPLOYEE en auth.users
 * PostgreSQL 10+ soporta ALTER TYPE ... RENAME VALUE directamente.
 * Ejecutar: node scripts/migrate_washer_to_employee.js
 */

require('dotenv').config();
const db = require('../src/config/database');

async function migrate() {
  try {
    await db.query(`ALTER TYPE user_role RENAME VALUE 'WASHER' TO 'EMPLOYEE'`);
    console.log('✅ ENUM user_role: WASHER → EMPLOYEE');

    const { rows } = await db.query(
      `SELECT COUNT(*) FROM auth.users WHERE role = 'EMPLOYEE'`
    );
    console.log(`✅ Usuarios con rol EMPLOYEE: ${rows[0].count}`);

    // Actualizar índice parcial (se recrea automáticamente con el nuevo valor)
    await db.query(`DROP INDEX IF EXISTS idx_auth_users_available_washers`);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_users_available_employees
        ON auth.users (is_available)
        WHERE role = 'EMPLOYEE'
    `);
    console.log('✅ Índice actualizado: idx_auth_users_available_employees');

    console.log('\nMigración completada.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

migrate();
