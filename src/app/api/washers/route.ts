import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getCurrentUser } from '@/lib/middleware/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/washers/available
 * Obtener washers disponibles cercanos (para clientes)
 */
export const GET = requireRole(['CLIENT', 'ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const { searchParams } = req.nextUrl;
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10'); // km

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Se requiere latitude y longitude' },
        { status: 400 }
      );
    }

    // Obtener todos los washers disponibles
    const washers = await prisma.user.findMany({
      where: {
        role: 'WASHER',
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        latitude: true,
        longitude: true,
        rating: true,
        completedServices: true,
        assignedJobs: {
          where: {
            status: 'IN_PROGRESS',
          },
          select: {
            id: true,
            scheduledDate: true,
            estimatedArrival: true,
          },
        },
      },
    });

    // Calcular distancia y filtrar por radio
    const washersWithDistance = washers
      .map(washer => {
        if (!washer.latitude || !washer.longitude) return null;

        // Fórmula de Haversine para calcular distancia
        const R = 6371; // Radio de la Tierra en km
        const dLat = toRad(washer.latitude - latitude);
        const dLon = toRad(washer.longitude - longitude);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(latitude)) *
            Math.cos(toRad(washer.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
          ...washer,
          distance: Math.round(distance * 10) / 10,
          isAvailable: washer.assignedJobs.length === 0, // No tiene trabajos en progreso
        };
      })
      .filter(washer => washer !== null && washer.distance <= radius)
      .sort((a, b) => a!.distance - b!.distance);

    return NextResponse.json(washersWithDistance);
  } catch (error) {
    console.error('Error al obtener washers disponibles:', error);
    return NextResponse.json({ error: 'Error al obtener washers' }, { status: 500 });
  }
});

/**
 * GET /api/washers/[id]/stats
 * Obtener estadísticas de un washer específico
 */
export async function getWasherStats(washerId: string) {
  try {
    const washer = await prisma.user.findUnique({
      where: { id: washerId, role: 'WASHER' },
      include: {
        assignedJobs: {
          where: { status: 'COMPLETED' },
          include: {
            rating: true,
          },
        },
        receivedRatings: true,
      },
    });

    if (!washer) {
      return null;
    }

    const totalJobs = washer.assignedJobs.length;
    const ratings = washer.receivedRatings;
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.stars, 0) / ratings.length
      : 0;

    // Calcular tasa de finalización
    const allJobs = await prisma.reservation.count({
      where: { washerId },
    });
    const completedJobs = await prisma.reservation.count({
      where: { washerId, status: 'COMPLETED' },
    });
    const completionRate = allJobs > 0 ? (completedJobs / allJobs) * 100 : 0;

    return {
      washer: {
        id: washer.id,
        name: washer.name,
        rating: washer.rating,
        completedServices: washer.completedServices,
      },
      stats: {
        totalJobs,
        completedJobs,
        completionRate: Math.round(completionRate),
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
      },
      recentRatings: ratings.slice(0, 5).map((r: any) => ({
        stars: r.stars,
        comment: r.comment,
        date: r.createdAt,
      })),
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del washer:', error);
    throw error;
  }
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * POST /api/washers/toggle-availability
 * Cambiar disponibilidad del washer (solo WASHER)
 */
export const POST = requireRole(['WASHER'], async (req: NextRequest, session: any) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { isAvailable, latitude, longitude } = body;

    // Actualizar disponibilidad y ubicación
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        isAvailable,
        ...(latitude && { latitude }),
        ...(longitude && { longitude }),
      },
      select: {
        id: true,
        name: true,
        isAvailable: true,
        latitude: true,
        longitude: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error al cambiar disponibilidad:', error);
    return NextResponse.json({ error: 'Error al cambiar disponibilidad' }, { status: 500 });
  }
});
