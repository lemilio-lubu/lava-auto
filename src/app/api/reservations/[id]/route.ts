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

    const params = await context.params;
    const body = await request.json();
    const { vehicleId, serviceId, scheduledDate, scheduledTime, status, notes } = body;

    if (!vehicleId || !serviceId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Obtener el precio del servicio
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const reservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        vehicleId,
        serviceId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        totalAmount: service.price,
        status: status || undefined,
        notes: notes || undefined,
      } as any,
      include: {
        vehicle: true,
        service: true,
      },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return NextResponse.json({ error: 'Error al actualizar reserva' }, { status: 500 });
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

    // Verificar si la reserva tiene pagos completados
    const paymentsCount = await prisma.payment.count({
      where: {
        reservationId: params.id,
        status: 'COMPLETED',
      },
    });

    if (paymentsCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una reserva que tiene pagos registrados' },
        { status: 400 }
      );
    }

    // Eliminar pagos pendientes si existen
    await prisma.payment.deleteMany({
      where: {
        reservationId: params.id,
        status: 'PENDING',
      },
    });

    await prisma.reservation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Reserva eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return NextResponse.json({ error: 'Error al eliminar reserva' }, { status: 500 });
  }
}
