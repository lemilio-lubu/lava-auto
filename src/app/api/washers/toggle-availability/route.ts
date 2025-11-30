import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/washers/toggle-availability
 * Cambiar disponibilidad del washer (solo WASHER)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || currentUser.role !== 'WASHER') {
      return NextResponse.json({ error: 'Solo los lavadores pueden cambiar disponibilidad' }, { status: 403 });
    }

    // Alternar la disponibilidad actual
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        isAvailable: !currentUser.isAvailable,
      },
      select: {
        id: true,
        name: true,
        isAvailable: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error al cambiar disponibilidad:', error);
    return NextResponse.json({ error: 'Error al cambiar disponibilidad' }, { status: 500 });
  }
}
