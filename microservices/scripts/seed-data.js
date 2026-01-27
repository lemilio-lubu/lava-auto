/**
 * Seed Test Data Script
 * Creates test users and sample data for development
 */

require('dotenv').config({ path: '../auth-service/.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const authPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'lava_auto_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const vehiclePool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'lava_auto_vehicles',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seedData() {
  try {
    console.log('🌱 Seeding test data...\n');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientPassword = await bcrypt.hash('client123', 10);
    const washerPassword = await bcrypt.hash('washer123', 10);

    // Create users
    const users = [
      { id: 'admin001', name: 'Admin User', email: 'admin@lavauto.com', password: adminPassword, role: 'ADMIN', phone: '5551234567' },
      { id: 'client001', name: 'Juan Pérez', email: 'cliente@test.com', password: clientPassword, role: 'CLIENT', phone: '5559876543' },
      { id: 'client002', name: 'María García', email: 'maria@test.com', password: clientPassword, role: 'CLIENT', phone: '5551112233' },
      { id: 'washer001', name: 'Carlos Lavador', email: 'lavador@test.com', password: washerPassword, role: 'WASHER', phone: '5554445566', is_available: true, rating: 4.8, completed_services: 150 },
      { id: 'washer002', name: 'Ana Limpieza', email: 'ana.washer@test.com', password: washerPassword, role: 'WASHER', phone: '5557778899', is_available: true, rating: 4.5, completed_services: 95 },
      { id: 'washer003', name: 'Luis Experto', email: 'luis.washer@test.com', password: washerPassword, role: 'WASHER', phone: '5556667788', is_available: true, rating: 4.9, completed_services: 220 },
    ];

    for (const user of users) {
      try {
        await authPool.query(`
          INSERT INTO users (id, name, email, password, phone, role, is_available, rating, completed_services)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (email) DO NOTHING
        `, [user.id, user.name, user.email, user.password, user.phone, user.role, user.is_available || false, user.rating || 5.0, user.completed_services || 0]);
        console.log(`✅ User created: ${user.email}`);
      } catch (err) {
        console.log(`⚠️  User ${user.email} already exists`);
      }
    }

    // Create vehicles
    const vehicles = [
      { id: 'veh001', user_id: 'client001', brand: 'Toyota', model: 'Corolla', plate: 'ABC123', vehicle_type: 'SEDAN', color: 'Blanco', year: 2022, owner_name: 'Juan Pérez', owner_phone: '5559876543' },
      { id: 'veh002', user_id: 'client001', brand: 'Honda', model: 'CR-V', plate: 'XYZ789', vehicle_type: 'SUV', color: 'Negro', year: 2021, owner_name: 'Juan Pérez', owner_phone: '5559876543' },
      { id: 'veh003', user_id: 'client002', brand: 'Ford', model: 'F-150', plate: 'DEF456', vehicle_type: 'PICKUP', color: 'Rojo', year: 2023, owner_name: 'María García', owner_phone: '5551112233' },
    ];

    for (const vehicle of vehicles) {
      try {
        await vehiclePool.query(`
          INSERT INTO vehicles (id, user_id, brand, model, plate, vehicle_type, color, year, owner_name, owner_phone)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (plate) DO NOTHING
        `, [vehicle.id, vehicle.user_id, vehicle.brand, vehicle.model, vehicle.plate, vehicle.vehicle_type, vehicle.color, vehicle.year, vehicle.owner_name, vehicle.owner_phone]);
        console.log(`✅ Vehicle created: ${vehicle.plate}`);
      } catch (err) {
        console.log(`⚠️  Vehicle ${vehicle.plate} already exists`);
      }
    }

    console.log('\n✨ Seed data completed!\n');
    console.log('Test Credentials:');
    console.log('  Admin:  admin@lavauto.com / admin123');
    console.log('  Client: cliente@test.com / client123');
    console.log('  Washer 1: lavador@test.com / washer123');
    console.log('  Washer 2: ana.washer@test.com / washer123');
    console.log('  Washer 3: luis.washer@test.com / washer123\n');

    await authPool.end();
    await vehiclePool.end();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedData();
