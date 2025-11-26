import { PrismaClient, VehicleType, ReservationStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (en orden correcto por dependencias)
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.message.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Datos anteriores eliminados');

  // ============ USUARIOS (30 usuarios) ============
  const hashedPassword = await bcrypt.hash('password123', 10);

  const usersData = [
    // Administradores
    { name: 'Admin Principal', email: 'admin@lavauto.com', phone: '555-0001' },
    { name: 'Super Admin', email: 'superadmin@lavauto.com', phone: '555-0002' },
    
    // Empleados
    { name: 'Carlos Mendoza', email: 'carlos.mendoza@lavauto.com', phone: '555-1001' },
    { name: 'María López', email: 'maria.lopez@lavauto.com', phone: '555-1002' },
    { name: 'Juan Pérez', email: 'juan.perez@lavauto.com', phone: '555-1003' },
    { name: 'Ana García', email: 'ana.garcia@lavauto.com', phone: '555-1004' },
    { name: 'Roberto Sánchez', email: 'roberto.sanchez@lavauto.com', phone: '555-1005' },
    
    // Clientes/Usuarios regulares
    { name: 'Laura Martínez', email: 'laura.martinez@gmail.com', phone: '555-2001' },
    { name: 'Diego Fernández', email: 'diego.fernandez@gmail.com', phone: '555-2002' },
    { name: 'Carmen Ruiz', email: 'carmen.ruiz@outlook.com', phone: '555-2003' },
    { name: 'Pedro Gómez', email: 'pedro.gomez@gmail.com', phone: '555-2004' },
    { name: 'Sofía Torres', email: 'sofia.torres@hotmail.com', phone: '555-2005' },
    { name: 'Miguel Ángel Díaz', email: 'miguel.diaz@gmail.com', phone: '555-2006' },
    { name: 'Elena Moreno', email: 'elena.moreno@yahoo.com', phone: '555-2007' },
    { name: 'Francisco Jiménez', email: 'francisco.jimenez@gmail.com', phone: '555-2008' },
    { name: 'Isabel Romero', email: 'isabel.romero@outlook.com', phone: '555-2009' },
    { name: 'Antonio Navarro', email: 'antonio.navarro@gmail.com', phone: '555-2010' },
    { name: 'Lucía Domínguez', email: 'lucia.dominguez@hotmail.com', phone: '555-2011' },
    { name: 'Manuel Vázquez', email: 'manuel.vazquez@gmail.com', phone: '555-2012' },
    { name: 'Patricia Castro', email: 'patricia.castro@yahoo.com', phone: '555-2013' },
    { name: 'Javier Ortiz', email: 'javier.ortiz@gmail.com', phone: '555-2014' },
    { name: 'Rosa Muñoz', email: 'rosa.munoz@outlook.com', phone: '555-2015' },
    { name: 'David Álvarez', email: 'david.alvarez@gmail.com', phone: '555-2016' },
    { name: 'Teresa Marín', email: 'teresa.marin@hotmail.com', phone: '555-2017' },
    { name: 'Raúl Herrera', email: 'raul.herrera@gmail.com', phone: '555-2018' },
    { name: 'Beatriz Molina', email: 'beatriz.molina@yahoo.com', phone: '555-2019' },
    { name: 'Andrés Vargas', email: 'andres.vargas@gmail.com', phone: '555-2020' },
    { name: 'Mónica Reyes', email: 'monica.reyes@outlook.com', phone: '555-2021' },
    { name: 'Fernando Silva', email: 'fernando.silva@gmail.com', phone: '555-2022' },
    { name: 'Claudia Ramos', email: 'claudia.ramos@hotmail.com', phone: '555-2023' },
  ];

  const users = await Promise.all(
    usersData.map((user) =>
      prisma.user.create({
        data: {
          ...user,
          password: hashedPassword,
        },
      })
    )
  );

  console.log(`✅ ${users.length} usuarios creados`);

  // ============ SERVICIOS (24 servicios) ============
  const servicesData = [
    // Servicios para SEDAN
    { name: 'Lavado Básico Sedán', description: 'Lavado exterior con agua y jabón biodegradable', duration: 30, price: 80.00, vehicleType: VehicleType.SEDAN },
    { name: 'Lavado Completo Sedán', description: 'Lavado exterior e interior completo con aspirado', duration: 60, price: 150.00, vehicleType: VehicleType.SEDAN },
    { name: 'Lavado Premium Sedán', description: 'Lavado completo + encerado + aromatización', duration: 90, price: 250.00, vehicleType: VehicleType.SEDAN },
    { name: 'Detallado Completo Sedán', description: 'Servicio completo de detallado interior y exterior con pulido', duration: 180, price: 500.00, vehicleType: VehicleType.SEDAN },
    
    // Servicios para SUV
    { name: 'Lavado Básico SUV', description: 'Lavado exterior con agua y jabón biodegradable', duration: 40, price: 100.00, vehicleType: VehicleType.SUV },
    { name: 'Lavado Completo SUV', description: 'Lavado exterior e interior completo con aspirado', duration: 75, price: 180.00, vehicleType: VehicleType.SUV },
    { name: 'Lavado Premium SUV', description: 'Lavado completo + encerado + aromatización', duration: 105, price: 300.00, vehicleType: VehicleType.SUV },
    { name: 'Detallado Completo SUV', description: 'Servicio completo de detallado interior y exterior con pulido', duration: 210, price: 650.00, vehicleType: VehicleType.SUV },
    
    // Servicios para PICKUP
    { name: 'Lavado Básico Pickup', description: 'Lavado exterior con agua y jabón biodegradable', duration: 45, price: 110.00, vehicleType: VehicleType.PICKUP },
    { name: 'Lavado Completo Pickup', description: 'Lavado exterior e interior completo con aspirado', duration: 80, price: 200.00, vehicleType: VehicleType.PICKUP },
    { name: 'Lavado Premium Pickup', description: 'Lavado completo + encerado + aromatización + lavado de caja', duration: 120, price: 350.00, vehicleType: VehicleType.PICKUP },
    { name: 'Detallado Completo Pickup', description: 'Servicio completo de detallado interior y exterior con pulido', duration: 240, price: 700.00, vehicleType: VehicleType.PICKUP },
    
    // Servicios para VAN
    { name: 'Lavado Básico Van', description: 'Lavado exterior con agua y jabón biodegradable', duration: 50, price: 120.00, vehicleType: VehicleType.VAN },
    { name: 'Lavado Completo Van', description: 'Lavado exterior e interior completo con aspirado', duration: 90, price: 220.00, vehicleType: VehicleType.VAN },
    { name: 'Lavado Premium Van', description: 'Lavado completo + encerado + aromatización', duration: 130, price: 380.00, vehicleType: VehicleType.VAN },
    { name: 'Detallado Completo Van', description: 'Servicio completo de detallado interior y exterior con pulido', duration: 270, price: 800.00, vehicleType: VehicleType.VAN },
    
    // Servicios para MOTORCYCLE
    { name: 'Lavado Básico Moto', description: 'Lavado completo de motocicleta', duration: 20, price: 50.00, vehicleType: VehicleType.MOTORCYCLE },
    { name: 'Lavado Premium Moto', description: 'Lavado + encerado + pulido de cromados', duration: 45, price: 120.00, vehicleType: VehicleType.MOTORCYCLE },
    { name: 'Detallado Moto', description: 'Detallado completo con protección de pintura', duration: 90, price: 250.00, vehicleType: VehicleType.MOTORCYCLE },
    
    // Servicios adicionales (todos los tipos)
    { name: 'Encerado Express', description: 'Aplicación rápida de cera protectora', duration: 30, price: 100.00, vehicleType: VehicleType.SEDAN },
    { name: 'Limpieza de Motor', description: 'Desengrase y limpieza del compartimento del motor', duration: 45, price: 150.00, vehicleType: VehicleType.SEDAN },
    { name: 'Tratamiento de Piel', description: 'Limpieza y acondicionado de asientos de piel', duration: 60, price: 200.00, vehicleType: VehicleType.SUV },
    { name: 'Pulido de Faros', description: 'Restauración de faros opacos', duration: 40, price: 180.00, vehicleType: VehicleType.SEDAN },
    { name: 'Desodorización con Ozono', description: 'Eliminación de olores con tratamiento de ozono', duration: 30, price: 120.00, vehicleType: VehicleType.SUV },
  ];

  const services = await Promise.all(
    servicesData.map((service) =>
      prisma.service.create({
        data: service,
      })
    )
  );

  console.log(`✅ ${services.length} servicios creados`);

  // ============ VEHÍCULOS (40 vehículos) ============
  const vehiclesData = [
    // Sedanes
    { ownerName: 'Laura Martínez', ownerPhone: '555-2001', brand: 'Toyota', model: 'Corolla', plate: 'ABC-123', vehicleType: VehicleType.SEDAN, color: 'Blanco' },
    { ownerName: 'Diego Fernández', ownerPhone: '555-2002', brand: 'Honda', model: 'Civic', plate: 'DEF-456', vehicleType: VehicleType.SEDAN, color: 'Negro' },
    { ownerName: 'Carmen Ruiz', ownerPhone: '555-2003', brand: 'Nissan', model: 'Sentra', plate: 'GHI-789', vehicleType: VehicleType.SEDAN, color: 'Gris' },
    { ownerName: 'Pedro Gómez', ownerPhone: '555-2004', brand: 'Volkswagen', model: 'Jetta', plate: 'JKL-012', vehicleType: VehicleType.SEDAN, color: 'Azul' },
    { ownerName: 'Sofía Torres', ownerPhone: '555-2005', brand: 'Mazda', model: '3', plate: 'MNO-345', vehicleType: VehicleType.SEDAN, color: 'Rojo' },
    { ownerName: 'Miguel Ángel Díaz', ownerPhone: '555-2006', brand: 'BMW', model: 'Serie 3', plate: 'PQR-678', vehicleType: VehicleType.SEDAN, color: 'Blanco' },
    { ownerName: 'Elena Moreno', ownerPhone: '555-2007', brand: 'Mercedes-Benz', model: 'Clase C', plate: 'STU-901', vehicleType: VehicleType.SEDAN, color: 'Plata' },
    { ownerName: 'Francisco Jiménez', ownerPhone: '555-2008', brand: 'Audi', model: 'A4', plate: 'VWX-234', vehicleType: VehicleType.SEDAN, color: 'Negro' },
    { ownerName: 'Isabel Romero', ownerPhone: '555-2009', brand: 'Hyundai', model: 'Elantra', plate: 'YZA-567', vehicleType: VehicleType.SEDAN, color: 'Blanco' },
    { ownerName: 'Antonio Navarro', ownerPhone: '555-2010', brand: 'Kia', model: 'Forte', plate: 'BCD-890', vehicleType: VehicleType.SEDAN, color: 'Gris' },
    
    // SUVs
    { ownerName: 'Lucía Domínguez', ownerPhone: '555-2011', brand: 'Toyota', model: 'RAV4', plate: 'EFG-111', vehicleType: VehicleType.SUV, color: 'Verde' },
    { ownerName: 'Manuel Vázquez', ownerPhone: '555-2012', brand: 'Honda', model: 'CR-V', plate: 'HIJ-222', vehicleType: VehicleType.SUV, color: 'Gris' },
    { ownerName: 'Patricia Castro', ownerPhone: '555-2013', brand: 'Nissan', model: 'Rogue', plate: 'KLM-333', vehicleType: VehicleType.SUV, color: 'Blanco' },
    { ownerName: 'Javier Ortiz', ownerPhone: '555-2014', brand: 'Ford', model: 'Explorer', plate: 'NOP-444', vehicleType: VehicleType.SUV, color: 'Negro' },
    { ownerName: 'Rosa Muñoz', ownerPhone: '555-2015', brand: 'Chevrolet', model: 'Equinox', plate: 'QRS-555', vehicleType: VehicleType.SUV, color: 'Plata' },
    { ownerName: 'David Álvarez', ownerPhone: '555-2016', brand: 'Jeep', model: 'Grand Cherokee', plate: 'TUV-666', vehicleType: VehicleType.SUV, color: 'Negro' },
    { ownerName: 'Teresa Marín', ownerPhone: '555-2017', brand: 'BMW', model: 'X5', plate: 'WXY-777', vehicleType: VehicleType.SUV, color: 'Blanco' },
    { ownerName: 'Raúl Herrera', ownerPhone: '555-2018', brand: 'Mercedes-Benz', model: 'GLC', plate: 'ZAB-888', vehicleType: VehicleType.SUV, color: 'Gris' },
    { ownerName: 'Beatriz Molina', ownerPhone: '555-2019', brand: 'Audi', model: 'Q5', plate: 'CDE-999', vehicleType: VehicleType.SUV, color: 'Azul' },
    { ownerName: 'Andrés Vargas', ownerPhone: '555-2020', brand: 'Porsche', model: 'Cayenne', plate: 'FGH-000', vehicleType: VehicleType.SUV, color: 'Rojo' },
    
    // Pickups
    { ownerName: 'Mónica Reyes', ownerPhone: '555-2021', brand: 'Ford', model: 'F-150', plate: 'PKP-001', vehicleType: VehicleType.PICKUP, color: 'Negro' },
    { ownerName: 'Fernando Silva', ownerPhone: '555-2022', brand: 'Chevrolet', model: 'Silverado', plate: 'PKP-002', vehicleType: VehicleType.PICKUP, color: 'Blanco' },
    { ownerName: 'Claudia Ramos', ownerPhone: '555-2023', brand: 'Toyota', model: 'Tacoma', plate: 'PKP-003', vehicleType: VehicleType.PICKUP, color: 'Gris' },
    { ownerName: 'Laura Martínez', ownerPhone: '555-2001', brand: 'Ram', model: '1500', plate: 'PKP-004', vehicleType: VehicleType.PICKUP, color: 'Rojo' },
    { ownerName: 'Diego Fernández', ownerPhone: '555-2002', brand: 'Nissan', model: 'Frontier', plate: 'PKP-005', vehicleType: VehicleType.PICKUP, color: 'Azul' },
    { ownerName: 'Carmen Ruiz', ownerPhone: '555-2003', brand: 'GMC', model: 'Sierra', plate: 'PKP-006', vehicleType: VehicleType.PICKUP, color: 'Negro' },
    { ownerName: 'Pedro Gómez', ownerPhone: '555-2004', brand: 'Honda', model: 'Ridgeline', plate: 'PKP-007', vehicleType: VehicleType.PICKUP, color: 'Plata' },
    { ownerName: 'Sofía Torres', ownerPhone: '555-2005', brand: 'Toyota', model: 'Tundra', plate: 'PKP-008', vehicleType: VehicleType.PICKUP, color: 'Verde' },
    
    // Vans
    { ownerName: 'Miguel Ángel Díaz', ownerPhone: '555-2006', brand: 'Honda', model: 'Odyssey', plate: 'VAN-001', vehicleType: VehicleType.VAN, color: 'Blanco' },
    { ownerName: 'Elena Moreno', ownerPhone: '555-2007', brand: 'Toyota', model: 'Sienna', plate: 'VAN-002', vehicleType: VehicleType.VAN, color: 'Gris' },
    { ownerName: 'Francisco Jiménez', ownerPhone: '555-2008', brand: 'Chrysler', model: 'Pacifica', plate: 'VAN-003', vehicleType: VehicleType.VAN, color: 'Azul' },
    { ownerName: 'Isabel Romero', ownerPhone: '555-2009', brand: 'Kia', model: 'Carnival', plate: 'VAN-004', vehicleType: VehicleType.VAN, color: 'Negro' },
    { ownerName: 'Antonio Navarro', ownerPhone: '555-2010', brand: 'Mercedes-Benz', model: 'Sprinter', plate: 'VAN-005', vehicleType: VehicleType.VAN, color: 'Blanco' },
    { ownerName: 'Lucía Domínguez', ownerPhone: '555-2011', brand: 'Ford', model: 'Transit', plate: 'VAN-006', vehicleType: VehicleType.VAN, color: 'Plata' },
    
    // Motocicletas
    { ownerName: 'Manuel Vázquez', ownerPhone: '555-2012', brand: 'Honda', model: 'CBR600', plate: 'MOT-001', vehicleType: VehicleType.MOTORCYCLE, color: 'Rojo' },
    { ownerName: 'Patricia Castro', ownerPhone: '555-2013', brand: 'Yamaha', model: 'R6', plate: 'MOT-002', vehicleType: VehicleType.MOTORCYCLE, color: 'Azul' },
    { ownerName: 'Javier Ortiz', ownerPhone: '555-2014', brand: 'Kawasaki', model: 'Ninja', plate: 'MOT-003', vehicleType: VehicleType.MOTORCYCLE, color: 'Verde' },
    { ownerName: 'Rosa Muñoz', ownerPhone: '555-2015', brand: 'BMW', model: 'S1000RR', plate: 'MOT-004', vehicleType: VehicleType.MOTORCYCLE, color: 'Blanco' },
    { ownerName: 'David Álvarez', ownerPhone: '555-2016', brand: 'Ducati', model: 'Panigale', plate: 'MOT-005', vehicleType: VehicleType.MOTORCYCLE, color: 'Rojo' },
    { ownerName: 'Teresa Marín', ownerPhone: '555-2017', brand: 'Harley-Davidson', model: 'Sportster', plate: 'MOT-006', vehicleType: VehicleType.MOTORCYCLE, color: 'Negro' },
  ];

  const vehicles = await Promise.all(
    vehiclesData.map((vehicle) =>
      prisma.vehicle.create({
        data: vehicle,
      })
    )
  );

  console.log(`✅ ${vehicles.length} vehículos creados`);

  // ============ TIME SLOTS (slots para 14 días) ============
  const timeSlots = [];
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);
    
    for (const time of times) {
      const reserved = Math.floor(Math.random() * 3); // 0-2 reservados
      timeSlots.push({
        date,
        time,
        capacity: 3,
        reserved,
        isAvailable: reserved < 3,
      });
    }
  }

  await prisma.timeSlot.createMany({
    data: timeSlots,
  });

  console.log(`✅ ${timeSlots.length} time slots creados`);

  // ============ RESERVACIONES (50 reservaciones) ============
  const statuses = [
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.IN_PROGRESS,
    ReservationStatus.COMPLETED,
    ReservationStatus.CANCELLED,
  ];

  const scheduledTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  const notes = [
    'Cliente frecuente, dar descuento',
    'Cuidado especial con la pintura',
    'Primera vez, dar buena impresión',
    'Llega puntual siempre',
    'Prefiere esperar en sala',
    'Pagar en efectivo',
    'Auto nuevo, mucho cuidado',
    'Rayón en puerta derecha, no tocar',
    null,
    null,
    null,
  ];

  const reservations = [];
  const employees = users.slice(2, 7); // Empleados

  for (let i = 0; i < 50; i++) {
    const dayOffset = Math.floor(Math.random() * 30) - 15; // -15 a +15 días
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
    scheduledDate.setHours(0, 0, 0, 0);

    const vehicle = vehicles[i % vehicles.length];
    
    // Seleccionar un servicio que coincida con el tipo de vehículo
    const matchingServices = services.filter(s => s.vehicleType === vehicle.vehicleType);
    const service = matchingServices[Math.floor(Math.random() * matchingServices.length)];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const employee = employees[Math.floor(Math.random() * employees.length)];

    const reservation = await prisma.reservation.create({
      data: {
        userId: employee.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        scheduledDate,
        scheduledTime: scheduledTimes[Math.floor(Math.random() * scheduledTimes.length)],
        status,
        totalAmount: service.price,
        notes: notes[Math.floor(Math.random() * notes.length)],
      },
    });

    reservations.push(reservation);
  }

  console.log(`✅ ${reservations.length} reservaciones creadas`);

  // ============ PAGOS (35 pagos para reservaciones completadas/confirmadas) ============
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.TRANSFER, PaymentMethod.OTHER];
  const paymentStatuses = [PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.REFUNDED];

  const eligibleReservations = reservations.filter(
    (r) => r.status === ReservationStatus.COMPLETED || r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.IN_PROGRESS
  );

  let paymentsCreated = 0;
  for (let i = 0; i < Math.min(35, eligibleReservations.length); i++) {
    const reservation = eligibleReservations[i];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    // La mayoría de pagos completados
    let paymentStatus: PaymentStatus;
    if (reservation.status === ReservationStatus.COMPLETED) {
      paymentStatus = PaymentStatus.COMPLETED;
    } else {
      paymentStatus = paymentStatuses[Math.floor(Math.random() * 3)]; // Sin refunded
    }

    await prisma.payment.create({
      data: {
        reservationId: reservation.id,
        amount: reservation.totalAmount,
        paymentMethod,
        status: paymentStatus,
        transactionId: paymentStatus === PaymentStatus.COMPLETED ? `TXN-${Date.now()}-${i}` : null,
        notes: i % 5 === 0 ? 'Pago procesado correctamente' : null,
      },
    });

    paymentsCreated++;
  }

  console.log(`✅ ${paymentsCreated} pagos creados`);

  // ============ MENSAJES (60 mensajes de chat) ============
  const messageContents = [
    '¡Hola! ¿Cómo estás?',
    '¿A qué hora puedo pasar por mi auto?',
    'Tu vehículo ya está listo para recoger.',
    'Gracias por tu preferencia.',
    '¿Tienen disponibilidad para hoy?',
    'Sí, tenemos espacio a las 3pm.',
    '¿Cuánto cuesta el lavado premium?',
    'El precio es de $250 pesos.',
    'Perfecto, agendo para mañana.',
    '¡Excelente servicio como siempre!',
    '¿Puedo pagar con tarjeta?',
    'Sí, aceptamos todas las tarjetas.',
    'Mi auto quedó impecable, gracias.',
    '¿Hacen servicio a domicilio?',
    'Por el momento no, solo en sucursal.',
    '¿Tienen promociones este mes?',
    'Sí, 20% en lavados premium.',
    'Voy llegando en 10 minutos.',
    'Te esperamos, ya tenemos tu lugar.',
    'Necesito factura por favor.',
    'Claro, envíame tus datos fiscales.',
    '¿Cuánto tiempo toma el detallado?',
    'Aproximadamente 3 horas.',
    'Ok, regreso más tarde entonces.',
    '¿Pueden revisar un rayón que tiene?',
    'Sí, lo revisamos sin costo.',
    'Gracias por la atención.',
    'Para servirte, que tengas buen día.',
    '¿Trabajan los domingos?',
    'Sí, de 9am a 5pm.',
  ];

  let messagesCreated = 0;
  for (let i = 0; i < 60; i++) {
    const senderIndex = Math.floor(Math.random() * users.length);
    let receiverIndex = Math.floor(Math.random() * users.length);
    
    // Asegurar que sender y receiver sean diferentes
    while (receiverIndex === senderIndex) {
      receiverIndex = Math.floor(Math.random() * users.length);
    }

    const createdAt = new Date();
    createdAt.setMinutes(createdAt.getMinutes() - Math.floor(Math.random() * 10000));

    await prisma.message.create({
      data: {
        content: messageContents[i % messageContents.length],
        senderId: users[senderIndex].id,
        receiverId: users[receiverIndex].id,
        read: Math.random() > 0.3, // 70% leídos
        createdAt,
      },
    });

    messagesCreated++;
  }

  console.log(`✅ ${messagesCreated} mensajes creados`);

  // ============ RESUMEN ============
  console.log('\n📊 Resumen del seed:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 Usuarios:      ${users.length}`);
  console.log(`🚗 Vehículos:     ${vehicles.length}`);
  console.log(`🧽 Servicios:     ${services.length}`);
  console.log(`📅 Time Slots:    ${timeSlots.length}`);
  console.log(`📋 Reservaciones: ${reservations.length}`);
  console.log(`💳 Pagos:         ${paymentsCreated}`);
  console.log(`💬 Mensajes:      ${messagesCreated}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✨ Seed completado exitosamente!\n');
  
  console.log('📝 Credenciales de prueba:');
  console.log('   Email: admin@lavauto.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
