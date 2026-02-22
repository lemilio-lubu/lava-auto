-- ================================================================
-- Lava Auto — Schema Unificado v2.0
-- Base de datos: lava_auto
-- ================================================================
-- INSTRUCCIONES:
--   Este archivo es idempotente (IF NOT EXISTS / OR REPLACE).
--   Puede ejecutarse más de una vez sin errores.
--   Ejecutar con: node scripts/migrate.js
-- ================================================================

-- ================================================================
-- TIPOS ENUMERADOS GLOBALES
-- ================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'CLIENT', 'WASHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'VAN', 'MOTORCYCLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'INFO',
        'WASHER_ASSIGNED',
        'WASHER_ON_WAY',
        'SERVICE_STARTED',
        'SERVICE_COMPLETED',
        'PAYMENT_REMINDER',
        'PROMOTION'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- FUNCIÓN GLOBAL: updated_at trigger (definida una sola vez)
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SCHEMA: auth
-- Usuarios, roles, recuperación de contraseña
-- ================================================================

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id                  VARCHAR(50)       PRIMARY KEY,
    name                VARCHAR(255)      NOT NULL,
    email               VARCHAR(255)      UNIQUE NOT NULL,
    password            VARCHAR(255)      NOT NULL,
    phone               VARCHAR(50),
    role                user_role         NOT NULL DEFAULT 'CLIENT',
    email_verified      TIMESTAMP,
    reset_token         VARCHAR(255)      UNIQUE,
    reset_token_expiry  TIMESTAMP,
    address             TEXT,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    -- Campos específicos del lavador (is_available, rating)
    -- Se almacenan en el mismo registro para evitar JOINs innecesarios.
    -- Solo son relevantes cuando role = 'WASHER'.
    is_available        BOOLEAN           NOT NULL DEFAULT false,
    rating              DOUBLE PRECISION  NOT NULL DEFAULT 5.0 CHECK (rating BETWEEN 0 AND 5),
    completed_services  INTEGER           NOT NULL DEFAULT 0 CHECK (completed_services >= 0),
    created_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_users_email
    ON auth.users (email);

CREATE INDEX IF NOT EXISTS idx_auth_users_role
    ON auth.users (role);

-- Índice parcial: solo indexa lavadores disponibles
CREATE INDEX IF NOT EXISTS idx_auth_users_available_washers
    ON auth.users (is_available)
    WHERE role = 'WASHER';

CREATE INDEX IF NOT EXISTS idx_auth_users_reset_token
    ON auth.users (reset_token)
    WHERE reset_token IS NOT NULL;

DO $$ BEGIN
    CREATE TRIGGER trg_auth_users_updated_at
        BEFORE UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- SCHEMA: vehicles
-- Vehículos registrados por los clientes
-- ================================================================

CREATE SCHEMA IF NOT EXISTS vehicles;

CREATE TABLE IF NOT EXISTS vehicles.vehicles (
    id           VARCHAR(50)   PRIMARY KEY,
    user_id      VARCHAR(50)   NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    brand        VARCHAR(100)  NOT NULL,
    model        VARCHAR(100)  NOT NULL,
    plate        VARCHAR(20)   UNIQUE NOT NULL,
    vehicle_type vehicle_type  NOT NULL,
    color        VARCHAR(50),
    year         INTEGER       CHECK (year BETWEEN 1900 AND 2100),
    owner_name   VARCHAR(255)  NOT NULL,
    owner_phone  VARCHAR(50),
    is_active    BOOLEAN       NOT NULL DEFAULT true,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id
    ON vehicles.vehicles (user_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate
    ON vehicles.vehicles (plate);

CREATE INDEX IF NOT EXISTS idx_vehicles_active
    ON vehicles.vehicles (user_id, is_active);

DO $$ BEGIN
    CREATE TRIGGER trg_vehicles_updated_at
        BEFORE UPDATE ON vehicles.vehicles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- SCHEMA: reservations
-- Servicios ofrecidos, horarios, reservas, calificaciones y evidencias
-- ================================================================

CREATE SCHEMA IF NOT EXISTS reservations;

-- Catálogo de servicios de lavado
CREATE TABLE IF NOT EXISTS reservations.services (
    id           VARCHAR(50)    PRIMARY KEY,
    name         VARCHAR(255)   NOT NULL,
    description  TEXT,
    duration     INTEGER        NOT NULL CHECK (duration > 0),  -- minutos
    price        DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    vehicle_type vehicle_type   NOT NULL,
    is_active    BOOLEAN        NOT NULL DEFAULT true,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_active_type
    ON reservations.services (vehicle_type, is_active);

DO $$ BEGIN
    CREATE TRIGGER trg_services_updated_at
        BEFORE UPDATE ON reservations.services
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bloques horarios disponibles por día
CREATE TABLE IF NOT EXISTS reservations.time_slots (
    id          VARCHAR(50)  PRIMARY KEY,
    date        DATE         NOT NULL,
    time        VARCHAR(10)  NOT NULL,
    capacity    INTEGER      NOT NULL DEFAULT 3 CHECK (capacity > 0),
    reserved    INTEGER      NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    is_available BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (date, time),
    CONSTRAINT chk_reserved_lte_capacity CHECK (reserved <= capacity)
);

CREATE INDEX IF NOT EXISTS idx_time_slots_date
    ON reservations.time_slots (date, is_available);

DO $$ BEGIN
    CREATE TRIGGER trg_time_slots_updated_at
        BEFORE UPDATE ON reservations.time_slots
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reservas de servicio
CREATE TABLE IF NOT EXISTS reservations.reservations (
    id               VARCHAR(50)        PRIMARY KEY,
    user_id          VARCHAR(50)        NOT NULL REFERENCES auth.users (id),
    vehicle_id       VARCHAR(50)        NOT NULL REFERENCES vehicles.vehicles (id),
    service_id       VARCHAR(50)        NOT NULL REFERENCES reservations.services (id),
    washer_id        VARCHAR(50)        REFERENCES auth.users (id),
    scheduled_date   DATE               NOT NULL,
    scheduled_time   VARCHAR(10)        NOT NULL,
    status           reservation_status NOT NULL DEFAULT 'PENDING',
    total_amount     DECIMAL(10, 2)     NOT NULL CHECK (total_amount >= 0),
    notes            TEXT,
    address          TEXT,
    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,
    started_at       TIMESTAMP,
    completed_at     TIMESTAMP,
    estimated_arrival TIMESTAMP,
    created_at       TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id
    ON reservations.reservations (user_id, status);

CREATE INDEX IF NOT EXISTS idx_reservations_washer_id
    ON reservations.reservations (washer_id, status)
    WHERE washer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_scheduled_date
    ON reservations.reservations (scheduled_date, status);

DO $$ BEGIN
    CREATE TRIGGER trg_reservations_updated_at
        BEFORE UPDATE ON reservations.reservations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Evidencias fotográficas del servicio (antes/después)
CREATE TABLE IF NOT EXISTS reservations.service_proofs (
    id             VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL
        REFERENCES reservations.reservations (id) ON DELETE CASCADE,
    before_photos  TEXT[],
    after_photos   TEXT[],
    notes          TEXT,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
    CREATE TRIGGER trg_service_proofs_updated_at
        BEFORE UPDATE ON reservations.service_proofs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Calificaciones de servicio
CREATE TABLE IF NOT EXISTS reservations.ratings (
    id             VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL
        REFERENCES reservations.reservations (id) ON DELETE CASCADE,
    user_id        VARCHAR(50) NOT NULL REFERENCES auth.users (id),
    washer_id      VARCHAR(50) NOT NULL REFERENCES auth.users (id),
    stars          INTEGER     NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment        TEXT,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ratings_washer_id
    ON reservations.ratings (washer_id, stars);

-- ================================================================
-- SCHEMA: payments
-- Pagos asociados a reservas
-- ================================================================

CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE IF NOT EXISTS payments.payments (
    id                    VARCHAR(50)     PRIMARY KEY,
    reservation_id        VARCHAR(50)     NOT NULL
        REFERENCES reservations.reservations (id),
    user_id               VARCHAR(50)     NOT NULL REFERENCES auth.users (id),
    amount                DECIMAL(10, 2)  NOT NULL CHECK (amount >= 0),
    payment_method        payment_method  NOT NULL,
    status                payment_status  NOT NULL DEFAULT 'PENDING',
    transaction_id        VARCHAR(255),
    stripe_payment_intent VARCHAR(255),
    notes                 TEXT,
    created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation_id
    ON payments.payments (reservation_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id
    ON payments.payments (user_id, status);

DO $$ BEGIN
    CREATE TRIGGER trg_payments_updated_at
        BEFORE UPDATE ON payments.payments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- SCHEMA: notifications
-- Notificaciones push y mensajes de chat
-- ================================================================

CREATE SCHEMA IF NOT EXISTS notifications;

CREATE TABLE IF NOT EXISTS notifications.notifications (
    id         VARCHAR(50)       PRIMARY KEY,
    user_id    VARCHAR(50)       NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    title      VARCHAR(255)      NOT NULL,
    message    TEXT              NOT NULL,
    type       notification_type NOT NULL DEFAULT 'INFO',
    is_read    BOOLEAN           NOT NULL DEFAULT false,
    action_url VARCHAR(500),
    metadata   JSONB,
    created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice parcial: solo notificaciones no leídas (las más consultadas)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications.notifications (user_id, created_at DESC)
    WHERE is_read = false;

CREATE TABLE IF NOT EXISTS notifications.messages (
    id          VARCHAR(50) PRIMARY KEY,
    sender_id   VARCHAR(50) NOT NULL REFERENCES auth.users (id),
    sender_role VARCHAR(20),
    receiver_id VARCHAR(50) NOT NULL REFERENCES auth.users (id),
    content     TEXT        NOT NULL,
    read        BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON notifications.messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
    ON notifications.messages (receiver_id, read)
    WHERE read = false;
