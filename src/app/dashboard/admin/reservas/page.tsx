import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Calendar, MapPin, Car as CarIcon, User, Wrench } from 'lucide-react';

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabels = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export default async function AdminReservasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const reservations = await prisma.reservation.findMany({
    include: {
      user: true,
      washer: true,
      service: true,
      vehicle: true,
    },
    orderBy: { scheduledDate: 'desc' },
  });

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'PENDING').length,
    confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
    inProgress: reservations.filter((r) => r.status === 'IN_PROGRESS').length,
    completed: reservations.filter((r) => r.status === 'COMPLETED').length,
    cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestión de Reservas
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Visualiza y administra todas las reservas del sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Confirmadas</p>
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.confirmed}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">En Progreso</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Completadas</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Canceladas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, lavador, vehículo..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <select className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white">
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="COMPLETED">Completada</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>

        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[reservation.status]
                      }`}
                    >
                      {statusLabels[reservation.status]}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(reservation.scheduledDate).toLocaleString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                    {reservation.service.name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4" />
                      <span>Cliente: {reservation.user.name}</span>
                    </div>
                    {reservation.washer && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Wrench className="w-4 h-4" />
                        <span>Lavador: {reservation.washer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <CarIcon className="w-4 h-4" />
                      <span>
                        {reservation.vehicle.brand} {reservation.vehicle.model} -{' '}
                        {reservation.vehicle.plate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 col-span-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{reservation.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${reservation.totalAmount.toFixed(0)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="px-4 py-2 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors border border-cyan-200 dark:border-cyan-800">
                      Ver Detalles
                    </button>
                    {reservation.status === 'PENDING' && (
                      <button className="px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800">
                        Asignar Lavador
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
