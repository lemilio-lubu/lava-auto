import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getCurrentUser } from '@/lib/middleware/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/notifications
 * Obtener las notificaciones del usuario actual
 */
export const GET = requireRole(['CLIENT', 'WASHER', 'ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = req.nextUrl;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const notifications = await prisma.notification.findMany({
      where: {
        userId: currentUser.id,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: currentUser.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
});

/**
 * POST /api/notifications
 * Crear una notificación (solo ADMIN o sistema)
 */
export const POST = requireRole(['ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const body = await req.json();
    const { userId, title, message, type = 'INFO', actionUrl, metadata } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: userId, title, message' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actionUrl: actionUrl || undefined,
        metadata: metadata || undefined,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 });
  }
});

/**
 * PATCH /api/notifications/[id]
 * Marcar notificación como leída
 */
export const PATCH = requireRole(['CLIENT', 'WASHER', 'ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const notificationId = req.nextUrl.pathname.split('/').pop();
    if (!notificationId) {
      return NextResponse.json({ error: 'ID de notificación requerido' }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    if (notification.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    return NextResponse.json({ error: 'Error al actualizar notificación' }, { status: 500 });
  }
});

/**
 * DELETE /api/notifications/[id]
 * Eliminar una notificación
 */
export const DELETE = requireRole(['CLIENT', 'WASHER', 'ADMIN'], async (req: NextRequest, session: any) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const notificationId = req.nextUrl.pathname.split('/').pop();
    if (!notificationId) {
      return NextResponse.json({ error: 'ID de notificación requerido' }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    if (notification.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return NextResponse.json({ error: 'Error al eliminar notificación' }, { status: 500 });
  }
});

/**
 * PATCH /api/notifications/mark-all-read
 * Marcar todas las notificaciones como leídas
 */
export async function markAllAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    throw error;
  }
}

/**
 * Utilidad: Crear notificación para el cliente cuando el washer está en camino
 */
export async function notifyWasherOnWay(reservationId: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
        washer: true,
      },
    });

    if (!reservation || !reservation.washer) return;

    await prisma.notification.create({
      data: {
        userId: reservation.userId,
        title: '🚗 Tu Washer va en camino',
        message: `${reservation.washer.name} está en camino a tu ubicación. Tiempo estimado: 15 min.`,
        type: 'WASHER_ON_WAY',
        actionUrl: `/dashboard/reservas/${reservationId}`,
        metadata: {
          reservationId,
          washerId: reservation.washerId,
          washerName: reservation.washer.name,
        },
      },
    });
  } catch (error) {
    console.error('Error al notificar washer en camino:', error);
  }
}

/**
 * Utilidad: Crear notificación cuando se asigna un washer
 */
export async function notifyWasherAssigned(reservationId: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
        washer: true,
      },
    });

    if (!reservation || !reservation.washer) return;

    // Notificar al cliente
    await prisma.notification.create({
      data: {
        userId: reservation.userId,
        title: '✅ Washer Asignado',
        message: `${reservation.washer.name} (⭐ ${reservation.washer.rating?.toFixed(1)}) ha sido asignado a tu reserva.`,
        type: 'WASHER_ASSIGNED',
        actionUrl: `/dashboard/reservas/${reservationId}`,
        metadata: {
          reservationId,
          washerId: reservation.washerId,
          washerName: reservation.washer.name,
          washerRating: reservation.washer.rating,
        },
      },
    });

    // Notificar al washer
    await prisma.notification.create({
      data: {
        userId: reservation.washerId!,
        title: '🎯 Nuevo Trabajo Asignado',
        message: `Tienes un nuevo trabajo con ${reservation.user.name}. Dirección: ${reservation.address || 'Ver en mapa'}`,
        type: 'INFO',
        actionUrl: `/dashboard/trabajos/${reservationId}`,
        metadata: {
          reservationId,
          clientId: reservation.userId,
          clientName: reservation.user.name,
          address: reservation.address,
        },
      },
    });
  } catch (error) {
    console.error('Error al notificar washer asignado:', error);
  }
}
