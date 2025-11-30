import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReservationForm from '@/components/reservas/ReservationForm';

export default async function NuevaReservaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      vehicles: true,
    },
  });

  if (!user || user.role !== 'CLIENT') {
    redirect('/dashboard');
  }

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/client"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Solicitar Nuevo Lavado
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Completa el formulario para solicitar un servicio a domicilio
          </p>
        </div>
      </div>

      {user.vehicles.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
            No tienes vehículos registrados
          </h3>
          <p className="text-amber-800 dark:text-amber-200 mb-4">
            Primero debes registrar al menos un vehículo antes de solicitar un servicio
          </p>
          <Link
            href="/dashboard/client/vehiculos"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Registrar Vehículo
          </Link>
        </div>
      ) : (
        <ReservationForm
          vehicles={user.vehicles}
          services={services}
          defaultAddress={user.address || ''}
        />
      )}
    </div>
  );
}
