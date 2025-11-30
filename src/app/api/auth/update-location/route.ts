import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
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

    // Solo lavadores necesitan actualizar ubicación
    if (user.role !== 'WASHER') {
      return NextResponse.json(
        { error: 'Solo los lavadores necesitan actualizar ubicación' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Latitud y longitud son requeridas y deben ser números' },
        { status: 400 }
      );
    }

    // Actualizar ubicación del lavador
    await prisma.user.update({
      where: { id: user.id },
      data: {
        latitude,
        longitude,
      },
    });

    return NextResponse.json({
      message: 'Ubicación actualizada exitosamente',
      latitude,
      longitude,
    });
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar ubicación' },
      { status: 500 }
    );
  }
}
