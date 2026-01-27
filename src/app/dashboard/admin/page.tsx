'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Briefcase, DollarSign, Star, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { adminApi, reservationApi } from '@/lib/api-client';

export default function AdminDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReservations: 0,
    totalRevenue: 0,
    activeWashers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (token) {
      Promise.all([
        adminApi.getUsers(token),
        reservationApi.getAllReservations(token),
      ])
        .then(([users, reservations]) => {
          const washers = users.filter((u: any) => u.role === 'WASHER' && u.available);
          const completedReservations = reservations.filter((r: any) => r.status === 'COMPLETED');
          
          setStats({
            totalUsers: users.length,
            totalReservations: reservations.length,
            totalRevenue: completedReservations.reduce((sum: number, r: any) => sum + (r.service?.price || 0), 0),
            activeWashers: washers.length,
          });
          setRecentActivity(reservations.slice(0, 5));
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-purple-50">
          Gestiona todo el sistema desde aquí
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Usuarios Totales</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Reservas Totales</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalReservations}</p>
            </div>
            <Briefcase className="w-12 h-12 text-cyan-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingresos Totales</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">${stats.totalRevenue}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Lavadores Activos</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeWashers}</p>
            </div>
            <Star className="w-12 h-12 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/admin/usuarios"
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <Users className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-1">Gestionar Usuarios</h3>
          <p className="text-purple-100">Ver y administrar todos los usuarios</p>
        </Link>

        <Link
          href="/dashboard/admin/reservas"
          className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <Briefcase className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-1">Reservas</h3>
          <p className="text-cyan-100">Monitorear todas las reservas</p>
        </Link>

        <Link
          href="/dashboard/admin/servicios"
          className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-1">Servicios</h3>
          <p className="text-pink-100">Administrar servicios disponibles</p>
        </Link>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Actividad Reciente</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {recentActivity.map((reservation) => (
              <div key={reservation.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {reservation.service?.name || 'Servicio'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Cliente: {reservation.user?.name || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    reservation.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    reservation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    reservation.status === 'CONFIRMED' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {reservation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
