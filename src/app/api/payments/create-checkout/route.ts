import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Verificar que Stripe esté configurado
    if (!stripe) {
      return NextResponse.json(
        { 
          error: 'El sistema de pagos no está configurado. Por favor contacta al administrador.',
          details: 'STRIPE_SECRET_KEY no está definido'
        },
        { status: 503 }
      );
    }

    const { reservationId, amount } = await request.json();

    console.log('📝 Datos recibidos:', { reservationId, amount });

    // Validar que la reserva existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        vehicle: true,
        service: true,
      },
    });

    console.log('🔍 Reserva encontrada:', reservation ? 'Sí' : 'No');

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Obtener pagos existentes
    const existingPayments = await prisma.payment.findMany({
      where: {
        reservationId,
        status: 'COMPLETED',
      },
    });

    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = reservation.totalAmount - totalPaid;

    console.log('💰 Balance:', { totalPaid, balance, amount });

    if (amount > balance) {
      return NextResponse.json(
        { error: 'El monto excede el saldo pendiente' },
        { status: 400 }
      );
    }

    console.log('🔐 Creando sesión de Stripe...');
    console.log('Stripe Key presente:', !!process.env.STRIPE_SECRET_KEY);

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Pago - ${reservation.service.name}`,
              description: `${reservation.vehicle.brand} ${reservation.vehicle.model} - ${reservation.vehicle.plate}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pagos/${reservationId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pagos/${reservationId}`,
      metadata: {
        reservationId,
        amount: amount.toString(),
      },
    });

    console.log('✅ Sesión creada:', session.id);

    // Crear registro de pago pendiente
    await prisma.payment.create({
      data: {
        reservationId,
        amount: parseFloat(amount),
        paymentMethod: 'CARD',
        status: 'PENDING',
        transactionId: session.id,
      },
    });

    console.log('✅ Pago pendiente registrado');

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    console.error('Error message:', error?.message);
    console.error('Error type:', error?.type);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { error: error?.message || 'Error al crear sesión de pago', details: error?.type },
      { status: 500 }
    );
  }
}
