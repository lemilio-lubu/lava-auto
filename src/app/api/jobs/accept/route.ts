import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/jobs/accept
 * Aceptar un trabajo (solo WASHER)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (currentUser.role !== 'WASHER') {
      return NextResponse.json({ error: 'Solo los lavadores pueden aceptar trabajos' }, { status: 403 });
    }

    const body = await req.json();
    const { reservationId, estimatedArrival } = body;

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId requerido' }, { status: 400 });
    }

    // Verificar que el trabajo existe y está disponible
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (reservation.washerId) {
      return NextResponse.json(
        { error: 'Este trabajo ya fue asignado a otro lavador' },
        { status: 400 }
      );
    }

    if (reservation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Este trabajo no está disponible' },
        { status: 400 }
      );
    }

    // Asignar el trabajo al washer
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        washerId: currentUser.id,
        status: 'CONFIRMED',
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : undefined,
      },
      include: {
        vehicle: true,
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    // Crear notificación para el cliente
    try {
      await prisma.notification.create({
        data: {
          userId: reservation.userId,
          type: 'WASHER_ASSIGNED',
          title: 'Lavador Asignado',
          message: `${currentUser.name} ha aceptado tu solicitud de lavado. Te contactará pronto.`,
          actionUrl: `/dashboard/client/reservas`,
          metadata: {
            reservationId,
            washerId: currentUser.id,
          },
        },
      });
    } catch (notificationError) {
      console.error('Error al crear notificación:', notificationError);
      // No fallar la asignación si falla la notificación
    }

    return NextResponse.json({
      success: true,
      message: 'Trabajo aceptado exitosamente',
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error('Error al aceptar trabajo:', error);
    return NextResponse.json(
      { error: 'Error al aceptar trabajo' },
      { status: 500 }
    );
  }
}
