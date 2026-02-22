'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { jobApi } from '@/lib/api-client';

export default function EstadisticasPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalEarnings: 0,
    thisMonthJobs: 0,
    thisMonthEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'WASHER') {
      router.push('/dashboard');
      return;
    }

    if (token) {
      jobApi.getMyJobs(token)
        .then((jobs) => {
          const completed = jobs.filter((j: any) => j.status === 'COMPLETED');
          const thisMonth = new Date().getMonth();
          const thisMonthJobs = completed.filter((j: any) => 
            new Date(j.completedAt || j.updatedAt).getMonth() === thisMonth
          );
          
          setStats({
            totalJobs: completed.length,
            totalEarnings: completed.reduce((sum: number, j: any) => sum + (j.totalAmount || 0), 0),
            thisMonthJobs: thisMonthJobs.length,
            thisMonthEarnings: thisMonthJobs.reduce((sum: number, j: any) => sum + (j.totalAmount || 0), 0),
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Estadísticas</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Revisa tu desempeño y ganancias
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Ganancias Totales</p>
              <p className="text-3xl font-bold">${stats.totalEarnings}</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">Trabajos Completados</p>
              <p className="text-3xl font-bold">{stats.totalJobs}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Este Mes</p>
              <p className="text-3xl font-bold">${stats.thisMonthEarnings}</p>
            </div>
            <Calendar className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resumen del Mes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Trabajos este mes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.thisMonthJobs}</p>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Promedio por trabajo</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              ${stats.thisMonthJobs > 0 ? Math.round(stats.thisMonthEarnings / stats.thisMonthJobs) : 0}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Proyección mensual</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${Math.round(stats.thisMonthEarnings * (30 / new Date().getDate()))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
