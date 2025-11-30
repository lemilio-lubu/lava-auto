import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getCurrentUser } from '@/lib/middleware/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/ratings/[reservationId]
 * Obtener la calificación de una reserva específica
 */
export const GET = requireRole(['CLIENT', 'WASHER', 'ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const reservationId = req.nextUrl.pathname.split('/').pop();
    
    if (!reservationId) {
      return NextResponse.json({ error: 'ID de reserva requerido' }, { status: 400 });
    }

    const rating = await prisma.rating.findUnique({
      where: { reservationId },
      include: {
        user: { select: { id: true, name: true } },
        washer: { select: { id: true, name: true, rating: true } },
        reservation: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Calificación no encontrada' }, { status: 404 });
    }

    return NextResponse.json(rating);
  } catch (error) {
    console.error('Error al obtener calificación:', error);
    return NextResponse.json({ error: 'Error al obtener calificación' }, { status: 500 });
  }
});

/**
 * POST /api/ratings
 * Crear una calificación (solo CLIENTE)
 */
export const POST = requireRole(['CLIENT'], async (req: NextRequest, session: any) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { reservationId, stars, comment } = body;

    if (!reservationId || !stars) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: reservationId, stars' },
        { status: 400 }
      );
    }

    // Validar estrellas (1-5)
    if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
      return NextResponse.json(
        { error: 'Las estrellas deben ser un número entero entre 1 y 5' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe y pertenece a este cliente
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (reservation.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'No puedes calificar un servicio que no solicitaste' },
        { status: 403 }
      );
    }

    if (reservation.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Solo puedes calificar servicios completados' },
        { status: 400 }
      );
    }

    if (!reservation.washerId) {
      return NextResponse.json(
        { error: 'Esta reserva no tiene un washer asignado' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una calificación
    const existingRating = await prisma.rating.findUnique({
      where: { reservationId },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: 'Ya has calificado este servicio' },
        { status: 400 }
      );
    }

    // Crear la calificación
    const rating = await prisma.rating.create({
      data: {
        reservationId,
        userId: currentUser.id,
        washerId: reservation.washerId,
        stars,
        comment: comment || undefined,
      },
      include: {
        washer: { select: { id: true, name: true, rating: true } },
      },
    });

    // Actualizar el rating promedio del washer
    const washerRatings = await prisma.rating.findMany({
      where: { washerId: reservation.washerId },
      select: { stars: true },
    });

    const averageRating = 
      washerRatings.reduce((sum: number, r: any) => sum + r.stars, 0) / washerRatings.length;

    await prisma.user.update({
      where: { id: reservation.washerId },
      data: { rating: averageRating },
    });

    // Crear notificación para el washer
    await prisma.notification.create({
      data: {
        userId: reservation.washerId,
        title: '⭐ Nueva Calificación',
        message: `Recibiste ${stars} estrella${stars !== 1 ? 's' : ''} de ${currentUser.name}`,
        type: 'INFO',
        actionUrl: `/dashboard/calificaciones`,
        metadata: {
          reservationId,
          stars,
          comment,
        },
      },
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    console.error('Error al crear calificación:', error);
    return NextResponse.json({ error: 'Error al crear calificación' }, { status: 500 });
  }
});

/**
 * GET /api/ratings/washer/[washerId]
 * Obtener todas las calificaciones de un washer
 */
export async function getWasherRatings(washerId: string) {
  try {
    const ratings = await prisma.rating.findMany({
      where: { washerId },
      include: {
        user: { select: { name: true } },
        reservation: {
          include: {
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estadísticas
    const totalRatings = ratings.length;
    const averageStars = totalRatings > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.stars, 0) / totalRatings
      : 0;

    const starDistribution = {
      1: ratings.filter((r: any) => r.stars === 1).length,
      2: ratings.filter((r: any) => r.stars === 2).length,
      3: ratings.filter((r: any) => r.stars === 3).length,
      4: ratings.filter((r: any) => r.stars === 4).length,
      5: ratings.filter((r: any) => r.stars === 5).length,
    };

    return {
      ratings,
      statistics: {
        totalRatings,
        averageStars: Math.round(averageStars * 10) / 10,
        starDistribution,
      },
    };
  } catch (error) {
    console.error('Error al obtener calificaciones del washer:', error);
    throw error;
  }
}
