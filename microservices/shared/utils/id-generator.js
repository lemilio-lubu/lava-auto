/**
 * ID Generator Utility
 * Generates unique IDs similar to cuid
 */

const crypto = require('crypto');

function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${timestamp}${randomPart}` : `${timestamp}${randomPart}`;
}

function generateCuid() {
  const timestamp = Date.now().toString(36);
  const counter = Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
  const fingerprint = process.pid.toString(36).slice(-2) + 
                      require('os').hostname().split('').reduce((a, c) => a + c.charCodeAt(0), 0).toString(36).slice(-2);
  const random = crypto.randomBytes(4).toString('hex');
  
  return `c${timestamp}${counter}${fingerprint}${random}`;
}

module.exports = { generateId, generateCuid };
