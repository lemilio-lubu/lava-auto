-- Vehicle Service Database Schema
-- Database: lava_auto_vehicles

-- Create enum types
CREATE TYPE vehicle_type AS ENUM ('SEDAN', 'SUV', 'PICKUP', 'VAN', 'MOTORCYCLE');

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type vehicle_type NOT NULL,
    color VARCHAR(50),
    year INTEGER,
    owner_name VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
