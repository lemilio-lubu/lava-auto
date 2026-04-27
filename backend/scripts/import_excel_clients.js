'use strict';

/**
 * import_excel_clients.js
 *
 * Importa los prospectos del Excel CRM como usuarios CLIENT en la BD.
 * - Contraseña por defecto: los primeros 6 dígitos de la cédula.
 * - Emails duplicados: solo se importa el primero (ON CONFLICT DO NOTHING).
 * - Idempotente: puede ejecutarse varias veces sin crear duplicados.
 *
 * USO:
 *   node scripts/import_excel_clients.js
 *   node scripts/import_excel_clients.js --dry-run   (solo muestra, no inserta)
 */

require('dotenv').config();

const path   = require('node:path');
const bcrypt = require('bcryptjs');
const XLSX   = require('xlsx');

const db = require('../src/config/database');
const { generateId }  = require('../src/shared/id-generator');

// ── Config ────────────────────────────────────────────────────────
const EXCEL_PATH = path.resolve(
  __dirname,
  '../../OPORTUNIDADES SALE BY SERVICE_ 23 JUL 2025.xlsx'
);
const DRY_RUN    = process.argv.includes('--dry-run');
const HEADER_ROW = 2; // índice base-0 → fila 3 del Excel
const DATA_START = 3; // índice base-0 → fila 4

// ── Helpers ───────────────────────────────────────────────────────

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  // Asegura formato Ecuador: 10 dígitos iniciando con 0
  if (digits.length === 10 && digits.startsWith('0')) return digits;
  if (digits.length === 9) return '0' + digits;
  return digits.slice(0, 10) || null;
}

function normalizeName(raw) {
  if (!raw) return null;
  return String(raw).trim().replace(/\s+/g, ' ');
}

function normalizeProvince(raw) {
  if (!raw) return null;
  return String(raw).trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Leer Excel ────────────────────────────────────────────────────

function readProspects() {
  const wb      = XLSX.readFile(EXCEL_PATH);
  const ws      = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });

  const headers = rawRows[HEADER_ROW];

  return rawRows
    .slice(DATA_START)
    .map(row => {
      const obj = {};
      headers.forEach((h, j) => { if (h) obj[h] = row[j]; });
      return obj;
    })
    .filter(r => r['Nombres Prospecto'] && r['Email Prospecto'])
    .map(r => ({
      name:           normalizeName(r['Nombres Prospecto']),
      email:          String(r['Email Prospecto']).toLowerCase().trim(),
      identification: String(r['%identificacion']).replace(/\D/g, '') || null,
      phone:          normalizePhone(r['Celular']),
      city:           String(r['Ciudad Agencia']).trim() || null,
      province:       normalizeProvince(r['Provincia Agencia']),
      company:        String(r['Empresa Oportunidad']).trim() || null,
    }));
}

// ── Insertar en BD ────────────────────────────────────────────────

async function run() {
  const prospects = readProspects();
  console.log(`\n[import] Prospectos leídos del Excel: ${prospects.length}`);

  if (DRY_RUN) {
    console.log('\n[import] --dry-run activo. No se insertará nada.\n');
    prospects.forEach((p, i) =>
      console.log(`  ${i + 1}. ${p.name} | ${p.email} | ${p.identification} | ${p.city}, ${p.province}`)
    );
    return;
  }

  let inserted = 0;
  let skipped  = 0;
  const errors = [];

  try {
    for (const p of prospects) {
      try {
        const defaultPass = (p.identification ?? '000000').slice(0, 6);
        const hashed      = await bcrypt.hash(defaultPass, 10);
        const id          = generateId('user');

        const result = await db.query(
          `INSERT INTO auth.users
             (id, name, email, password, phone, role,
              identification, city, province, company)
           VALUES ($1,$2,$3,$4,$5,'CLIENT',$6,$7,$8,$9)
           ON CONFLICT (email) DO NOTHING`,
          [id, p.name, p.email, hashed, p.phone,
           p.identification, p.city, p.province, p.company]
        );

        if (result.rowCount > 0) {
          inserted++;
          console.log(`  ✅ ${p.name} (${p.email}) — pass: ${defaultPass}`);
        } else {
          skipped++;
          console.log(`  ⏭  Omitido (email ya existe): ${p.email}`);
        }
      } catch (err) {
        errors.push({ email: p.email, error: err.message });
        console.error(`  ❌ Error con ${p.email}: ${err.message}`);
      }
    }
  } finally {
    await db.close();
  }

  console.log(`
[import] ─────────────────────────────
  Insertados : ${inserted}
  Omitidos   : ${skipped}
  Errores    : ${errors.length}
[import] ─────────────────────────────
[import] ⚠ Contraseña por defecto = primeros 6 dígitos de la cédula.
[import] Recomienda que cada usuario cambie su contraseña al primer login.
`);
}

run().catch(err => {
  console.error('[import] Error fatal:', err.message);
  process.exit(1);
});
