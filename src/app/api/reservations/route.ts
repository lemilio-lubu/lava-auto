import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el usuario actual
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener solo las reservas del empleado logueado
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: user.id,
      },
      include: {
        vehicle: true,
        service: true,
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el usuario actual (empleado)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { vehicleId, serviceId, scheduledDate, scheduledTime, address, latitude, longitude, notes } = body;

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

    // Crear fecha con hora local para evitar problemas de zona horaria
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0); // Mediodía para evitar cambios de zona horaria

    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
        vehicleId,
        serviceId,
        scheduledDate: localDate,
        scheduledTime,
        totalAmount: service.price,
        address: address || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        notes: notes || undefined,
      } as any,
      include: {
        vehicle: true,
        service: true,
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
