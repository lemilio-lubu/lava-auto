import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReservationsTable from '@/components/reservas/ReservationsTable';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Obtener el usuario actual
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect('/login');
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

  return <ReservationsTable initialReservations={JSON.parse(JSON.stringify(reservations))} />;
}
