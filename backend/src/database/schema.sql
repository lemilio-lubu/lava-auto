-- ================================================================
-- Body Shop — Schema Unificado v2.0
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
    CREATE TYPE user_role AS ENUM ('ADMIN', 'CLIENT', 'EMPLOYEE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migración: renombrar WASHER → EMPLOYEE (idempotente — falla silenciosamente si
-- WASHER no existe o EMPLOYEE ya existe)
DO $$ BEGIN
    ALTER TYPE user_role RENAME VALUE 'WASHER' TO 'EMPLOYEE';
EXCEPTION
    WHEN invalid_parameter_value THEN NULL;  -- 'WASHER' ya no existe
    WHEN duplicate_object        THEN NULL;  -- 'EMPLOYEE' ya existe
END $$;

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
    identification      VARCHAR(20),
    city                VARCHAR(100),
    province            VARCHAR(100),
    company             VARCHAR(255),
    is_available        BOOLEAN           NOT NULL DEFAULT false,
    rating              DOUBLE PRECISION  NOT NULL DEFAULT 5.0 CHECK (rating BETWEEN 0 AND 5),
    completed_services  INTEGER           NOT NULL DEFAULT 0 CHECK (completed_services >= 0),
    must_change_password BOOLEAN          NOT NULL DEFAULT false,
    totp_secret         VARCHAR(255),
    totp_enabled        BOOLEAN          NOT NULL DEFAULT false,
    created_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS identification    VARCHAR(20);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS city             VARCHAR(100);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS province         VARCHAR(100);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS company          VARCHAR(255);

DO $$ BEGIN
    ALTER TABLE auth.users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE auth.users ADD COLUMN totp_secret VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE auth.users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_auth_users_email
    ON auth.users (email);

CREATE INDEX IF NOT EXISTS idx_auth_users_role
    ON auth.users (role);

-- Índice parcial: solo indexa técnicos disponibles
CREATE INDEX IF NOT EXISTS idx_auth_users_available_employees
    ON auth.users (is_available)
    WHERE role = 'EMPLOYEE';

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

-- ================================================================
-- SCHEMA: catalog
-- Catálogos del módulo de Órdenes de Trabajo
-- ================================================================

CREATE SCHEMA IF NOT EXISTS catalog;

-- Marcas de vehículo
CREATE TABLE IF NOT EXISTS catalog.brands (
    id         VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_brands_updated_at
        BEFORE UPDATE ON catalog.brands
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Modelos de vehículo
CREATE TABLE IF NOT EXISTS catalog.models (
    id         VARCHAR(50)  PRIMARY KEY,
    brand_id   VARCHAR(50)  NOT NULL REFERENCES catalog.brands(id),
    name       VARCHAR(100) NOT NULL,
    year_from  SMALLINT,
    year_to    SMALLINT,
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_models_brand_id
    ON catalog.models (brand_id);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_models_updated_at
        BEFORE UPDATE ON catalog.models
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipos de combustible
CREATE TABLE IF NOT EXISTS catalog.fuel_types (
    id         VARCHAR(50) PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    is_active  BOOLEAN     NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_fuel_types_updated_at
        BEFORE UPDATE ON catalog.fuel_types
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Categorías de repuestos
CREATE TABLE IF NOT EXISTS catalog.spare_part_categories (
    id         VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_spare_part_categories_updated_at
        BEFORE UPDATE ON catalog.spare_part_categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Repuestos
CREATE TABLE IF NOT EXISTS catalog.spare_parts (
    id             VARCHAR(50)    PRIMARY KEY,
    category_id    VARCHAR(50)    REFERENCES catalog.spare_part_categories(id),
    name           VARCHAR(150)   NOT NULL,
    part_number    VARCHAR(100),
    unit           VARCHAR(30)    NOT NULL DEFAULT 'unidad',
    unit_price     DECIMAL(10,2)  NOT NULL DEFAULT 0,
    stock_quantity INTEGER        NOT NULL DEFAULT 0,
    min_stock      INTEGER        NOT NULL DEFAULT 0,
    is_active      BOOLEAN        NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_spare_parts_category_id
    ON catalog.spare_parts (category_id);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_spare_parts_updated_at
        BEFORE UPDATE ON catalog.spare_parts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipos de servicio
CREATE TABLE IF NOT EXISTS catalog.service_types (
    id          VARCHAR(50)  PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_service_types_updated_at
        BEFORE UPDATE ON catalog.service_types
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tarifas de mano de obra
CREATE TABLE IF NOT EXISTS catalog.labor_rates (
    id           VARCHAR(50)   PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    description  TEXT,
    rate_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active    BOOLEAN       NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_labor_rates_updated_at
        BEFORE UPDATE ON catalog.labor_rates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Especialidades de empleados
CREATE TABLE IF NOT EXISTS catalog.employee_specialties (
    id          VARCHAR(50)  PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE catalog.employee_specialties ADD COLUMN description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_employee_specialties_updated_at
        BEFORE UPDATE ON catalog.employee_specialties
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tasas de impuesto
CREATE TABLE IF NOT EXISTS catalog.tax_rates (
    id         VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    is_default BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE catalog.tax_rates ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_tax_rates_updated_at
        BEFORE UPDATE ON catalog.tax_rates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Configuración de numeración de órdenes de trabajo
CREATE TABLE IF NOT EXISTS catalog.order_number_config (
    id          VARCHAR(50)  PRIMARY KEY,
    prefix      VARCHAR(10)  NOT NULL DEFAULT 'OT',
    next_number INTEGER      NOT NULL DEFAULT 1,
    padding     INTEGER      NOT NULL DEFAULT 5,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_order_number_config_updated_at
        BEFORE UPDATE ON catalog.order_number_config
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO catalog.order_number_config (id, prefix, next_number, padding)
VALUES ('onc_default', 'OT', 1, 5)
ON CONFLICT (id) DO NOTHING;

-- Asignaciones de especialidades a empleados
CREATE TABLE IF NOT EXISTS catalog.employee_specialty_assignments (
    employee_id  VARCHAR(50) NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    specialty_id VARCHAR(50) NOT NULL REFERENCES catalog.employee_specialties(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (employee_id, specialty_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_emp_specialty_employee_id
    ON catalog.employee_specialty_assignments (employee_id);

-- Catalog FK columns en vehicles.vehicles
-- (van aquí porque catalog schema debe existir antes de referenciar sus tablas)
DO $$ BEGIN
    ALTER TABLE vehicles.vehicles ADD COLUMN brand_id VARCHAR(50) REFERENCES catalog.brands(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE vehicles.vehicles ADD COLUMN model_id VARCHAR(50) REFERENCES catalog.models(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE vehicles.vehicles ADD COLUMN fuel_type_id VARCHAR(50) REFERENCES catalog.fuel_types(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ================================================================
-- SCHEMA: work_orders
-- Órdenes de trabajo, mano de obra, repuestos, fotos e historial
-- ================================================================
CREATE SCHEMA IF NOT EXISTS work_orders;

-- ENUMs para órdenes de trabajo
DO $$ BEGIN
    CREATE TYPE work_order_status AS ENUM (
        'DRAFT', 'OPEN', 'DIAGNOSING', 'PENDING_APPROVAL',
        'IN_REPAIR', 'COMPLETED', 'INVOICED', 'DELIVERED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE work_order_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE photo_type AS ENUM ('BEFORE', 'DURING', 'AFTER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla principal de órdenes de trabajo
CREATE TABLE IF NOT EXISTS work_orders.work_orders (
    id                   VARCHAR(50)          PRIMARY KEY,
    order_number         VARCHAR(20)          NOT NULL UNIQUE,
    client_id            VARCHAR(50)          NOT NULL REFERENCES auth.users(id),
    vehicle_id           VARCHAR(50)          NOT NULL REFERENCES vehicles.vehicles(id),
    technician_id        VARCHAR(50)          REFERENCES auth.users(id),
    status               work_order_status    NOT NULL DEFAULT 'DRAFT',
    priority             work_order_priority  NOT NULL DEFAULT 'NORMAL',
    mileage              INTEGER,
    problem_description  TEXT,
    diagnosis            TEXT,
    recommendations      TEXT,
    internal_notes       TEXT,
    estimated_cost       DECIMAL(10,2)        DEFAULT 0,
    final_cost           DECIMAL(10,2)        DEFAULT 0,
    discount_amount      DECIMAL(10,2)        DEFAULT 0,
    tax_amount           DECIMAL(10,2)        DEFAULT 0,
    total_amount         DECIMAL(10,2)        DEFAULT 0,
    approved_by          VARCHAR(50)          REFERENCES auth.users(id),
    approved_at          TIMESTAMPTZ,
    invoiced_at          TIMESTAMPTZ,
    delivered_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_work_orders_updated_at
        BEFORE UPDATE ON work_orders.work_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Líneas de mano de obra
CREATE TABLE IF NOT EXISTS work_orders.work_order_labor (
    id               VARCHAR(50)   PRIMARY KEY,
    work_order_id    VARCHAR(50)   NOT NULL REFERENCES work_orders.work_orders(id) ON DELETE CASCADE,
    technician_id    VARCHAR(50)   REFERENCES auth.users(id),
    labor_rate_id    VARCHAR(50)   REFERENCES catalog.labor_rates(id),
    description      VARCHAR(255)  NOT NULL,
    hours            DECIMAL(6,2)  NOT NULL DEFAULT 0,
    rate_per_hour    DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Líneas de repuestos
CREATE TABLE IF NOT EXISTS work_orders.work_order_parts (
    id              VARCHAR(50)   PRIMARY KEY,
    work_order_id   VARCHAR(50)   NOT NULL REFERENCES work_orders.work_orders(id) ON DELETE CASCADE,
    spare_part_id   VARCHAR(50)   REFERENCES catalog.spare_parts(id),
    description     VARCHAR(255)  NOT NULL,
    quantity        DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Evidencia fotográfica
CREATE TABLE IF NOT EXISTS work_orders.work_order_photos (
    id              VARCHAR(50)   PRIMARY KEY,
    work_order_id   VARCHAR(50)   NOT NULL REFERENCES work_orders.work_orders(id) ON DELETE CASCADE,
    photo_url       TEXT          NOT NULL,
    photo_type      photo_type    NOT NULL DEFAULT 'BEFORE',
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Historial de cambios de estado
CREATE TABLE IF NOT EXISTS work_orders.work_order_status_history (
    id              VARCHAR(50)          PRIMARY KEY,
    work_order_id   VARCHAR(50)          NOT NULL REFERENCES work_orders.work_orders(id) ON DELETE CASCADE,
    from_status     work_order_status,
    to_status       work_order_status    NOT NULL,
    changed_by      VARCHAR(50)          NOT NULL REFERENCES auth.users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- Facturas
CREATE TABLE IF NOT EXISTS work_orders.invoices (
    id               VARCHAR(50)   PRIMARY KEY,
    work_order_id    VARCHAR(50)   NOT NULL UNIQUE REFERENCES work_orders.work_orders(id),
    invoice_number   VARCHAR(30)   NOT NULL UNIQUE,
    issued_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    due_at           TIMESTAMPTZ,
    subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
    total            DECIMAL(10,2) NOT NULL DEFAULT 0,
    pdf_url          TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wo_client      ON work_orders.work_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_wo_vehicle     ON work_orders.work_orders (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_wo_technician  ON work_orders.work_orders (technician_id);
CREATE INDEX IF NOT EXISTS idx_wo_status      ON work_orders.work_orders (status);
CREATE INDEX IF NOT EXISTS idx_wo_created     ON work_orders.work_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wo_labor_wo    ON work_orders.work_order_labor (work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_parts_wo    ON work_orders.work_order_parts (work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_history_wo  ON work_orders.work_order_status_history (work_order_id);

-- ================================================================
-- Service templates (catalog for work order services)
-- ================================================================

CREATE TABLE IF NOT EXISTS catalog.service_labor_templates (
    id              VARCHAR(50)   PRIMARY KEY,
    service_type_id VARCHAR(50)   NOT NULL REFERENCES catalog.service_types(id) ON DELETE CASCADE,
    description     VARCHAR(255)  NOT NULL,
    default_hours   DECIMAL(6,2)  NOT NULL DEFAULT 1,
    sort_order      INTEGER       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_slt_updated_at
        BEFORE UPDATE ON catalog.service_labor_templates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS catalog.service_part_templates (
    id               VARCHAR(50)   PRIMARY KEY,
    service_type_id  VARCHAR(50)   NOT NULL REFERENCES catalog.service_types(id) ON DELETE CASCADE,
    spare_part_id    VARCHAR(50)   REFERENCES catalog.spare_parts(id),
    description      VARCHAR(255)  NOT NULL,
    default_quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    sort_order       INTEGER       NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_catalog_spt_updated_at
        BEFORE UPDATE ON catalog.service_part_templates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_slt_service_type ON catalog.service_labor_templates (service_type_id);
CREATE INDEX IF NOT EXISTS idx_spt_service_type ON catalog.service_part_templates (service_type_id);

-- ================================================================
-- Work order services (links a work order to one or more services)
-- ================================================================

CREATE TABLE IF NOT EXISTS work_orders.work_order_services (
    id              VARCHAR(50)   PRIMARY KEY,
    work_order_id   VARCHAR(50)   NOT NULL REFERENCES work_orders.work_orders(id) ON DELETE CASCADE,
    service_type_id VARCHAR(50)   REFERENCES catalog.service_types(id),
    name            VARCHAR(255)  NOT NULL,
    description     TEXT,
    base_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    sort_order      INTEGER       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_wo_services_updated_at
        BEFORE UPDATE ON work_orders.work_order_services
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_wo_services_wo ON work_orders.work_order_services (work_order_id);

-- Add work_order_service_id FK to labor and parts (nullable — null means ungrouped direct item)
DO $$ BEGIN
    ALTER TABLE work_orders.work_order_labor
        ADD COLUMN work_order_service_id VARCHAR(50)
        REFERENCES work_orders.work_order_services(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE work_orders.work_order_parts
        ADD COLUMN work_order_service_id VARCHAR(50)
        REFERENCES work_orders.work_order_services(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Track sum of service base prices on the work order
DO $$ BEGIN
    ALTER TABLE work_orders.work_orders
        ADD COLUMN services_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
