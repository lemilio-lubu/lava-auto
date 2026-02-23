'use strict';

/**
 * index.js — Punto de entrada del backend monolítico.
 */

// Log inmediato para confirmar que el proceso arrancó
console.log('[startup] Iniciando proceso Node.js...');
console.log(`[startup] NODE_ENV=${process.env.NODE_ENV} PORT=${process.env.PORT} CWD=${process.cwd()}`);

// Paso 1: validar entorno ANTES de cualquier otro import
let config;
try {
  config = require('./config/env');
  console.log('[startup] ✅ env.js cargado');
} catch (err) {
  console.error('[startup] ❌ Fallo al cargar env.js:', err.message);
  process.exit(1);
}

let http, express, helmet, cors, compression, Server;
let db, logger, rateLimiter, notFoundHandler, errorHandler;
let swaggerUi, swaggerSpec;
let authRoutes, userRoutes, washerRoutes;
let vehicleRoutes;
let reservationRoutes, serviceRoutes, ratingRoutes, jobRoutes;
let paymentRoutes, webhookRoutes;
let notificationRoutes, chatRoutes, socketHandler;

try {
  http        = require('node:http');
  express     = require('express');
  helmet      = require('helmet');
  cors        = require('cors');
  compression = require('compression');
  ({ Server } = require('socket.io'));
  console.log('[startup] ✅ Dependencias core cargadas');

  db               = require('./config/database');
  logger           = require('./middleware/logger');
  ({ rateLimiter } = require('./middleware/rate-limiter'));
  ({ notFoundHandler, errorHandler } = require('./middleware/error-handler'));
  console.log('[startup] ✅ Middleware cargado');

  swaggerUi   = require('swagger-ui-express');
  swaggerSpec = require('./config/swagger');
  console.log('[startup] ✅ Swagger cargado');

  authRoutes   = require('./modules/auth/auth.routes');
  userRoutes   = require('./modules/auth/user.routes');
  washerRoutes = require('./modules/auth/washer.routes');
  console.log('[startup] ✅ Módulo auth cargado');

  vehicleRoutes = require('./modules/vehicles/vehicle.routes');
  console.log('[startup] ✅ Módulo vehicles cargado');

  reservationRoutes = require('./modules/reservations/reservation.routes');
  serviceRoutes     = require('./modules/reservations/service.routes');
  ratingRoutes      = require('./modules/reservations/rating.routes');
  jobRoutes         = require('./modules/reservations/job.routes');
  console.log('[startup] ✅ Módulo reservations cargado');

  paymentRoutes = require('./modules/payments/payment.routes');
  webhookRoutes = require('./modules/payments/webhook.routes');
  console.log('[startup] ✅ Módulo payments cargado');

  notificationRoutes = require('./modules/notifications/notification.routes');
  chatRoutes         = require('./modules/notifications/chat.routes');
  socketHandler      = require('./modules/notifications/socket.handler');
  console.log('[startup] ✅ Módulo notifications cargado');
} catch (err) {
  console.error('[startup] ❌ FALLO al cargar módulos:', err.message);
  console.error(err.stack);
  process.exit(1);
}

// ================================================================
// Configuración de la aplicación
// ================================================================

const app = express();
const server = http.createServer(app);

// ── Health check mínimo — se monta PRIMERO antes de cualquier middleware ──────
// De esta forma responde aunque algún middleware posterior falle.
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'lava-auto-backend' });
});

console.log('[startup] ✅ /health registrado');

// Orígenes permitidos en CORS: la URL del frontend configurada + localhost para dev
const allowedOrigins = [
  config.server.frontendUrl,
  'http://localhost:3000',
  'http://localhost:3001',
];

console.log('[startup] CORS origins permitidos:', allowedOrigins);

function corsOriginHandler(origin, callback) {
  // Permitir requests sin origin (curl, Postman, mobile apps)
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  console.warn(`[cors] Origen bloqueado: ${origin}`);
  callback(new Error(`CORS: origen no permitido: ${origin}`));
}

const corsOptions = {
  origin: corsOriginHandler,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Middleware global ────────────────────────────────────────────

app.use(helmet());
app.use(cors(corsOptions));
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

// Health check extendido (opcional, para monitoreo manual con info de BD)
app.get('/health/full', async (_req, res) => {
  const dbOk = await db.isHealthy();
  res.status(200).json({
    status: dbOk ? 'healthy' : 'degraded',
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

console.log(`[startup] Iniciando server.listen en puerto ${config.server.port}...`);
server.listen(config.server.port, '0.0.0.0', () => {
  console.log(`[startup] ✅ Backend corriendo en http://0.0.0.0:${config.server.port}`);
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
