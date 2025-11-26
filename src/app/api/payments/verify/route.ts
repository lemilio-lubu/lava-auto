import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 Verificando pago con session ID:', sessionId);

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('📊 Estado de la sesión de Stripe:', session.payment_status);

    // Si el pago está completo, actualizar en la base de datos
    if (session.payment_status === 'paid') {
      const payment = await prisma.payment.updateMany({
        where: {
          transactionId: sessionId,
          status: 'PENDING',
        },
        data: {
          status: 'COMPLETED',
        },
      });

      console.log('✅ Pagos actualizados:', payment.count);

      // Si se actualizó algún pago, verificar si la reserva está completamente pagada
      if (payment.count > 0) {
        // Obtener el pago actualizado para obtener el reservationId
        const updatedPayment = await prisma.payment.findFirst({
          where: {
            transactionId: sessionId,
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

      return NextResponse.json({ 
        success: true, 
        status: 'COMPLETED',
        message: 'Pago verificado y actualizado correctamente' 
      });
    } else {
      console.log('⚠️ El pago aún no está confirmado:', session.payment_status);
      return NextResponse.json({ 
        success: false, 
        status: session.payment_status,
        message: 'El pago aún no ha sido confirmado' 
      });
    }
  } catch (error: any) {
    console.error('❌ Error al verificar pago:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al verificar pago' },
      { status: 500 }
    );
  }
}
