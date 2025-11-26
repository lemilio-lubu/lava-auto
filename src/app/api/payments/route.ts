import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    const where = reservationId ? { reservationId } : {};

    const payments = await prisma.payment.findMany({
      where,
      include: {
        reservation: {
          include: {
            vehicle: true,
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { reservationId, amount, paymentMethod, transactionId, notes } = body;

    if (!reservationId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        reservationId,
        amount: parseFloat(amount),
        paymentMethod,
        status: 'COMPLETED',
        transactionId,
        notes,
      },
      include: {
        reservation: {
          include: {
            vehicle: true,
            service: true,
          },
        },
      },
    });

    // Calcular el total pagado
    const totalPaid = await prisma.payment.aggregate({
      where: {
        reservationId,
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    // Actualizar el estado de la reserva si está completamente pagada
    if (totalPaid._sum.amount && totalPaid._sum.amount >= reservation.totalAmount) {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'COMPLETED' },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error al crear pago:', error);
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
  }
}
