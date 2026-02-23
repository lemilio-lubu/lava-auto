'use strict';

/**
 * env.js — Validación de variables de entorno al arranque.
 * Versión optimizada para Railway (manejo de comillas automáticas).
 */

require('dotenv').config();

// Función auxiliar para limpiar comillas accidentales de Railway/Sistemas
const cleanValue = (val) => {
  if (!val) return val;
  return val.replace(/^["']|["']$/g, '');
};

const REQUIRED_VARS = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

// Validamos verificando que después de limpiar no sea una cadena vacía
const missing = REQUIRED_VARS.filter((key) => {
  const val = cleanValue(process.env[key]);
  return !val || val.trim() === '';
});

if (missing.length > 0) {
  console.error(
    `[env] ❌ Error: Faltan variables requeridas: ${missing.join(', ')}\n` +
    `[env] Verifica la pestaña de Variables en Railway.`
  );
  // Solo salimos si NO estamos en producción para permitir debuggear en la nube
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

/**
 * Configuración centralizada tipada.
 * Limpiamos los valores al asignarlos al objeto config.
 */
const config = {
  nodeEnv: cleanValue(process.env.NODE_ENV) || 'development',
  isProduction: cleanValue(process.env.NODE_ENV) === 'production',

  server: {
    port: parseInt(cleanValue(process.env.PORT) || '4000', 10),
    frontendUrl: cleanValue(process.env.FRONTEND_URL) || 'http://localhost:3000',
  },

  db: {
    host: cleanValue(process.env.DB_HOST),
    port: parseInt(cleanValue(process.env.DB_PORT) || '5432', 10),
    name: cleanValue(process.env.DB_NAME),
    user: cleanValue(process.env.DB_USER),
    password: cleanValue(process.env.DB_PASSWORD),
    poolMax: parseInt(cleanValue(process.env.DB_POOL_MAX) || '15', 10),
    idleTimeoutMs: parseInt(cleanValue(process.env.DB_IDLE_TIMEOUT_MS) || '30000', 10),
    connectTimeoutMs: parseInt(cleanValue(process.env.DB_CONNECT_TIMEOUT_MS) || '3000', 10),
  },

  jwt: {
    secret: cleanValue(process.env.JWT_SECRET),
    expiresIn: cleanValue(process.env.JWT_EXPIRES_IN) || '24h',
  },

  rateLimit: {
    windowMs: parseInt(cleanValue(process.env.RATE_LIMIT_WINDOW_MS) || '60000', 10),
    max: parseInt(cleanValue(process.env.RATE_LIMIT_MAX_REQUESTS) || '200', 10),
  },

  stripe: {
    secretKey: cleanValue(process.env.STRIPE_SECRET_KEY) || '',
  },
};

module.exports = config;