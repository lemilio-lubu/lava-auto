import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import VehicleList from '@/components/vehicles/VehicleList';

export default async function VehiculosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      vehicles: {
        orderBy: { createdAt: 'desc' },
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
      },
    },
  });

  // Transformar los vehículos para incluir hasActiveReservations
  const vehiclesWithStatus = user?.vehicles.map((vehicle) => ({
    ...vehicle,
    hasActiveReservations: vehicle._count.reservations > 0,
    _count: undefined,
  })) || [];

  if (!user || user.role !== 'CLIENT') {
    redirect('/dashboard');
  }

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
            Mis Vehículos
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Administra los vehículos registrados en tu cuenta
          </p>
        </div>
      </div>

      <VehicleList
        vehicles={vehiclesWithStatus}
        userName={user.name}
        userPhone={user.phone}
      />

      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">
          Información sobre tus Vehículos
        </h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Puedes registrar múltiples vehículos en tu cuenta
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Cada vehículo debe tener una placa única
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Al solicitar un servicio, seleccionarás qué vehículo deseas lavar
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Los datos de tus vehículos se mantienen privados y seguros
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
