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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            reservations: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
                },
              },
            },
          },
        },
      },
    });

    // Transformar la respuesta para incluir hasActiveReservations
    const vehiclesWithStatus = vehicles.map((vehicle) => ({
      ...vehicle,
      hasActiveReservations: vehicle._count.reservations > 0,
      _count: undefined, // Remover _count de la respuesta
    }));

    return NextResponse.json(vehiclesWithStatus);
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    return NextResponse.json({ error: 'Error al obtener vehículos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { ownerName, ownerPhone, brand, model, plate, vehicleType, color, year } = body;

    if (!ownerName || !brand || !model || !plate || !vehicleType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate: plate.toUpperCase() },
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: 'Ya existe un vehículo con esta placa' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: user.id,
        ownerName,
        ownerPhone: ownerPhone || null,
        brand,
        model,
        plate: plate.toUpperCase(),
        vehicleType,
        color: color || null,
        year: year ? parseInt(year) : null,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    return NextResponse.json({ error: 'Error al crear vehículo' }, { status: 500 });
  }
}
