-- Reservation Service Database Schema
-- Database: lava_auto_reservations

-- Create enum types
CREATE TYPE vehicle_type AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'VAN', 'MOTORCYCLE');
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    vehicle_type vehicle_type NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Slots table
CREATE TABLE IF NOT EXISTS time_slots (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    capacity INTEGER DEFAULT 3,
    reserved INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, time)
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    vehicle_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(50) NOT NULL REFERENCES services(id),
    washer_id VARCHAR(255),
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(10) NOT NULL,
    status reservation_status DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_arrival TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Proofs table
CREATE TABLE IF NOT EXISTS service_proofs (
    id VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    before_photos TEXT[],
    after_photos TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    washer_id VARCHAR(255) NOT NULL,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_vehicle_type ON services(vehicle_type);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_washer_id ON reservations(washer_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_scheduled_date ON reservations(scheduled_date);
CREATE INDEX idx_time_slots_date ON time_slots(date);
CREATE INDEX idx_ratings_washer_id ON ratings(washer_id);
CREATE INDEX idx_ratings_stars ON ratings(stars);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
    BEFORE UPDATE ON time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_proofs_updated_at
    BEFORE UPDATE ON service_proofs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
