'use strict';

/**
 * swagger.js — Configuración de Swagger (OpenAPI 3.0).
 */

const path = require('node:path');
const swaggerJSDoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lava Auto API',
      version: '2.0.0',
      description:
        'API REST del sistema de reservas de autolavado Lava Auto.\n\n' +
        '**Autenticación**: Bearer JWT en el header `Authorization`.\n\n' +
        'Obtén tu token en `POST /api/auth/login`.',
      contact: { name: 'Lava Auto Dev Team' },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido desde POST /api/auth/login',
        },
      },
      schemas: {
        // ── Genéricos ────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensaje de error descriptivo' },
          },
        },
        // ── Usuario / Auth ────────────────────────────────────────
        UserPublic: {
          type: 'object',
          properties: {
            id:               { type: 'string', example: 'user_lp4k8a3...' },
            name:             { type: 'string', example: 'Juan Pérez' },
            email:            { type: 'string', format: 'email', example: 'juan@example.com' },
            role:             { type: 'string', enum: ['ADMIN', 'CLIENT', 'WASHER'] },
            phone:            { type: 'string', example: '0988888888' },
            address:          { type: 'string', example: 'Av. Principal 123' },
            isAvailable:      { type: 'boolean' },
            rating:           { type: 'number', example: 4.8 },
            completedServices:{ type: 'integer', example: 42 },
            createdAt:        { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/UserPublic' },
            token: { type: 'string', example: 'eyJhbGci...' },
          },
        },
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', example: 'Juan Pérez' },
            email:    { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', minLength: 6, example: 'secret123' },
            phone:    { type: 'string', example: '0988888888' },
            role:     { type: 'string', enum: ['CLIENT', 'WASHER'], default: 'CLIENT' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'admin@lavauto.com' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        WasherPublic: {
          type: 'object',
          properties: {
            id:               { type: 'string' },
            name:             { type: 'string' },
            email:            { type: 'string', format: 'email' },
            phone:            { type: 'string' },
            isAvailable:      { type: 'boolean' },
            rating:           { type: 'number' },
            completedServices:{ type: 'integer' },
            address:          { type: 'string' },
            latitude:         { type: 'number' },
            longitude:        { type: 'number' },
          },
        },
        // ── Vehículos ─────────────────────────────────────────────
        Vehicle: {
          type: 'object',
          properties: {
            id:          { type: 'string', example: 'vhc_abc123' },
            userId:      { type: 'string', example: 'user_xyz' },
            brand:       { type: 'string', example: 'Toyota' },
            model:       { type: 'string', example: 'Corolla' },
            plate:       { type: 'string', example: 'ABC-1234' },
            vehicleType: { type: 'string', enum: ['SEDAN','SUV','HATCHBACK','PICKUP','VAN','MOTORCYCLE'] },
            color:       { type: 'string', example: 'Negro' },
            year:        { type: 'integer', example: 2022 },
            ownerName:   { type: 'string', example: 'Juan Pérez' },
            ownerPhone:  { type: 'string', example: '0988888888' },
            isActive:    { type: 'boolean', default: true },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        VehicleCreateBody: {
          type: 'object',
          required: ['brand', 'model', 'plate', 'vehicleType', 'ownerName'],
          properties: {
            brand:       { type: 'string', example: 'Toyota' },
            model:       { type: 'string', example: 'Corolla' },
            plate:       { type: 'string', example: 'ABC-1234' },
            vehicleType: { type: 'string', enum: ['SEDAN','SUV','HATCHBACK','PICKUP','VAN','MOTORCYCLE'] },
            color:       { type: 'string', example: 'Negro' },
            year:        { type: 'integer', example: 2022 },
            ownerName:   { type: 'string', example: 'Juan Pérez' },
            ownerPhone:  { type: 'string', example: '0988888888' },
          },
        },
        // ── Reservas ──────────────────────────────────────────────
        Reservation: {
          type: 'object',
          properties: {
            id:               { type: 'string', example: 'res_abc123' },
            userId:           { type: 'string' },
            washerId:         { type: 'string', nullable: true },
            vehicleId:        { type: 'string' },
            serviceId:        { type: 'string' },
            status:           { type: 'string', enum: ['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'] },
            scheduledDate:    { type: 'string', format: 'date', example: '2026-03-15' },
            scheduledTime:    { type: 'string', example: '10:30' },
            totalAmount:      { type: 'number', example: 15.00 },
            notes:            { type: 'string', nullable: true },
            address:          { type: 'string', nullable: true },
            latitude:         { type: 'number', nullable: true },
            longitude:        { type: 'number', nullable: true },
            estimatedArrival: { type: 'string', format: 'date-time', nullable: true },
            serviceName:      { type: 'string', example: 'Lavado Básico SEDAN' },
            serviceDuration:  { type: 'integer', example: 30 },
            createdAt:        { type: 'string', format: 'date-time' },
            updatedAt:        { type: 'string', format: 'date-time' },
          },
        },
        ReservationCreateBody: {
          type: 'object',
          required: ['vehicleId', 'serviceId', 'scheduledDate', 'scheduledTime'],
          properties: {
            vehicleId:     { type: 'string' },
            serviceId:     { type: 'string' },
            scheduledDate: { type: 'string', format: 'date', example: '2026-03-15' },
            scheduledTime: { type: 'string', example: '10:30' },
            notes:         { type: 'string' },
            address:       { type: 'string' },
            latitude:      { type: 'number' },
            longitude:     { type: 'number' },
          },
        },
        ReservationStats: {
          type: 'object',
          properties: {
            pending:    { type: 'integer' },
            confirmed:  { type: 'integer' },
            inProgress: { type: 'integer' },
            completed:  { type: 'integer' },
            cancelled:  { type: 'integer' },
            total:      { type: 'integer' },
          },
        },
        // ── Servicios ─────────────────────────────────────────────
        Service: {
          type: 'object',
          properties: {
            id:          { type: 'string', example: 'svc_abc123' },
            name:        { type: 'string', example: 'Lavado Básico' },
            description: { type: 'string', nullable: true },
            duration:    { type: 'integer', example: 30, description: 'Duración en minutos' },
            price:       { type: 'number', example: 12.50 },
            vehicleType: { type: 'string', enum: ['SEDAN','SUV','HATCHBACK','PICKUP','VAN','MOTORCYCLE'] },
            isActive:    { type: 'boolean', default: true },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        ServiceCreateBody: {
          type: 'object',
          required: ['name', 'duration', 'price', 'vehicleType'],
          properties: {
            name:        { type: 'string', example: 'Lavado Completo' },
            description: { type: 'string' },
            duration:    { type: 'integer', example: 60 },
            price:       { type: 'number', example: 20.00 },
            vehicleType: { type: 'string', enum: ['SEDAN','SUV','HATCHBACK','PICKUP','VAN','MOTORCYCLE'] },
            isActive:    { type: 'boolean', default: true },
          },
        },
        // ── Calificaciones ────────────────────────────────────────
        Rating: {
          type: 'object',
          properties: {
            id:            { type: 'string', example: 'rtg_abc123' },
            reservationId: { type: 'string' },
            userId:        { type: 'string' },
            washerId:      { type: 'string' },
            stars:         { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment:       { type: 'string', nullable: true },
            createdAt:     { type: 'string', format: 'date-time' },
          },
        },
        RatingCreateBody: {
          type: 'object',
          required: ['reservationId', 'stars'],
          properties: {
            reservationId: { type: 'string' },
            stars:         { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment:       { type: 'string' },
          },
        },
        // ── Trabajos (Jobs) ───────────────────────────────────────
        JobEnriched: {
          allOf: [
            { $ref: '#/components/schemas/Reservation' },
            {
              type: 'object',
              properties: {
                vehicle: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    id:          { type: 'string' },
                    brand:       { type: 'string' },
                    model:       { type: 'string' },
                    plate:       { type: 'string' },
                    vehicleType: { type: 'string' },
                    color:       { type: 'string' },
                    year:        { type: 'integer' },
                    ownerName:   { type: 'string' },
                    ownerPhone:  { type: 'string' },
                  },
                },
              },
            },
          ],
        },
        // ── Pagos ─────────────────────────────────────────────────────
        Payment: {
          type: 'object',
          properties: {
            id:                  { type: 'string', example: 'pay_abc123' },
            reservationId:       { type: 'string' },
            userId:              { type: 'string' },
            amount:              { type: 'number', example: 15.00 },
            paymentMethod:       { type: 'string', enum: ['CARD', 'CASH'] },
            status:              { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
            transactionId:       { type: 'string', nullable: true },
            stripePaymentIntent: { type: 'string', nullable: true },
            notes:               { type: 'string', nullable: true },
            createdAt:           { type: 'string', format: 'date-time' },
            updatedAt:           { type: 'string', format: 'date-time' },
          },
        },
        PaymentStats: {
          type: 'object',
          properties: {
            pending:       { type: 'integer' },
            completed:     { type: 'integer' },
            failed:        { type: 'integer' },
            refunded:      { type: 'integer' },
            totalRevenue:  { type: 'number', example: 1250.00 },
            cashCompleted: { type: 'integer' },
            cardCompleted: { type: 'integer' },
          },
        },
        PaymentIntentResponse: {
          type: 'object',
          properties: {
            clientSecret: { type: 'string', description: 'Usar con Stripe.js en el frontend' },
            paymentId:    { type: 'string', example: 'pay_abc123' },
            isMock:       { type: 'boolean', description: 'true si Stripe no está configurado' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: 'ntf_abc123' },
            userId:    { type: 'string' },
            title:     { type: 'string', example: 'Lavador asignado' },
            message:   { type: 'string', example: 'Juan García atenderá tu reserva' },
            type:      { type: 'string', enum: ['INFO','WASHER_ASSIGNED','WASHER_ON_WAY','SERVICE_STARTED','SERVICE_COMPLETED','PAYMENT_REMINDER','PROMOTION'] },
            isRead:    { type: 'boolean' },
            actionUrl: { type: 'string', nullable: true },
            metadata:  { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id:          { type: 'string', example: 'msg_abc123' },
            sender_id:   { type: 'string' },
            receiver_id: { type: 'string' },
            content:     { type: 'string', example: 'Estoy en camino' },
            read:        { type: 'boolean' },
            senderName:  { type: 'string' },
            created_at:  { type: 'string', format: 'date-time' },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            id:           { type: 'string' },
            partner_id:   { type: 'string' },
            partner_name: { type: 'string' },
            partner_role: { type: 'string' },
            content:      { type: 'string', description: 'Último mensaje' },
            read:         { type: 'boolean' },
            created_at:   { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    // Seguridad global: todos los endpoints requieren JWT salvo los públicos
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',          description: 'Registro, login y gestión de tokens' },
      { name: 'Users',         description: 'Gestión de usuarios (requiere auth)' },
      { name: 'Washers',       description: 'Gestión de lavadores' },
      { name: 'Vehicles',      description: 'Gestión de vehículos' },
      { name: 'Reservations',  description: 'Reservas de servicio de lavado' },
      { name: 'Services',      description: 'Catálogo de servicios de lavado' },
      { name: 'Ratings',       description: 'Calificaciones de servicios completados' },
      { name: 'Jobs',          description: 'Panel de trabajo para lavadores' },
      { name: 'Payments',      description: 'Pagos con tarjeta (Stripe) y efectivo' },
      { name: 'Notifications', description: 'Notificaciones push del usuario' },
      { name: 'Chat',          description: 'Mensajería en tiempo real' },
    ],
  },
  // Archivos que contienen anotaciones @swagger
  // Usar __dirname para que funcione independientemente del CWD (Railway/Docker)
  apis: [path.join(__dirname, '../modules/**/*.routes.js')],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
