'use strict';

/**
 * rate-limiter.js — Configuración de rate limiting por IP.
 *
 * Exporta dos limitadores:
 *   - rateLimiter       → límite general para todas las rutas
 *   - authRateLimiter   → límite más estricto para /api/auth (login, register)
 *
 * Los valores se leen de la configuración centralizada (env.js).
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * Formatea el mensaje de error con el tiempo de espera restante.
 */
function buildMessage(windowMs) {
  const minutes = Math.ceil(windowMs / 60_000);
  return `Demasiadas solicitudes. Inténtalo de nuevo en ${minutes} minuto(s).`;
}

/**
 * Rate limiter general — aplica a todas las rutas.
 */
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,   // devuelve RateLimit-* headers (RFC 6585)
  legacyHeaders: false,     // desactiva X-RateLimit-* headers obsoletos
  message: { error: buildMessage(config.rateLimit.windowMs) },
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter estricto para endpoints de autenticación.
 * Previene ataques de fuerza bruta en login/register.
 * Ventana: 15 minutos, máximo 20 intentos por IP.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: buildMessage(15 * 60 * 1_000) },
});

module.exports = { rateLimiter, authRateLimiter };
