const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  console.log('🔄 Iniciando migración de datos existentes...\n');
  
  try {
    // 1. Convertir todos los usuarios existentes a ADMIN
    const updatedUsers = await prisma.user.updateMany({
      where: {
        role: undefined, // Usuarios sin rol asignado
      },
      data: { 
        role: 'ADMIN',
        isAvailable: false, // Los admins no son washers
      }
    });
    console.log(`✅ ${updatedUsers.count} usuarios convertidos a ADMIN`);
    
    // 2. Obtener el primer admin para asignar vehículos huérfanos
    const firstAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (firstAdmin) {
      // 3. Asignar vehículos sin userId al primer admin
      const updatedVehicles = await prisma.vehicle.updateMany({
        where: {
          userId: undefined,
        },
        data: { 
          userId: firstAdmin.id,
          isActive: true,
        }
      });
      console.log(`✅ ${updatedVehicles.count} vehículos asignados al administrador principal`);
      
      // 4. Actualizar reservas existentes
      // Las reservas ya tienen userId (el empleado que las registró)
      // Solo necesitamos asegurarnos de que sean consistentes
      const reservationsCount = await prisma.reservation.count();
      console.log(`✅ ${reservationsCount} reservas existentes preservadas`);
      
    } else {
      console.log('⚠️  No se encontraron usuarios. La base de datos está vacía.');
    }
    
    // 5. Crear datos de ejemplo para testing (opcional)
    console.log('\n📝 ¿Deseas crear usuarios de prueba? (Cliente y Washer)');
    console.log('   Ejecuta: node scripts/seed-test-users.js\n');
    
    console.log('✅ Migración completada exitosamente');
    console.log('\n📋 Resumen:');
    console.log('   - Usuarios existentes → ADMIN');
    console.log('   - Vehículos asignados al admin principal');
    console.log('   - Reservas preservadas sin cambios');
    console.log('   - Sistema listo para multi-rol');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

migrateData()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
