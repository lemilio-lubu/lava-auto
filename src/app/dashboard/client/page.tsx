import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Car, Calendar, Star, Bell, MapPin } from 'lucide-react';
import Link from 'next/link';

/**
 * Dashboard del CLIENTE
 * 
 * Flujo de negocio:
 * 1. Cliente registra sus vehículos
 * 2. Solicita un servicio de lavado (selecciona vehículo + servicio + ubicación + horario)
 * 3. Sistema asigna un WASHER cercano disponible
 * 4. Cliente recibe notificación cuando el washer está en camino
 * 5. Cliente ve fotos antes/después del lavado
 * 6. Cliente califica al washer después del servicio
 */
export default async function ClientDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      vehicles: true,
      reservations: {
        include: {
          service: true,
          vehicle: true,
          washer: {
            select: {
              name: true,
              rating: true,
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
        take: 5,
      },
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user || user.role !== 'CLIENT') {
    redirect('/dashboard');
  }

  const pendingReservations = user.reservations.filter(r => 
    r.status === 'PENDING' || r.status === 'CONFIRMED' || r.status === 'IN_PROGRESS'
  );

  return (
    <div className="space-y-6">
      {/* Header del Cliente */}
      <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Hola, {user.name}</h1>
        <p className="text-cyan-50 text-lg">
          Solicita un lavado a domicilio con solo unos clics
        </p>
      </div>

      {/* Botón principal: Solicitar Lavado */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-cyan-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Solicita tu Lavado
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Un lavador profesional irá hasta tu ubicación
            </p>
          </div>
          <MapPin className="w-12 h-12 text-cyan-500" />
        </div>
        
        {user.vehicles.length === 0 ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
            <p className="text-amber-800 dark:text-amber-200 font-medium">
              Primero debes registrar un vehículo para solicitar servicios
            </p>
          </div>
        ) : null}

        <div className="flex gap-3">
          <Link
            href="/dashboard/client/nueva-reserva"
            className={`
              flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white
              font-bold py-4 px-6 rounded-xl shadow-lg
              hover:shadow-xl transition-all duration-200
              flex items-center justify-center gap-2
              ${user.vehicles.length === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
            `}
          >
            <Calendar className="w-5 h-5" />
            Solicitar Lavado Ahora
          </Link>
          
          <Link
            href="/dashboard/client/vehiculos"
            className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-4 px-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <Car className="w-5 h-5" />
            {user.vehicles.length === 0 ? 'Registrar Vehículo' : 'Mis Vehículos'}
          </Link>
        </div>
      </div>

      {/* Grid de información */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vehículos registrados */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Car className="w-8 h-8 text-cyan-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {user.vehicles.length}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Vehículos</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Registrados</p>
        </div>

        {/* Reservas activas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-emerald-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {pendingReservations.length}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Reservas Activas</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">En proceso</p>
        </div>

        {/* Notificaciones */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Bell className="w-8 h-8 text-amber-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {user.notifications.length}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Notificaciones</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Sin leer</p>
        </div>
      </div>

      {/* Últimas reservas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Mis Últimas Reservas
          </h2>
          <Link 
            href="/dashboard/client/reservas"
            className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        {user.reservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              No tienes reservas aún
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
              Solicita tu primer lavado ahora
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {user.reservations.map((reservation) => (
              <div 
                key={reservation.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    w-3 h-3 rounded-full
                    ${reservation.status === 'COMPLETED' ? 'bg-green-500' : 
                      reservation.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      reservation.status === 'CONFIRMED' ? 'bg-amber-500' :
                      'bg-slate-400'}
                  `} />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {reservation.service.name} - {reservation.vehicle.brand} {reservation.vehicle.model}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(reservation.scheduledDate).toLocaleDateString('es-ES')} a las {reservation.scheduledTime}
                      {reservation.washer && ` • Lavador: ${reservation.washer.name} ⭐ ${reservation.washer.rating?.toFixed(1)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${reservation.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      reservation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      reservation.status === 'CONFIRMED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}
                  `}>
                    {reservation.status === 'COMPLETED' ? 'Completado' :
                     reservation.status === 'IN_PROGRESS' ? 'En proceso' :
                     reservation.status === 'CONFIRMED' ? 'Confirmado' :
                     'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
