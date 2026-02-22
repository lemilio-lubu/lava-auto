'use strict';

/**
 * seed.js — Carga datos iniciales de prueba en la base de datos.
 *
 * Respeta el orden de inserción según las FKs del schema:
 *   1. auth.users
 *   2. vehicles.vehicles
 *   3. reservations.services
 *
 * Es idempotente gracias a ON CONFLICT DO NOTHING.
 *
 * USO:
 *   node scripts/seed.js
 *   npm run seed
 *
 * REQUISITO: ejecutar `npm run migrate` antes del seed.
 */

require('../src/config/env');

const { Pool } = require('pg');
const config = require('../src/config/env');

// ================================================================
// Datos de prueba
// ================================================================

// Contraseñas bcrypt hasheadas:
//   admin123   → $2a$10$nHEhFGJoW3D79y8XhbK1vO1p7UCSqSoZUW.526DrbeTAYpJ8xYZRS
//   client123  → $2a$10$gt/Bwmj5OD8qG.qoeMDBC.NB7w1c3Z3yaMHKdeldvF2lOM0YMGoaq
//   washer123  → $2a$10$EtJOcltQ4wmtA.JkGsDoSOu8I7j9fQ.RuMQXaL6w3QUPAo3NMhcza
const USERS_SQL = `
INSERT INTO auth.users
  (id, email, name, password, phone, role, is_available)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001',
   'admin@lavauto.com',    'Administrador',      '$2a$10$nHEhFGJoW3D79y8XhbK1vO1p7UCSqSoZUW.526DrbeTAYpJ8xYZRS', '0999999999', 'ADMIN',  false),
  ('550e8400-e29b-41d4-a716-446655440002',
   'cliente@test.com',     'Cliente de Prueba',  '$2a$10$gt/Bwmj5OD8qG.qoeMDBC.NB7w1c3Z3yaMHKdeldvF2lOM0YMGoaq', '0988888888', 'CLIENT', false),
  ('550e8400-e29b-41d4-a716-446655440003',
   'lavador@test.com',     'Lavador de Prueba',  '$2a$10$EtJOcltQ4wmtA.JkGsDoSOu8I7j9fQ.RuMQXaL6w3QUPAo3NMhcza', '0977777777', 'WASHER', true)
ON CONFLICT (id) DO NOTHING;
`;

const VEHICLES_SQL = `
INSERT INTO vehicles.vehicles
  (id, user_id, brand, model, plate, year, color, vehicle_type, owner_name, owner_phone)
VALUES
  ('660e8400-e29b-41d4-a716-446655440001',
   '550e8400-e29b-41d4-a716-446655440002',
   'Toyota', 'Corolla', 'ABC-1234', 2020, 'Blanco', 'SEDAN', 'Cliente de Prueba', '0988888888'),
  ('660e8400-e29b-41d4-a716-446655440002',
   '550e8400-e29b-41d4-a716-446655440002',
   'Chevrolet', 'Tracker', 'XYZ-5678', 2022, 'Negro', 'SUV', 'Cliente de Prueba', '0988888888')
ON CONFLICT (id) DO NOTHING;
`;

const SERVICES_SQL = `
INSERT INTO reservations.services
  (id, name, description, duration, price, vehicle_type, is_active)
VALUES
  ('svc_sedan_basic',    'Lavado Básico Sedán',    'Lavado exterior con agua a presión, jabón especial y secado',       30,  150.00, 'SEDAN',      true),
  ('svc_sedan_complete', 'Lavado Completo Sedán',  'Lavado exterior e interior, aspirado y limpieza de vidrios',         60,  250.00, 'SEDAN',      true),
  ('svc_sedan_premium',  'Lavado Premium Sedán',   'Lavado completo más encerado y acondicionador de llantas',           90,  400.00, 'SEDAN',      true),
  ('svc_suv_basic',      'Lavado Básico SUV',      'Lavado exterior con agua a presión, jabón especial y secado',        45,  200.00, 'SUV',        true),
  ('svc_suv_complete',   'Lavado Completo SUV',    'Lavado exterior e interior, aspirado y limpieza de vidrios',         75,  350.00, 'SUV',        true),
  ('svc_suv_premium',    'Lavado Premium SUV',     'Lavado completo más encerado y acondicionador de llantas',          120,  500.00, 'SUV',        true),
  ('svc_pickup_basic',   'Lavado Básico Pickup',   'Lavado exterior con agua a presión, jabón especial y secado',        45,  200.00, 'PICKUP',     true),
  ('svc_pickup_complete','Lavado Completo Pickup', 'Lavado exterior e interior, aspirado y limpieza de vidrios',         75,  350.00, 'PICKUP',     true),
  ('svc_van_basic',      'Lavado Básico Van',      'Lavado exterior con agua a presión, jabón especial y secado',        60,  250.00, 'VAN',        true),
  ('svc_van_complete',   'Lavado Completo Van',    'Lavado exterior e interior, aspirado y limpieza de vidrios',         90,  450.00, 'VAN',        true),
  ('svc_moto_basic',     'Lavado Básico Moto',     'Lavado completo de motocicleta',                                     20,   80.00, 'MOTORCYCLE', true),
  ('svc_moto_premium',   'Lavado Premium Moto',    'Lavado completo con cera y brillo especial',                         40,  150.00, 'MOTORCYCLE', true)
ON CONFLICT (id) DO NOTHING;
`;

// ================================================================
// Runner
// ================================================================

const STEPS = [
  { label: 'auth.users',               sql: USERS_SQL },
  { label: 'vehicles.vehicles',        sql: VEHICLES_SQL },
  { label: 'reservations.services',    sql: SERVICES_SQL },
];

async function seed() {
  console.log('[seed] Iniciando carga de datos de prueba...');

  const pool = new Pool({
    host:     config.db.host,
    port:     config.db.port,
    database: config.db.name,
    user:     config.db.user,
    password: config.db.password,
    connectionTimeoutMillis: 5_000,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const step of STEPS) {
      console.log(`[seed]   → Insertando ${step.label}...`);
      await client.query(step.sql);
    }

    await client.query('COMMIT');
    console.log('[seed] ✅ Datos de prueba cargados exitosamente.');
    console.log('[seed]');
    console.log('[seed] Usuarios disponibles:');
    console.log('[seed]   admin@lavauto.com   / admin123  (ADMIN)');
    console.log('[seed]   cliente@test.com    / client123 (CLIENT)');
    console.log('[seed]   lavador@test.com    / washer123 (WASHER)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] ❌ Error durante el seed. Se hizo ROLLBACK.', err.message);
    if (err.detail) console.error('[seed] Detalle:', err.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
