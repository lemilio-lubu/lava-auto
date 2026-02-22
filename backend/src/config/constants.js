'use strict';

/**
 * constants.js — Valores inmutables compartidos por todo el backend.
 *
 * Centralizar aquí evita "magic strings" dispersos en el código.
 * Si cambia un valor, se corrige en un solo lugar.
 *
 * Object.freeze() garantiza que nadie modifique los objetos en runtime.
 */

/** Roles de usuario del sistema */
const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  WASHER: 'WASHER',
});

/** Estados posibles de una reserva */
const RESERVATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

/** Tipos de vehículo */
const VEHICLE_TYPES = Object.freeze({
  SEDAN: 'SEDAN',
  SUV: 'SUV',
  HATCHBACK: 'HATCHBACK',
  PICKUP: 'PICKUP',
  VAN: 'VAN',
  MOTORCYCLE: 'MOTORCYCLE',
});

/** Métodos de pago aceptados */
const PAYMENT_METHODS = Object.freeze({
  CASH: 'CASH',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
  OTHER: 'OTHER',
});

/** Estados de un pago */
const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

/** Tipos de notificación */
const NOTIFICATION_TYPES = Object.freeze({
  INFO: 'INFO',
  WASHER_ASSIGNED: 'WASHER_ASSIGNED',
  WASHER_ON_WAY: 'WASHER_ON_WAY',
  SERVICE_STARTED: 'SERVICE_STARTED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  PAYMENT_REMINDER: 'PAYMENT_REMINDER',
  PROMOTION: 'PROMOTION',
});

/**
 * Nombres de schemas PostgreSQL.
 * Centralizar aquí evita typos en los nombres de tablas de los repositories.
 */
const DB_SCHEMAS = Object.freeze({
  AUTH: 'auth',
  VEHICLES: 'vehicles',
  RESERVATIONS: 'reservations',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
});

/** Nombres de tablas cualificados (schema.tabla) */
const DB_TABLES = Object.freeze({
  USERS: `${DB_SCHEMAS.AUTH}.users`,
  VEHICLES: `${DB_SCHEMAS.VEHICLES}.vehicles`,
  SERVICES: `${DB_SCHEMAS.RESERVATIONS}.services`,
  TIME_SLOTS: `${DB_SCHEMAS.RESERVATIONS}.time_slots`,
  RESERVATIONS: `${DB_SCHEMAS.RESERVATIONS}.reservations`,
  SERVICE_PROOFS: `${DB_SCHEMAS.RESERVATIONS}.service_proofs`,
  RATINGS: `${DB_SCHEMAS.RESERVATIONS}.ratings`,
  PAYMENTS: `${DB_SCHEMAS.PAYMENTS}.payments`,
  NOTIFICATIONS: `${DB_SCHEMAS.NOTIFICATIONS}.notifications`,
  MESSAGES: `${DB_SCHEMAS.NOTIFICATIONS}.messages`,
});

/** Eventos de Socket.IO */
const SOCKET_EVENTS = Object.freeze({
  // Conexión
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  // Chat
  JOIN_CHAT: 'join-chat',
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  // Notificaciones
  NOTIFICATION: 'notification',
  // Tracking
  LOCATION_UPDATE: 'location-update',
  WASHER_LOCATION: 'washer-location',
});

/** Límites de paginación */
const PAGINATION = Object.freeze({
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

module.exports = {
  USER_ROLES,
  RESERVATION_STATUS,
  VEHICLE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  DB_SCHEMAS,
  DB_TABLES,
  SOCKET_EVENTS,
  PAGINATION,
};
