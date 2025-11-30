import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getCurrentUser } from '@/lib/middleware/auth';
import prisma from '@/lib/prisma';
import { notifyWasherAssigned } from '../notifications/route';

/**
 * GET /api/jobs/available
 * Obtener trabajos disponibles para washers
 */
export const GET = requireRole(['WASHER', 'ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') || 'PENDING';

    // Trabajos no asignados o asignados a este washer
    const jobs = await prisma.reservation.findMany({
      where: {
        status: status as any,
        ...(status === 'PENDING' && { washerId: null }), // Solo sin asignar si es PENDING
        ...(status !== 'PENDING' && { washerId: currentUser.id }), // Asignados a él
      },
      include: {
        vehicle: true,
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error al obtener trabajos:', error);
    return NextResponse.json({ error: 'Error al obtener trabajos' }, { status: 500 });
  }
});

/**
 * POST /api/jobs/accept
 * Aceptar un trabajo (solo WASHER)
 */
export const POST = requireRole(['WASHER'], async (req: NextRequest, session: any) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
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
        { error: 'Este trabajo ya fue asignado a otro washer' },
        { status: 400 }
      );
    }

    if (reservation.status !== 'PENDING' && reservation.status !== 'CONFIRMED') {
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

    // Notificar al cliente
    await notifyWasherAssigned(reservationId);

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error al aceptar trabajo:', error);
    return NextResponse.json({ error: 'Error al aceptar trabajo' }, { status: 500 });
  }
});
