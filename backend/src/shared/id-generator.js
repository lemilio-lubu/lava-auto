'use strict';

/**
 * id-generator.js — Generación de IDs únicos.
 *
 * Usa crypto.randomBytes de Node.js (sin dependencias externas).
 * Los IDs generados son:
 *  - Suficientemente únicos para la carga esperada del sistema.
 *  - URL-safe (sin caracteres especiales).
 *  - Lexicográficamente ordenables por tiempo de creación
 *    (el timestamp va primero).
 */

const crypto = require('crypto');
const os = require('os');

// Fingerprint estático para evitar colisiones entre instancias del proceso
const _fingerprint = (() => {
  const pid = process.pid.toString(36).slice(-2).padStart(2, '0');
  const host = os.hostname()
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    .toString(36)
    .slice(-2)
    .padStart(2, '0');
  return pid + host;
})();

/**
 * Genera un ID prefijado único (ej: 'usr_lp4k8a3...').
 * Formato: `<prefix>_<timestamp_base36><random_hex>`
 *
 * @param {string} [prefix=''] - Prefijo semántico (ej: 'usr', 'res', 'pay')
 * @returns {string}
 */
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Genera un ID estilo CUID (compatible con formatos existentes en la BD).
 * Formato: `c<timestamp><counter><fingerprint><random>`
 *
 * @returns {string}
 */
function generateCuid() {
  const timestamp = Date.now().toString(36);
  const counter = Math.floor(Math.random() * 1_679_616)
    .toString(36)
    .padStart(4, '0');
  const random = crypto.randomBytes(4).toString('hex');
  return `c${timestamp}${counter}${_fingerprint}${random}`;
}

module.exports = { generateId, generateCuid };
