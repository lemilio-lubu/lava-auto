import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Car as CarIcon, User, Star, X, Check, Clock } from 'lucide-react';
import ReservationActions from '@/components/reservas/ReservationActions';

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

const statusIcons = {
  PENDING: Clock,
  CONFIRMED: Check,
  IN_PROGRESS: CarIcon,
  COMPLETED: Check,
  CANCELLED: X,
};

export default async function ReservasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      reservations: {
        include: {
          service: true,
          vehicle: true,
          washer: true,
          rating: true,
          payments: {
            where: {
              status: 'COMPLETED',
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
      },
    },
  });

  if (!user || user.role !== 'CLIENT') {
    redirect('/dashboard');
  }

  const stats = {
    total: user.reservations.length,
    completed: user.reservations.filter((r) => r.status === 'COMPLETED').length,
    pending: user.reservations.filter((r) => r.status === 'PENDING' || r.status === 'CONFIRMED').length,
    cancelled: user.reservations.filter((r) => r.status === 'CANCELLED').length,
  };

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
            Mis Reservas
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Historial completo de tus servicios de lavado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Total de Servicios
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Completados
          </p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Pendientes
          </p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Cancelados
          </p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {stats.cancelled}
          </p>
        </div>
      </div>

      {user.reservations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center border border-slate-200 dark:border-slate-700">
          <Calendar className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No tienes reservas todavía
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Solicita tu primer servicio de lavado a domicilio
          </p>
          <Link
            href="/dashboard/client/nueva-reserva"
            className="inline-block bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Solicitar Lavado
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {user.reservations.map((reservation) => {
            const StatusIcon = statusIcons[reservation.status];
            return (
              <div
                key={reservation.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                          statusColors[reservation.status]
                        }`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {statusLabels[reservation.status]}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(reservation.scheduledDate).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}, {reservation.scheduledTime}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {reservation.service.name}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <CarIcon className="w-4 h-4" />
                        <span>
                          {reservation.vehicle.brand} {reservation.vehicle.model} -{' '}
                          {reservation.vehicle.plate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{reservation.address}</span>
                      </div>
                      {reservation.washer && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <User className="w-4 h-4" />
                          <span>Lavador: {reservation.washer.name}</span>
                        </div>
                      )}
                      {reservation.rating && (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span>Calificación: {reservation.rating.stars}/5</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Total Pagado
                      </p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${reservation.totalAmount.toFixed(0)}
                      </p>
                    </div>

                    <ReservationActions
                      reservationId={reservation.id}
                      status={reservation.status}
                      hasRating={!!reservation.rating}
                      isPaid={
                        reservation.payments.reduce(
                          (sum, p) => sum + p.amount,
                          0
                        ) >= reservation.totalAmount
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
