'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, DollarSign, TrendingUp, Users, Briefcase } from 'lucide-react';
import { adminApi, reservationApi } from '@/lib/api-client';

export default function ReportesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalReservations: 0,
    completedReservations: 0,
    activeUsers: 0,
    topWashers: [] as any[],
  });
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
          const completed = reservations.filter((r: any) => r.status === 'COMPLETED');
          const thisMonth = new Date().getMonth();
          const monthlyReservations = completed.filter((r: any) => 
            new Date(r.completedAt || r.updatedAt).getMonth() === thisMonth
          );

          // Calculate top washers
          const washerStats = new Map();
          completed.forEach((r: any) => {
            if (r.washerId) {
              const current = washerStats.get(r.washerId) || { count: 0, revenue: 0, washer: r.washer };
              washerStats.set(r.washerId, {
                count: current.count + 1,
                revenue: current.revenue + (r.service?.price || 0),
                washer: r.washer || current.washer,
              });
            }
          });
          
          const topWashers = Array.from(washerStats.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

          setStats({
            totalRevenue: completed.reduce((sum: number, r: any) => sum + (r.service?.price || 0), 0),
            monthlyRevenue: monthlyReservations.reduce((sum: number, r: any) => sum + (r.service?.price || 0), 0),
            totalReservations: reservations.length,
            completedReservations: completed.length,
            activeUsers: users.length,
            topWashers,
          });
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes y Analíticas</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Estadísticas y métricas del negocio
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ingresos Totales</p>
              <p className="text-3xl font-bold">${stats.totalRevenue}</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Ingresos del Mes</p>
              <p className="text-3xl font-bold">${stats.monthlyRevenue}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Reservas Completadas</p>
              <p className="text-3xl font-bold">{stats.completedReservations}</p>
            </div>
            <Briefcase className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Usuarios Activos</p>
              <p className="text-3xl font-bold">{stats.activeUsers}</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Top Washers */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Top 5 Lavadores por Ingresos
        </h2>
        <div className="space-y-4">
          {stats.topWashers.map((item, index) => (
            <div key={item.washer?.id || index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {item.washer?.name || 'Lavador'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.count} trabajos completados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${item.revenue}
                </p>
              </div>
            </div>
          ))}
          {stats.topWashers.length === 0 && (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">
              No hay datos disponibles
            </p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Tasa de Completado
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.totalReservations > 0 
              ? Math.round((stats.completedReservations / stats.totalReservations) * 100)
              : 0}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Ingreso Promedio
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            ${stats.completedReservations > 0 
              ? Math.round(stats.totalRevenue / stats.completedReservations)
              : 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Proyección Mensual
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            ${Math.round(stats.monthlyRevenue * (30 / new Date().getDate()))}
          </p>
        </div>
      </div>
    </div>
  );
}
