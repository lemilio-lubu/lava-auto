import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Página principal del dashboard
 * Redirige automáticamente según el rol del usuario:
 * - CLIENT → /dashboard/client (solicitar lavados, ver sus reservas)
 * - WASHER → /dashboard/washer (ver trabajos asignados, gestionar servicios)
 * - ADMIN → /dashboard/admin (administrar todo el sistema)
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Obtener el usuario con su rol
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Redirigir según el rol del usuario
  switch (user.role) {
    case 'CLIENT':
      redirect('/dashboard/client');
    case 'WASHER':
      redirect('/dashboard/washer');
    case 'ADMIN':
      redirect('/dashboard/admin');
    default:
      redirect('/login');
  }
}
