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
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const params = await context.params;
    const body = await request.json();
    const { ownerName, ownerPhone, brand, model, plate, vehicleType, color } = body;

    if (!ownerName || !brand || !model || !plate || !vehicleType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si existe otro vehículo con la misma placa (excluyendo el actual)
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        plate: plate.toUpperCase(),
        id: {
          not: params.id,
        },
      },
    });

    if (existingVehicle) {
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
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const params = await context.params;

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
