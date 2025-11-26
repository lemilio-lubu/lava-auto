import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Manejar el evento
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('🎯 Webhook recibido - checkout.session.completed');
    console.log('📊 Session ID:', session.id);
    console.log('💳 Payment status:', session.payment_status);
    
    // Actualizar el pago en la base de datos
    const payment = await prisma.payment.updateMany({
      where: {
        transactionId: session.id,
        status: 'PENDING',
      },
      data: {
        status: 'COMPLETED',
      },
    });

    console.log('✅ Pagos actualizados:', payment.count);

    // Si se actualizó algún pago, verificar si la reserva está completamente pagada
    if (payment.count > 0) {
      const updatedPayment = await prisma.payment.findFirst({
        where: {
          transactionId: session.id,
        },
        include: {
          reservation: true,
        },
      });

      if (updatedPayment) {
        // Calcular el total pagado
        const totalPaid = await prisma.payment.aggregate({
          where: {
            reservationId: updatedPayment.reservationId,
            status: 'COMPLETED',
          },
          _sum: {
            amount: true,
          },
        });

        // Actualizar estado de la reserva si está completamente pagada
        if (
          totalPaid._sum.amount &&
          totalPaid._sum.amount >= updatedPayment.reservation.totalAmount
        ) {
          await prisma.reservation.update({
            where: { id: updatedPayment.reservationId },
            data: { status: 'COMPLETED' },
          });
          console.log('✅ Reserva marcada como completada');
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
