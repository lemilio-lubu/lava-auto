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
//   employee123 → $2a$10$EtJOcltQ4wmtA.JkGsDoSOu8I7j9fQ.RuMQXaL6w3QUPAo3NMhcza
const USERS_SQL = `
INSERT INTO auth.users
  (id, email, name, password, phone, role, is_available)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001',
   'admin@lavauto.com',    'Administrador',      '$2a$10$nHEhFGJoW3D79y8XhbK1vO1p7UCSqSoZUW.526DrbeTAYpJ8xYZRS', '0999999999', 'ADMIN',  false),
  ('550e8400-e29b-41d4-a716-446655440002',
   'cliente@test.com',     'Cliente de Prueba',  '$2a$10$gt/Bwmj5OD8qG.qoeMDBC.NB7w1c3Z3yaMHKdeldvF2lOM0YMGoaq', '0988888888', 'CLIENT', false),
  ('550e8400-e29b-41d4-a716-446655440003',
   'empleado@test.com',    'Empleado de Prueba', '$2a$10$EtJOcltQ4wmtA.JkGsDoSOu8I7j9fQ.RuMQXaL6w3QUPAo3NMhcza', '0977777777', 'EMPLOYEE', true)
ON CONFLICT (id) DO NOTHING;
`;

const VEHICLES_SQL = `
INSERT INTO vehicles.vehicles
  (id, user_id, brand, model, plate, year, color, vehicle_type, owner_name, owner_phone, brand_id, model_id, fuel_type_id)
VALUES
  ('660e8400-e29b-41d4-a716-446655440001',
   '550e8400-e29b-41d4-a716-446655440002',
   'Toyota', 'Corolla', 'ABC-1234', 2020, 'Blanco', 'SEDAN', 'Cliente de Prueba', '0988888888',
   'brd-toyota', 'mdl-corolla', 'flt-gasolina'),
  ('660e8400-e29b-41d4-a716-446655440002',
   '550e8400-e29b-41d4-a716-446655440002',
   'Chevrolet', 'Tracker', 'XYZ-5678', 2022, 'Negro', 'SUV', 'Cliente de Prueba', '0988888888',
   'brd-chevrolet', 'mdl-tracker', 'flt-gasolina')
ON CONFLICT (id) DO NOTHING;
`;

// ── Catalog ──────────────────────────────────────────────────────────────────

const CATALOG_BRANDS_SQL = `
INSERT INTO catalog.brands (id, name, is_active) VALUES
  ('brd-toyota',     'Toyota',      true),
  ('brd-chevrolet',  'Chevrolet',   true),
  ('brd-hyundai',    'Hyundai',     true),
  ('brd-kia',        'Kia',         true),
  ('brd-nissan',     'Nissan',      true),
  ('brd-ford',       'Ford',        true),
  ('brd-volkswagen', 'Volkswagen',  true),
  ('brd-mazda',      'Mazda',       true),
  ('brd-renault',    'Renault',     true),
  ('brd-suzuki',     'Suzuki',      true)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_MODELS_SQL = `
INSERT INTO catalog.models (id, brand_id, name, is_active) VALUES
  ('mdl-corolla',   'brd-toyota',     'Corolla',        true),
  ('mdl-hilux',     'brd-toyota',     'Hilux',          true),
  ('mdl-camry',     'brd-toyota',     'Camry',          true),
  ('mdl-rav4',      'brd-toyota',     'RAV4',           true),
  ('mdl-fortuner',  'brd-toyota',     'Fortuner',       true),
  ('mdl-tracker',   'brd-chevrolet',  'Tracker',        true),
  ('mdl-aveo',      'brd-chevrolet',  'Aveo',           true),
  ('mdl-dmax',      'brd-chevrolet',  'D-Max',          true),
  ('mdl-captiva',   'brd-chevrolet',  'Captiva',        true),
  ('mdl-tucson',    'brd-hyundai',    'Tucson',         true),
  ('mdl-elantra',   'brd-hyundai',    'Elantra',        true),
  ('mdl-accent',    'brd-hyundai',    'Accent',         true),
  ('mdl-rio',       'brd-kia',        'Rio',            true),
  ('mdl-sportage',  'brd-kia',        'Sportage',       true),
  ('mdl-picanto',   'brd-kia',        'Picanto',        true),
  ('mdl-sentra',    'brd-nissan',     'Sentra',         true),
  ('mdl-frontier',  'brd-nissan',     'Frontier',       true),
  ('mdl-kicks',     'brd-nissan',     'Kicks',          true),
  ('mdl-ecosport',  'brd-ford',       'EcoSport',       true),
  ('mdl-ranger',    'brd-ford',       'Ranger',         true),
  ('mdl-golf',      'brd-volkswagen', 'Golf',           true),
  ('mdl-jetta',     'brd-volkswagen', 'Jetta',          true),
  ('mdl-cx5',       'brd-mazda',      'CX-5',           true),
  ('mdl-3',         'brd-mazda',      'Mazda 3',        true),
  ('mdl-sandero',   'brd-renault',    'Sandero',        true),
  ('mdl-duster',    'brd-renault',    'Duster',         true),
  ('mdl-swift',     'brd-suzuki',     'Swift',          true),
  ('mdl-vitara',    'brd-suzuki',     'Vitara',         true)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_FUEL_TYPES_SQL = `
INSERT INTO catalog.fuel_types (id, name, is_active) VALUES
  ('flt-gasolina', 'Gasolina',   true),
  ('flt-diesel',   'Diésel',     true),
  ('flt-electrico','Eléctrico',  true),
  ('flt-hibrido',  'Híbrido',    true),
  ('flt-glp',      'GLP',        true)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_SERVICE_TYPES_SQL = `
INSERT INTO catalog.service_types (id, name, description, is_active) VALUES
  ('srt-oil',       'Cambio de Aceite',        'Cambio de aceite de motor y filtro',                   true),
  ('srt-brakes',    'Revisión de Frenos',       'Inspección y ajuste del sistema de frenos',            true),
  ('srt-alignment', 'Alineación y Balanceo',   'Alineación de dirección y balanceo de ruedas',         true),
  ('srt-diag',      'Diagnóstico General',      'Diagnóstico computarizado del vehículo',               true),
  ('srt-ac',        'Aire Acondicionado',       'Revisión, carga y reparación del sistema A/C',        true),
  ('srt-electric',  'Sistema Eléctrico',        'Revisión y reparación del sistema eléctrico',          true),
  ('srt-suspension','Suspensión y Dirección',   'Revisión de amortiguadores, rótulas y cauchos',        true),
  ('srt-maint',     'Mantenimiento Preventivo', 'Servicio de mantenimiento según kilometraje',          true)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_LABOR_RATES_SQL = `
INSERT INTO catalog.labor_rates (id, name, description, rate_per_hour, is_active) VALUES
  ('lbr-mechanic',   'Mecánico General',         'Mano de obra mecánica estándar',              25.00, true),
  ('lbr-electrician','Electricista Automotriz',   'Trabajo en sistema eléctrico y electrónico',  30.00, true),
  ('lbr-bodywork',   'Enderezado y Pintura',      'Trabajo de carrocería y pintura',             35.00, true),
  ('lbr-ac',         'Técnico A/C',              'Servicio de aire acondicionado',               28.00, true),
  ('lbr-alignment',  'Alineación y Balanceo',    'Alineación computarizada',                    20.00, true),
  ('lbr-diagnostic', 'Diagnóstico',              'Diagnóstico computarizado por escáner',        15.00, true)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_PART_CATEGORIES_SQL = `
INSERT INTO catalog.spare_part_categories (id, name, is_active) VALUES
  ('spc-oils',      'Aceites y Lubricantes', true),
  ('spc-filters',   'Filtros',               true),
  ('spc-brakes',    'Sistema de Frenos',     true),
  ('spc-tires',     'Llantas y Neumáticos',  true),
  ('spc-electric',  'Sistema Eléctrico',     true),
  ('spc-engine',    'Motor y Distribución',  true),
  ('spc-suspension','Suspensión',            true),
  ('spc-ac',        'Aire Acondicionado',    true)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_SPARE_PARTS_SQL = `
INSERT INTO catalog.spare_parts (id, category_id, name, part_number, unit_price, stock_quantity, is_active) VALUES
  ('spp-oil-10w30',  'spc-oils',    'Aceite Motor 10W-30 (1L)',          'OIL-10W30-1L',  8.50,  50, true),
  ('spp-oil-5w30',   'spc-oils',    'Aceite Motor 5W-30 (1L)',           'OIL-5W30-1L',   9.00,  40, true),
  ('spp-oil-filter', 'spc-filters', 'Filtro de Aceite Universal',        'FLT-ACE-001',   5.00,  30, true),
  ('spp-air-filter', 'spc-filters', 'Filtro de Aire Universal',          'FLT-AIR-001',  12.00,  20, true),
  ('spp-fuel-filter','spc-filters', 'Filtro de Combustible',             'FLT-FUEL-001',  8.00,  15, true),
  ('spp-brake-pad-f','spc-brakes',  'Pastillas de Freno Delanteras (par)','BRK-PAD-DEL', 35.00,  12, true),
  ('spp-brake-pad-r','spc-brakes',  'Pastillas de Freno Traseras (par)', 'BRK-PAD-TRS',  30.00,  10, true),
  ('spp-brake-disc', 'spc-brakes',  'Disco de Freno (unidad)',           'BRK-DSC-001',  45.00,   8, true),
  ('spp-spark-plug', 'spc-electric','Bujía de Encendido (unidad)',       'ELC-BUJA-001',  4.50,  40, true),
  ('spp-battery',    'spc-electric','Batería 12V 60Ah',                  'ELC-BAT-60AH',120.00,   5, true),
  ('spp-coolant',    'spc-engine',  'Refrigerante Motor 1L',             'ENG-COOL-1L',   6.00,  25, true),
  ('spp-timing-belt','spc-engine',  'Correa de Distribución',            'ENG-CREA-001',  55.00,  6, true)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_SERVICE_TEMPLATES_SQL = `
INSERT INTO catalog.service_labor_templates (id, service_type_id, description, default_hours, sort_order) VALUES
  ('slt-oil-1',  'srt-oil',    'Drenaje y cambio de aceite',         0.5,  0),
  ('slt-oil-2',  'srt-oil',    'Cambio de filtro de aceite',         0.25, 1),
  ('slt-brk-1',  'srt-brakes', 'Inspección sistema de frenos',       0.5,  0),
  ('slt-brk-2',  'srt-brakes', 'Ajuste y limpieza de frenos',        0.5,  1),
  ('slt-aln-1',  'srt-alignment','Alineación computarizada',          0.5,  0),
  ('slt-aln-2',  'srt-alignment','Balanceo de ruedas (4 ruedas)',     0.5,  1),
  ('slt-mnt-1',  'srt-maint',  'Cambio de aceite y filtro',          0.5,  0),
  ('slt-mnt-2',  'srt-maint',  'Revisión y ajuste de frenos',        0.5,  1),
  ('slt-mnt-3',  'srt-maint',  'Revisión de suspensión y dirección', 0.5,  2),
  ('slt-mnt-4',  'srt-maint',  'Inspección eléctrica general',       0.5,  3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog.service_part_templates (id, service_type_id, spare_part_id, description, default_quantity, sort_order) VALUES
  ('spt-oil-1',  'srt-oil',   'spp-oil-10w30', 'Aceite Motor 10W-30 (1L)', 4, 0),
  ('spt-oil-2',  'srt-oil',   'spp-oil-filter','Filtro de Aceite',         1, 1),
  ('spt-mnt-1',  'srt-maint', 'spp-oil-5w30',  'Aceite Motor 5W-30 (1L)', 4, 0),
  ('spt-mnt-2',  'srt-maint', 'spp-oil-filter','Filtro de Aceite',         1, 1),
  ('spt-mnt-3',  'srt-maint', 'spp-air-filter','Filtro de Aire',           1, 2)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_TAX_RATES_SQL = `
INSERT INTO catalog.tax_rates (id, name, percentage, is_active, is_default) VALUES
  ('txr-iva12', 'IVA 12%', 12.00, true, true),
  ('txr-iva0',  'IVA 0%',   0.00, true, false)
ON CONFLICT (id) DO NOTHING;
`;

const CATALOG_SPECIALTIES_SQL = `
INSERT INTO catalog.employee_specialties (id, name, description, is_active) VALUES
  ('esp-mechanic',   'Mecánica General',        'Reparación y mantenimiento mecánico',     true),
  ('esp-electric',   'Electricidad Automotriz', 'Diagnóstico y reparación eléctrica',      true),
  ('esp-bodywork',   'Enderezado y Pintura',    'Carrocería y pintura automotriz',         true),
  ('esp-ac',         'Aire Acondicionado',      'Servicio y reparación de A/C',            true),
  ('esp-alignment',  'Alineación y Balanceo',   'Alineación computarizada y balanceo',     true)
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
  { label: 'auth.users',                      sql: USERS_SQL },
  // catalog must come before vehicles (vehicles FK → catalog.brands/models)
  { label: 'catalog.brands',                  sql: CATALOG_BRANDS_SQL },
  { label: 'catalog.models',                  sql: CATALOG_MODELS_SQL },
  { label: 'catalog.fuel_types',              sql: CATALOG_FUEL_TYPES_SQL },
  { label: 'catalog.service_types',           sql: CATALOG_SERVICE_TYPES_SQL },
  { label: 'catalog.labor_rates',             sql: CATALOG_LABOR_RATES_SQL },
  { label: 'catalog.spare_part_categories',   sql: CATALOG_PART_CATEGORIES_SQL },
  { label: 'catalog.spare_parts',             sql: CATALOG_SPARE_PARTS_SQL },
  { label: 'catalog.service_templates',       sql: CATALOG_SERVICE_TEMPLATES_SQL },
  { label: 'catalog.tax_rates',               sql: CATALOG_TAX_RATES_SQL },
  { label: 'catalog.employee_specialties',    sql: CATALOG_SPECIALTIES_SQL },
  { label: 'vehicles.vehicles',               sql: VEHICLES_SQL },
  { label: 'reservations.services',           sql: SERVICES_SQL },
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
    console.log('[seed]   empleado@test.com   / employee123 (EMPLOYEE)');
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
