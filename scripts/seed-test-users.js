const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestUsers() {
  console.log('🌱 Creando usuarios de prueba...\n');

  try {
    // 1. Crear Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@lava-auto.com' },
      update: {},
      create: {
        email: 'admin@lava-auto.com',
        name: 'Admin Principal',
        password: adminPassword,
        phone: '5551234567',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin creado:', admin.email);

    // 2. Crear Clientes de Prueba
    const clientPassword = await bcrypt.hash('cliente123', 10);
    
    const cliente1 = await prisma.user.upsert({
      where: { email: 'cliente1@test.com' },
      update: {},
      create: {
        email: 'cliente1@test.com',
        name: 'Juan Pérez',
        password: clientPassword,
        phone: '5559876543',
        role: 'CLIENT',
        latitude: 19.4326,
        longitude: -99.1332,
        address: 'Av. Insurgentes Sur 123, CDMX',
      },
    });
    console.log('✅ Cliente 1 creado:', cliente1.email);

    const cliente2 = await prisma.user.upsert({
      where: { email: 'cliente2@test.com' },
      update: {},
      create: {
        email: 'cliente2@test.com',
        name: 'María González',
        password: clientPassword,
        phone: '5558765432',
        role: 'CLIENT',
        latitude: 19.3910,
        longitude: -99.2837,
        address: 'Calle Morelos 456, CDMX',
      },
    });
    console.log('✅ Cliente 2 creado:', cliente2.email);

    // 3. Crear Washers de Prueba
    const washerPassword = await bcrypt.hash('washer123', 10);

    const washer1 = await prisma.user.upsert({
      where: { email: 'washer1@test.com' },
      update: {},
      create: {
        email: 'washer1@test.com',
        name: 'Carlos Lavador',
        password: washerPassword,
        phone: '5557654321',
        role: 'WASHER',
        isAvailable: true,
        rating: 4.8,
        completedServices: 125,
        latitude: 19.4200,
        longitude: -99.1500,
        address: 'Zona Centro, CDMX',
      },
    });
    console.log('✅ Washer 1 creado:', washer1.email);

    const washer2 = await prisma.user.upsert({
      where: { email: 'washer2@test.com' },
      update: {},
      create: {
        email: 'washer2@test.com',
        name: 'Luis Detallador',
        password: washerPassword,
        phone: '5556543210',
        role: 'WASHER',
        isAvailable: true,
        rating: 4.9,
        completedServices: 200,
        latitude: 19.3700,
        longitude: -99.2500,
        address: 'Zona Sur, CDMX',
      },
    });
    console.log('✅ Washer 2 creado:', washer2.email);

    // 4. Crear vehículos para clientes
    const vehicle1 = await prisma.vehicle.upsert({
      where: { plate: 'ABC-123-XYZ' },
      update: {},
      create: {
        userId: cliente1.id,
        ownerName: cliente1.name,
        ownerPhone: cliente1.phone,
        brand: 'Toyota',
        model: 'Corolla',
        plate: 'ABC-123-XYZ',
        vehicleType: 'SEDAN',
        color: 'Blanco',
        year: 2020,
        isActive: true,
      },
    });
    console.log('✅ Vehículo 1 creado:', vehicle1.plate);

    const vehicle2 = await prisma.vehicle.upsert({
      where: { plate: 'XYZ-789-ABC' },
      update: {},
      create: {
        userId: cliente1.id,
        ownerName: cliente1.name,
        ownerPhone: cliente1.phone,
        brand: 'Honda',
        model: 'CR-V',
        plate: 'XYZ-789-ABC',
        vehicleType: 'SUV',
        color: 'Negro',
        year: 2021,
        isActive: true,
      },
    });
    console.log('✅ Vehículo 2 creado:', vehicle2.plate);

    const vehicle3 = await prisma.vehicle.upsert({
      where: { plate: 'DEF-456-GHI' },
      update: {},
      create: {
        userId: cliente2.id,
        ownerName: cliente2.name,
        ownerPhone: cliente2.phone,
        brand: 'Nissan',
        model: 'Sentra',
        plate: 'DEF-456-GHI',
        vehicleType: 'SEDAN',
        color: 'Gris',
        year: 2019,
        isActive: true,
      },
    });
    console.log('✅ Vehículo 3 creado:', vehicle3.plate);

    // 5. Crear servicios si no existen
    const servicios = [
      {
        name: 'Lavado Básico',
        description: 'Lavado exterior completo',
        duration: 30,
        price: 150,
        vehicleType: 'SEDAN',
      },
      {
        name: 'Lavado Premium',
        description: 'Lavado exterior + interior',
        duration: 60,
        price: 250,
        vehicleType: 'SEDAN',
      },
      {
        name: 'Lavado SUV',
        description: 'Lavado completo para SUV',
        duration: 45,
        price: 300,
        vehicleType: 'SUV',
      },
    ];

    for (const servicio of servicios) {
      await prisma.service.upsert({
        where: { 
          name_vehicleType: { 
            name: servicio.name,
            vehicleType: servicio.vehicleType 
          } 
        },
        update: {},
        create: servicio,
      });
      console.log(`✅ Servicio creado: ${servicio.name}`);
    }

    console.log('\n✅ Seed completado exitosamente!\n');
    console.log('📋 Credenciales de prueba:');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│ ADMIN:                                      │');
    console.log('│   Email: admin@lava-auto.com                │');
    console.log('│   Pass:  admin123                           │');
    console.log('├─────────────────────────────────────────────┤');
    console.log('│ CLIENTES:                                   │');
    console.log('│   Email: cliente1@test.com                  │');
    console.log('│   Email: cliente2@test.com                  │');
    console.log('│   Pass:  cliente123                         │');
    console.log('├─────────────────────────────────────────────┤');
    console.log('│ WASHERS:                                    │');
    console.log('│   Email: washer1@test.com                   │');
    console.log('│   Email: washer2@test.com                   │');
    console.log('│   Pass:  washer123                          │');
    console.log('└─────────────────────────────────────────────┘\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

seedTestUsers()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
