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
  EMPLOYEE: 'EMPLOYEE',
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
  CATALOG: 'catalog',
  WORK_ORDERS: 'work_orders',
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
  CATALOG_BRANDS: `${DB_SCHEMAS.CATALOG}.brands`,
  CATALOG_MODELS: `${DB_SCHEMAS.CATALOG}.models`,
  CATALOG_FUEL_TYPES: `${DB_SCHEMAS.CATALOG}.fuel_types`,
  CATALOG_SPARE_PART_CATEGORIES: `${DB_SCHEMAS.CATALOG}.spare_part_categories`,
  CATALOG_SPARE_PARTS: `${DB_SCHEMAS.CATALOG}.spare_parts`,
  CATALOG_SERVICE_TYPES: `${DB_SCHEMAS.CATALOG}.service_types`,
  CATALOG_LABOR_RATES: `${DB_SCHEMAS.CATALOG}.labor_rates`,
  CATALOG_EMPLOYEE_SPECIALTIES: `${DB_SCHEMAS.CATALOG}.employee_specialties`,
  CATALOG_EMPLOYEE_SPECIALTY_ASSIGNMENTS: `${DB_SCHEMAS.CATALOG}.employee_specialty_assignments`,
  CATALOG_TAX_RATES: `${DB_SCHEMAS.CATALOG}.tax_rates`,
  CATALOG_ORDER_NUMBER_CONFIG:        `${DB_SCHEMAS.CATALOG}.order_number_config`,
  CATALOG_SERVICE_LABOR_TEMPLATES:   `${DB_SCHEMAS.CATALOG}.service_labor_templates`,
  CATALOG_SERVICE_PART_TEMPLATES:    `${DB_SCHEMAS.CATALOG}.service_part_templates`,
  WORK_ORDER_SERVICES:               `${DB_SCHEMAS.WORK_ORDERS}.work_order_services`,
  WORK_ORDERS:               `${DB_SCHEMAS.WORK_ORDERS}.work_orders`,
  WORK_ORDER_LABOR:          `${DB_SCHEMAS.WORK_ORDERS}.work_order_labor`,
  WORK_ORDER_PARTS:          `${DB_SCHEMAS.WORK_ORDERS}.work_order_parts`,
  WORK_ORDER_PHOTOS:         `${DB_SCHEMAS.WORK_ORDERS}.work_order_photos`,
  WORK_ORDER_STATUS_HISTORY: `${DB_SCHEMAS.WORK_ORDERS}.work_order_status_history`,
  WORK_ORDER_INVOICES:       `${DB_SCHEMAS.WORK_ORDERS}.invoices`,
});

/** Estados posibles de una orden de trabajo */
const WORK_ORDER_STATUS = Object.freeze({
  DRAFT:            'DRAFT',
  OPEN:             'OPEN',
  DIAGNOSING:       'DIAGNOSING',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  IN_REPAIR:        'IN_REPAIR',
  COMPLETED:        'COMPLETED',
  INVOICED:         'INVOICED',
  DELIVERED:        'DELIVERED',
  CANCELLED:        'CANCELLED',
});

/** Prioridades de una orden de trabajo */
const WORK_ORDER_PRIORITY = Object.freeze({
  LOW:    'LOW',
  NORMAL: 'NORMAL',
  HIGH:   'HIGH',
  URGENT: 'URGENT',
});

/** Tipos de foto de evidencia */
const PHOTO_TYPE = Object.freeze({
  BEFORE: 'BEFORE',
  DURING: 'DURING',
  AFTER:  'AFTER',
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
  EMPLOYEE_LOCATION: 'employee-location',
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
  WORK_ORDER_STATUS,
  WORK_ORDER_PRIORITY,
  PHOTO_TYPE,
  DB_SCHEMAS,
  DB_TABLES,
  SOCKET_EVENTS,
  PAGINATION,
};
