'use strict';

/**
 * index.js — Punto de entrada del backend monolítico.
 *
 * Responsabilidades de este archivo:
 *   1. Validar variables de entorno (fail fast).
 *   2. Crear el servidor HTTP + Socket.IO.
 *   3. Aplicar middleware global.
 *   4. Montar las rutas de cada módulo de dominio.
 *   5. Registrar el handler de Socket.IO.
 *   6. Iniciar el servidor con graceful shutdown.
 *
 * REGLA: este archivo solo orquesta — no contiene lógica de negocio.
 */

// Paso 1: validar entorno ANTES de cualquier otro import
const config = require('./config/env');

const http = require('node:http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { Server } = require('socket.io');

// Config & shared
const db = require('./config/database');
const logger = require('./middleware/logger');
const { rateLimiter } = require('./middleware/rate-limiter');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

// Swagger UI (debe importarse antes de los routers que anotan los endpoints)
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// ── Módulos de dominio (se agregan fase a fase) ──────────────────
// Fase 1: auth
const authRoutes   = require('./modules/auth/auth.routes');
const userRoutes   = require('./modules/auth/user.routes');
const washerRoutes = require('./modules/auth/washer.routes');

// Fase 2: vehicles
const vehicleRoutes = require('./modules/vehicles/vehicle.routes');

// Fase 3: reservations
const reservationRoutes = require('./modules/reservations/reservation.routes');
const serviceRoutes     = require('./modules/reservations/service.routes');
const ratingRoutes      = require('./modules/reservations/rating.routes');
const jobRoutes         = require('./modules/reservations/job.routes');

// Fase 4: payments
const paymentRoutes = require('./modules/payments/payment.routes');
const webhookRoutes = require('./modules/payments/webhook.routes');

// Fase 5: notifications + Socket.IO
const notificationRoutes = require('./modules/notifications/notification.routes');
const chatRoutes         = require('./modules/notifications/chat.routes');
const socketHandler      = require('./modules/notifications/socket.handler');

// ================================================================
// Configuración de la aplicación
// ================================================================

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.server.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

// ── Middleware global ────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: config.server.frontendUrl, credentials: true }));
app.use(compression());
app.use(logger);

// Stripe webhook necesita cuerpo RAW — debe montarse ANTES de express.json()
// Si se montara después, el cuerpo ya estaría parseado y la firma fallaría.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Inyectar dependencias compartidas en cada request
// Evita imports circulares al pasar db/io como contexto del request
app.use((req, _res, next) => {
  req.db = db;
  req.io = io;
  next();
});

// ── Documentación Swagger ──────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Lava Auto API',
}));
// Spec JSON (útil para herramientas externas como Postman)
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// ── Rutas de dominio ─────────────────────────────────────────────
// Los prefijos replican exactamente los endpoints de los microservicios
// para que el frontend no requiera cambios.

// Fase 1
app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/washers', washerRoutes);

// Fase 2
app.use('/api/vehicles', vehicleRoutes);

// Fase 3
app.use('/api/reservations', reservationRoutes);
app.use('/api/services',     serviceRoutes);
app.use('/api/ratings',      ratingRoutes);
app.use('/api/jobs',         jobRoutes);

// Fase 4
app.use('/api/payments', paymentRoutes);

// Fase 5
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat',          chatRoutes);
socketHandler(io, db);

// ── Health check ─────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const dbOk = await db.isHealthy();
  const status = dbOk ? 'healthy' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    service: 'lava-auto-backend',
    timestamp: new Date().toISOString(),
    checks: { database: dbOk ? 'ok' : 'error' },
  });
});

// ── Manejo de errores (siempre al final) ─────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ================================================================
// Inicio del servidor con graceful shutdown
// ================================================================

server.listen(config.server.port, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en http://localhost:${config.server.port}`);
  console.log(`   Entorno  : ${config.nodeEnv}`);
  console.log(`   Frontend : ${config.server.frontendUrl}`);
  console.log(`   DB       : ${config.db.host}:${config.db.port}/${config.db.name}`);
  console.log(`   Swagger  : http://localhost:${config.server.port}/api-docs`);
});

/**
 * Graceful shutdown: cierra conexiones abiertas antes de terminar.
 * Evita cortar requests en curso y conexiones de DB abruptamente.
 */
function shutdown(signal) {
  console.log(`\n[server] Señal ${signal} recibida. Cerrando servidor...`);
  server.close(async () => {
    console.log('[server] Servidor HTTP cerrado.');
    await db.close();
    console.log('[server] Pool de BD cerrado. Proceso terminado.');
    process.exit(0);
  });

  // Forzar cierre si tarda más de 10 segundos
  setTimeout(() => {
    console.error('[server] Cierre forzado por timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Capturar errores no manejados para evitar crashes silenciosos
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException:', err);
  process.exit(1);
});

module.exports = { app, server, io }; // Exportar para tests futuros
