import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // Verificar que la reserva existe y pertenece al usuario
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { rating: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (reservation.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (reservation.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Solo puedes calificar servicios completados' },
        { status: 400 }
      );
    }

    if (reservation.rating) {
      return NextResponse.json(
        { error: 'Ya has calificado este servicio' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { stars, comment } = body;

    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'La calificación debe ser entre 1 y 5 estrellas' },
        { status: 400 }
      );
    }

    // Crear la calificación
    const rating = await prisma.rating.create({
      data: {
        reservationId: id,
        userId: user.id,
        washerId: reservation.washerId!,
        stars,
        comment: comment || null,
      },
    });

    // Actualizar el promedio de calificación del lavador
    if (reservation.washerId) {
      const washerRatings = await prisma.rating.findMany({
        where: { washerId: reservation.washerId },
      });

      const avgRating =
        washerRatings.reduce((sum, r) => sum + r.stars, 0) / washerRatings.length;

      await prisma.user.update({
        where: { id: reservation.washerId },
        data: { rating: avgRating },
      });
    }

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    console.error('Error al crear calificación:', error);
    return NextResponse.json({ error: 'Error al crear calificación' }, { status: 500 });
  }
}
