-- Seed data for Vehicle Service
-- This file contains sample vehicles for testing

INSERT INTO vehicles (id, user_id, brand, model, plate, year, color, vehicle_type, created_at, updated_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Toyota', 'Corolla', 'ABC-1234', 2020, 'Blanco', 'SEDAN', NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Chevrolet', 'Tracker', 'XYZ-5678', 2022, 'Negro', 'SUV', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
