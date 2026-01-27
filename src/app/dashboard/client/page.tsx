'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Calendar, Star, Bell, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { vehicleApi, reservationApi, notificationApi } from '@/lib/api-client';

export default function ClientDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'CLIENT') {
      router.push('/dashboard');
      return;
    }

    if (token) {
      Promise.all([
        vehicleApi.getAll(token),
        reservationApi.getAll(token),
        notificationApi.getAll(token)
      ])
        .then(([vehiclesData, reservationsData, notificationsData]) => {
          setVehicles(vehiclesData);
          // Filtrar reservas canceladas de las recientes
          setReservations(reservationsData.filter((r: any) => r.status !== 'CANCELLED').slice(0, 5)); // Last 5 no canceladas
          setNotifications(notificationsData.filter((n: any) => !n.isRead).slice(0, 5));
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user, token, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const pendingReservations = reservations.filter(r => 
    r.status === 'PENDING' || r.status === 'CONFIRMED' || r.status === 'IN_PROGRESS'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">¡Bienvenido, {user?.name}!</h1>
        <p className="text-cyan-50">
          Gestiona tus vehículos y solicita servicios de lavado a domicilio
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Vehículos Registrados</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{vehicles.length}</p>
            </div>
            <Car className="w-12 h-12 text-cyan-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Reservas Activas</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{pendingReservations.length}</p>
            </div>
            <Calendar className="w-12 h-12 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Notificaciones</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{notifications.length}</p>
            </div>
            <Bell className="w-12 h-12 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/client/nueva-reserva"
          className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-between"
        >
          <div>
            <h3 className="text-xl font-bold mb-1">Solicitar Lavado</h3>
            <p className="text-cyan-100">Programa un nuevo servicio a domicilio</p>
          </div>
          <Calendar className="w-12 h-12 opacity-80" />
        </Link>

        <Link
          href="/dashboard/client/vehiculos"
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-between"
        >
          <div>
            <h3 className="text-xl font-bold mb-1">Mis Vehículos</h3>
            <p className="text-emerald-100">Administra tu garaje virtual</p>
          </div>
          <Car className="w-12 h-12 opacity-80" />
        </Link>
      </div>

      {/* Recent Reservations */}
      {reservations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reservas Recientes</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {reservation.service?.name || 'Servicio'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(reservation.scheduledDate).toLocaleDateString('es-ES')} - {reservation.vehicle?.brand} {reservation.vehicle?.model}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    reservation.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    reservation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    reservation.status === 'CONFIRMED' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {reservation.status === 'COMPLETED' ? 'Completado' :
                     reservation.status === 'IN_PROGRESS' ? 'En Progreso' :
                     reservation.status === 'CONFIRMED' ? 'Confirmado' :
                     'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
            <Link
              href="/dashboard/client/reservas"
              className="text-cyan-600 dark:text-cyan-400 hover:underline text-sm font-medium"
            >
              Ver todas las reservas →
            </Link>
          </div>
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
            ¡Comienza registrando tu primer vehículo!
          </h3>
          <p className="text-amber-800 dark:text-amber-200 mb-4">
            Para solicitar servicios de lavado, necesitas tener al menos un vehículo registrado
          </p>
          <Link
            href="/dashboard/client/vehiculos"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Registrar mi primer vehículo
          </Link>
        </div>
      )}
    </div>
  );
}
