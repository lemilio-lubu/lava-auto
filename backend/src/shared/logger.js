'use strict';

/**
 * logger.js — Logger de aplicación liviano (sin dependencias nuevas).
 *
 * Envuelve `console` con niveles y formato consistente. En producción se
 * silencian `debug`; `info`/`warn`/`error` siempre se emiten. Morgan sigue
 * encargándose del logging HTTP por request.
 *
 * Uso:
 *   const logger = require('../shared/logger');
 *   logger.info('Servidor iniciado', { port });
 *   logger.error('Fallo al procesar pago', err);
 */

const config = require('../config/env');

function format(level, args) {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${level}]`, ...args];
}

const logger = {
  debug(...args) {
    if (!config.isProduction) console.debug(...format('debug', args));
  },
  info(...args) {
    console.info(...format('info', args));
  },
  warn(...args) {
    console.warn(...format('warn', args));
  },
  error(...args) {
    console.error(...format('error', args));
  },
};

module.exports = logger;
