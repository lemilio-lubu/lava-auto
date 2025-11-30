import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import AvailableJobs from '@/components/washer/AvailableJobs';

export default async function TrabajosDisponiblesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'WASHER') {
    redirect('/dashboard');
  }

  // Obtener todos los trabajos disponibles
  const availableJobs = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      washerId: null,
    },
    include: {
      service: true,
      vehicle: true,
      user: {
        select: {
          name: true,
          phone: true,
          address: true,
        },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/washer"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Bell className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            {availableJobs.length > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{availableJobs.length}</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Trabajos Disponibles
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {availableJobs.length === 0
                ? 'No hay trabajos disponibles en este momento'
                : `${availableJobs.length} ${availableJobs.length === 1 ? 'trabajo disponible' : 'trabajos disponibles'}`}
            </p>
          </div>
        </div>
      </div>

      {!user.isAvailable && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                No estás disponible
              </h3>
              <p className="text-amber-800 dark:text-amber-200 text-sm mb-3">
                Activa tu disponibilidad en el dashboard para poder aceptar trabajos
              </p>
              <Link
                href="/dashboard/washer"
                className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <AvailableJobs jobs={availableJobs} />
      </div>
    </div>
  );
}
