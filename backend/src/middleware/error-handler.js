'use strict';

/**
 * error-handler.js — Manejadores globales de errores Express.
 *
 * ORDEN DE USO en src/index.js (debe ir AL FINAL, después de todas las rutas):
 *   app.use(notFoundHandler);
 *   app.use(errorHandler);
 *
 * errorHandler recibe 4 parámetros (err, req, res, next) — Express
 * lo identifica como error handler precisamente por eso.
 */

const config = require('../config/env');

// ------------------------------------------------------------------
// Clase de error enriquecida (opcional, para lanzar errores con status)
// ------------------------------------------------------------------

/**
 * Error con código HTTP asociado.
 * @example throw new AppError('Recurso no encontrado', 404);
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=500]
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ------------------------------------------------------------------
// Manejadores de middleware
// ------------------------------------------------------------------

/**
 * Responde con 404 para rutas no definidas.
 * @type {import('express').RequestHandler}
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

/**
 * Manejador central de errores.
 * Distingue errores de dominio (AppError), errores de PostgreSQL,
 * errores de JWT y errores genéricos.
 *
 * En producción NO se exponen detalles internos al cliente.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log siempre, independiente del tipo de error
  console.error(`[error] ${req.method} ${req.originalUrl} — ${err.message}`, {
    stack: err.stack,
    code: err.code,
  });

  // ── Errores de dominio con status explícito ──────────────────────
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // ── Errores de PostgreSQL (códigos SQLSTATE) ─────────────────────
  if (err.code) {
    const pgErrors = {
      '23505': { status: 409, message: 'Ya existe un registro con ese valor.' },
      '23503': { status: 400, message: 'El registro referenciado no existe.' },
      '23502': { status: 400, message: `Campo requerido faltante: ${err.column ?? 'desconocido'}.` },
      '22001': { status: 400, message: 'El valor excede el largo máximo permitido.' },
      '42P01': { status: 500, message: 'Error interno de base de datos.' }, // tabla no existe
    };

    const mapped = pgErrors[err.code];
    if (mapped) {
      return res.status(mapped.status).json({ error: mapped.message });
    }
  }

  // ── Errores de validación (ej: lanzados con err.name = 'ValidationError') ─
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // ── Error genérico ───────────────────────────────────────────────
  const status = err.status || err.statusCode || 500;
  const message = config.isProduction
    ? 'Error interno del servidor.'
    : err.message || 'Error interno del servidor.';

  return res.status(status).json({ error: message });
}

module.exports = { AppError, notFoundHandler, errorHandler };
