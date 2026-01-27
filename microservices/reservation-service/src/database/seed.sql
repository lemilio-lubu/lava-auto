-- Seed Data for Reservation Service
-- Default Services

INSERT INTO services (id, name, description, duration, price, vehicle_type, is_active) VALUES
('svc_sedan_basic', 'Lavado Básico Sedán', 'Lavado exterior con agua a presión, jabón especial y secado', 30, 150.00, 'SEDAN', true),
('svc_sedan_complete', 'Lavado Completo Sedán', 'Lavado exterior e interior, aspirado y limpieza de vidrios', 60, 250.00, 'SEDAN', true),
('svc_sedan_premium', 'Lavado Premium Sedán', 'Lavado completo más encerado y acondicionador de llantas', 90, 400.00, 'SEDAN', true),
('svc_suv_basic', 'Lavado Básico SUV', 'Lavado exterior con agua a presión, jabón especial y secado', 45, 200.00, 'SUV', true),
('svc_suv_complete', 'Lavado Completo SUV', 'Lavado exterior e interior, aspirado y limpieza de vidrios', 75, 350.00, 'SUV', true),
('svc_suv_premium', 'Lavado Premium SUV', 'Lavado completo más encerado y acondicionador de llantas', 120, 500.00, 'SUV', true),
('svc_pickup_basic', 'Lavado Básico Pickup', 'Lavado exterior con agua a presión, jabón especial y secado', 45, 200.00, 'PICKUP', true),
('svc_pickup_complete', 'Lavado Completo Pickup', 'Lavado exterior e interior, aspirado y limpieza de vidrios', 75, 350.00, 'PICKUP', true),
('svc_van_basic', 'Lavado Básico Van', 'Lavado exterior con agua a presión, jabón especial y secado', 60, 250.00, 'VAN', true),
('svc_van_complete', 'Lavado Completo Van', 'Lavado exterior e interior, aspirado y limpieza de vidrios', 90, 450.00, 'VAN', true),
('svc_moto_basic', 'Lavado Básico Moto', 'Lavado completo de motocicleta', 20, 80.00, 'MOTORCYCLE', true),
('svc_moto_premium', 'Lavado Premium Moto', 'Lavado completo con cera y brillo especial', 40, 150.00, 'MOTORCYCLE', true)
ON CONFLICT (id) DO NOTHING;
