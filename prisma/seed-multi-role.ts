import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed con sistema multi-rol...\n');

  // 1. ADMIN
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lavauto.com' },
    update: {},
    create: {
      email: 'admin@lavauto.com',
      password: adminPassword,
      name: 'Admin Lava-Auto',
      phone: '+52 555 000 0000',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin creado:', admin.email);

  // 2. CLIENTS (2 clientes con vehículos)
  const client1Password = await bcrypt.hash('cliente123', 10);
  const client1 = await prisma.user.upsert({
    where: { email: 'juan.perez@gmail.com' },
    update: {},
    create: {
      email: 'juan.perez@gmail.com',
      password: client1Password,
      name: 'Juan Pérez',
      phone: '+52 555 111 1111',
      role: UserRole.CLIENT,
      address: 'Escuela Politécnica Nacional, Quito, Ecuador',
    },
  });
  console.log('✅ Cliente 1 creado:', client1.email);

  // Vehículo de cliente 1
  const vehicle1 = await prisma.vehicle.create({
    data: {
      userId: client1.id,
      plate: 'ABC-123-A',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Blanco',
      vehicleType: 'SEDAN',
      ownerName: client1.name,
      ownerPhone: client1.phone,
    },
  });
  console.log('  🚗 Vehículo creado:', vehicle1.plate);

  const client2Password = await bcrypt.hash('cliente123', 10);
  const client2 = await prisma.user.upsert({
    where: { email: 'maria.garcia@gmail.com' },
    update: {},
    create: {
      email: 'maria.garcia@gmail.com',
      password: client2Password,
      name: 'María García',
      phone: '+52 555 222 2222',
      role: UserRole.CLIENT,
      address: 'Quicentro Shopping, Quito, Ecuador',
    },
  });
  console.log('✅ Cliente 2 creado:', client2.email);

  // Vehículo de cliente 2
  const vehicle2 = await prisma.vehicle.create({
    data: {
      userId: client2.id,
      plate: 'XYZ-789-B',
      brand: 'Honda',
      model: 'CR-V',
      year: 2022,
      color: 'Gris',
      vehicleType: 'SUV',
      ownerName: client2.name,
      ownerPhone: client2.phone,
    },
  });
  console.log('  🚗 Vehículo creado:', vehicle2.plate);

  // 3. WASHERS (2 lavadores con ubicación y disponibilidad)
  const washer1Password = await bcrypt.hash('lavador123', 10);
  const washer1 = await prisma.user.upsert({
    where: { email: 'carlos.wash@lavauto.com' },
    update: {},
    create: {
      email: 'carlos.wash@lavauto.com',
      password: washer1Password,
      name: 'Carlos Lavador',
      phone: '+52 555 333 3333',
      role: UserRole.WASHER,
      address: 'Condesa, CDMX',
      isAvailable: true,
      latitude: 19.4126, // Condesa, CDMX
      longitude: -99.1710,
      rating: 4.8,
      completedServices: 145,
    },
  });
  console.log('✅ Lavador 1 creado:', washer1.email, '⭐', washer1.rating);

  const washer2Password = await bcrypt.hash('lavador123', 10);
  const washer2 = await prisma.user.upsert({
    where: { email: 'pedro.wash@lavauto.com' },
    update: {},
    create: {
      email: 'pedro.wash@lavauto.com',
      password: washer2Password,
      name: 'Pedro Lavador',
      phone: '+52 555 444 4444',
      role: UserRole.WASHER,
      address: 'Roma Norte, CDMX',
      isAvailable: true,
      latitude: 19.4180, // Roma Norte, CDMX
      longitude: -99.1620,
      rating: 4.9,
      completedServices: 203,
    },
  });
  console.log('✅ Lavador 2 creado:', washer2.email, '⭐', washer2.rating);

  // 4. SERVICIOS
  // Eliminar servicios existentes para evitar conflictos
  await prisma.service.deleteMany({});
  
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Lavado Básico Sedan',
        description: 'Lavado exterior con shampoo y encerado',
        price: 150.0,
        duration: 30,
        vehicleType: 'SEDAN',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Lavado Premium SUV',
        description: 'Lavado completo interior y exterior, encerado y aspirado',
        price: 300.0,
        duration: 60,
        vehicleType: 'SUV',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Detallado Completo Sedan',
        description: 'Lavado profesional, pulido, encerado, limpieza profunda interior',
        price: 600.0,
        duration: 120,
        vehicleType: 'SEDAN',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Servicios creados:', services.length);

  // 5. RESERVA DE PRUEBA CON LAVADOR ASIGNADO
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const reservation = await prisma.reservation.create({
    data: {
      userId: client1.id,
      vehicleId: vehicle1.id,
      serviceId: services[1].id, // Lavado Premium SUV
      washerId: washer1.id, // Lavador asignado
      scheduledDate: tomorrow,
      scheduledTime: '10:00',
      status: 'CONFIRMED',
      totalAmount: 300.0,
      latitude: 19.4100,
      longitude: -99.1700,
      address: client1.address,
      notes: 'Por favor llegar puntual, tengo junta a las 11am',
    },
  });
  console.log('✅ Reserva creada:', reservation.id, 'con lavador asignado');

  // 6. NOTIFICACIÓN DE LAVADOR ASIGNADO
  await prisma.notification.create({
    data: {
      userId: client1.id,
      title: 'Lavador Asignado',
      message: `${washer1.name} (⭐ ${washer1.rating?.toFixed(1)}) ha sido asignado a tu reserva de mañana.`,
      type: 'WASHER_ASSIGNED',
      isRead: false,
      metadata: {
        reservationId: reservation.id,
        washerId: washer1.id,
        washerName: washer1.name,
        washerRating: washer1.rating,
      },
    },
  });
  console.log('  📩 Notificación enviada al cliente');

  console.log('\n🎉 Seed completado exitosamente!\n');
  console.log('📊 Resumen:');
  console.log('   - 1 Admin');
  console.log('   - 2 Clientes con vehículos');
  console.log('   - 2 Lavadores disponibles con ubicación');
  console.log('   - 3 Servicios activos');
  console.log('   - 1 Reserva confirmada con lavador asignado');
  console.log('\n🔐 Credenciales de prueba:');
  console.log('   Admin: admin@lavauto.com / admin123');
  console.log('   Cliente: juan.perez@gmail.com / cliente123');
  console.log('   Cliente: maria.garcia@gmail.com / cliente123');
  console.log('   Lavador: carlos.wash@lavauto.com / lavador123');
  console.log('   Lavador: pedro.wash@lavauto.com / lavador123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
