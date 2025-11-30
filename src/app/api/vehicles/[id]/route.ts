import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const params = await context.params;

    // Verificar que el vehículo pertenece al usuario
    const currentVehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
    });

    if (!currentVehicle) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    if (currentVehicle.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { ownerName, ownerPhone, brand, model, plate, vehicleType, color, year } = body;

    if (!ownerName || !brand || !model || !plate || !vehicleType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si existe otro vehículo con la misma placa (excluyendo el actual)
    const duplicateVehicle = await prisma.vehicle.findFirst({
      where: {
        plate: plate.toUpperCase(),
        id: {
          not: params.id,
        },
      },
    });

    if (duplicateVehicle) {
      return NextResponse.json(
        { error: 'Ya existe otro vehículo con esta placa' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        ownerName,
        ownerPhone: ownerPhone || null,
        brand,
        model,
        plate: plate.toUpperCase(),
        vehicleType,
        color: color || null,
        year: year ? parseInt(year) : null,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    return NextResponse.json({ error: 'Error al actualizar vehículo' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const params = await context.params;

    // Verificar que el vehículo pertenece al usuario
    const vehicleToDelete = await prisma.vehicle.findUnique({
      where: { id: params.id },
    });

    if (!vehicleToDelete) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    if (vehicleToDelete.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar si el vehículo tiene reservas
    const reservationsCount = await prisma.reservation.count({
      where: { vehicleId: params.id },
    });

    if (reservationsCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el vehículo porque tiene reservas asociadas' },
        { status: 400 }
      );
    }

    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Vehículo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    return NextResponse.json({ error: 'Error al eliminar vehículo' }, { status: 500 });
  }
}
