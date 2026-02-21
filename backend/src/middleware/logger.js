'use strict';

/**
 * logger.js — Configuración de Morgan para logging de requests HTTP.
 *
 * Formato:
 *   - development : 'dev'   → colorizado, conciso, ideal para terminal
 *   - production  : 'combined' → formato Apache combinado, completo para logs
 */

const morgan = require('morgan');
const config = require('../config/env');

const logger = morgan(config.isProduction ? 'combined' : 'dev');

module.exports = logger;
