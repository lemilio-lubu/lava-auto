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

// Precios autocalculados:
//   Mano de obra: tarifa×horas  |  Repuestos: precio×cantidad
//   svc-sedan-oil:    lbr-mechanic 0.5h($12.50) + 4L 10W-30($34.00) + filtro($5.00)      = $51.50
//   svc-sedan-brakes: lbr-mechanic 1.0h($25.00) + pastillas del.($35.00)                  = $60.00
//   svc-sedan-diag:   lbr-diagnostic 1.0h($15.00)                                         = $15.00
//   svc-sedan-align:  lbr-alignment  1.0h($20.00)                                         = $20.00
//   svc-sedan-maint:  lbr-mechanic 1.5h($37.50) + 4L 5W-30($36.00) + 2 filtros($17.00)  = $90.50
//   svc-sedan-ac:     lbr-ac 1.0h($28.00)                                                 = $28.00
//   svc-sedan-elec:   lbr-electrician 1.0h($30.00) + 4 bujías($18.00)                    = $48.00
//   svc-suv-oil:      lbr-mechanic 0.5h($12.50) + 6L 10W-30($51.00) + filtro($5.00)      = $68.50
//   svc-suv-brakes:   lbr-mechanic 1.5h($37.50) + past.del($35)+past.tr($30)             = $102.50
//   svc-suv-maint:    lbr-mechanic 2.0h($50.00) + 6L 5W-30($54.00) + 2 filtros($17.00)  = $121.00
//   svc-suv-align:    lbr-alignment  1.0h($20.00)                                         = $20.00
//   svc-pickup-oil:   igual que svc-suv-oil                                               = $68.50
//   svc-pickup-maint: igual que svc-suv-maint                                             = $121.00
//   svc-van-oil:      igual que svc-suv-oil                                               = $68.50
//   svc-moto-oil:     lbr-mechanic 0.25h($6.25) + 1L 10W-30($8.50) + filtro($5.00)       = $19.75
//   svc-moto-brakes:  lbr-mechanic 0.5h($12.50)                                           = $12.50
const SERVICES_SQL = `
INSERT INTO reservations.services
  (id, name, description, duration, price, vehicle_type, is_active)
VALUES
  ('svc-sedan-oil',    'Cambio de Aceite Sedán',           'Cambio de aceite 10W-30 y filtro de aceite',                    45,  51.50, 'SEDAN',      true),
  ('svc-sedan-brakes', 'Revisión de Frenos Sedán',         'Inspección y cambio de pastillas delanteras',                   60,  60.00, 'SEDAN',      true),
  ('svc-sedan-diag',   'Diagnóstico General Sedán',        'Diagnóstico computarizado del vehículo con escáner',             30,  15.00, 'SEDAN',      true),
  ('svc-sedan-align',  'Alineación y Balanceo Sedán',      'Alineación computarizada y balanceo de 4 ruedas',               45,  20.00, 'SEDAN',      true),
  ('svc-sedan-maint',  'Mantenimiento Preventivo Sedán',   'Cambio de aceite 5W-30, filtro de aceite y filtro de aire',     90,  90.50, 'SEDAN',      true),
  ('svc-sedan-ac',     'Revisión A/C Sedán',               'Revisión y carga del sistema de aire acondicionado',            60,  28.00, 'SEDAN',      true),
  ('svc-sedan-elec',   'Sistema Eléctrico Sedán',          'Revisión eléctrica y cambio de bujías',                         60,  48.00, 'SEDAN',      true),
  ('svc-suv-oil',      'Cambio de Aceite SUV',             'Cambio de aceite 10W-30 y filtro (motor grande)',               45,  68.50, 'SUV',        true),
  ('svc-suv-brakes',   'Revisión de Frenos SUV',           'Inspección y cambio de pastillas delanteras y traseras',        75, 102.50, 'SUV',        true),
  ('svc-suv-maint',    'Mantenimiento Preventivo SUV',     'Cambio de aceite 5W-30, filtro de aceite y filtro de aire',    120, 121.00, 'SUV',        true),
  ('svc-suv-align',    'Alineación y Balanceo SUV',        'Alineación computarizada y balanceo de 4 ruedas',               45,  20.00, 'SUV',        true),
  ('svc-pickup-oil',   'Cambio de Aceite Pickup',          'Cambio de aceite 10W-30 y filtro (motor diésel/gasolina)',      45,  68.50, 'PICKUP',     true),
  ('svc-pickup-maint', 'Mantenimiento Preventivo Pickup',  'Cambio de aceite 5W-30, filtro de aceite y filtro de aire',    120, 121.00, 'PICKUP',     true),
  ('svc-van-oil',      'Cambio de Aceite Van',             'Cambio de aceite 10W-30 y filtro de aceite',                    45,  68.50, 'VAN',        true),
  ('svc-moto-oil',     'Cambio de Aceite Moto',            'Cambio de aceite de motor 1L y filtro',                         20,  19.75, 'MOTORCYCLE', true),
  ('svc-moto-brakes',  'Revisión de Frenos Moto',          'Inspección y ajuste del sistema de frenos',                     30,  12.50, 'MOTORCYCLE', true)
ON CONFLICT (id) DO NOTHING;
`;

const SERVICE_ITEMS_SQL = `
INSERT INTO reservations.service_labor_items (id, service_id, labor_rate_id, hours, sort_order) VALUES
  ('sli-sedan-oil-1',   'svc-sedan-oil',   'lbr-mechanic',    0.50, 0),
  ('sli-sedan-brk-1',   'svc-sedan-brakes','lbr-mechanic',    1.00, 0),
  ('sli-sedan-diag-1',  'svc-sedan-diag',  'lbr-diagnostic',  1.00, 0),
  ('sli-sedan-aln-1',   'svc-sedan-align', 'lbr-alignment',   1.00, 0),
  ('sli-sedan-mnt-1',   'svc-sedan-maint', 'lbr-mechanic',    1.50, 0),
  ('sli-sedan-ac-1',    'svc-sedan-ac',    'lbr-ac',          1.00, 0),
  ('sli-sedan-elc-1',   'svc-sedan-elec',  'lbr-electrician', 1.00, 0),
  ('sli-suv-oil-1',     'svc-suv-oil',     'lbr-mechanic',    0.50, 0),
  ('sli-suv-brk-1',     'svc-suv-brakes',  'lbr-mechanic',    1.50, 0),
  ('sli-suv-mnt-1',     'svc-suv-maint',   'lbr-mechanic',    2.00, 0),
  ('sli-suv-aln-1',     'svc-suv-align',   'lbr-alignment',   1.00, 0),
  ('sli-pck-oil-1',     'svc-pickup-oil',  'lbr-mechanic',    0.50, 0),
  ('sli-pck-mnt-1',     'svc-pickup-maint','lbr-mechanic',    2.00, 0),
  ('sli-van-oil-1',     'svc-van-oil',     'lbr-mechanic',    0.50, 0),
  ('sli-moto-oil-1',    'svc-moto-oil',    'lbr-mechanic',    0.25, 0),
  ('sli-moto-brk-1',    'svc-moto-brakes', 'lbr-mechanic',    0.50, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reservations.service_part_items (id, service_id, spare_part_id, quantity, sort_order) VALUES
  -- svc-sedan-oil: 4L aceite + filtro
  ('spi-sedan-oil-1',  'svc-sedan-oil',   'spp-oil-10w30',   4.0, 0),
  ('spi-sedan-oil-2',  'svc-sedan-oil',   'spp-oil-filter',  1.0, 1),
  -- svc-sedan-brakes: pastillas delanteras
  ('spi-sedan-brk-1',  'svc-sedan-brakes','spp-brake-pad-f', 1.0, 0),
  -- svc-sedan-elec: 4 bujías
  ('spi-sedan-elc-1',  'svc-sedan-elec',  'spp-spark-plug',  4.0, 0),
  -- svc-sedan-maint: 4L aceite + filtro aceite + filtro aire
  ('spi-sedan-mnt-1',  'svc-sedan-maint', 'spp-oil-5w30',    4.0, 0),
  ('spi-sedan-mnt-2',  'svc-sedan-maint', 'spp-oil-filter',  1.0, 1),
  ('spi-sedan-mnt-3',  'svc-sedan-maint', 'spp-air-filter',  1.0, 2),
  -- svc-suv-oil: 6L aceite + filtro
  ('spi-suv-oil-1',    'svc-suv-oil',     'spp-oil-10w30',   6.0, 0),
  ('spi-suv-oil-2',    'svc-suv-oil',     'spp-oil-filter',  1.0, 1),
  -- svc-suv-brakes: pastillas del. + traseras
  ('spi-suv-brk-1',    'svc-suv-brakes',  'spp-brake-pad-f', 1.0, 0),
  ('spi-suv-brk-2',    'svc-suv-brakes',  'spp-brake-pad-r', 1.0, 1),
  -- svc-suv-maint: 6L aceite + filtro aceite + filtro aire
  ('spi-suv-mnt-1',    'svc-suv-maint',   'spp-oil-5w30',    6.0, 0),
  ('spi-suv-mnt-2',    'svc-suv-maint',   'spp-oil-filter',  1.0, 1),
  ('spi-suv-mnt-3',    'svc-suv-maint',   'spp-air-filter',  1.0, 2),
  -- svc-pickup-oil: 6L aceite + filtro
  ('spi-pck-oil-1',    'svc-pickup-oil',  'spp-oil-10w30',   6.0, 0),
  ('spi-pck-oil-2',    'svc-pickup-oil',  'spp-oil-filter',  1.0, 1),
  -- svc-pickup-maint: 6L aceite + filtro aceite + filtro aire
  ('spi-pck-mnt-1',    'svc-pickup-maint','spp-oil-5w30',    6.0, 0),
  ('spi-pck-mnt-2',    'svc-pickup-maint','spp-oil-filter',  1.0, 1),
  ('spi-pck-mnt-3',    'svc-pickup-maint','spp-air-filter',  1.0, 2),
  -- svc-van-oil: 6L aceite + filtro
  ('spi-van-oil-1',    'svc-van-oil',     'spp-oil-10w30',   6.0, 0),
  ('spi-van-oil-2',    'svc-van-oil',     'spp-oil-filter',  1.0, 1),
  -- svc-moto-oil: 1L aceite + filtro
  ('spi-moto-oil-1',   'svc-moto-oil',    'spp-oil-10w30',   1.0, 0),
  ('spi-moto-oil-2',   'svc-moto-oil',    'spp-oil-filter',  1.0, 1)
ON CONFLICT (id) DO NOTHING;
`;

// ── Work order de demostración (encabezado + cuerpo completo) ─────────────────
//
// Orden COMPLETED lista para abrir, revisar el cuerpo (servicios, mano de obra,
// repuestos) y generar la factura PDF. Usa un número fuera del rango del contador
// autoincremental (OT-90001) para no colisionar con órdenes creadas desde la UI.
//
// Cuadre de costos:
//   Mano de obra: 12.50 + 6.25 + 12.50 = 31.25
//   Repuestos:    34.00 + 5.00 + 35.00 = 74.00
//   final_cost  = 105.25   |   services_amount = 0
//   descuento   = 5.25  → base imponible 100.00  → IVA 12% = 12.00
//   total       = 105.25 + 0 - 5.25 + 12.00 = 112.00
const WORK_ORDER_DEMO_SQL = `
INSERT INTO work_orders.work_orders
  (id, order_number, client_id, vehicle_id, technician_id, status, priority, mileage,
   problem_description, diagnosis, recommendations, internal_notes,
   estimated_cost, final_cost, services_amount, discount_amount, tax_amount, total_amount)
VALUES
  ('wo-demo-0001', 'OT-90001',
   '550e8400-e29b-41d4-a716-446655440002',
   '660e8400-e29b-41d4-a716-446655440001',
   '550e8400-e29b-41d4-a716-446655440003',
   'COMPLETED', 'NORMAL', 51000,
   'Cliente solicita cambio de aceite y revisión de frenos por ruido al frenar.',
   'Aceite degradado y pastillas delanteras al límite de desgaste.',
   'Próximo cambio de aceite a los 56.000 km. Revisar discos en próxima visita.',
   'Cliente prefiere repuestos originales.',
   105.25, 105.25, 0.00, 5.25, 12.00, 112.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_orders.work_order_services
  (id, work_order_id, service_type_id, name, description, base_price, sort_order)
VALUES
  ('wos-demo-oil',    'wo-demo-0001', 'srt-oil',    'Cambio de Aceite y Filtro', 'Mantenimiento de lubricación de motor', 0.00, 0),
  ('wos-demo-brakes', 'wo-demo-0001', 'srt-brakes', 'Revisión de Frenos',        'Inspección y cambio de pastillas',      0.00, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_orders.work_order_labor
  (id, work_order_id, work_order_service_id, technician_id, labor_rate_id, description, hours, rate_per_hour, subtotal)
VALUES
  ('wol-demo-1', 'wo-demo-0001', 'wos-demo-oil',    '550e8400-e29b-41d4-a716-446655440003', 'lbr-mechanic', 'Drenaje y cambio de aceite',     0.50, 25.00, 12.50),
  ('wol-demo-2', 'wo-demo-0001', 'wos-demo-oil',    '550e8400-e29b-41d4-a716-446655440003', 'lbr-mechanic', 'Cambio de filtro de aceite',     0.25, 25.00,  6.25),
  ('wol-demo-3', 'wo-demo-0001', 'wos-demo-brakes', '550e8400-e29b-41d4-a716-446655440003', 'lbr-mechanic', 'Inspección y ajuste de frenos',  0.50, 25.00, 12.50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_orders.work_order_parts
  (id, work_order_id, work_order_service_id, spare_part_id, description, quantity, unit_price, subtotal)
VALUES
  ('wop-demo-1', 'wo-demo-0001', 'wos-demo-oil',    'spp-oil-10w30',   'Aceite Motor 10W-30 (1L)',            4.000,  8.50, 34.00),
  ('wop-demo-2', 'wo-demo-0001', 'wos-demo-oil',    'spp-oil-filter',  'Filtro de Aceite Universal',          1.000,  5.00,  5.00),
  ('wop-demo-3', 'wo-demo-0001', 'wos-demo-brakes', 'spp-brake-pad-f', 'Pastillas de Freno Delanteras (par)', 1.000, 35.00, 35.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_orders.work_order_status_history
  (id, work_order_id, from_status, to_status, changed_by, notes, created_at)
VALUES
  ('woh-demo-1', 'wo-demo-0001', NULL,          'OPEN',       '550e8400-e29b-41d4-a716-446655440001', 'Orden creada',                     NOW() - INTERVAL '3 hours'),
  ('woh-demo-2', 'wo-demo-0001', 'OPEN',        'DIAGNOSING', '550e8400-e29b-41d4-a716-446655440001', 'Ingresa a diagnóstico',            NOW() - INTERVAL '2 hours'),
  ('woh-demo-3', 'wo-demo-0001', 'DIAGNOSING',  'IN_REPAIR',  '550e8400-e29b-41d4-a716-446655440001', 'Aprobado por cliente',             NOW() - INTERVAL '1 hour'),
  ('woh-demo-4', 'wo-demo-0001', 'IN_REPAIR',   'COMPLETED',  '550e8400-e29b-41d4-a716-446655440001', 'Trabajo finalizado',               NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_orders.work_order_photos
  (id, work_order_id, photo_url, photo_type, description)
VALUES
  ('wph-demo-1', 'wo-demo-0001', 'https://picsum.photos/seed/brakes/400/300', 'BEFORE', 'Pastillas desgastadas antes del cambio')
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
  { label: 'reservations.service_items',      sql: SERVICE_ITEMS_SQL },
  // work order de demostración: depende de users + vehicles + catálogo completo
  { label: 'work_orders.work_order (demo)',   sql: WORK_ORDER_DEMO_SQL },
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
