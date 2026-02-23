'use strict';

/**
 * env.js — Validación de variables de entorno al arranque.
 *
 * Soporta dos modos de configuración de BD (Railway compatible):
 *   1. DATABASE_URL  → connection string completo (plugin Postgres de Railway)
 *   2. DB_HOST / DB_NAME / DB_USER / DB_PASSWORD → variables individuales
 */

require('dotenv').config();

// Función auxiliar para limpiar comillas accidentales de Railway
const cleanValue = (val) => {
  if (!val) return val;
  return val.replace(/^["']|["']$/g, '').trim();
};

// ── 1. Parsear DATABASE_URL si está disponible ────────────────────────────────
// Railway Postgres plugin inyecta DATABASE_URL automáticamente.
// Formato: postgresql://user:password@host:5432/dbname
const rawDatabaseUrl =
  cleanValue(process.env.DATABASE_URL) ||
  cleanValue(process.env.POSTGRES_URL);

let parsedDb = {
  host:     cleanValue(process.env.DB_HOST),
  port:     cleanValue(process.env.DB_PORT) || '5432',
  name:     cleanValue(process.env.DB_NAME),
  user:     cleanValue(process.env.DB_USER),
  password: cleanValue(process.env.DB_PASSWORD),
  connectionString: null,
};

if (rawDatabaseUrl) {
  try {
    const url = new URL(rawDatabaseUrl);
    parsedDb = {
      host:             url.hostname,
      port:             url.port || '5432',
      name:             url.pathname.replace(/^\//, ''),
      user:             decodeURIComponent(url.username),
      password:         decodeURIComponent(url.password),
      connectionString: rawDatabaseUrl, // pg Pool lo usa directamente
    };
    console.log(`[env] DATABASE_URL detectada → host=${parsedDb.host} db=${parsedDb.name}`);
  } catch (e) {
    console.warn('[env] ⚠ No se pudo parsear DATABASE_URL:', e.message);
  }
}

// ── 2. Validación de variables requeridas (solo advertencias — nunca process.exit) ──
// En Railway el contenedor DEBE arrancar siempre para pasar el healthcheck.
// Si faltan vars, el servidor arranca igual pero las rutas protegidas fallarán
// en runtime con mensajes claros → revisa los deploy logs en Railway.
const hasDbConnection =
  parsedDb.connectionString ||
  (parsedDb.host && parsedDb.name && parsedDb.user && parsedDb.password);

const missingJwt = !cleanValue(process.env.JWT_SECRET);

if (!hasDbConnection) {
  console.warn(
    '[env] ⚠ Sin configuración de BD. Añade el plugin Postgres en Railway ' +
    'o configura DB_HOST / DB_NAME / DB_USER / DB_PASSWORD.'
  );
}
if (missingJwt) {
  console.warn('[env] ⚠ JWT_SECRET no está configurada. Añádela en Railway → Variables.');
}

// ── 3. Objeto de configuración centralizado ───────────────────────────────────
const config = {
  nodeEnv:      cleanValue(process.env.NODE_ENV) || 'development',
  isProduction: cleanValue(process.env.NODE_ENV) === 'production',

  server: {
    port:        parseInt(cleanValue(process.env.PORT) || '4000', 10),
    // Garantizar que FRONTEND_URL siempre tenga protocolo.
    // Railway a veces entrega la URL sin https:// dependiendo de cómo se escribió.
    frontendUrl: (() => {
      const raw = cleanValue(process.env.FRONTEND_URL) || 'http://localhost:3000';
      if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
      return `https://${raw}`;
    })(),
  },

  db: {
    host:             parsedDb.host,
    port:             parseInt(parsedDb.port, 10),
    name:             parsedDb.name,
    user:             parsedDb.user,
    password:         parsedDb.password,
    connectionString: parsedDb.connectionString, // null si se usan vars individuales
    poolMax:          parseInt(cleanValue(process.env.DB_POOL_MAX) || '15', 10),
    idleTimeoutMs:    parseInt(cleanValue(process.env.DB_IDLE_TIMEOUT_MS) || '30000', 10),
    connectTimeoutMs: parseInt(cleanValue(process.env.DB_CONNECT_TIMEOUT_MS) || '5000', 10),
  },

  jwt: {
    secret:    cleanValue(process.env.JWT_SECRET),
    expiresIn: cleanValue(process.env.JWT_EXPIRES_IN) || '24h',
  },

  rateLimit: {
    windowMs: parseInt(cleanValue(process.env.RATE_LIMIT_WINDOW_MS) || '60000', 10),
    max:      parseInt(cleanValue(process.env.RATE_LIMIT_MAX_REQUESTS) || '200', 10),
  },

  stripe: {
    secretKey: cleanValue(process.env.STRIPE_SECRET_KEY) || '',
  },
};

module.exports = config;