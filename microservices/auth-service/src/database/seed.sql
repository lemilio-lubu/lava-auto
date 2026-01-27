-- Seed data for Auth Service
-- This file is executed after schema.sql when the container starts

-- Insert test users (passwords are bcrypt hashed: 'admin123', 'client123', 'washer123')
INSERT INTO users (id, email, name, password, phone, role, is_available, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@lavauto.com', 'Administrador', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu.lq', '0999999999', 'ADMIN', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'cliente@test.com', 'Cliente de Prueba', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu.lq', '0988888888', 'CLIENT', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'lavador@test.com', 'Lavador de Prueba', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu.lq', '0977777777', 'WASHER', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
