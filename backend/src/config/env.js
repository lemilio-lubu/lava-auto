'use strict';

/**
 * env.js — Validación de variables de entorno al arranque.
 *
 * Patrón "fail fast": si falta una variable requerida el proceso
 * termina con un mensaje claro antes de que cualquier otra parte
 * del sistema intente inicializarse.
 *
 * USO: require('./config/env') debe ser la PRIMERA línea de
 *      src/index.js, antes de cualquier otro require.
 */

require('dotenv').config();

const REQUIRED_VARS = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[env] Faltan variables de entorno requeridas: ${missing.join(', ')}\n` +
    `[env] Copia .env.example a .env y completa los valores.`
  );
  process.exit(1);
}

// Advertencia (no fatal) si se usa el secreto por defecto en producción
if (
  process.env.NODE_ENV === 'production' &&
  process.env.JWT_SECRET === 'change-this-to-a-random-256-bit-secret-in-production'
) {
  console.warn('[env] ADVERTENCIA: JWT_SECRET es el valor por defecto. Cámbialo en producción.');
}

/**
 * Configuración centralizada tipada.
 * El resto del código importa de aquí, nunca de process.env directamente.
 */
const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  server: {
    port: parseInt(process.env.PORT || '4000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolMax: parseInt(process.env.DB_POOL_MAX || '15', 10),
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    connectTimeoutMs: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '3000', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },
};

module.exports = config;
