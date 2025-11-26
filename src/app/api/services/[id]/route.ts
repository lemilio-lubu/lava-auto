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
    const { name, description, duration, price, vehicleType, isActive } = body;

    if (!name || !duration || !price || !vehicleType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        vehicleType,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 });
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

    // Verificar si el servicio tiene reservas
    const reservationsCount = await prisma.reservation.count({
      where: { serviceId: params.id },
    });

    if (reservationsCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el servicio porque tiene reservas asociadas' },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Servicio eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 });
  }
}
