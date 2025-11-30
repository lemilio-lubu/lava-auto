import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
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
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        vehicle: true,
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        washer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        rating: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario tenga acceso a esta reserva
    if (user.role === 'CLIENT' && reservation.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (user.role === 'WASHER' && reservation.washerId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    return NextResponse.json({ error: 'Error al obtener reserva' }, { status: 500 });
  }
}

export async function PATCH(
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
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    if (user.role === 'CLIENT' && reservation.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (user.role === 'WASHER' && reservation.washerId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    // Validar cambios de estado según rol
    if (user.role === 'CLIENT' && status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Los clientes solo pueden cancelar reservas' },
        { status: 403 }
      );
    }

    if (user.role === 'CLIENT' && reservation.status !== 'PENDING' && reservation.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Solo se pueden cancelar reservas pendientes o confirmadas' },
        { status: 400 }
      );
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: params.id },
      data: { status },
      include: {
        vehicle: true,
        service: true,
        user: true,
        washer: true,
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return NextResponse.json({ error: 'Error al actualizar reserva' }, { status: 500 });
  }
}

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
