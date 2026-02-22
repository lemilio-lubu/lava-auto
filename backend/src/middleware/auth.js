'use strict';

/**
 * auth.js — Middleware de autenticación y autorización JWT.
 *
 * Exporta tres elementos:
 *   - generateToken(payload)   → crea un JWT firmado
 *   - authMiddleware           → valida el Bearer token en cada request
 *   - roleMiddleware(...roles) → restringe acceso por rol
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');

// ------------------------------------------------------------------
// Generación de tokens
// ------------------------------------------------------------------

/**
 * Genera un JWT firmado con el payload dado.
 * @param {Object} payload - Datos a incluir (id, email, role)
 * @param {string} [expiresIn] - Duración del token (default: configuración)
 * @returns {string} JWT firmado
 */
function generateToken(payload, expiresIn = config.jwt.expiresIn) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

// ------------------------------------------------------------------
// Middleware de autenticación
// ------------------------------------------------------------------

/**
 * Valida el Bearer token del header Authorization.
 * Si es válido, adjunta el payload decodificado a req.user.
 *
 * @type {import('express').RequestHandler}
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación no proporcionado.' });
  }

  const token = authHeader.slice(7); // remove "Bearer "

  try {
    req.user = jwt.verify(token, config.jwt.secret);
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'El token ha expirado.'
        : 'Token inválido.';
    return res.status(401).json({ error: message });
  }
}

// ------------------------------------------------------------------
// Middleware de autorización por rol
// ------------------------------------------------------------------

/**
 * Fábrica de middleware que restringe el acceso a los roles indicados.
 * Debe usarse DESPUÉS de authMiddleware en la cadena de la ruta.
 *
 * @param {...string} allowedRoles - Roles permitidos (USER_ROLES.ADMIN, etc.)
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.get('/admin/stats',
 *   authMiddleware,
 *   roleMiddleware(USER_ROLES.ADMIN),
 *   statsController
 * );
 */
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // authMiddleware no fue aplicado antes — error de configuración
      return res.status(401).json({ error: 'No autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes.' });
    }

    next();
  };
}

module.exports = { generateToken, authMiddleware, roleMiddleware };
