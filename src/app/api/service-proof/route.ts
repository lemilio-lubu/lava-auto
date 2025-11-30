import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getCurrentUser } from '@/lib/middleware/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/service-proof/[reservationId]
 * Obtener las fotos de un servicio específico
 */
export const GET = requireRole(['CLIENT', 'WASHER', 'ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const reservationId = req.nextUrl.pathname.split('/').pop();
    
    if (!reservationId) {
      return NextResponse.json({ error: 'ID de reserva requerido' }, { status: 400 });
    }

    const serviceProof = await prisma.serviceProof.findUnique({
      where: { reservationId },
      include: {
        reservation: {
          include: {
            service: true,
            vehicle: true,
            user: { select: { id: true, name: true, email: true } },
            washer: { select: { id: true, name: true, rating: true } },
          },
        },
      },
    });

    if (!serviceProof) {
      return NextResponse.json({ error: 'Prueba de servicio no encontrada' }, { status: 404 });
    }

    // Verificar permisos: solo el cliente, el washer o admin pueden ver
    const currentUser = await getCurrentUser();
    const isAuthorized = 
      currentUser?.role === 'ADMIN' ||
      serviceProof.reservation.userId === currentUser?.id ||
      serviceProof.reservation.washerId === currentUser?.id;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(serviceProof);
  } catch (error) {
    console.error('Error al obtener prueba de servicio:', error);
    return NextResponse.json({ error: 'Error al obtener prueba de servicio' }, { status: 500 });
  }
});

/**
 * POST /api/service-proof
 * Subir fotos del servicio (solo WASHER)
 */
export const POST = requireRole(['WASHER'], async (req: NextRequest, session: any) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { reservationId, beforePhotos, afterPhotos, notes } = body;

    if (!reservationId || !beforePhotos || !afterPhotos) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: reservationId, beforePhotos, afterPhotos' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe y pertenece a este washer
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (reservation.washerId !== currentUser.id) {
      return NextResponse.json(
        { error: 'No puedes subir fotos de un servicio que no te fue asignado' },
        { status: 403 }
      );
    }

    if (reservation.status !== 'IN_PROGRESS' && reservation.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Solo puedes subir fotos de servicios en progreso o completados' },
        { status: 400 }
      );
    }

    // Crear o actualizar la prueba de servicio
    const serviceProof = await prisma.serviceProof.upsert({
      where: { reservationId },
      create: {
        reservationId,
        beforePhotos,
        afterPhotos,
        notes,
      },
      update: {
        beforePhotos,
        afterPhotos,
        notes,
      },
      include: {
        reservation: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            service: true,
          },
        },
      },
    });

    // Actualizar estado de la reserva a COMPLETED si no lo está
    if (reservation.status !== 'COMPLETED') {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // Crear notificación para el cliente
    await prisma.notification.create({
      data: {
        userId: reservation.userId,
        title: '✅ Servicio Completado',
        message: `Tu servicio ha sido completado. ¡Revisa las fotos del antes y después!`,
        type: 'SERVICE_COMPLETED',
        actionUrl: `/dashboard/reservas/${reservationId}`,
        metadata: {
          reservationId,
          washerId: currentUser.id,
          washerName: currentUser.name,
        },
      },
    });

    // Incrementar contador de servicios completados del washer
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        completedServices: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(serviceProof, { status: 201 });
  } catch (error) {
    console.error('Error al crear prueba de servicio:', error);
    return NextResponse.json({ error: 'Error al crear prueba de servicio' }, { status: 500 });
  }
});

/**
 * DELETE /api/service-proof/[reservationId]
 * Eliminar fotos del servicio (solo ADMIN)
 */
export const DELETE = requireRole(['ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const reservationId = req.nextUrl.pathname.split('/').pop();
    
    if (!reservationId) {
      return NextResponse.json({ error: 'ID de reserva requerido' }, { status: 400 });
    }

    await prisma.serviceProof.delete({
      where: { reservationId },
    });

    return NextResponse.json({ message: 'Prueba de servicio eliminada' });
  } catch (error) {
    console.error('Error al eliminar prueba de servicio:', error);
    return NextResponse.json({ error: 'Error al eliminar prueba de servicio' }, { status: 500 });
  }
});
