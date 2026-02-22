# Plan Técnico de Migración — Microservicios → Monolito Modular

> **Fecha**: Febrero 2026  
> **Proyecto**: Lava Auto — Sistema de Reservas de Autolavado  
> **Objetivo**: Refactorizar de arquitectura de microservicios a un monolito modular con único backend Express.js y única instancia PostgreSQL.

---

## 1. Diagnóstico de la Arquitectura Actual

### 1.1 Inventario de Servicios

| Servicio | Puerto | Base de Datos | Tablas principales | Responsabilidades |
|---|---|---|---|---|
| **api-gateway** | 4000 | — | — | Proxy reverso, JWT validation, Rate Limiting |
| **auth-service** | 4001 | `lava_auto_auth` | `users` | Login, registro, roles, reset password |
| **vehicle-service** | 4002 | `lava_auto_vehicles` | `vehicles` | CRUD de vehículos por usuario |
| **reservation-service** | 4003 | `lava_auto_reservations` | `services`, `time_slots`, `reservations`, `ratings`, `service_proofs` | Catálogo de servicios, reservas, calificaciones |
| **payment-service** | 4004 | `lava_auto_payments` | `payments` | Procesamiento de pagos mock Stripe |
| **notification-service** | 4005 | `lava_auto_notifications` | `notifications`, `messages` | Socket.IO, chat en tiempo real, notificaciones push |

### 1.2 Problemas Identificados en la Arquitectura Actual

#### Overhead operacional innecesario para el tamaño del proyecto
- **6 procesos Node.js** independientes (API Gateway + 5 servicios) corriendo simultáneamente.
- **5 instancias de PostgreSQL** separadas en Docker, cada una con su propio pool de conexiones (mínimo 10 conexiones cada una = 50+ conexiones mínimas en idle).
- **10+ contenedores Docker** en total, consumiendo ~1.5–2 GB de RAM solo en overhead de proceso.
- El API Gateway agrega una **capa de latencia de red** (HTTP proxy) en cada request sin valor diferencial para el sistema actual.

#### Inconsistencia de datos distribuida
- `user_id` en `vehicles`, `reservations`, `payments`, y `notifications` son strings VARCHAR sin FK real entre bases de datos — integridad referencial solo por convención, nunca enforced.
- Las referencias entre `reservation_id` en `payments` y `reservations` son cadenas sin constraint, creando riesgo de datos huérfanos.

#### Complejidad de desarrollo y debugging
- Un bug que cruza dos servicios requiere leer logs de múltiples contenedores.
- No hay transacciones distribuidas — una falla parcial crea estados inconsistentes (ej: reserva creada pero pago no registrado).
- El API Gateway redirige el body de los POST/PUT re-parseando JSON, añadiendo complejidad sin beneficio.

---

## 2. Arquitectura Objetivo

### 2.1 Diagrama Conceptual

```
┌────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js :3000)                     │
│              HTTP REST  +  WebSocket (Socket.IO)               │
└───────────────────────────────┬────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│              Backend Monolítico (Express.js :4000)             │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Middleware Stack (src/middleware/)          │  │
│  │  JWT Auth · CORS · Helmet · Rate Limit · Logger · Error │  │
│  └─────────────────────────────────────────────────────────┘  │
│              │            │            │            │           │
│              ▼            ▼            ▼            ▼           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                  Módulos de Dominio                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │  auth/   │ │vehicles/ │ │reservat/ │ │payments/ │  │  │
│  │  │ routes   │ │ routes   │ │ routes   │ │ routes   │  │  │
│  │  │ repos    │ │ repos    │ │ repos    │ │ repos    │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │                 ┌──────────────────┐                    │  │
│  │                 │ notifications/   │                    │  │
│  │                 │ routes + repos   │                    │  │
│  │                 │ + Socket.IO      │                    │  │
│  │                 └──────────────────┘                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│              │                                                  │
│              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   Shared Layer                          │  │
│  │  BaseRepository · Database (Pool) · JWT Utils          │  │
│  │  ID Generator · Error Handler · Validators             │  │
│  └─────────────────────────────────────────────────────────┘  │
│              │                                                  │
└──────────────┼──────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│        PostgreSQL único — base: lava_auto (:5432)            │
│                                                              │
│  Schema: auth          Schema: vehicles                      │
│  └─ users              └─ vehicles                           │
│                                                              │
│  Schema: reservations  Schema: payments                      │
│  ├─ services           └─ payments                           │
│  ├─ time_slots                                               │
│  ├─ reservations       Schema: notifications                 │
│  ├─ ratings            ├─ notifications                      │
│  └─ service_proofs     └─ messages                           │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Principios de Diseño

| Principio | Implementación |
|---|---|
| **Separación lógica** | Schemas PostgreSQL por dominio (no prefijos) — mantiene cohesión sin bases separadas |
| **Integridad referencial real** | FKs cross-schema nativas en PostgreSQL (`auth.users` → `vehicles.vehicles`) |
| **Transacciones ACID** | Un único pool de conexiones permite transacciones que abarcan múltiples módulos |
| **Modularidad** | Cada dominio encapsula sus routes + repositories — extensible sin romper otros módulos |
| **WebSocket integrado** | Socket.IO corre en el mismo proceso HTTP, elimina un contenedor y simplifica auth |

---

## 3. Estructura de Carpetas Propuesta

```
backend/
├── package.json
├── .env
├── .env.example
├── Dockerfile
│
├── src/
│   ├── index.js                    # Punto de entrada — Express + Socket.IO
│   │
│   ├── config/
│   │   ├── database.js             # Pool de conexión único (pg Pool)
│   │   ├── env.js                  # Validación y carga de variables de entorno
│   │   └── constants.js            # Constantes globales (roles, enums, etc.)
│   │
│   ├── middleware/
│   │   ├── auth.js                 # JWT authMiddleware + roleMiddleware
│   │   ├── error-handler.js        # Global error handler + notFoundHandler
│   │   ├── rate-limiter.js         # express-rate-limit config
│   │   └── logger.js               # morgan config
│   │
│   ├── shared/
│   │   ├── base-repository.js      # BaseRepository (portado del shared actual)
│   │   └── id-generator.js         # nanoid / uuid wrapper
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.routes.js      # POST /api/auth/login, register, refresh
│   │   │   ├── user.routes.js      # GET/PUT /api/users/:id
│   │   │   ├── washer.routes.js    # GET /api/washers (available, assign)
│   │   │   └── user.repository.js  # Queries sobre auth.users
│   │   │
│   │   ├── vehicles/
│   │   │   ├── vehicle.routes.js   # CRUD /api/vehicles
│   │   │   └── vehicle.repository.js
│   │   │
│   │   ├── reservations/
│   │   │   ├── reservation.routes.js
│   │   │   ├── service.routes.js   # Catálogo de servicios
│   │   │   ├── rating.routes.js
│   │   │   ├── job.routes.js       # Vista del lavador
│   │   │   ├── reservation.repository.js
│   │   │   ├── service.repository.js
│   │   │   ├── timeslot.repository.js
│   │   │   └── rating.repository.js
│   │   │
│   │   ├── payments/
│   │   │   ├── payment.routes.js
│   │   │   └── payment.repository.js
│   │   │
│   │   └── notifications/
│   │       ├── notification.routes.js
│   │       ├── chat.routes.js
│   │       ├── notification.repository.js
│   │       ├── message.repository.js
│   │       └── socket.handler.js   # Lógica Socket.IO extraída del index.js
│   │
│   └── database/
│       ├── schema.sql              # Schema unificado con todos los schemas PG
│       └── seed.sql                # Datos iniciales consolidados
│
└── scripts/
    ├── migrate.js                  # Crea schemas y tablas
    └── seed.js                     # Carga datos de prueba
```

---

## 4. Modelo Unificado de Base de Datos

### 4.1 Estrategia: Schemas PostgreSQL por Dominio

PostgreSQL soporta múltiples schemas dentro de una misma base de datos. Esta estrategia:
- Mantiene separación lógica equivalente a la actual separación por base de datos.
- Permite FKs cross-schema reales (`REFERENCES auth.users(id)`).
- Simplifica backups (un dump), réplicas y gestión de conexiones.
- No requiere cambiar nombres de tablas — solo prefijo de schema.

### 4.2 Schema SQL Consolidado

```sql
-- ================================================================
-- LAVA AUTO — Schema Unificado
-- Base de datos: lava_auto
-- Versión: 2.0 (monolito modular)
-- ================================================================

-- ----------------------------------------------------------------
-- ENUMS GLOBALES
-- ----------------------------------------------------------------
CREATE TYPE user_role       AS ENUM ('ADMIN', 'CLIENT', 'WASHER');
CREATE TYPE vehicle_type    AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'VAN', 'MOTORCYCLE');
CREATE TYPE res_status      AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_method  AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');
CREATE TYPE payment_status  AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE notif_type      AS ENUM ('INFO','WASHER_ASSIGNED','WASHER_ON_WAY','SERVICE_STARTED','SERVICE_COMPLETED','PAYMENT_REMINDER','PROMOTION');

-- ----------------------------------------------------------------
-- FUNCIÓN GLOBAL updated_at (una sola vez)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SCHEMA: auth
-- ================================================================
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id                VARCHAR(50)       PRIMARY KEY,
    name              VARCHAR(255)      NOT NULL,
    email             VARCHAR(255)      UNIQUE NOT NULL,
    password          VARCHAR(255)      NOT NULL,
    phone             VARCHAR(50),
    role              user_role         DEFAULT 'CLIENT',
    email_verified    TIMESTAMP,
    reset_token       VARCHAR(255)      UNIQUE,
    reset_token_expiry TIMESTAMP,
    address           TEXT,
    latitude          DOUBLE PRECISION,
    longitude         DOUBLE PRECISION,
    -- Campos lavador (antes duplicados en lógica de negocio)
    is_available      BOOLEAN           DEFAULT false,
    rating            DOUBLE PRECISION  DEFAULT 5.0,
    completed_services INTEGER          DEFAULT 0,
    created_at        TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP         DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_users_email  ON auth.users(email);
CREATE INDEX idx_auth_users_role   ON auth.users(role);
CREATE INDEX idx_auth_users_avail  ON auth.users(is_available) WHERE role = 'WASHER';

CREATE TRIGGER trg_auth_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SCHEMA: vehicles
-- ================================================================
CREATE SCHEMA IF NOT EXISTS vehicles;

CREATE TABLE IF NOT EXISTS vehicles.vehicles (
    id           VARCHAR(50)    PRIMARY KEY,
    user_id      VARCHAR(50)    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand        VARCHAR(100)   NOT NULL,
    model        VARCHAR(100)   NOT NULL,
    plate        VARCHAR(20)    UNIQUE NOT NULL,
    vehicle_type vehicle_type   NOT NULL,
    color        VARCHAR(50),
    year         INTEGER,
    owner_name   VARCHAR(255)   NOT NULL,
    owner_phone  VARCHAR(50),
    is_active    BOOLEAN        DEFAULT true,
    created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_user_id ON vehicles.vehicles(user_id);
CREATE INDEX idx_vehicles_plate   ON vehicles.vehicles(plate);
CREATE INDEX idx_vehicles_active  ON vehicles.vehicles(is_active);

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles.vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SCHEMA: reservations
-- ================================================================
CREATE SCHEMA IF NOT EXISTS reservations;

CREATE TABLE IF NOT EXISTS reservations.services (
    id           VARCHAR(50)   PRIMARY KEY,
    name         VARCHAR(255)  NOT NULL,
    description  TEXT,
    duration     INTEGER       NOT NULL,            -- minutos
    price        DECIMAL(10,2) NOT NULL,
    vehicle_type vehicle_type  NOT NULL,
    is_active    BOOLEAN       DEFAULT true,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations.time_slots (
    id          VARCHAR(50)  PRIMARY KEY,
    date        DATE         NOT NULL,
    time        VARCHAR(10)  NOT NULL,
    capacity    INTEGER      DEFAULT 3,
    reserved    INTEGER      DEFAULT 0,
    is_available BOOLEAN     DEFAULT true,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, time)
);

CREATE TABLE IF NOT EXISTS reservations.reservations (
    id               VARCHAR(50)   PRIMARY KEY,
    user_id          VARCHAR(50)   NOT NULL REFERENCES auth.users(id),
    vehicle_id       VARCHAR(50)   NOT NULL REFERENCES vehicles.vehicles(id),
    service_id       VARCHAR(50)   NOT NULL REFERENCES reservations.services(id),
    washer_id        VARCHAR(50)   REFERENCES auth.users(id),
    scheduled_date   DATE          NOT NULL,
    scheduled_time   VARCHAR(10)   NOT NULL,
    status           res_status    DEFAULT 'PENDING',
    total_amount     DECIMAL(10,2) NOT NULL,
    notes            TEXT,
    address          TEXT,
    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,
    started_at       TIMESTAMP,
    completed_at     TIMESTAMP,
    estimated_arrival TIMESTAMP,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations.service_proofs (
    id             VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL REFERENCES reservations.reservations(id) ON DELETE CASCADE,
    before_photos  TEXT[],
    after_photos   TEXT[],
    notes          TEXT,
    created_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations.ratings (
    id             VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL REFERENCES reservations.reservations(id) ON DELETE CASCADE,
    user_id        VARCHAR(50) NOT NULL REFERENCES auth.users(id),
    washer_id      VARCHAR(50) NOT NULL REFERENCES auth.users(id),
    stars          INTEGER     NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment        TEXT,
    created_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_res_user_id       ON reservations.reservations(user_id);
CREATE INDEX idx_res_washer_id     ON reservations.reservations(washer_id);
CREATE INDEX idx_res_status        ON reservations.reservations(status);
CREATE INDEX idx_res_scheduled     ON reservations.reservations(scheduled_date);
CREATE INDEX idx_ts_date           ON reservations.time_slots(date);
CREATE INDEX idx_svc_active        ON reservations.services(is_active);
CREATE INDEX idx_ratings_washer    ON reservations.ratings(washer_id);

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON reservations.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_timeslots_updated_at
    BEFORE UPDATE ON reservations.time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON reservations.reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SCHEMA: payments
-- ================================================================
CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE IF NOT EXISTS payments.payments (
    id                    VARCHAR(50)    PRIMARY KEY,
    reservation_id        VARCHAR(50)    NOT NULL REFERENCES reservations.reservations(id),
    user_id               VARCHAR(50)    NOT NULL REFERENCES auth.users(id),
    amount                DECIMAL(10,2)  NOT NULL,
    payment_method        payment_method NOT NULL,
    status                payment_status DEFAULT 'PENDING',
    transaction_id        VARCHAR(255),
    stripe_payment_intent VARCHAR(255),
    notes                 TEXT,
    created_at            TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pay_reservation ON payments.payments(reservation_id);
CREATE INDEX idx_pay_user_id     ON payments.payments(user_id);
CREATE INDEX idx_pay_status      ON payments.payments(status);

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SCHEMA: notifications
-- ================================================================
CREATE SCHEMA IF NOT EXISTS notifications;

CREATE TABLE IF NOT EXISTS notifications.notifications (
    id         VARCHAR(50)  PRIMARY KEY,
    user_id    VARCHAR(50)  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    type       notif_type   DEFAULT 'INFO',
    is_read    BOOLEAN      DEFAULT false,
    action_url VARCHAR(500),
    metadata   JSONB,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications.messages (
    id          VARCHAR(50) PRIMARY KEY,
    sender_id   VARCHAR(50) NOT NULL REFERENCES auth.users(id),
    sender_role VARCHAR(20),
    receiver_id VARCHAR(50) NOT NULL REFERENCES auth.users(id),
    content     TEXT        NOT NULL,
    read        BOOLEAN     DEFAULT false,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_user    ON notifications.notifications(user_id);
CREATE INDEX idx_notif_unread  ON notifications.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_msg_conv      ON notifications.messages(sender_id, receiver_id);
CREATE INDEX idx_msg_created   ON notifications.messages(created_at);
```

### 4.3 Ventajas del Modelo Cross-Schema

| Aspecto | Antes (5 DB separadas) | Ahora (1 DB, 5 schemas) |
|---|---|---|
| Integridad referencial | ❌ Sin FKs entre bases | ✅ FKs nativas cross-schema |
| Transacciones | ❌ Solo dentro de cada DB | ✅ ACID multi-tabla en una transacción |
| Backups | ❌ 5 dumps independientes | ✅ Un solo `pg_dump lava_auto` |
| Conexiones idle | ~50 (10×5 DBs) | ~10–20 (pool único compartido) |
| Queries JOINs | ❌ Imposibles entre servicios | ✅ `SELECT r.*, u.name FROM reservations.reservations r JOIN auth.users u` |
| Aislamiento lógico | ✅ Separación física total | ✅ Separación lógica por schema |

---

## 5. Reorganización de Módulos del Backend

### 5.1 Mapa de Migración de Archivos

| Archivo actual (microservicio) | Destino en monolito |
|---|---|
| `auth-service/src/routes/auth.routes.js` | `src/modules/auth/auth.routes.js` |
| `auth-service/src/routes/user.routes.js` | `src/modules/auth/user.routes.js` |
| `auth-service/src/routes/washer.routes.js` | `src/modules/auth/washer.routes.js` |
| `auth-service/src/repositories/user.repository.js` | `src/modules/auth/user.repository.js` |
| `vehicle-service/src/routes/*.js` | `src/modules/vehicles/*.routes.js` |
| `vehicle-service/src/repositories/*.js` | `src/modules/vehicles/*.repository.js` |
| `reservation-service/src/routes/*.js` | `src/modules/reservations/*.routes.js` |
| `reservation-service/src/repositories/*.js` | `src/modules/reservations/*.repository.js` |
| `payment-service/src/routes/*.js` | `src/modules/payments/*.routes.js` |
| `payment-service/src/repositories/*.js` | `src/modules/payments/*.repository.js` |
| `notification-service/src/routes/*.js` | `src/modules/notifications/*.routes.js` |
| `notification-service/src/repositories/*.js` | `src/modules/notifications/*.repository.js` |
| Socket.IO lógica en `notification-service/src/index.js` | `src/modules/notifications/socket.handler.js` |
| `shared/base-repository.js` | `src/shared/base-repository.js` |
| `shared/middleware/auth.js` | `src/middleware/auth.js` |
| `shared/middleware/error-handler.js` | `src/middleware/error-handler.js` |
| `shared/utils/id-generator.js` | `src/shared/id-generator.js` |
| `api-gateway/src/index.js` | **Eliminado** |

### 5.2 Ejemplo del Entry Point del Monolito (`src/index.js`)

```javascript
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

// Config
const db = require('./config/database');

// Middleware
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const { rateLimiter } = require('./middleware/rate-limiter');

// Módulos
const authRoutes    = require('./modules/auth/auth.routes');
const userRoutes    = require('./modules/auth/user.routes');
const washerRoutes  = require('./modules/auth/washer.routes');
const vehicleRoutes = require('./modules/vehicles/vehicle.routes');
const reservRoutes  = require('./modules/reservations/reservation.routes');
const serviceRoutes = require('./modules/reservations/service.routes');
const ratingRoutes  = require('./modules/reservations/rating.routes');
const jobRoutes     = require('./modules/reservations/job.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const notifRoutes   = require('./modules/notifications/notification.routes');
const chatRoutes    = require('./modules/notifications/chat.routes');
const socketHandler = require('./modules/notifications/socket.handler');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: process.env.FRONTEND_URL || '*' } });
const PORT   = process.env.PORT || 4000;

// Middleware global
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(morgan('combined'));
app.use(express.json());
app.use(rateLimiter);

// Inyectar db e io en req (evita imports circulares)
app.use((req, _res, next) => { req.db = db; req.io = io; next(); });

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// Rutas — prefijos equivalentes a los de los microservicios
app.use('/api',              authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/washers',      washerRoutes);
app.use('/api/vehicles',     vehicleRoutes);
app.use('/api/reservations', reservRoutes);
app.use('/api/services',     serviceRoutes);
app.use('/api/ratings',      ratingRoutes);
app.use('/api/jobs',         jobRoutes);
app.use('/api/payments',     paymentRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/chat',         chatRoutes);

// Socket.IO
socketHandler(io, db);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
```

### 5.3 Ajuste de Queries — Prefijo de Schema

El único cambio en los repositories existentes es agregar el prefijo del schema en los nombres de tabla:

```javascript
// ANTES (en vehicle-service)
class VehicleRepository extends BaseRepository {
  constructor(db) {
    super(db, 'vehicles');  // tabla 'vehicles' en su propia DB
  }
}

// DESPUÉS (en monolito)
class VehicleRepository extends BaseRepository {
  constructor(db) {
    super(db, 'vehicles.vehicles');  // tabla 'vehicles' en schema 'vehicles'
  }
}
```

El `BaseRepository` actual no necesita modificaciones — solo el `tableName` pasado en el constructor.

---

## 6. Plan de Migración por Fases

### Fase 0 — Preparación (1–2 días)

```
[ ] Crear carpeta backend/ con package.json vacío
[ ] Instalar dependencias comunes:
    npm install express pg jsonwebtoken bcryptjs helmet cors
                morgan express-rate-limit socket.io dotenv nanoid
[ ] Crear src/config/database.js con pool único
[ ] Crear src/shared/base-repository.js (copiar de shared/base-repository.js)
[ ] Crear src/middleware/auth.js (copiar de shared/middleware/auth.js)
[ ] Crear src/middleware/error-handler.js (copiar de shared/middleware/error-handler.js)
[ ] Crear src/database/schema.sql con el schema unificado (ver Sección 4.2)
[ ] Crear script scripts/migrate.js para inicializar BD
```

### Fase 1 — Módulo Auth (1 día)

```
[ ] Crear src/modules/auth/
[ ] Portar auth-service/src/routes/auth.routes.js
    → Cambiar req.app.get('db') → req.db
[ ] Portar auth-service/src/routes/user.routes.js
[ ] Portar auth-service/src/routes/washer.routes.js
[ ] Portar auth-service/src/repositories/user.repository.js
    → Cambiar tableName: 'users' → 'auth.users'
[ ] Probar endpoints: POST /api/auth/login, register; GET /api/users
```

### Fase 2 — Módulo Vehicles (0.5 días)

```
[ ] Crear src/modules/vehicles/
[ ] Portar vehicle-service/src/routes/ y repositories/
    → Cambiar tableName: 'vehicles' → 'vehicles.vehicles'
[ ] Probar endpoints CRUD /api/vehicles
```

### Fase 3 — Módulo Reservations (1.5 días)

```
[ ] Crear src/modules/reservations/
[ ] Portar reservation-service/src/routes/ y repositories/
    → Cambiar tableName:
       'services'       → 'reservations.services'
       'time_slots'     → 'reservations.time_slots'
       'reservations'   → 'reservations.reservations'
       'ratings'        → 'reservations.ratings'
       'service_proofs' → 'reservations.service_proofs'
[ ] Probar endpoints: /api/services, /api/reservations, /api/ratings
[ ] Verificar FK vehicle_id ahora enforced a nivel DB
```

### Fase 4 — Módulo Payments (0.5 días)

```
[ ] Crear src/modules/payments/
[ ] Portar payment-service/src/routes/ y repositories/
    → Cambiar tableName: 'payments' → 'payments.payments'
[ ] Probar endpoints: POST /api/payments, GET /api/payments/user/:id
[ ] Verificar FK reservation_id enforced
```

### Fase 5 — Módulo Notifications + Socket.IO (1 día)

```
[ ] Crear src/modules/notifications/
[ ] Portar notification-service/src/routes/
    → Cambiar tableName:
       'notifications' → 'notifications.notifications'
       'messages'      → 'notifications.messages'
[ ] Extraer lógica Socket.IO de notification-service/src/index.js
    → Crear src/modules/notifications/socket.handler.js como función exportada
[ ] Integrar socketHandler(io, db) en src/index.js
[ ] Probar eventos: join-chat, send-message, disconnect
```

### Fase 6 — Integración y Pruebas (1–2 días)

```
[ ] Actualizar src/lib/api-client.ts del frontend:
    → Cambiar base URL de http://localhost:4000 (ya correcto, no cambia)
    → Eliminar cualquier URL directa a puertos 4001–4005
[ ] Ejecutar seed.sql consolidado
[ ] Probar flujo completo end-to-end:
    register → login → add vehicle → create reservation
    → assign washer → update status → payment → notification → rating
[ ] Verificar WebSocket en dashboard/chat y washer location tracker
```

### Fase 7 — Docker y CI/CD (1 día)

```
[ ] Crear Dockerfile del backend (multi-stage build para producción)
[ ] Actualizar docker-compose.microservices.yml → docker-compose.yml:
    → Eliminar: api-gateway, auth-service, vehicle-service,
                reservation-service, payment-service, notification-service
    → Mantener: frontend, backend (nuevo), postgres (único)
[ ] Actualizar .github/workflows/ci.yml:
    → Simplificar jobs de microservicios → un solo job 'backend'
[ ] Ejecutar pipeline completo y verificar health checks
```

---

## 7. Análisis de Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Queries usan nombre de tabla sin schema** | Alta | Medio | El BaseRepository solo cambia el `tableName` en el constructor — cambio puntual y predecible |
| **req.app.get('db') en lugar de req.db** | Alta | Bajo | Búsqueda y reemplazo global — patrón uniforme en todos los servicios |
| **socket.userId de handshake auth (ya correcto)** | Baja | Alto | El código actual ya extrae userId del JWT en `io.use()`, no del evento del cliente |
| **FKs nuevas rompen datos existentes de seed** | Media | Medio | Reescribir seed.sql respetando orden de inserción: users → vehicles → reservations → payments |
| **Pérdida de aislamiento de errores por módulo** | Baja | Bajo | Global error handler en Express absorbe excepciones — logging estructurado por módulo |
| **Transición de 5 variables DB_* a 1 set de env** | Baja | Bajo | Un solo bloque en .env: `DB_HOST`, `DB_PORT`, `DB_NAME=lava_auto`, `DB_USER`, `DB_PASSWORD` |

---

## 8. Optimizaciones para Entorno de 4 GB RAM

### 8.1 PostgreSQL (`postgresql.conf`)

```ini
# Para 4GB RAM total, asignar ~1GB a Postgres
shared_buffers       = 256MB   # 25% de RAM asignada a Postgres
effective_cache_size = 768MB   # estimado de cache del OS + Postgres
work_mem             = 4MB     # por conexión (con 20 conex. = 80MB máx.)
maintenance_work_mem = 64MB
max_connections      = 25      # suficiente para el monolito (pool de 10-15)
wal_buffers          = 8MB
checkpoint_completion_target = 0.9
random_page_cost     = 1.1     # si usa SSD
```

### 8.2 Pool de Conexiones Node.js

```javascript
// src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lava_auto',
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max:              15,   // máximo de conexiones simultáneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

module.exports = pool;
```

### 8.3 Docker Compose con Límites de Memoria

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine          # Alpine = ~50MB vs ~200MB de imagen estándar
    deploy:
      resources:
        limits:
          memory: 1G
    environment:
      POSTGRES_DB: lava_auto
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    command: >
      postgres
        -c shared_buffers=256MB
        -c max_connections=25
        -c work_mem=4MB

  backend:
    build: ./backend
    deploy:
      resources:
        limits:
          memory: 512M
    environment:
      NODE_ENV: production
      PORT: 4000
      DB_HOST: postgres
      DB_NAME: lava_auto
      # ... resto de vars

  frontend:
    build: .
    deploy:
      resources:
        limits:
          memory: 512M
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
```

### 8.4 Comparación de Consumo de RAM

| Componente | Arquitectura Actual | Arquitectura Nueva |
|---|---|---|
| PostgreSQL (5 instancias → 1) | ~800MB | ~300MB |
| Node.js procesos (6 → 1) | ~700MB | ~150MB |
| Docker overhead (10 ctnr → 3) | ~400MB | ~100MB |
| **Total estimado** | **~1.9 GB** | **~550 MB** |
| **Disponible para OS + Frontend** | **~2.1 GB** | **~3.45 GB** |

### 8.5 Optimizaciones Adicionales

```javascript
// 1. Usar next/standalone en Next.js para reducir imagen
// next.config.ts
const config = {
  output: 'standalone',  // Reduce bundle de ~1GB a ~100MB
};

// 2. Deshabilitar logging verbose en producción
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('short'));  // en lugar de 'combined'
}

// 3. Comprimir respuestas HTTP
const compression = require('compression');
app.use(compression());  // Reduce transferencia ~70% en respuestas JSON

// 4. Índice parcial para washer disponibles (ya incluido en schema)
// CREATE INDEX idx_auth_users_avail ON auth.users(is_available) WHERE role = 'WASHER';
// Solo indexa las filas de lavadores, no toda la tabla
```

---

## 9. Comparación Arquitectural

| Criterio | Microservicios (actual) | Monolito Modular (objetivo) |
|---|---|---|
| **Procesos** | 6 Node.js | 1 Node.js |
| **Bases de datos** | 5 PostgreSQL | 1 PostgreSQL (5 schemas) |
| **Contenedores Docker** | ~10 | 3 |
| **RAM estimada** | ~1.9 GB | ~550 MB |
| **Latencia per-request** | 2 saltos (GW + servicio) | 0 saltos (directo) |
| **Transacciones ACID** | Imposibles entre servicios | Nativas |
| **Integridad referencial** | Por convención | Por FKs reales |
| **Debugging** | Multi-contenedor | Un solo log stream |
| **Escalabilidad horizontal** | Por servicio | Por réplica completa |
| **Complejidad operacional** | Alta | Baja |
| **Adecuado para el tamaño del proyecto** | ❌ Over-engineered | ✅ Ajustado |

---

## 10. Checklist Final de Validación

```
□ Login / Register funcionan correctamente
□ Reset de contraseña funciona
□ CRUD de vehículos con FK a usuario enforced
□ Catálogo de servicios accesible sin auth
□ Crear reserva: valida vehicle_id y service_id con FK real
□ Asignación de lavador actualiza washer_id en reserva
□ Actualización de estado de reserva (PENDING → IN_PROGRESS → COMPLETED)
□ Registro de pago crea registro con reservation_id FK válida
□ Chat en tiempo real (Socket.IO) funciona entre cliente y admin
□ Chat en tiempo real funciona entre lavador y admin
□ Notificaciones push llegan al usuario correcto
□ Calificación de servicio completado
□ Dashboard admin ve todas las reservas
□ Dashboard cliente ve solo sus reservas y vehículos
□ Dashboard lavador ve solo sus trabajos asignados
□ Modo oscuro/claro funciona (frontend, sin cambios)
□ Tracker de ubicación del lavador funciona (WebSocket)
□ Health check GET /health retorna 200
□ El frontend no hace llamadas directas a puertos 4001–4005
```

---

## Anexo — Variables de Entorno (`.env.example`)

```env
# Aplicación
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Base de datos (única)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lava_auto
DB_USER=postgres
DB_PASSWORD=postgres

# Seguridad
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Stripe (mock)
STRIPE_SECRET_KEY=sk_test_placeholder
```

---

*Plan generado automáticamente a partir del análisis completo de la arquitectura de microservicios del proyecto Lava Auto — Febrero 2026.*
